import { useGetStudentDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { CalendarIcon, BellIcon, UsersIcon, CheckCircleIcon, ClockIcon } from "lucide-react";
import { format } from "date-fns";

export default function StudentDashboard() {
  const { data: dashboard, isLoading } = useGetStudentDashboard();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
        Failed to load dashboard data.
      </div>
    );
  }

  const { joinedClubs, pendingRequests, upcomingEvents, recentNotices } = dashboard;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-serif font-bold tracking-tight mb-8">My Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Joined Clubs */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-serif font-bold flex items-center gap-2">
                <UsersIcon className="h-5 w-5 text-primary" /> My Clubs
              </h2>
            </div>
            
            {joinedClubs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {joinedClubs.map(club => (
                  <Link key={club.id} href={`/clubs/${club.slug}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-border/50">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ backgroundColor: club.accentColor || 'var(--muted)' }}>
                          {club.logoUrl ? (
                            <img src={club.logoUrl} alt={club.name} className="h-full w-full object-cover bg-background border border-background" />
                          ) : (
                            <span className="font-bold text-background mix-blend-difference">{club.name.substring(0, 2)}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold line-clamp-1 group-hover:text-primary">{club.name}</h3>
                          <p className="text-xs text-muted-foreground">{club.category}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="bg-muted/10 border-dashed">
                <CardContent className="p-8 text-center flex flex-col items-center">
                  <UsersIcon className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-medium mb-4">You haven't joined any clubs yet.</p>
                  <Link href="/clubs">
                    <Badge variant="secondary" className="px-4 py-2 text-sm hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors">
                      Explore Clubs
                    </Badge>
                  </Link>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Upcoming Registered Events */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-serif font-bold flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" /> My Events
              </h2>
            </div>
            
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map(event => (
                  <Link key={event.id} href={`/events/${event.id}`}>
                    <Card className="hover:shadow-md transition-all border-border/50 cursor-pointer">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-14 w-14 rounded-lg bg-primary/10 text-primary flex flex-col items-center justify-center flex-shrink-0 border border-primary/20">
                          <span className="text-[10px] font-bold uppercase">{format(new Date(event.startsAt), 'MMM')}</span>
                          <span className="text-lg font-black font-serif leading-none">{format(new Date(event.startsAt), 'd')}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-0.5">{event.clubName}</p>
                          <h3 className="font-bold text-base line-clamp-1">{event.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            <ClockIcon className="h-3 w-3" /> {format(new Date(event.startsAt), 'h:mm a')}
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Going</Badge>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="bg-muted/10 border-dashed">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground text-sm">No upcoming events you're attending.</p>
                </CardContent>
              </Card>
            )}
          </section>
        </div>

        <div className="space-y-8">
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <section>
              <h2 className="text-xl font-serif font-bold flex items-center gap-2 mb-4">
                <ClockIcon className="h-5 w-5 text-primary" /> Pending Requests
              </h2>
              <div className="space-y-3">
                {pendingRequests.map(req => (
                  <Card key={req.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{req.clubName}</span>
                        <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-200 bg-yellow-50">Pending</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" /> Requested on {format(new Date(req.createdAt), 'MMM d')}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Recent Notices */}
          <section>
            <h2 className="text-xl font-serif font-bold flex items-center gap-2 mb-4">
              <BellIcon className="h-5 w-5 text-primary" /> Recent Notices
            </h2>
            
            {recentNotices.length > 0 ? (
              <div className="space-y-3">
                {recentNotices.map(notice => (
                  <Card key={notice.id} className="border-l-4 border-l-primary border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="secondary" className="text-[10px]">{notice.scope === 'university' ? 'MU' : notice.clubName}</Badge>
                        <span className="text-xs text-muted-foreground">{format(new Date(notice.publishAt), 'MMM d')}</span>
                      </div>
                      <h3 className="font-semibold text-sm line-clamp-1">{notice.title}</h3>
                    </CardContent>
                  </Card>
                ))}
                <Link href="/notices" className="block text-center text-sm text-primary hover:underline mt-4">
                  View all notices
                </Link>
              </div>
            ) : (
              <Card className="bg-muted/10 border-dashed">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground text-sm">No recent notices.</p>
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}