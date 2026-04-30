import { useListClubs, useListEvents, useListNotices } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { CalendarIcon, MapPinIcon, BellIcon, ArrowRightIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function Home() {
  const { data: clubs, isLoading: isLoadingClubs } = useListClubs();
  const { data: events, isLoading: isLoadingEvents } = useListEvents({ query: { queryKey: ["/api/events", { scope: "upcoming" }] } });
  const { data: notices, isLoading: isLoadingNotices } = useListNotices({ query: { queryKey: ["/api/notices", { scope: "pinned" }] } });

  const featuredClubs = clubs?.slice(0, 6) || [];
  const upcomingEvents = events?.slice(0, 3) || [];
  const pinnedNotices = notices?.slice(0, 3) || [];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/40"></div>
        <div className="container relative mx-auto px-4 z-10">
          <div className="max-w-3xl space-y-6">
            <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight leading-tight">
              Discover your community at MU
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/80 font-light leading-relaxed">
              Explore official university clubs, join exciting events, and connect with students who share your passions.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/clubs">
                <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-lg h-14 px-8">
                  Browse Clubs
                </Button>
              </Link>
              <Link href="/events">
                <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-lg h-14 px-8">
                  View Events
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Clubs */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-serif font-bold tracking-tight text-foreground mb-2">Featured Societies</h2>
              <p className="text-muted-foreground">Find where you belong from our vibrant student communities.</p>
            </div>
            <Link href="/clubs" className="hidden md:flex items-center text-primary font-medium hover:underline">
              View all <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {isLoadingClubs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-[200px] rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredClubs.map(club => (
                <Link key={club.id} href={`/clubs/${club.slug}`}>
                  <Card className="h-full group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20 cursor-pointer overflow-hidden flex flex-col">
                    <div 
                      className="h-24 w-full bg-muted relative"
                      style={{ backgroundColor: club.accentColor || 'hsl(var(--primary))' }}
                    >
                      {club.coverUrl && (
                        <img src={club.coverUrl} alt={club.name} className="w-full h-full object-cover opacity-50 mix-blend-overlay group-hover:opacity-70 transition-opacity" />
                      )}
                    </div>
                    <CardHeader className="relative pt-12 flex-1">
                      <div className="absolute -top-10 left-6 h-16 w-16 rounded-lg border-4 border-card bg-background overflow-hidden shadow-sm flex items-center justify-center">
                        {club.logoUrl ? (
                          <img src={club.logoUrl} alt={club.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="font-serif font-bold text-xl text-primary">{club.name.substring(0, 2)}</span>
                        )}
                      </div>
                      <Badge variant="outline" className="w-fit mb-2 bg-muted/50">{club.category}</Badge>
                      <CardTitle className="text-xl font-serif group-hover:text-primary transition-colors line-clamp-1">{club.name}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-2 text-sm">{club.shortDescription}</CardDescription>
                    </CardHeader>
                    <CardFooter className="border-t border-border/40 bg-muted/10 py-3 text-xs text-muted-foreground flex justify-between">
                      <span>{club.memberCount} members</span>
                      <span>{club.eventCount} events</span>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
          <div className="mt-8 text-center md:hidden">
            <Link href="/clubs">
              <Button variant="outline" className="w-full">View all clubs</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Split Section: Events & Notices */}
      <section className="py-20 bg-muted/30 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8">
            
            {/* Upcoming Events */}
            <div>
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-2xl font-serif font-bold tracking-tight flex items-center gap-2">
                    <CalendarIcon className="h-6 w-6 text-primary" />
                    Upcoming Events
                  </h2>
                </div>
                <Link href="/events" className="text-sm font-medium text-primary hover:underline">
                  View all
                </Link>
              </div>

              <div className="space-y-4">
                {isLoadingEvents ? (
                  [1, 2, 3].map(i => <Skeleton key={i} className="h-[120px] rounded-xl" />)
                ) : upcomingEvents.length > 0 ? (
                  upcomingEvents.map(event => (
                    <Link key={event.id} href={`/events/${event.id}`}>
                      <Card className="hover:shadow-md transition-all duration-200 border-border/50 cursor-pointer group">
                        <CardContent className="p-5 flex gap-5">
                          <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-primary/5 text-primary border border-primary/10">
                            <span className="text-xs font-medium uppercase tracking-wider">{format(new Date(event.startsAt), 'MMM')}</span>
                            <span className="text-xl font-bold font-serif">{format(new Date(event.startsAt), 'd')}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-muted-foreground mb-1 line-clamp-1">{event.clubName}</p>
                            <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">{event.title}</h3>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> {format(new Date(event.startsAt), 'h:mm a')}</span>
                              <span className="flex items-center gap-1 truncate"><MapPinIcon className="h-3 w-3" /> {event.venue}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                ) : (
                  <Card className="border-dashed bg-transparent shadow-none border-border/60">
                    <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                      <CalendarIcon className="h-10 w-10 text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground font-medium">No upcoming events scheduled</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Pinned Notices */}
            <div>
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-2xl font-serif font-bold tracking-tight flex items-center gap-2">
                    <BellIcon className="h-6 w-6 text-primary" />
                    Important Notices
                  </h2>
                </div>
                <Link href="/notices" className="text-sm font-medium text-primary hover:underline">
                  View all
                </Link>
              </div>

              <div className="space-y-4">
                {isLoadingNotices ? (
                  [1, 2, 3].map(i => <Skeleton key={i} className="h-[120px] rounded-xl" />)
                ) : pinnedNotices.length > 0 ? (
                  pinnedNotices.map(notice => (
                    <Card key={notice.id} className="border-border/50 border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="font-semibold text-base line-clamp-1">{notice.title}</h3>
                          <Badge variant="secondary" className="flex-shrink-0">{notice.scope}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{notice.body}</p>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>{notice.clubName || 'University Administration'}</span>
                          <span>{format(new Date(notice.publishAt), 'MMM d, yyyy')}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="border-dashed bg-transparent shadow-none border-border/60">
                    <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                      <BellIcon className="h-10 w-10 text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground font-medium">No new notices</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>
    </Layout>
  );
}