import { useState } from "react";
import {
  useGetOverseerDashboard,
  useListUsers,
  useUpdateUserRole,
  useAssignClubAdmin,
  useApproveEvent,
  useApproveNotice,
  useCreateNotice,
  useCreateClub,
  useListClubs,
  UpdateUserRoleBodyRole,
  AssignClubAdminBodyRole,
  CreateNoticeBodyScope,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetOverseerDashboardQueryKey,
  getListUsersQueryKey,
  getListEventsQueryKey,
  getListNoticesQueryKey,
} from "@workspace/api-client-react";
import {
  UsersIcon,
  CheckCircleIcon,
  CalendarIcon,
  BellIcon,
  ShieldIcon,
  BuildingIcon,
  XCircleIcon,
  PlusIcon,
  FolderPlusIcon,
  ClockIcon,
  TrendingUpIcon,
  ActivityIcon,
  FileTextIcon,
  CloudUploadIcon,
  Loader2Icon,
  AlertCircleIcon,
} from "lucide-react";
import { format } from "date-fns";

interface MigrationResult {
  model: string;
  id: string;
  field: string;
  oldUrl: string;
  newUrl: string;
  status: "migrated" | "skipped" | "failed";
  error?: string;
}

interface MigrationResponse {
  success: boolean;
  summary: { total: number; migrated: number; skipped: number; failed: number };
  results: MigrationResult[];
}

interface MigrationStatus {
  pending: number;
  breakdown: { clubs: number; events: number; posts: number; media: number; users: number };
  cloudinaryEnabled: boolean;
}

