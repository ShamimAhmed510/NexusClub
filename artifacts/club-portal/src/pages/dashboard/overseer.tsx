import { useState } from "react";
import { 
  useGetOverseerDashboard, 
  useListUsers, 
  useUpdateUserRole, 
  useAssignClubAdmin, 
  useApproveEvent, 
  useCreateNotice,
  useCreateClub,
  useListClubs,
  UpdateUserRoleBodyRole,
  AssignClubAdminBodyRole,
  CreateNoticeBodyScope,
  NoticeScope
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetOverseerDashboardQueryKey, getListUsersQueryKey, getListEventsQueryKey } from "@workspace/api-client-react";
import { UsersIcon, CheckCircleIcon, CalendarIcon, BellIcon, ShieldIcon, BuildingIcon, XCircleIcon, PlusIcon, FolderPlusIcon } from "lucide-react";
import { format } from "date-fns";

export default function OverseerDashboard() {
  const { data: dashboard, isLoading } = useGetOverseerDashboard();
  const { data: users } = useListUsers();
  const { data: clubs } = useListClubs();
  
  const { mutate: updateUserRole } = useUpdateUserRole();
  const { mutate: assignClubAdmin } = useAssignClubAdmin();
  const { mutate: approveEvent } = useApproveEvent();
  const { mutate: createNotice } = useCreateNotice();
  const { mutate: createClub, isPending: isCreatingClub } = useCreateClub();
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeBody, setNoticeBody] = useState("");
  const [noticePinned, setNoticePinned] = useState(false);
  const [noticeDialogOpen, setNoticeDialogOpen] = useState(false);
  
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedClub, setSelectedClub] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<AssignClubAdminBodyRole>(AssignClubAdminBodyRole.president);

  const [createClubDialogOpen, setCreateClubDialogOpen] = useState(false);
  const [clubForm, setClubForm] = useState({
    name: "", category: "", shortDescription: "",
    adminUsername: "", adminPassword: "", adminFullName: ""
  });

  if (isLoading || !dashboard) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const { totals, clubsByMembers, pendingEvents, recentRequests, recentNotices } = dashboard;

  const handleApproveEvent = (id: number, decision: 'approved' | 'rejected') => {
    approveEvent({ id, data: { decision } }, {
      onSuccess: () => {
        toast({ title: `Event ${decision}` });
        queryClient.invalidateQueries({ queryKey: getGetOverseerDashboardQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey({ scope: "pending" }) });
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey({ scope: "upcoming" }) });
      }
    });
  };

  const handleCreateNotice = () => {
    createNotice({
      data: {
        title: noticeTitle,
        body: noticeBody,
        scope: CreateNoticeBodyScope.university,
        pinned: noticePinned
      }
    }, {
      onSuccess: () => {
        toast({ title: "Notice created successfully" });
        setNoticeDialogOpen(false);
        setNoticeTitle("");
        setNoticeBody("");
        setNoticePinned(false);
        queryClient.invalidateQueries({ queryKey: getGetOverseerDashboardQueryKey() });
      }
    });
  };

  const handleAssignAdmin = () => {
    if (!selectedUser || !selectedClub) return;
    
    assignClubAdmin({
      id: selectedUser,
      data: {
        clubSlug: selectedClub,
        role: selectedRole
      }
    }, {
      onSuccess: () => {
        toast({ title: "Admin assigned successfully" });
        setAdminDialogOpen(false);
        setSelectedUser(null);
        setSelectedClub("");
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      }
    });
  };

  const handleCreateClub = () => {
    if (!clubForm.name) return;
    createClub({
      data: {
        name: clubForm.name,
        category: clubForm.category || undefined,
        shortDescription: clubForm.shortDescription || undefined,
        adminUsername: clubForm.adminUsername || undefined,
        adminPassword: clubForm.adminPassword || undefined,
        adminFullName: clubForm.adminFullName || undefined,
      }
    }, {
      onSuccess: (club) => {
        toast({ title: `Club "${club.name}" created successfully` });
        setCreateClubDialogOpen(false);
        setClubForm({ name: "", category: "", shortDescription: "", adminUsername: "", adminPassword: "", adminFullName: "" });
        queryClient.invalidateQueries({ queryKey: getGetOverseerDashboardQueryKey() });
      },
      onError: () => {
        toast({ title: "Failed to create club", variant: "destructive" });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">System Overseer</h1>
          <p className="text-muted-foreground">Manage clubs, events, users, and university notices.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
        <Dialog open={createClubDialogOpen} onOpenChange={setCreateClubDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"><FolderPlusIcon className="h-4 w-4 mr-2" /> Create Club</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Club</DialogTitle>
              <DialogDescription>Create a club and optionally assign an admin account.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Club Name <span className="text-red-500">*</span></Label>
                <Input value={clubForm.name} onChange={e => setClubForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Robotics Club" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={clubForm.category} onChange={e => setClubForm(f => ({...f, category: e.target.value}))} placeholder="e.g. Technology, Arts, Sports" />
              </div>
              <div className="space-y-2">
                <Label>Short Description</Label>
                <Input value={clubForm.shortDescription} onChange={e => setClubForm(f => ({...f, shortDescription: e.target.value}))} placeholder="One-line description" />
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">Admin Account (optional)</p>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Admin Full Name</Label>
                    <Input value={clubForm.adminFullName} onChange={e => setClubForm(f => ({...f, adminFullName: e.target.value}))} placeholder="Full name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Admin Username</Label>
                    <Input value={clubForm.adminUsername} onChange={e => setClubForm(f => ({...f, adminUsername: e.target.value}))} placeholder="username" />
                  </div>
                  <div className="space-y-2">
                    <Label>Admin Password</Label>
                    <Input type="password" value={clubForm.adminPassword} onChange={e => setClubForm(f => ({...f, adminPassword: e.target.value}))} placeholder="password" />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateClubDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateClub} disabled={!clubForm.name || isCreatingClub}>
                {isCreatingClub ? "Creating..." : "Create Club"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={noticeDialogOpen} onOpenChange={setNoticeDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground"><PlusIcon className="h-4 w-4 mr-2" /> New University Notice</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create University Notice</DialogTitle>
              <DialogDescription>Broadcast a notice to all users in the system.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)} placeholder="Notice title" />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea value={noticeBody} onChange={e => setNoticeBody(e.target.value)} placeholder="Notice details..." rows={5} />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="pinned" 
                  checked={noticePinned} 
                  onChange={e => setNoticePinned(e.target.checked)} 
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <Label htmlFor="pinned" className="cursor-pointer">Pin to top</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNoticeDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateNotice} disabled={!noticeTitle || !noticeBody}>Publish Notice</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-border/50">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <BuildingIcon className="h-8 w-8 text-primary mb-2 opacity-80" />
            <h3 className="text-3xl font-bold font-serif">{totals.clubs}</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Clubs</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <UsersIcon className="h-8 w-8 text-primary mb-2 opacity-80" />
            <h3 className="text-3xl font-bold font-serif">{totals.students + totals.faculty}</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Users</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <CalendarIcon className="h-8 w-8 text-primary mb-2 opacity-80" />
            <h3 className="text-3xl font-bold font-serif">{totals.approvedEvents}</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Events</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 border-secondary">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <BellIcon className="h-8 w-8 text-secondary mb-2 opacity-80" />
            <h3 className="text-3xl font-bold font-serif text-secondary">{totals.pendingEvents}</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Pending Events</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="mb-6 bg-muted/50 p-1">
          <TabsTrigger value="events">Pending Events ({pendingEvents.length})</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="overview">System Overview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="events" className="space-y-4">
          <h2 className="text-xl font-bold font-serif mb-4">Event Approval Queue</h2>
          {pendingEvents.length > 0 ? (
            <div className="space-y-4">
              {pendingEvents.map(event => (
                <Card key={event.id}>
                  <CardContent className="p-6 flex flex-col md:flex-row gap-6 justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{event.clubName}</Badge>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending Approval</Badge>
                      </div>
                      <h3 className="text-lg font-bold">{event.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                        <span className="flex items-center gap-1.5"><CalendarIcon className="h-4 w-4" /> {format(new Date(event.startsAt), 'MMM d, yyyy h:mm a')}</span>
                        <span className="flex items-center gap-1.5 text-muted-foreground">•</span>
                        <span className="flex items-center gap-1.5 text-muted-foreground">{event.venue}</span>
                        {event.capacity && (
                          <>
                            <span className="flex items-center gap-1.5 text-muted-foreground">•</span>
                            <span className="flex items-center gap-1.5 text-muted-foreground">Cap: {event.capacity}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex md:flex-col gap-2 items-center justify-center shrink-0">
                      <Button className="w-full md:w-32 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApproveEvent(event.id, 'approved')}>
                        <CheckCircleIcon className="h-4 w-4 mr-2" /> Approve
                      </Button>
                      <Button variant="outline" className="w-full md:w-32 border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleApproveEvent(event.id, 'rejected')}>
                        <XCircleIcon className="h-4 w-4 mr-2" /> Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed bg-muted/10">
              <CardContent className="p-12 text-center text-muted-foreground">
                <CheckCircleIcon className="mx-auto h-12 w-12 mb-4 opacity-20" />
                <p>No pending events require approval.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-bold font-serif">System Users</h2>
             
             <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline"><ShieldIcon className="h-4 w-4 mr-2" /> Assign Club Admin</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Club Admin</DialogTitle>
                  <DialogDescription>Grant administrative access for a club to a user.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>User</Label>
                    <Select value={selectedUser?.toString() || ""} onValueChange={(v) => setSelectedUser(Number(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {users?.map(u => (
                          <SelectItem key={u.id} value={u.id.toString()}>{u.fullName} ({u.email})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Club</Label>
                    <Select value={selectedClub} onValueChange={setSelectedClub}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select club" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {clubs?.map(c => (
                          <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AssignClubAdminBodyRole)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={AssignClubAdminBodyRole.president}>President</SelectItem>
                        <SelectItem value={AssignClubAdminBodyRole.vice_president}>Vice President</SelectItem>
                        <SelectItem value={AssignClubAdminBodyRole.secretary}>Secretary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAdminDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleAssignAdmin} disabled={!selectedUser || !selectedClub}>Assign Admin</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
           </div>

           <Card>
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                 <thead className="bg-muted/50 border-b">
                   <tr>
                     <th className="px-6 py-3 font-medium">Name</th>
                     <th className="px-6 py-3 font-medium">Email</th>
                     <th className="px-6 py-3 font-medium">Type</th>
                     <th className="px-6 py-3 font-medium">Role</th>
                     <th className="px-6 py-3 font-medium">Joined</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y border-b-0">
                   {users?.map(user => (
                     <tr key={user.id} className="hover:bg-muted/20">
                       <td className="px-6 py-4 font-medium">{user.fullName}</td>
                       <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                       <td className="px-6 py-4">
                         {user.studentId ? `Student (${user.studentId})` : 'Faculty'}
                       </td>
                       <td className="px-6 py-4">
                         <Select 
                           value={user.role} 
                           onValueChange={(val) => {
                             updateUserRole({ id: user.id, data: { role: val as UpdateUserRoleBodyRole } }, {
                               onSuccess: () => {
                                 toast({ title: "User role updated" });
                                 queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
                               }
                             });
                           }}
                         >
                           <SelectTrigger className="h-8 w-32 text-xs bg-transparent border-border/50">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value={UpdateUserRoleBodyRole.student}>Student</SelectItem>
                             <SelectItem value={UpdateUserRoleBodyRole.faculty}>Faculty</SelectItem>
                             <SelectItem value={UpdateUserRoleBodyRole.club_admin}>Club Admin</SelectItem>
                             <SelectItem value={UpdateUserRoleBodyRole.overseer}>Overseer</SelectItem>
                           </SelectContent>
                         </Select>
                       </td>
                       <td className="px-6 py-4 text-muted-foreground">{format(new Date(user.createdAt), 'MMM d, yyyy')}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Clubs by Membership</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clubsByMembers.map((club, idx) => (
                    <div key={club.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-muted-foreground font-bold w-4">{idx + 1}.</span>
                        <span className="font-medium">{club.name}</span>
                      </div>
                      <Badge variant="secondary">{club.memberCount} members</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Join Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {recentRequests.length > 0 ? (
                  <div className="space-y-4">
                    {recentRequests.map(req => (
                      <div key={req.id} className="flex flex-col gap-1 pb-4 border-b last:border-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{req.fullName}</span>
                          <span className="text-xs text-muted-foreground">{format(new Date(req.createdAt), 'MMM d')}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">Requested to join <strong className="text-foreground font-medium">{req.clubName}</strong></span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-4">No recent join requests.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}