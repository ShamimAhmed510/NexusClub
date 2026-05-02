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
import { CalendarIcon, MapPinIcon, UsersIcon, CheckIcon, ExternalLinkIcon, GlobeIcon, FacebookIcon, InstagramIcon } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { getGetClubQueryKey } from "@workspace/api-client-react";

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
        <div className="w-full h-72 bg-muted animate-pulse" />
        <div className="container mx-auto px-4 -mt-16 relative z-10">
          <Skeleton className="w-32 h-32 rounded-xl mb-4" />
          <Skeleton className="w-1/3 h-10 mb-2" />
          <Skeleton className="w-2/3 h-4 mb-8" />
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
      {/* ── Cover Banner ── */}
      <div
        className="w-full h-64 md:h-80 relative overflow-hidden"
        style={{ backgroundColor: club.accentColor || "#4f46e5" }}
      >
        {club.coverUrl ? (
          <>
            <img
              src={club.coverUrl}
              alt={`${club.name} cover`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "repeating-linear-gradient(45deg,rgba(255,255,255,.15) 0px,rgba(255,255,255,.15) 1px,transparent 1px,transparent 18px)" }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/30" />
          </>
        )}
      </div>

      <div className="container mx-auto px-4 -mt-20 relative z-10 mb-20">
        {/* ── Header: logo + name + join button ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="flex items-end gap-5">
            <div className="h-32 w-32 rounded-2xl border-4 border-background bg-background overflow-hidden shadow-xl flex items-center justify-center flex-shrink-0">
              {club.logoUrl ? (
                <img src={club.logoUrl} alt={club.name} className="h-full w-full object-cover" />
              ) : (
                <span className="font-serif font-bold text-4xl" style={{ color: club.accentColor || "#4f46e5" }}>
                  {club.name.substring(0, 2)}
                </span>
              )}
            </div>
            <div className="mb-1 pb-1">
              <Badge className="mb-2" style={{ backgroundColor: club.accentColor || undefined }}>{club.category}</Badge>
              <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight drop-shadow-sm">{club.name}</h1>
              {club.shortDescription && (
                <p className="text-muted-foreground mt-1 text-base max-w-xl">{club.shortDescription}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 md:mb-1">
            {viewerMembership?.status === "approved" ? (
              <Badge variant="secondary" className="px-4 py-2 text-sm bg-primary/10 text-primary border-primary/20">
                <CheckIcon className="w-4 h-4 mr-2" /> Member{viewerMembership.role && viewerMembership.role !== "member" && ` · ${viewerMembership.role.replace(/_/g, " ")}`}
              </Badge>
            ) : viewerMembership?.status === "pending" ? (
              <Badge variant="outline" className="px-4 py-2 text-sm">
                Request Pending
              </Badge>
            ) : (
              <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="shadow-md">Join Club</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Join {club.name}</DialogTitle>
                    <DialogDescription>
                      Send a request to join this club. You can optionally include a message.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Textarea
                      placeholder="Why do you want to join? (Optional)"
                      value={joinMessage}
                      onChange={(e) => setJoinMessage(e.target.value)}
                      rows={4}
                    />
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
              <TabsList className="w-full justify-start overflow-x-auto overflow-y-hidden border-b rounded-none h-auto p-0 bg-transparent mb-8 no-scrollbar">
                {["overview", "members", "events", "posts", "notices", "gallery", "achievements"].map(tab => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="capitalize rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-sm font-medium"
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Overview */}
              <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-300">
                <div>
                  <p className="text-base leading-relaxed text-muted-foreground whitespace-pre-wrap">{club.description}</p>
                </div>

                {upcomingEvents.length > 0 && (
                  <div>
                    <h3 className="text-xl font-serif font-bold mb-4">Upcoming Events</h3>
                    <div className="grid gap-4">
                      {upcomingEvents.map(event => (
                        <Card key={event.id} className="overflow-hidden">
                          {event.coverUrl && (
                            <img src={event.coverUrl} alt={event.title} className="w-full h-40 object-cover" />
                          )}
                          <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                            <div>
                              <h4 className="font-bold text-lg">{event.title}</h4>
                              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1"><CalendarIcon className="h-4 w-4" /> {format(new Date(event.startsAt), "MMM d, yyyy h:mm a")}</span>
                                <span className="flex items-center gap-1"><MapPinIcon className="h-4 w-4" /> {event.venue}</span>
                              </div>
                            </div>
                            <Button
                              variant={event.viewerHasRsvp ? "secondary" : "outline"}
                              onClick={() => handleRsvp(event.id as any)}
                            >
                              {event.viewerHasRsvp ? "Going" : "RSVP"}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Members */}
              <TabsContent value="members" className="animate-in fade-in duration-300 space-y-8">
                <div>
                  <h3 className="text-xl font-serif font-bold mb-4">Leadership</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {leadership.map(member => (
                      <Card key={member.id}>
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-lg flex-shrink-0">
                            {member.fullName.substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-bold">{member.fullName}</p>
                            <p className="text-sm text-muted-foreground capitalize">{member.role.replace(/_/g, " ")}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-serif font-bold mb-4">All Members ({club.memberCount})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {members.map(member => (
                      <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {member.fullName.substring(0, 2)}
                        </div>
                        <p className="text-sm font-medium truncate">{member.fullName}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Events */}
              <TabsContent value="events" className="space-y-8 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-xl font-serif font-bold mb-4">Upcoming Events</h3>
                  {upcomingEvents.length > 0 ? (
                    <div className="grid gap-4">
                      {upcomingEvents.map(event => (
                        <Card key={event.id} className="overflow-hidden">
                          {event.coverUrl && (
                            <img src={event.coverUrl} alt={event.title} className="w-full h-44 object-cover" />
                          )}
                          <CardContent className="p-4 flex justify-between items-start gap-4">
                            <div>
                              <h4 className="font-bold text-lg">{event.title}</h4>
                              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1"><CalendarIcon className="h-4 w-4" /> {format(new Date(event.startsAt), "MMM d, yyyy h:mm a")}</span>
                                <span className="flex items-center gap-1"><MapPinIcon className="h-4 w-4" /> {event.venue}</span>
                                <span className="flex items-center gap-1"><UsersIcon className="h-4 w-4" /> {event.rsvpCount} going</span>
                              </div>
                            </div>
                            <Button
                              variant={event.viewerHasRsvp ? "secondary" : "outline"}
                              className="flex-shrink-0"
                              onClick={() => handleRsvp(event.id as any)}
                            >
                              {event.viewerHasRsvp ? "Going" : "RSVP"}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : <p className="text-muted-foreground py-4">No upcoming events.</p>}
                </div>

                {pastEvents && pastEvents.length > 0 && (
                  <div>
                    <h3 className="text-xl font-serif font-bold mb-4 text-muted-foreground">Past Events</h3>
                    <div className="grid gap-3">
                      {pastEvents.map((event: any) => (
                        <Card key={event.id} className="opacity-70">
                          <CardContent className="p-4">
                            <h4 className="font-medium">{event.title}</h4>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>{format(new Date(event.startsAt), "MMM d, yyyy")}</span>
                              <span>· {event.venue}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Posts */}
              <TabsContent value="posts" className="animate-in fade-in duration-300 space-y-6">
                {posts.length > 0 ? posts.map(post => (
                  <Card key={post.id} className="overflow-hidden">
                    {post.imageUrl && (
                      <img src={post.imageUrl} alt={post.title} className="w-full h-64 object-cover" />
                    )}
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        By {post.authorName} · {format(new Date(post.createdAt), "MMM d, yyyy")}
                      </p>
                      <p className="whitespace-pre-wrap leading-relaxed">{post.body}</p>
                    </CardContent>
                  </Card>
                )) : <p className="text-muted-foreground py-4">No posts yet.</p>}
              </TabsContent>

              {/* Notices */}
              <TabsContent value="notices" className="animate-in fade-in duration-300 space-y-4">
                {notices.length > 0 ? notices.map(notice => (
                  <Card key={notice.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <h3 className="font-bold mb-1">{notice.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{format(new Date(notice.publishAt), "MMM d, yyyy")}</p>
                      <p className="text-sm leading-relaxed">{notice.body}</p>
                    </CardContent>
                  </Card>
                )) : <p className="text-muted-foreground py-4">No notices.</p>}
              </TabsContent>

              {/* Gallery */}
              <TabsContent value="gallery" className="animate-in fade-in duration-300">
                {gallery.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {gallery.map(item => (
                      <div key={item.id} className="relative group rounded-xl overflow-hidden aspect-square bg-muted">
                        <img src={item.url} alt={item.caption || "Gallery"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        {item.caption && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 border border-dashed rounded-xl">
                    <p className="text-muted-foreground">Gallery is empty.</p>
                  </div>
                )}
              </TabsContent>

              {/* Achievements */}
              <TabsContent value="achievements" className="animate-in fade-in duration-300">
                {achievements.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {achievements.map(item => (
                      <div key={item.id} className="relative group rounded-xl overflow-hidden aspect-square bg-muted">
                        <img src={item.url} alt={item.caption || "Achievement"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        {item.caption && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 border border-dashed rounded-xl">
                    <p className="text-muted-foreground">No achievements posted yet.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-serif">About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <UsersIcon className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>{club.memberCount} Members</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <CalendarIcon className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>{club.eventCount} Events</span>
                </div>

                {(club.websiteUrl || club.facebookUrl || club.instagramUrl) && (
                  <div className="pt-4 border-t flex flex-col gap-2.5">
                    {club.websiteUrl && (
                      <a href={club.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                        <GlobeIcon className="w-4 h-4 flex-shrink-0" /> Website
                      </a>
                    )}
                    {club.facebookUrl && (
                      <a href={club.facebookUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                        <ExternalLinkIcon className="w-4 h-4 flex-shrink-0" /> Facebook
                      </a>
                    )}
                    {club.instagramUrl && (
                      <a href={club.instagramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                        <ExternalLinkIcon className="w-4 h-4 flex-shrink-0" /> Instagram
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {leadership.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-serif">Leadership</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {leadership.map(leader => (
                    <div key={leader.id} className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                        {leader.fullName.substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{leader.fullName}</p>
                        <p className="text-xs text-muted-foreground capitalize">{leader.role.replace(/_/g, " ")}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
