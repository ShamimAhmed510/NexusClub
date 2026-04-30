import { useGetClub, useRequestJoinClub, useRsvpEvent } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { useRoute, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, MapPinIcon, UsersIcon, CheckIcon, ExternalLinkIcon } from "lucide-react";
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
        <div className="w-full h-64 bg-muted animate-pulse" />
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

  const handleRsvp = (eventId: number) => {
    rsvpEvent({ id: eventId, data: {} }, {
      onSuccess: () => {
        toast({ title: "RSVP successful", description: "Your RSVP status has been updated." });
        queryClient.invalidateQueries({ queryKey: getGetClubQueryKey(slug) });
      }
    });
  };

  return (
    <Layout>
      <div 
        className="w-full h-64 md:h-80 bg-muted relative"
        style={{ backgroundColor: club.accentColor || 'hsl(var(--primary))' }}
      >
        {club.coverUrl && (
          <img src={club.coverUrl} alt="Cover" className="w-full h-full object-cover mix-blend-overlay opacity-80" />
        )}
      </div>

      <div className="container mx-auto px-4 -mt-16 relative z-10 mb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="flex items-end gap-6">
            <div className="h-32 w-32 rounded-xl border-4 border-background bg-background overflow-hidden shadow-md flex items-center justify-center flex-shrink-0">
              {club.logoUrl ? (
                <img src={club.logoUrl} alt={club.name} className="h-full w-full object-cover" />
              ) : (
                <span className="font-serif font-bold text-4xl text-primary">{club.name.substring(0, 2)}</span>
              )}
            </div>
            <div className="mb-2">
              <Badge className="mb-2">{club.category}</Badge>
              <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">{club.name}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {viewerMembership?.status === 'approved' ? (
              <Badge variant="secondary" className="px-4 py-2 text-sm bg-primary/10 text-primary border-primary/20">
                <CheckIcon className="w-4 h-4 mr-2" /> Member {viewerMembership.role !== 'member' && `• ${viewerMembership.role}`}
              </Badge>
            ) : viewerMembership?.status === 'pending' ? (
              <Badge variant="outline" className="px-4 py-2 text-sm">
                Request Pending
              </Badge>
            ) : (
              <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="shadow-sm">Join Club</Button>
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
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setJoinDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleJoin} disabled={isJoining}>{isJoining ? "Sending..." : "Send Request"}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto overflow-y-hidden border-b rounded-none h-auto p-0 bg-transparent mb-8 no-scrollbar">
                {["overview", "members", "events", "posts", "notices", "achievements", "gallery"].map(tab => (
                  <TabsTrigger 
                    key={tab} 
                    value={tab}
                    className="capitalize rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-300">
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap">{club.description}</p>
                </div>
                
                {upcomingEvents.length > 0 && (
                  <div>
                    <h3 className="text-xl font-serif font-bold mb-4">Upcoming Events</h3>
                    <div className="grid gap-4">
                      {upcomingEvents.map(event => (
                        <Card key={event.id}>
                          <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                            <div>
                              <h4 className="font-bold text-lg">{event.title}</h4>
                              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1"><CalendarIcon className="h-4 w-4" /> {format(new Date(event.startsAt), 'MMM d, yyyy h:mm a')}</span>
                                <span className="flex items-center gap-1"><MapPinIcon className="h-4 w-4" /> {event.venue}</span>
                              </div>
                            </div>
                            <Button 
                              variant={event.viewerHasRsvp ? "secondary" : "outline"} 
                              onClick={() => handleRsvp(event.id)}
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

              <TabsContent value="members" className="animate-in fade-in duration-300">
                <h3 className="text-xl font-serif font-bold mb-4">Leadership</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  {leadership.map(member => (
                    <Card key={member.id}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {member.fullName.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold">{member.fullName}</p>
                          <p className="text-sm text-muted-foreground capitalize">{member.role.replace('_', ' ')}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <h3 className="text-xl font-serif font-bold mb-4">Members ({club.memberCount})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {members.map(member => (
                    <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg border bg-card">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                        {member.fullName.substring(0, 2)}
                      </div>
                      <p className="text-sm font-medium truncate">{member.fullName}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="events" className="space-y-8 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-xl font-serif font-bold mb-4">Upcoming Events</h3>
                  {upcomingEvents.length > 0 ? (
                    <div className="grid gap-4">
                      {upcomingEvents.map(event => (
                        <Card key={event.id}>
                          <CardContent className="p-4 flex justify-between items-center">
                            <div>
                              <h4 className="font-bold text-lg">{event.title}</h4>
                              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                <span>{format(new Date(event.startsAt), 'MMM d, yyyy h:mm a')}</span>
                                <span>•</span>
                                <span>{event.venue}</span>
                              </div>
                            </div>
                            <Button 
                              variant={event.viewerHasRsvp ? "secondary" : "outline"} 
                              onClick={() => handleRsvp(event.id)}
                            >
                              {event.viewerHasRsvp ? "Going" : "RSVP"}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : <p className="text-muted-foreground">No upcoming events.</p>}
                </div>
              </TabsContent>

              <TabsContent value="posts" className="animate-in fade-in duration-300 space-y-6">
                {posts.length > 0 ? posts.map(post => (
                  <Card key={post.id}>
                    {post.imageUrl && <img src={post.imageUrl} alt={post.title} className="w-full h-64 object-cover rounded-t-xl" />}
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">By {post.authorName} • {format(new Date(post.createdAt), 'MMM d, yyyy')}</p>
                      <p className="whitespace-pre-wrap">{post.body}</p>
                    </CardContent>
                  </Card>
                )) : <p className="text-muted-foreground">No posts yet.</p>}
              </TabsContent>
              
              <TabsContent value="notices" className="animate-in fade-in duration-300 space-y-4">
                {notices.length > 0 ? notices.map(notice => (
                  <Card key={notice.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <h3 className="font-bold mb-1">{notice.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{format(new Date(notice.publishAt), 'MMM d, yyyy')}</p>
                      <p className="text-sm">{notice.body}</p>
                    </CardContent>
                  </Card>
                )) : <p className="text-muted-foreground">No notices.</p>}
              </TabsContent>

              <TabsContent value="achievements" className="animate-in fade-in duration-300">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {achievements.length > 0 ? achievements.map(item => (
                    <div key={item.id} className="relative group rounded-xl overflow-hidden aspect-square bg-muted">
                      <img src={item.url} alt={item.caption || "Achievement"} className="w-full h-full object-cover" />
                      {item.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.caption}
                        </div>
                      )}
                    </div>
                  )) : <p className="text-muted-foreground col-span-full">No achievements posted.</p>}
                </div>
              </TabsContent>
              
              <TabsContent value="gallery" className="animate-in fade-in duration-300">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {gallery.length > 0 ? gallery.map(item => (
                    <div key={item.id} className="relative rounded-xl overflow-hidden aspect-square bg-muted">
                      <img src={item.url} alt="Gallery" className="w-full h-full object-cover" />
                    </div>
                  )) : <p className="text-muted-foreground col-span-full">Gallery is empty.</p>}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-serif">About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <UsersIcon className="w-5 h-5 text-primary" />
                  <span>{club.memberCount} Members</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  <span>{club.eventCount} Events</span>
                </div>
                
                {(club.websiteUrl || club.facebookUrl || club.instagramUrl) && (
                  <div className="pt-4 border-t flex flex-col gap-2">
                    {club.websiteUrl && (
                      <a href={club.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                        <ExternalLinkIcon className="w-4 h-4" /> Website
                      </a>
                    )}
                    {club.facebookUrl && (
                      <a href={club.facebookUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                        <ExternalLinkIcon className="w-4 h-4" /> Facebook
                      </a>
                    )}
                    {club.instagramUrl && (
                      <a href={club.instagramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                        <ExternalLinkIcon className="w-4 h-4" /> Instagram
                      </a>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}