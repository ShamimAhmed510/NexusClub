import { useState } from "react";
import { 
  useGetClubAdminDashboard, 
  useUpdateMemberRole, 
  useDecideJoinRequest,
  useApproveEvent,
  useCreateEvent,
  useCreatePost,
  useCreateNotice,
  useAddClubMedia,
  useUpdateClub,
  MemberRole,
  DecisionBodyDecision,
  EventStatus,
  CreateNoticeBodyScope,
  AddMediaBodyCategory
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
import { getGetClubAdminDashboardQueryKey, getGetClubQueryKey, getListEventsQueryKey } from "@workspace/api-client-react";
import { UsersIcon, CheckCircleIcon, CalendarIcon, BellIcon, ImageIcon, EditIcon, XCircleIcon, PlusIcon, MegaphoneIcon, MapPinIcon, ClockIcon } from "lucide-react";
import { format } from "date-fns";
import { ImageUploadField } from "@/components/ImageUploadField";

export default function ClubAdminDashboard({ slug }: { slug: string }) {
  const { data: dashboard, isLoading } = useGetClubAdminDashboard(slug);
  
  const { mutate: updateMemberRole } = useUpdateMemberRole();
  const { mutate: decideJoinRequest } = useDecideJoinRequest();
  const { mutate: approveEvent } = useApproveEvent(); // To approve their own events if they are overseer, but normal admins might not have this, we'll only show it for pending events that they can't approve unless they are overseer, wait actually the spec says "(useApproveEvent for approving events of own club only when overseer)", wait no, "pending events (useApproveEvent for approving events of own club only when overseer)" implies if they are NOT overseer they can't approve. Actually they can see pending events but wait for overseer. Wait, spec says: "upcoming + pending events (useApproveEvent for approving events of own club only when overseer)". We'll just show pending events. If they aren't overseer, the backend might reject approveEvent. We'll skip approve button unless we know they are overseer, but we don't have user object here. We'll just list pending events.

  const { mutate: createEvent } = useCreateEvent();
  const { mutate: createPost } = useCreatePost();
  const { mutate: createNotice } = useCreateNotice();
  const { mutate: addMedia } = useAddClubMedia();
  const { mutate: updateClub } = useUpdateClub();
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Forms state
  const [eventForm, setEventForm] = useState({ title: "", description: "", startsAt: "", endsAt: "", venue: "", capacity: "", coverUrl: "" });
  const [postForm, setPostForm] = useState({ title: "", body: "", imageUrl: "" });
  const [noticeForm, setNoticeForm] = useState({ title: "", body: "" });
  const [mediaForm, setMediaForm] = useState({ url: "", caption: "", category: AddMediaBodyCategory.gallery });
  const [clubForm, setClubForm] = useState({ description: "", shortDescription: "", websiteUrl: "", facebookUrl: "", instagramUrl: "", logoUrl: "", coverUrl: "" });
  
  // Dialogs state
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [noticeDialogOpen, setNoticeDialogOpen] = useState(false);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [editClubDialogOpen, setEditDialogOpen] = useState(false);

  if (isLoading || !dashboard) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-32 rounded-xl mb-8" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const { club, members, pendingRequests, upcomingEvents, pendingEvents, recentPosts, notices } = dashboard;

  const handleDecision = (id: string, decision: DecisionBodyDecision) => {
    decideJoinRequest({ id, data: { decision } }, {
      onSuccess: () => {
        toast({ title: `Request ${decision}` });
        queryClient.invalidateQueries({ queryKey: getGetClubAdminDashboardQueryKey(slug) });
      }
    });
  };

  const handleCreateEvent = () => {
    createEvent({
      slug,
      data: {
        ...eventForm,
        capacity: eventForm.capacity ? parseInt(eventForm.capacity, 10) : undefined,
        endsAt: eventForm.endsAt || undefined,
        coverUrl: eventForm.coverUrl || undefined
      }
    }, {
      onSuccess: () => {
        toast({ title: "Event created successfully", description: "It will be pending until approved by an Overseer." });
        setEventDialogOpen(false);
        setEventForm({ title: "", description: "", startsAt: "", endsAt: "", venue: "", capacity: "", coverUrl: "" });
        queryClient.invalidateQueries({ queryKey: getGetClubAdminDashboardQueryKey(slug) });
      }
    });
  };

  const handleCreatePost = () => {
    createPost({
      slug,
      data: {
        ...postForm,
        imageUrl: postForm.imageUrl || undefined
      }
    }, {
      onSuccess: () => {
        toast({ title: "Post created successfully" });
        setPostDialogOpen(false);
        setPostForm({ title: "", body: "", imageUrl: "" });
        queryClient.invalidateQueries({ queryKey: getGetClubAdminDashboardQueryKey(slug) });
        queryClient.invalidateQueries({ queryKey: getGetClubQueryKey(slug) });
      }
    });
  };

  const handleCreateNotice = () => {
    createNotice({
      data: {
        title: noticeForm.title,
        body: noticeForm.body,
        scope: CreateNoticeBodyScope.club,
        clubSlug: slug
      }
    }, {
      onSuccess: () => {
        toast({ title: "Notice created successfully" });
        setNoticeDialogOpen(false);
        setNoticeForm({ title: "", body: "" });
        queryClient.invalidateQueries({ queryKey: getGetClubAdminDashboardQueryKey(slug) });
      }
    });
  };

  const handleAddMedia = () => {
    addMedia({
      slug,
      data: {
        url: mediaForm.url,
        caption: mediaForm.caption || undefined,
        category: mediaForm.category
      }
    }, {
      onSuccess: () => {
        toast({ title: "Media added successfully" });
        setMediaDialogOpen(false);
        setMediaForm({ url: "", caption: "", category: AddMediaBodyCategory.gallery });
        queryClient.invalidateQueries({ queryKey: getGetClubAdminDashboardQueryKey(slug) });
        queryClient.invalidateQueries({ queryKey: getGetClubQueryKey(slug) });
      }
    });
  };

  const handleUpdateClub = () => {
    updateClub({
      slug,
      data: {
        ...clubForm,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Club details updated" });
        setEditDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: getGetClubAdminDashboardQueryKey(slug) });
        queryClient.invalidateQueries({ queryKey: getGetClubQueryKey(slug) });
      }
    });
  };

  const openEditModal = () => {
    setClubForm({
      description: club.description || "",
      shortDescription: club.shortDescription || "",
      websiteUrl: club.websiteUrl || "",
      facebookUrl: club.facebookUrl || "",
      instagramUrl: club.instagramUrl || "",
      logoUrl: club.logoUrl || "",
      coverUrl: club.coverUrl || ""
    });
    setEditDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl border-2 border-border bg-muted overflow-hidden flex items-center justify-center shrink-0" style={{ backgroundColor: club.accentColor || 'var(--muted)' }}>
            {club.logoUrl ? <img src={club.logoUrl} alt={club.name} className="h-full w-full object-cover bg-background" /> : <span className="font-bold text-xl">{club.name.substring(0, 2)}</span>}
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold tracking-tight">{club.name} Admin</h1>
            <p className="text-muted-foreground text-sm">Manage your club's members, events, and content.</p>
          </div>
        </div>
        <Button variant="outline" onClick={openEditModal}>
          <EditIcon className="h-4 w-4 mr-2" /> Edit Club Profile
        </Button>
      </div>

      {/* Edit Club Dialog */}
      <Dialog open={editClubDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Club Profile</DialogTitle>
            <DialogDescription>Update the public details of your club.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4 md:col-span-2">
              <Label>Short Description (Tagline)</Label>
              <Input value={clubForm.shortDescription} onChange={e => setClubForm({...clubForm, shortDescription: e.target.value})} maxLength={150} />
            </div>
            <div className="space-y-4 md:col-span-2">
              <Label>Full Description</Label>
              <Textarea value={clubForm.description} onChange={e => setClubForm({...clubForm, description: e.target.value})} rows={5} />
            </div>
            
            <div className="space-y-4">
              <Label>Logo</Label>
              <ImageUploadField variant="square" value={clubForm.logoUrl} onChange={url => setClubForm({...clubForm, logoUrl: url || ""})} />
            </div>
            <div className="space-y-4">
              <Label>Cover Image</Label>
              <ImageUploadField variant="banner" value={clubForm.coverUrl} onChange={url => setClubForm({...clubForm, coverUrl: url || ""})} />
            </div>

            <div className="space-y-4 md:col-span-2">
              <h4 className="font-medium border-b pb-2 mb-2">Social Links</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Website</Label>
                  <Input value={clubForm.websiteUrl} onChange={e => setClubForm({...clubForm, websiteUrl: e.target.value})} placeholder="https://" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Facebook</Label>
                  <Input value={clubForm.facebookUrl} onChange={e => setClubForm({...clubForm, facebookUrl: e.target.value})} placeholder="https://facebook.com/..." />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Instagram</Label>
                  <Input value={clubForm.instagramUrl} onChange={e => setClubForm({...clubForm, instagramUrl: e.target.value})} placeholder="https://instagram.com/..." />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateClub}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-border/50">
          <CardContent className="p-6 flex flex-col justify-center">
            <p className="text-sm text-muted-foreground mb-1">Total Members</p>
            <h3 className="text-3xl font-bold font-serif">{club.memberCount}</h3>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-6 flex flex-col justify-center">
            <p className="text-sm text-muted-foreground mb-1">Join Requests</p>
            <h3 className="text-3xl font-bold font-serif text-secondary">{pendingRequests.length}</h3>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-6 flex flex-col justify-center">
            <p className="text-sm text-muted-foreground mb-1">Upcoming Events</p>
            <h3 className="text-3xl font-bold font-serif">{upcomingEvents.length}</h3>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-6 flex flex-col justify-center">
            <p className="text-sm text-muted-foreground mb-1">Pending Events</p>
            <h3 className="text-3xl font-bold font-serif text-muted-foreground">{pendingEvents.length}</h3>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="mb-6 bg-muted/50 p-1 flex-wrap h-auto">
          <TabsTrigger value="members">Members & Requests</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="posts">Posts & Notices</TabsTrigger>
          <TabsTrigger value="media">Gallery & Media</TabsTrigger>
        </TabsList>
        
        <TabsContent value="members" className="space-y-8">
          {pendingRequests.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-xl font-serif font-bold">Join Requests</h2>
                <span className="px-3 py-0.5 rounded-full text-sm font-bold bg-amber-100 text-amber-800 border border-amber-200">{pendingRequests.length} pending</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingRequests.map(req => (
                  <Card key={req.id} className="border-amber-200/60 bg-gradient-to-br from-amber-50/50 to-orange-50/30 overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
                    <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {req.fullName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-bold text-base leading-tight">{req.fullName}</h3>
                              <span className="text-xs text-muted-foreground">{format(new Date(req.createdAt), 'MMM d, yyyy')}</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Pending</span>
                        </div>

                        {/* Member Details Grid */}
                        <div className="grid grid-cols-1 gap-2 bg-white/70 rounded-xl p-3 border border-amber-100">
                          <div className="flex items-start gap-2 text-sm">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider w-20 flex-shrink-0 mt-0.5">Email</span>
                            <span className="text-foreground font-medium break-all">{req.email}</span>
                          </div>
                          <div className="flex items-start gap-2 text-sm border-t border-amber-100 pt-2">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider w-20 flex-shrink-0 mt-0.5">Member ID</span>
                            <span className={`font-medium ${req.studentId ? 'text-indigo-700' : 'text-muted-foreground italic'}`}>
                              {req.studentId || 'Not provided'}
                            </span>
                          </div>
                          <div className="flex items-start gap-2 text-sm border-t border-amber-100 pt-2">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider w-20 flex-shrink-0 mt-0.5">Dept.</span>
                            <span className={`font-medium ${req.department ? 'text-emerald-700' : 'text-muted-foreground italic'}`}>
                              {req.department || 'Not provided'}
                            </span>
                          </div>
                          <div className="flex items-start gap-2 text-sm border-t border-amber-100 pt-2">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider w-20 flex-shrink-0 mt-0.5">Batch</span>
                            <span className={`font-medium ${(req as any).batch ? 'text-violet-700' : 'text-muted-foreground italic'}`}>
                              {(req as any).batch || 'Not provided'}
                            </span>
                          </div>
                        </div>

                        {req.message && (
                          <div className="bg-white/60 p-3 rounded-xl border border-amber-100 text-sm italic mt-3 text-muted-foreground leading-relaxed">
                            "{req.message}"
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white h-9 shadow-sm" onClick={() => handleDecision(req.id, DecisionBodyDecision.approved)}>
                          <CheckCircleIcon className="h-4 w-4 mr-1.5" /> Approve
                        </Button>
                        <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50 h-9" onClick={() => handleDecision(req.id, DecisionBodyDecision.rejected)}>
                          <XCircleIcon className="h-4 w-4 mr-1.5" /> Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xl font-serif font-bold mb-4">Club Members</h2>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Joined</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-b-0">
                    {members.map(member => (
                      <tr key={member.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                            {member.fullName.substring(0, 2)}
                          </div>
                          {member.fullName}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                        <td className="px-4 py-3 text-muted-foreground">{format(new Date(member.joinedAt), 'MMM d, yyyy')}</td>
                        <td className="px-4 py-3">
                          <Select 
                            value={member.role} 
                            onValueChange={(val) => {
                              updateMemberRole({ id: member.id, data: { role: val as MemberRole } }, {
                                onSuccess: () => {
                                  toast({ title: "Role updated" });
                                  queryClient.invalidateQueries({ queryKey: getGetClubAdminDashboardQueryKey(slug) });
                                }
                              });
                            }}
                          >
                            <SelectTrigger className="h-8 w-[140px] text-xs bg-transparent">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={MemberRole.president}>President</SelectItem>
                              <SelectItem value={MemberRole.vice_president}>Vice President</SelectItem>
                              <SelectItem value={MemberRole.secretary}>Secretary</SelectItem>
                              <SelectItem value={MemberRole.member}>Member</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-serif font-bold">Manage Events</h2>
            <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
              <DialogTrigger asChild>
                <Button><PlusIcon className="h-4 w-4 mr-2" /> Create Event</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                  <DialogDescription>Submit an event for approval. Once approved by an overseer, it will be visible to students.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Event Title</Label>
                    <Input value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Description</Label>
                    <Textarea value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>Starts At</Label>
                    <Input type="datetime-local" value={eventForm.startsAt} onChange={e => setEventForm({...eventForm, startsAt: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Ends At (Optional)</Label>
                    <Input type="datetime-local" value={eventForm.endsAt} onChange={e => setEventForm({...eventForm, endsAt: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Venue</Label>
                    <Input value={eventForm.venue} onChange={e => setEventForm({...eventForm, venue: e.target.value})} placeholder="e.g. Auditorium, Room 301" />
                  </div>
                  <div className="space-y-2">
                    <Label>Capacity (Optional)</Label>
                    <Input type="number" value={eventForm.capacity} onChange={e => setEventForm({...eventForm, capacity: e.target.value})} placeholder="Max attendees" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Cover Image</Label>
                    <ImageUploadField variant="banner" value={eventForm.coverUrl} onChange={url => setEventForm({...eventForm, coverUrl: url || ""})} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEventDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateEvent} disabled={!eventForm.title || !eventForm.startsAt || !eventForm.venue}>Submit for Approval</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {pendingEvents.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2"><ClockIcon className="h-5 w-5 text-yellow-500" /> Pending Approval</h3>
              <div className="grid gap-3">
                {pendingEvents.map(event => (
                  <Card key={event.id} className="border-yellow-200 bg-yellow-50/30">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold">{event.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(event.startsAt), 'MMM d, yyyy h:mm a')} • {event.venue}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-medium mb-3 flex items-center gap-2"><CalendarIcon className="h-5 w-5 text-primary" /> Upcoming Events</h3>
            {upcomingEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingEvents.map(event => (
                  <Card key={event.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-lg leading-tight line-clamp-1">{event.title}</h4>
                        <Badge variant="secondary" className="bg-green-100 text-green-800 shrink-0">Approved</Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground mt-3">
                        <p className="flex items-center gap-2"><CalendarIcon className="h-3.5 w-3.5" /> {format(new Date(event.startsAt), 'MMM d, yyyy h:mm a')}</p>
                        <p className="flex items-center gap-2"><MapPinIcon className="h-3.5 w-3.5" /> {event.venue}</p>
                        <p className="flex items-center gap-2"><UsersIcon className="h-3.5 w-3.5" /> {event.rsvpCount} attending</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed bg-muted/10">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No upcoming events.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="posts" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-serif font-bold">Club Posts</h2>
                <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><PlusIcon className="h-4 w-4 mr-2" /> New Post</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Club Post</DialogTitle>
                      <DialogDescription>Share updates, summaries, or articles on your club page.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input value={postForm.title} onChange={e => setPostForm({...postForm, title: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Content</Label>
                        <Textarea value={postForm.body} onChange={e => setPostForm({...postForm, body: e.target.value})} rows={5} />
                      </div>
                      <div className="space-y-2">
                        <Label>Image (Optional)</Label>
                        <ImageUploadField variant="standard" value={postForm.imageUrl} onChange={url => setPostForm({...postForm, imageUrl: url || ""})} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setPostDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreatePost} disabled={!postForm.title || !postForm.body}>Publish Post</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="space-y-4">
                {recentPosts.length > 0 ? recentPosts.map(post => (
                  <Card key={post.id} className="overflow-hidden">
                    {post.imageUrl && <div className="h-32 w-full bg-muted"><img src={post.imageUrl} className="w-full h-full object-cover" alt="" /></div>}
                    <CardContent className="p-4">
                      <h4 className="font-bold mb-1">{post.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{format(new Date(post.createdAt), 'MMM d, yyyy')} • By {post.authorName}</p>
                      <p className="text-sm line-clamp-2">{post.body}</p>
                    </CardContent>
                  </Card>
                )) : (
                  <Card className="border-dashed bg-muted/10"><CardContent className="p-6 text-center text-sm text-muted-foreground">No posts yet.</CardContent></Card>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-serif font-bold">Club Notices</h2>
                <Dialog open={noticeDialogOpen} onOpenChange={setNoticeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><MegaphoneIcon className="h-4 w-4 mr-2" /> New Notice</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Club Notice</DialogTitle>
                      <DialogDescription>Pin a short announcement for club members and visitors.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input value={noticeForm.title} onChange={e => setNoticeForm({...noticeForm, title: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Content</Label>
                        <Textarea value={noticeForm.body} onChange={e => setNoticeForm({...noticeForm, body: e.target.value})} rows={3} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNoticeDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreateNotice} disabled={!noticeForm.title || !noticeForm.body}>Publish Notice</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4">
                {notices.length > 0 ? notices.map(notice => (
                  <Card key={notice.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <h4 className="font-bold text-sm mb-1">{notice.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{format(new Date(notice.publishAt), 'MMM d, yyyy')}</p>
                      <p className="text-sm">{notice.body}</p>
                    </CardContent>
                  </Card>
                )) : (
                  <Card className="border-dashed bg-muted/10"><CardContent className="p-6 text-center text-sm text-muted-foreground">No notices yet.</CardContent></Card>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-serif font-bold">Gallery & Achievements</h2>
            <Dialog open={mediaDialogOpen} onOpenChange={setMediaDialogOpen}>
              <DialogTrigger asChild>
                <Button><ImageIcon className="h-4 w-4 mr-2" /> Upload Media</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Club Media</DialogTitle>
                  <DialogDescription>Add photos to your club's gallery or showcase achievements.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Image</Label>
                    <ImageUploadField variant="standard" value={mediaForm.url} onChange={url => setMediaForm({...mediaForm, url: url || ""})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={mediaForm.category} onValueChange={(v) => setMediaForm({...mediaForm, category: v as AddMediaBodyCategory})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={AddMediaBodyCategory.gallery}>Gallery Image</SelectItem>
                        <SelectItem value={AddMediaBodyCategory.achievement}>Achievement/Award</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Caption (Optional)</Label>
                    <Input value={mediaForm.caption} onChange={e => setMediaForm({...mediaForm, caption: e.target.value})} placeholder="Describe this photo..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setMediaDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddMedia} disabled={!mediaForm.url}>Upload to Gallery</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border-dashed bg-muted/10">
            <CardContent className="p-12 text-center text-muted-foreground">
               <ImageIcon className="mx-auto h-12 w-12 mb-4 opacity-20" />
               <p>Your club has {club.memberCount} members but needs more media! Upload photos above to fill your gallery.</p>
               <p className="text-xs mt-2 opacity-70">Media viewer is visible on the public club profile.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