export default function OverseerDashboard() {
  const { data: dashboard, isLoading } = useGetOverseerDashboard();
  const { data: users } = useListUsers();
  const { data: clubs } = useListClubs();

  const { mutate: updateUserRole } = useUpdateUserRole();
  const { mutate: assignClubAdmin } = useAssignClubAdmin();
  const { mutate: approveEvent } = useApproveEvent();
  const { mutate: approveNotice } = useApproveNotice();
  const { mutate: createNotice, isPending: isCreatingNotice } = useCreateNotice();
  const { mutate: createClub, isPending: isCreatingClub } = useCreateClub();

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeBody, setNoticeBody] = useState("");
  const [noticePinned, setNoticePinned] = useState(false);
  const [noticeDialogOpen, setNoticeDialogOpen] = useState(false);

  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedClub, setSelectedClub] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<AssignClubAdminBodyRole>(
    AssignClubAdminBodyRole.president,
  );

  const [createClubDialogOpen, setCreateClubDialogOpen] = useState(false);
  const [clubForm, setClubForm] = useState({
    name: "",
    category: "",
    shortDescription: "",
    description: "",
    adminUsername: "",
    adminPassword: "",
    adminFullName: "",
  });

  const [migrateDialogOpen, setMigrateDialogOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResponse | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // ─── handlers ────────────────────────────────────────────────────────────────

  const invalidateDashboard = () =>
    queryClient.invalidateQueries({ queryKey: getGetOverseerDashboardQueryKey() });

  const handleOpenMigrateDialog = async () => {
    setMigrateDialogOpen(true);
    setMigrationResult(null);
    setIsCheckingStatus(true);
    try {
      const res = await fetch("/api/admin/migrate-images/status", { credentials: "include" });
      if (res.ok) setMigrationStatus(await res.json());
    } catch {
      // ignore
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleRunMigration = async () => {
    setIsMigrating(true);
    setMigrationResult(null);
    try {
      const res = await fetch("/api/admin/migrate-images", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Migration failed");
      setMigrationResult(data as MigrationResponse);
      toast({
        title: `Migration complete — ${(data as MigrationResponse).summary.migrated} images moved to Cloudinary`,
      });
      setMigrationStatus(null);
    } catch (err: any) {
      toast({ title: err.message ?? "Migration failed", variant: "destructive" });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleApproveEvent = (id: string, decision: "approved" | "rejected") => {
    approveEvent(
      { id, data: { decision } },
      {
        onSuccess: () => {
          toast({
            title: decision === "approved" ? "Event approved" : "Event rejected",
            description: decision === "approved" ? "The event is now public." : "The event has been rejected.",
          });
          invalidateDashboard();
          queryClient.invalidateQueries({ queryKey: getListEventsQueryKey({ scope: "upcoming" }) });
        },
        onError: () => toast({ title: "Action failed", variant: "destructive" }),
      },
    );
  };

  const handleApproveNotice = (id: string, decision: "approved" | "rejected") => {
    approveNotice(
      { id, data: { decision } },
      {
        onSuccess: () => {
          toast({
            title: decision === "approved" ? "Notice approved" : "Notice rejected",
            description:
              decision === "approved"
                ? "The notice is now visible to members."
                : "The notice has been rejected.",
          });
          invalidateDashboard();
          queryClient.invalidateQueries({ queryKey: getListNoticesQueryKey() });
        },
        onError: () => toast({ title: "Action failed", variant: "destructive" }),
      },
    );
  };

  const handleCreateNotice = () => {
    if (!noticeTitle || !noticeBody) return;
    createNotice(
      {
        data: {
          title: noticeTitle,
          body: noticeBody,
          scope: CreateNoticeBodyScope.university,
          pinned: noticePinned,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "University notice published" });
          setNoticeDialogOpen(false);
          setNoticeTitle("");
          setNoticeBody("");
          setNoticePinned(false);
          invalidateDashboard();
        },
        onError: () => toast({ title: "Failed to publish notice", variant: "destructive" }),
      },
    );
  };

  const handleAssignAdmin = () => {
    if (!selectedUser || !selectedClub) return;
    assignClubAdmin(
      { id: selectedUser, data: { clubSlug: selectedClub, role: selectedRole } },
      {
        onSuccess: () => {
          toast({ title: "Admin assigned successfully" });
          setAdminDialogOpen(false);
          setSelectedUser(null);
          setSelectedClub("");
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
          invalidateDashboard();
        },
        onError: () => toast({ title: "Failed to assign admin", variant: "destructive" }),
      },
    );
  };

  const handleCreateClub = () => {
    if (!clubForm.name) return;
    const hasAdminCredentials =
      clubForm.adminUsername && clubForm.adminPassword && clubForm.adminFullName;

    createClub(
      {
        data: {
          name: clubForm.name,
          category: clubForm.category || undefined,
          shortDescription: clubForm.shortDescription || undefined,
          description: clubForm.description || undefined,
          ...(hasAdminCredentials
            ? {
                adminUsername: clubForm.adminUsername,
                adminPassword: clubForm.adminPassword,
                adminFullName: clubForm.adminFullName,
              }
            : {}),
        },
      },
      {
        onSuccess: (club) => {
          toast({
            title: `Club "${club.name}" created`,
            description: hasAdminCredentials
              ? `Admin account "${clubForm.adminUsername}" created and assigned as president.`
              : "No admin account was created — assign one later.",
          });
          setCreateClubDialogOpen(false);
          setClubForm({
            name: "",
            category: "",
            shortDescription: "",
            description: "",
            adminUsername: "",
            adminPassword: "",
            adminFullName: "",
          });
          invalidateDashboard();
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        },
        onError: (err: any) => {
          const msg = err?.message || "Failed to create club";
          toast({ title: msg, variant: "destructive" });
        },
      },
    );
  };

  // ─── loading state ────────────────────────────────────────────────────────────

  if (isLoading || !dashboard) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[500px] rounded-xl" />
      </div>
    );
  }

  const { totals, clubsByMembers, pendingEvents, pendingNotices, recentRequests, recentNotices } =
    dashboard;

  const pendingCount = pendingEvents.length + pendingNotices.length;

  // ─── render ────────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">System Overseer</h1>
          <p className="text-muted-foreground text-sm">
            Manage clubs, approve events & notices, and monitor university activity.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Migrate Images to Cloudinary */}
          <Dialog open={migrateDialogOpen} onOpenChange={setMigrateDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="border-emerald-400/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                onClick={handleOpenMigrateDialog}
              >
                <CloudUploadIcon className="h-4 w-4 mr-2" /> Migrate Images
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CloudUploadIcon className="h-5 w-5 text-emerald-600" /> Migrate Images to Cloudinary
                </DialogTitle>
                <DialogDescription>
                  Scans all clubs, events, posts, media, and user profiles for images stored in
                  Replit Object Storage and permanently moves them to the Cloudinary CDN. Existing
                  Cloudinary URLs are left untouched.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Status check */}
                {isCheckingStatus && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2Icon className="h-4 w-4 animate-spin" /> Checking for images to migrate…
                  </div>
                )}

                {migrationStatus && !migrationResult && (
                  <div className={`rounded-xl border p-4 ${migrationStatus.pending === 0 ? "border-green-200 bg-green-50 dark:bg-green-950/20" : "border-amber-200 bg-amber-50 dark:bg-amber-950/20"}`}>
                    {migrationStatus.pending === 0 ? (
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium text-sm">
                        <CheckCircleIcon className="h-4 w-4" /> All images are already on Cloudinary CDN.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                          {migrationStatus.pending} image{migrationStatus.pending !== 1 ? "s" : ""} ready to migrate
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-xs text-amber-700 dark:text-amber-500">
                          {Object.entries(migrationStatus.breakdown)
                            .filter(([, v]) => v > 0)
                            .map(([k, v]) => (
                              <div key={k} className="bg-amber-100/60 dark:bg-amber-900/30 rounded-lg px-2 py-1.5 text-center">
                                <div className="font-bold text-base text-amber-900 dark:text-amber-300">{v}</div>
                                <div className="capitalize">{k}</div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    {!migrationStatus.cloudinaryEnabled && (
                      <div className="flex items-start gap-2 mt-2 text-sm text-red-600 dark:text-red-400">
                        <AlertCircleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.
                      </div>
                    )}
                  </div>
                )}

                {/* Migration results */}
                {migrationResult && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/20 p-3 text-center">
                        <div className="text-2xl font-bold text-green-700 dark:text-green-400">{migrationResult.summary.migrated}</div>
                        <div className="text-xs text-green-600 dark:text-green-500 font-medium mt-0.5">Migrated</div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800/30 p-3 text-center">
                        <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">{migrationResult.summary.skipped}</div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">Skipped</div>
                      </div>
                      <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 p-3 text-center">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{migrationResult.summary.failed}</div>
                        <div className="text-xs text-red-500 font-medium mt-0.5">Failed</div>
                      </div>
                    </div>

                    {migrationResult.summary.total === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No Object Storage images were found — everything is already on Cloudinary.
                      </p>
                    )}

                    {migrationResult.results.filter(r => r.status !== "skipped").length > 0 && (
                      <div className="space-y-1.5 max-h-52 overflow-y-auto rounded-xl border border-border p-2">
                        {migrationResult.results.filter(r => r.status !== "skipped").map((r, i) => (
                          <div key={i} className={`flex items-center gap-2 text-xs rounded-lg px-2.5 py-1.5 ${r.status === "migrated" ? "bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-400" : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400"}`}>
                            <CheckCircleIcon className={`h-3 w-3 flex-shrink-0 ${r.status === "migrated" ? "text-green-500" : "hidden"}`} />
                            <XCircleIcon className={`h-3 w-3 flex-shrink-0 ${r.status === "failed" ? "text-red-500" : "hidden"}`} />
                            <span className="font-semibold">{r.model}</span>
                            <span className="text-muted-foreground">·</span>
                            <span>{r.field}</span>
                            {r.error && <span className="ml-auto text-red-500 truncate max-w-[160px]">{r.error}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setMigrateDialogOpen(false)}>
                  Close
                </Button>
                {!migrationResult && (
                  <Button
                    onClick={handleRunMigration}
                    disabled={isMigrating || migrationStatus?.pending === 0 || migrationStatus?.cloudinaryEnabled === false}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                  >
                    {isMigrating ? (
                      <><Loader2Icon className="h-4 w-4 mr-2 animate-spin" /> Migrating…</>
                    ) : (
                      <><CloudUploadIcon className="h-4 w-4 mr-2" /> Run Migration</>
                    )}
                  </Button>
                )}
                {migrationResult && migrationResult.summary.failed > 0 && (
                  <Button onClick={handleRunMigration} disabled={isMigrating} variant="outline" className="border-amber-400/40 text-amber-700">
                    <CloudUploadIcon className="h-4 w-4 mr-2" /> Retry Failed
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Create Club */}
          <Dialog open={createClubDialogOpen} onOpenChange={setCreateClubDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/5">
                <FolderPlusIcon className="h-4 w-4 mr-2" /> Create Club
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Club</DialogTitle>
                <DialogDescription>
                  Create a club and simultaneously set up its admin account. All three admin fields
                  (name, username, email, password) are required together to create an admin.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>
                    Club Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={clubForm.name}
                    onChange={(e) => setClubForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Robotics Society"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input
                      value={clubForm.category}
                      onChange={(e) => setClubForm((f) => ({ ...f, category: e.target.value }))}
                      placeholder="e.g. Technology"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Short Description</Label>
                    <Input
                      value={clubForm.shortDescription}
                      onChange={(e) =>
                        setClubForm((f) => ({ ...f, shortDescription: e.target.value }))
                      }
                      placeholder="One-liner"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Full Description</Label>
                  <Textarea
                    value={clubForm.description}
                    onChange={(e) => setClubForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Detailed description of the club's mission, activities, and goals..."
                    rows={4}
                  />
                </div>

                <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
                  <div>
                    <p className="text-sm font-semibold mb-0.5">Admin Account</p>
                    <p className="text-xs text-muted-foreground">
                      Fill all four fields to simultaneously create a club admin account.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-xs">Full Name</Label>
                      <Input
                        value={clubForm.adminFullName}
                        onChange={(e) =>
                          setClubForm((f) => ({ ...f, adminFullName: e.target.value }))
                        }
                        placeholder="e.g. Karim Hossain"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Username</Label>
                      <Input
                        value={clubForm.adminUsername}
                        onChange={(e) =>
                          setClubForm((f) => ({ ...f, adminUsername: e.target.value }))
                        }
                        placeholder="e.g. karim.hossain"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Password</Label>
                      <Input
                        type="password"
                        value={clubForm.adminPassword}
                        onChange={(e) =>
                          setClubForm((f) => ({ ...f, adminPassword: e.target.value }))
                        }
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Email will be auto-assigned as username@mu.edu</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateClubDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateClub} disabled={!clubForm.name || isCreatingClub}>
                  {isCreatingClub ? "Creating..." : "Create Club"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* New University Notice */}
          <Dialog open={noticeDialogOpen} onOpenChange={setNoticeDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" /> University Notice
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create University Notice</DialogTitle>
                <DialogDescription>
                  Broadcast an announcement to all students and faculty. University notices are
                  published immediately.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    placeholder="Notice title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    value={noticeBody}
                    onChange={(e) => setNoticeBody(e.target.value)}
                    placeholder="Notice details..."
                    rows={5}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="pinned"
                    checked={noticePinned}
                    onChange={(e) => setNoticePinned(e.target.checked)}
                    className="rounded border-border"
                  />
                  <Label htmlFor="pinned" className="cursor-pointer font-normal">
                    Pin to top of notices board
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNoticeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateNotice}
                  disabled={!noticeTitle || !noticeBody || isCreatingNotice}
                >
                  {isCreatingNotice ? "Publishing..." : "Publish Notice"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { icon: BuildingIcon, value: totals.clubs, label: "Clubs", color: "text-violet-600" },
          {
            icon: UsersIcon,
            value: totals.students + totals.faculty,
            label: "Users",
            color: "text-blue-600",
          },
          {
            icon: CalendarIcon,
            value: totals.approvedEvents,
            label: "Live Events",
            color: "text-emerald-600",
          },
          {
            icon: ClockIcon,
            value: totals.pendingEvents,
            label: "Pending Events",
            color: totals.pendingEvents > 0 ? "text-amber-600" : "text-muted-foreground",
          },
          {
            icon: BellIcon,
            value: totals.pendingNotices,
            label: "Pending Notices",
            color: totals.pendingNotices > 0 ? "text-rose-600" : "text-muted-foreground",
          },
        ].map(({ icon: Icon, value, label, color }) => (
          <Card key={label} className="border-border/50">
            <CardContent className="p-5 flex flex-col items-center justify-center text-center">
              <Icon className={`h-6 w-6 mb-2 opacity-80 ${color}`} />
              <h3 className={`text-3xl font-bold font-serif ${color}`}>{value}</h3>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">
                {label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue={pendingCount > 0 ? "approvals" : "overview"} className="w-full">
        <TabsList className="mb-6 bg-muted/50 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="approvals" className="relative">
            Approvals
            {pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold w-4 h-4">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        {/* ── Approvals Tab ── */}
        <TabsContent value="approvals" className="space-y-8">
          {/* Pending Events */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-semibold font-serif">
                Event Approval Queue
              </h2>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                {pendingEvents.length} pending
              </Badge>
            </div>

            {pendingEvents.length > 0 ? (
              <div className="space-y-3">
                {pendingEvents.map((event) => (
                  <Card key={event.id} className="border-amber-200/60 bg-amber-50/30">
                    <CardContent className="p-5 flex flex-col md:flex-row gap-5 justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {event.clubName}
                          </Badge>
                          <Badge className="bg-amber-100 text-amber-800 text-xs hover:bg-amber-100">
                            <ClockIcon className="h-3 w-3 mr-1" /> Pending
                          </Badge>
                        </div>
                        <h3 className="text-base font-bold mb-1">{event.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {event.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            {format(new Date(event.startsAt), "MMM d, yyyy • h:mm a")}
                          </span>
                          <span className="flex items-center gap-1">📍 {event.venue}</span>
                          {event.capacity && (
                            <span>Cap: {event.capacity}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex md:flex-col gap-2 shrink-0 items-center justify-center">
                        <Button
                          size="sm"
                          className="w-28 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleApproveEvent(event.id, "approved")}
                        >
                          <CheckCircleIcon className="h-3.5 w-3.5 mr-1.5" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-28 border-destructive/40 text-destructive hover:bg-destructive/5"
                          onClick={() => handleApproveEvent(event.id, "rejected")}
                        >
                          <XCircleIcon className="h-3.5 w-3.5 mr-1.5" /> Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed bg-muted/10">
                <CardContent className="p-10 text-center text-muted-foreground">
                  <CheckCircleIcon className="mx-auto h-10 w-10 mb-3 opacity-20" />
                  <p className="font-medium">No pending events — all clear!</p>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Pending Notices */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <BellIcon className="h-5 w-5 text-rose-600" />
              <h2 className="text-lg font-semibold font-serif">
                Notice Approval Queue
              </h2>
              <Badge variant="secondary" className="bg-rose-100 text-rose-800">
                {pendingNotices.length} pending
              </Badge>
            </div>

            {pendingNotices.length > 0 ? (
              <div className="space-y-3">
                {pendingNotices.map((notice) => (
                  <Card key={notice.id} className="border-rose-200/60 bg-rose-50/30">
                    <CardContent className="p-5 flex flex-col md:flex-row gap-5 justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {notice.clubName || notice.clubSlug}
                          </Badge>
                          <Badge className="bg-rose-100 text-rose-800 text-xs hover:bg-rose-100">
                            <ClockIcon className="h-3 w-3 mr-1" /> Awaiting Approval
                          </Badge>
                        </div>
                        <h3 className="text-base font-bold mb-1">{notice.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                          {notice.body}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Submitted {format(new Date(notice.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      <div className="flex md:flex-col gap-2 shrink-0 items-center justify-center">
                        <Button
                          size="sm"
                          className="w-28 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleApproveNotice(notice.id, "approved")}
                        >
                          <CheckCircleIcon className="h-3.5 w-3.5 mr-1.5" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-28 border-destructive/40 text-destructive hover:bg-destructive/5"
                          onClick={() => handleApproveNotice(notice.id, "rejected")}
                        >
                          <XCircleIcon className="h-3.5 w-3.5 mr-1.5" /> Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed bg-muted/10">
                <CardContent className="p-10 text-center text-muted-foreground">
                  <CheckCircleIcon className="mx-auto h-10 w-10 mb-3 opacity-20" />
                  <p className="font-medium">No pending notices — all clear!</p>
                </CardContent>
              </Card>
            )}
          </section>
        </TabsContent>

        {/* ── User Management Tab ── */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold font-serif">
              System Users ({users?.length ?? 0})
            </h2>

            <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <ShieldIcon className="h-4 w-4 mr-2" /> Assign Club Admin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Club Admin</DialogTitle>
                  <DialogDescription>
                    Grant administrative access to an existing user for a specific club.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>User</Label>
                    <Select
                      value={selectedUser ?? ""}
                      onValueChange={(v) => setSelectedUser(v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user…" />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {users?.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.fullName}{" "}
                            <span className="text-muted-foreground text-xs">({u.email})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Club</Label>
                    <Select value={selectedClub} onValueChange={setSelectedClub}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select club…" />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {clubs?.map((c) => (
                          <SelectItem key={c.id} value={c.slug}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={selectedRole}
                      onValueChange={(v) => setSelectedRole(v as AssignClubAdminBodyRole)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={AssignClubAdminBodyRole.president}>
                          President
                        </SelectItem>
                        <SelectItem value={AssignClubAdminBodyRole.vice_president}>
                          Vice President
                        </SelectItem>
                        <SelectItem value={AssignClubAdminBodyRole.secretary}>
                          Secretary
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAdminDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAssignAdmin}
                    disabled={!selectedUser || !selectedClub}
                  >
                    Assign Admin
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border/50">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider hidden md:table-cell">
                      Student ID
                    </th>
                    <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider hidden lg:table-cell">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {users?.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5 font-medium">{user.fullName}</td>
                      <td className="px-5 py-3.5 text-muted-foreground text-xs">{user.email}</td>
                      <td className="px-5 py-3.5 text-muted-foreground text-xs hidden md:table-cell">
                        {user.studentId || "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <Select
                          value={user.role}
                          onValueChange={(val) => {
                            updateUserRole(
                              {
                                id: user.id,
                                data: { role: val as UpdateUserRoleBodyRole },
                              },
                              {
                                onSuccess: () => {
                                  toast({ title: `Role updated to ${val}` });
                                  queryClient.invalidateQueries({
                                    queryKey: getListUsersQueryKey(),
                                  });
                                },
                                onError: () =>
                                  toast({ title: "Failed to update role", variant: "destructive" }),
                              },
                            );
                          }}
                        >
                          <SelectTrigger className="h-7 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={UpdateUserRoleBodyRole.student}>
                              Student
                            </SelectItem>
                            <SelectItem value={UpdateUserRoleBodyRole.faculty}>
                              Faculty
                            </SelectItem>
                            <SelectItem value={UpdateUserRoleBodyRole.club_admin}>
                              Club Admin
                            </SelectItem>
                            <SelectItem value={UpdateUserRoleBodyRole.overseer}>
                              Overseer
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground text-xs hidden lg:table-cell">
                        {format(new Date(user.createdAt), "MMM d, yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Clubs */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUpIcon className="h-4 w-4 text-primary" /> Top Clubs by Membership
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clubsByMembers.slice(0, 8).map((club, idx) => (
                    <div key={club.id} className="flex items-center gap-3">
                      <span className="font-mono text-muted-foreground text-sm w-5 text-right shrink-0">
                        {idx + 1}
                      </span>
                      <div
                        className="h-7 w-7 rounded-md flex items-center justify-center shrink-0 text-xs font-bold text-white overflow-hidden"
                        style={{ backgroundColor: club.accentColor || "#6366f1" }}
                      >
                        {club.logoUrl ? (
                          <img
                            src={club.logoUrl}
                            alt={club.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          club.name.substring(0, 2)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{club.name}</p>
                        <p className="text-xs text-muted-foreground">{club.category}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant="secondary" className="text-xs">
                          {club.memberCount}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ActivityIcon className="h-4 w-4 text-primary" /> Recent Join Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentRequests.length > 0 ? (
                  <div className="space-y-3">
                    {recentRequests.slice(0, 8).map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between gap-2 pb-3 border-b last:border-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-sm line-clamp-1">{req.fullName}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            → {req.clubName}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {format(new Date(req.createdAt), "MMM d")}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent requests
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Published Notices */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileTextIcon className="h-4 w-4 text-primary" /> Recently Published Notices
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentNotices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {recentNotices.map((notice) => (
                    <div
                      key={notice.id}
                      className="p-3 rounded-lg border border-border/50 bg-muted/10"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${
                            notice.scope === "university"
                              ? "border-indigo-300 text-indigo-700"
                              : "border-amber-300 text-amber-700"
                          }`}
                        >
                          {notice.scope === "university" ? "University" : notice.clubName}
                        </Badge>
                        {notice.pinned && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            Pinned
                          </Badge>
                        )}
                      </div>
                      <p className="font-semibold text-sm line-clamp-1">{notice.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notice.body}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No published notices yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
