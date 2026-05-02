import { useGetClub, useRequestJoinClub, useRsvpEvent } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { useRoute, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarIcon, MapPinIcon, UsersIcon, CheckIcon, ExternalLinkIcon,
  GlobeIcon, FacebookIcon, InstagramIcon, TrophyIcon, ImageIcon,
  BellIcon, BookOpenIcon, UserCircleIcon, CalendarDaysIcon, StarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { getGetClubQueryKey } from "@workspace/api-client-react";

const AVATAR_COLORS = [
  "from-violet-500 to-indigo-500",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-amber-500",
  "from-rose-500 to-pink-500",
  "from-purple-500 to-fuchsia-500",
];

function colorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function ClubDetail() {
  const [, params] = useRoute("/clubs/:slug");
  const slug = params?.slug || "";
  const { data: clubDetail, isLoading } = useGetClub(slug);
  const { mutate: requestJoin, isPending: isJoining } = useRequestJoinClub();
  const { mutate: rsvpEvent } = useRsvpEvent();
  const [joinMessage, setJoinMessage] = useState("");
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (isLoading) {
    return (
      <Layout>
        <div className="w-full h-72 bg-gradient-to-br from-violet-200 to-indigo-200 animate-pulse" />
        <div className="container mx-auto px-4 -mt-16 relative z-10 space-y-4">
          <Skeleton className="w-32 h-32 rounded-2xl" />
          <Skeleton className="w-1/3 h-10" />
          <Skeleton className="w-2/3 h-4" />
        </div>
      </Layout>
    );
  }

  if (!clubDetail) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-2">Club not found</h2>
          <Link href="/clubs"><Button variant="outline">Back to Clubs</Button></Link>
        </div>
      </Layout>
    );
  }

  const { club, leadership, members, upcomingEvents, pastEvents, posts, notices, achievements, gallery, viewerMembership } = clubDetail;
  const accent = club.accentColor || "#7c3aed";

  const handleJoin = () => {
    requestJoin({ slug, data: { message: joinMessage } }, {
      onSuccess: () => {
        toast({ title: "Request sent", description: "Your request to join has been sent to the club admins." });
        setJoinDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: getGetClubQueryKey(slug) });
      }
    });
  };

  const handleRsvp = (eventId: string) => {
    rsvpEvent({ id: eventId }, {
      onSuccess: () => {
        toast({ title: "RSVP updated" });
        queryClient.invalidateQueries({ queryKey: getGetClubQueryKey(slug) });
      }
    });
  };

  return (
    <Layout>
      {/* ── Hero Banner ── */}
      <div className="w-full h-72 md:h-88 relative overflow-hidden" style={{ minHeight: 320 }}>
        {club.coverUrl ? (
          <>
            <img src={club.coverUrl} alt={`${club.name} cover`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${accent}cc 0%, ${accent}88 40%, #1e1b4b 100%)`,
            }}
          >
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.3) 1px, transparent 1px), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "48px 48px" }}
            />
            <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 24px)" }} />
          </div>
        )}

        {/* Bottom stats strip on banner */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-6 py-4 flex gap-6">
          <div className="flex items-center gap-1.5 text-white/90 text-sm font-medium">
            <UsersIcon className="h-4 w-4" />
            <span>{club.memberCount} Members</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/90 text-sm font-medium">
            <CalendarIcon className="h-4 w-4" />
            <span>{club.eventCount} Events</span>
          </div>
          {upcomingEvents.length > 0 && (
            <div className="flex items-center gap-1.5 text-white/90 text-sm font-medium">
              <StarIcon className="h-4 w-4 text-amber-300" />
              <span>{upcomingEvents.length} Upcoming</span>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-16 relative z-10 pb-24">
        {/* ── Profile Row ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="flex items-end gap-5">
            <div
              className="h-28 w-28 md:h-32 md:w-32 rounded-2xl border-4 border-white bg-white overflow-hidden shadow-2xl flex items-center justify-center flex-shrink-0"
              style={{ boxShadow: `0 8px 32px ${accent}40` }}
            >
              {club.logoUrl ? (
                <img src={club.logoUrl} alt={club.name} className="h-full w-full object-cover" />
              ) : (
                <span className="font-serif font-bold text-4xl" style={{ color: accent }}>
                  {club.name.substring(0, 2)}
                </span>
              )}
            </div>
            <div className="mb-1 pb-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="text-white font-semibold px-3 py-0.5" style={{ backgroundColor: accent }}>{club.category}</Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight drop-shadow-sm">{club.name}</h1>
              {club.shortDescription && (
                <p className="text-muted-foreground mt-1 text-base max-w-xl leading-relaxed">{club.shortDescription}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 md:mb-1">
            {viewerMembership?.status === "approved" ? (
              <Badge variant="secondary" className="px-4 py-2 text-sm bg-primary/10 text-primary border border-primary/20 rounded-xl">
                <CheckIcon className="w-4 h-4 mr-2" /> Member{viewerMembership.role && viewerMembership.role !== "member" && ` · ${viewerMembership.role.replace(/_/g, " ")}`}
              </Badge>
            ) : viewerMembership?.status === "pending" ? (
              <Badge variant="outline" className="px-4 py-2 text-sm rounded-xl">Request Pending</Badge>
            ) : (
              <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="shadow-lg rounded-xl px-7 transition-all duration-200 hover:-translate-y-0.5" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}bb)` }}>
                    Join Club
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Join {club.name}</DialogTitle>
                    <DialogDescription>Send a request to join this club. You can optionally include a message.</DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Textarea placeholder="Why do you want to join? (Optional)" value={joinMessage} onChange={(e) => setJoinMessage(e.target.value)} rows={4} />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setJoinDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleJoin} disabled={isJoining}>{isJoining ? "Sending…" : "Send Request"}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Tabs ── */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="w-full">
              <div className="bg-white rounded-2xl shadow-sm border border-border/60 p-1 mb-6 overflow-x-auto no-scrollbar">
                <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-0.5 flex-nowrap min-w-max">
                  {[
                    { id: "overview", label: "Overview", icon: BookOpenIcon },
                    { id: "events", label: "Events", icon: CalendarDaysIcon },
                    { id: "posts", label: "Posts", icon: BookOpenIcon },
                    { id: "notices", label: "Notices", icon: BellIcon },
                    { id: "members", label: "Members", icon: UsersIcon },
                    { id: "gallery", label: "Gallery", icon: ImageIcon },
                    { id: "achievements", label: "Achievements", icon: TrophyIcon },
                  ].map(tab => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-xl capitalize transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm"
                    >
                      <tab.icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* ── Overview ── */}
              <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-300">
                {club.description && (
                  <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6">
                    <h3 className="text-lg font-serif font-bold mb-3 flex items-center gap-2">
                      <span className="w-1 h-5 rounded-full inline-block" style={{ backgroundColor: accent }} />
                      About the Club
                    </h3>
                    <p className="text-base leading-relaxed text-muted-foreground whitespace-pre-wrap">{club.description}</p>
                  </div>
                )}

                {upcomingEvents.length > 0 && (
                  <div>
                    <h3 className="text-xl font-serif font-bold mb-4 flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-primary" /> Upcoming Events
                    </h3>
                    <div className="grid gap-4">
                      {upcomingEvents.slice(0, 3).map(event => (
                        <EventCard key={event.id} event={event} onRsvp={handleRsvp} accent={accent} />
                      ))}
                    </div>
                  </div>
                )}

                {posts.length > 0 && (
                  <div>
                    <h3 className="text-xl font-serif font-bold mb-4 flex items-center gap-2">
                      <BookOpenIcon className="h-5 w-5 text-primary" /> Latest Posts
                    </h3>
                    <div className="grid gap-4">
                      {posts.slice(0, 2).map(post => (
                        <PostCard key={post.id} post={post} accent={accent} />
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ── Events ── */}
              <TabsContent value="events" className="space-y-8 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-xl font-serif font-bold mb-4 flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary" /> Upcoming Events
                  </h3>
                  {upcomingEvents.length > 0 ? (
                    <div className="grid gap-4">
                      {upcomingEvents.map(event => (
                        <EventCard key={event.id} event={event} onRsvp={handleRsvp} accent={accent} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={CalendarIcon} text="No upcoming events scheduled." />
                  )}
                </div>

                {pastEvents && pastEvents.length > 0 && (
                  <div>
                    <h3 className="text-xl font-serif font-bold mb-4 text-muted-foreground flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5" /> Past Events
                    </h3>
                    <div className="grid gap-3">
                      {pastEvents.map((event: any) => (
                        <div key={event.id} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-border/60 opacity-65 hover:opacity-100 transition-opacity duration-200">
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{event.title}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(event.startsAt), "MMM d, yyyy")} · {event.venue}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ── Posts ── */}
              <TabsContent value="posts" className="animate-in fade-in duration-300 space-y-5">
                {posts.length > 0 ? posts.map(post => (
                  <PostCard key={post.id} post={post} accent={accent} full />
                )) : (
                  <EmptyState icon={BookOpenIcon} text="No posts yet." />
                )}
              </TabsContent>

              {/* ── Notices ── */}
              <TabsContent value="notices" className="animate-in fade-in duration-300 space-y-4">
                {notices.length > 0 ? notices.map((notice, i) => {
                  const colors = [
                    { bg: "bg-violet-50", border: "border-violet-400", badge: "bg-violet-100 text-violet-700" },
                    { bg: "bg-blue-50", border: "border-blue-400", badge: "bg-blue-100 text-blue-700" },
                    { bg: "bg-emerald-50", border: "border-emerald-400", badge: "bg-emerald-100 text-emerald-700" },
                    { bg: "bg-amber-50", border: "border-amber-400", badge: "bg-amber-100 text-amber-700" },
                  ];
                  const c = colors[i % colors.length];
                  return (
                    <div key={notice.id} className={`rounded-2xl border-l-4 p-5 shadow-sm transition-all duration-200 hover:shadow-md ${c.bg} ${c.border}`}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-bold text-foreground">{notice.title}</h3>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${c.badge}`}>
                          {format(new Date(notice.publishAt), "MMM d")}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/80">{notice.body}</p>
                    </div>
                  );
                }) : (
                  <EmptyState icon={BellIcon} text="No notices." />
                )}
              </TabsContent>

              {/* ── Members ── */}
              <TabsContent value="members" className="animate-in fade-in duration-300 space-y-8">
                {leadership.length > 0 && (
                  <div>
                    <h3 className="text-xl font-serif font-bold mb-4 flex items-center gap-2">
                      <StarIcon className="h-5 w-5 text-amber-500" /> Leadership
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {leadership.map(member => (
                        <div key={member.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-border/60 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                          <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${colorForName(member.fullName)} flex items-center justify-center font-bold text-white text-lg flex-shrink-0 shadow-sm`}>
                            {member.fullName.substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-bold">{member.fullName}</p>
                            <p className="text-sm text-muted-foreground capitalize">{member.role.replace(/_/g, " ")}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-serif font-bold mb-4 flex items-center gap-2">
                    <UsersIcon className="h-5 w-5 text-primary" /> All Members
                    <span className="ml-1 text-sm font-normal text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">{club.memberCount}</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {members.map(member => (
                      <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl border bg-white hover:bg-accent/30 transition-colors duration-150">
                        <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${colorForName(member.fullName)} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
                          {member.fullName.substring(0, 2)}
                        </div>
                        <p className="text-sm font-medium truncate">{member.fullName}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* ── Gallery ── */}
              <TabsContent value="gallery" className="animate-in fade-in duration-300">
                {gallery.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {gallery.map(item => (
                      <div key={item.id} className="relative group rounded-2xl overflow-hidden aspect-square bg-muted shadow-sm hover:shadow-lg transition-all duration-300">
                        <img src={item.url} alt={item.caption || "Gallery"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        {item.caption && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white text-xs translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                            {item.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={ImageIcon} text="Gallery is empty." />
                )}
              </TabsContent>

              {/* ── Achievements ── */}
              <TabsContent value="achievements" className="animate-in fade-in duration-300">
                {achievements.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {achievements.map(item => (
                      <div key={item.id} className="relative group rounded-2xl overflow-hidden aspect-square bg-muted shadow-sm hover:shadow-lg transition-all duration-300">
                        <img src={item.url} alt={item.caption || "Achievement"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute top-2 right-2">
                          <div className="w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center shadow-md">
                            <TrophyIcon className="h-3.5 w-3.5 text-white" />
                          </div>
                        </div>
                        {item.caption && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white text-xs translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                            {item.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={TrophyIcon} text="No achievements posted yet." />
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-5">
            {/* Stats card */}
            <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
              <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />
              <div className="p-5 space-y-4">
                <h3 className="font-serif font-bold text-lg">About</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{club.memberCount}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Members</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-center">
                    <p className="text-2xl font-bold text-amber-600">{club.eventCount}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Events</p>
                  </div>
                </div>

                {(club.websiteUrl || club.facebookUrl || club.instagramUrl) && (
                  <div className="pt-3 border-t flex flex-col gap-2.5">
                    {club.websiteUrl && (
                      <a href={club.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-sm p-2.5 rounded-xl hover:bg-muted transition-colors">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                          <GlobeIcon className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="font-medium">Website</span>
                        <ExternalLinkIcon className="w-3 h-3 ml-auto text-muted-foreground" />
                      </a>
                    )}
                    {club.facebookUrl && (
                      <a href={club.facebookUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-sm p-2.5 rounded-xl hover:bg-muted transition-colors">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                          <FacebookIcon className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <span className="font-medium">Facebook</span>
                        <ExternalLinkIcon className="w-3 h-3 ml-auto text-muted-foreground" />
                      </a>
                    )}
                    {club.instagramUrl && (
                      <a href={club.instagramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-sm p-2.5 rounded-xl hover:bg-muted transition-colors">
                        <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
                          <InstagramIcon className="w-3.5 h-3.5 text-rose-500" />
                        </div>
                        <span className="font-medium">Instagram</span>
                        <ExternalLinkIcon className="w-3 h-3 ml-auto text-muted-foreground" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Leadership sidebar */}
            {leadership.length > 0 && (
              <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-5">
                <h3 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
                  <StarIcon className="h-4.5 w-4.5 text-amber-500" /> Leadership
                </h3>
                <div className="space-y-3">
                  {leadership.map(leader => (
                    <div key={leader.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent/30 transition-colors duration-150">
                      <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${colorForName(leader.fullName)} flex items-center justify-center font-bold text-white text-sm flex-shrink-0 shadow-sm`}>
                        {leader.fullName.substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{leader.fullName}</p>
                        <p className="text-xs text-muted-foreground capitalize">{leader.role.replace(/_/g, " ")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming events quick list */}
            {upcomingEvents.length > 0 && (
              <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-5">
                <h3 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
                  <CalendarDaysIcon className="h-4.5 w-4.5 text-primary" /> Next Events
                </h3>
                <div className="space-y-3">
                  {upcomingEvents.slice(0, 3).map(event => (
                    <div key={event.id} className="flex gap-3 items-start">
                      <div className="flex-shrink-0 w-10 text-center rounded-xl overflow-hidden border border-border/60 shadow-sm">
                        <div className="text-white text-xs font-bold py-0.5" style={{ backgroundColor: accent }}>
                          {format(new Date(event.startsAt), "MMM")}
                        </div>
                        <div className="text-foreground font-bold text-sm py-1 bg-white">
                          {format(new Date(event.startsAt), "d")}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{event.venue}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function EventCard({ event, onRsvp, accent, full = false }: { event: any; onRsvp: (id: string) => void; accent: string; full?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      {event.coverUrl && (
        <div className="relative overflow-hidden">
          <img src={event.coverUrl} alt={event.title} className="w-full h-44 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}
      <div className="p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-lg leading-snug mb-2">{event.title}</h4>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5 text-primary" />
              {format(new Date(event.startsAt), "MMM d, yyyy h:mm a")}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPinIcon className="h-3.5 w-3.5 text-rose-500" />
              {event.venue}
            </span>
            {event.rsvpCount != null && (
              <span className="flex items-center gap-1.5">
                <UsersIcon className="h-3.5 w-3.5 text-emerald-500" />
                {event.rsvpCount} going
              </span>
            )}
          </div>
        </div>
        <Button
          variant={event.viewerHasRsvp ? "secondary" : "outline"}
          className={`flex-shrink-0 rounded-xl transition-all duration-200 ${event.viewerHasRsvp ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20" : "hover:border-primary hover:text-primary"}`}
          onClick={() => onRsvp(event.id)}
        >
          {event.viewerHasRsvp ? <><CheckIcon className="h-3.5 w-3.5 mr-1.5" /> Going</> : "RSVP"}
        </Button>
      </div>
    </div>
  );
}

function PostCard({ post, accent, full = false }: { post: any; accent: string; full?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
      {post.imageUrl && (
        <div className="overflow-hidden">
          <img src={post.imageUrl} alt={post.title} className="w-full h-52 object-cover hover:scale-105 transition-transform duration-500" />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className={`h-7 w-7 rounded-full bg-gradient-to-br ${colorForName(post.authorName)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
            {post.authorName.substring(0, 2)}
          </div>
          <span className="text-sm font-medium text-muted-foreground">{post.authorName}</span>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-xs text-muted-foreground">{format(new Date(post.createdAt), "MMM d, yyyy")}</span>
        </div>
        <h3 className="text-xl font-bold mb-3 leading-snug">{post.title}</h3>
        <p className={`leading-relaxed text-muted-foreground text-sm whitespace-pre-wrap ${!full ? "line-clamp-3" : ""}`}>{post.body}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="text-center py-16 rounded-2xl border border-dashed bg-white/50">
      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground font-medium">{text}</p>
    </div>
  );
}
