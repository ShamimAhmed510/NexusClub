import { useListClubs, useListEvents, useListNotices } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { CalendarIcon, MapPinIcon, BellIcon, ArrowRightIcon, UsersIcon, SparklesIcon, TrophyIcon, ChevronRightIcon, PinIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const STAT_CARDS = [
  { label: "Active Clubs", value: "20+", icon: UsersIcon, color: "from-violet-500 to-indigo-600" },
  { label: "Events Hosted", value: "100+", icon: CalendarIcon, color: "from-pink-500 to-rose-600" },
  { label: "Members", value: "2000+", icon: SparklesIcon, color: "from-amber-500 to-orange-500" },
  { label: "Awards Won", value: "50+", icon: TrophyIcon, color: "from-teal-500 to-emerald-600" },
];

export default function Home() {
  const { data: clubs, isLoading: isLoadingClubs } = useListClubs();
  const { data: events, isLoading: isLoadingEvents } = useListEvents({ scope: "upcoming" as any });
  const { data: notices, isLoading: isLoadingNotices } = useListNotices({ scope: "pinned" as any });

  const featuredClubs = clubs?.slice(0, 6) || [];
  const upcomingEvents = events?.slice(0, 4) || [];
  const pinnedNotices = notices?.slice(0, 4) || [];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-24 md:py-40 overflow-hidden text-white" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 40%, #24243e 100%)' }}>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-5" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(139,92,246,0.35) 0%, transparent 55%), radial-gradient(ellipse at 15% 80%, rgba(59,130,246,0.25) 0%, transparent 45%)' }} />
        <div className="absolute top-16 right-16 w-96 h-96 rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }} />
        <div className="absolute bottom-10 left-8 w-64 h-64 rounded-full opacity-10 blur-2xl" style={{ background: 'radial-gradient(circle, #60a5fa, transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-5 blur-3xl" style={{ background: 'radial-gradient(circle, #ec4899, transparent)' }} />

        <div className="container relative mx-auto px-4 z-10">
          <div className="max-w-3xl space-y-7">
            <div className="animate-slide-right">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border border-white/20" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                <SparklesIcon className="h-3.5 w-3.5 text-violet-300" />
                Metropolitan University Student Portal
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight leading-tight animate-fade-up">
              Discover your <br />
              <span style={{ background: 'linear-gradient(90deg, #c084fc, #818cf8, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                community
              </span>{" "}at MU
            </h1>
            <p className="text-xl md:text-2xl text-white/70 font-light leading-relaxed animate-fade-up animate-delay-100 max-w-2xl">
              Explore official university clubs, join exciting events, and connect with students who share your passions.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 animate-fade-up animate-delay-200">
              <Link href="/clubs">
                <Button size="lg" className="text-base h-13 px-8 shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 transition-all duration-300" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 'none', color: 'white' }}>
                  Browse Clubs
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 text-base h-13 px-8 transition-all duration-300">
                  Join Now — It's Free
                </Button>
              </Link>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-6 pt-6 animate-fade-up animate-delay-300">
              {[
                { val: clubs?.length ?? "20+", label: "Active Clubs" },
                { val: "2000+", label: "Students" },
                { val: "100+", label: "Events/Year" },
              ].map(({ val, label }) => (
                <div key={label} className="text-center">
                  <div className="text-2xl font-bold font-serif text-white">{val}</div>
                  <div className="text-xs text-white/50 uppercase tracking-wider">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" style={{ display: 'block' }}>
            <path d="M0 60L60 50C120 40 240 20 360 16.7C480 13.3 600 26.7 720 30C840 33.3 960 26.7 1080 23.3C1200 20 1320 20 1380 20L1440 20V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0V60Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className={`relative rounded-2xl p-5 text-white overflow-hidden bg-gradient-to-br ${color} shadow-lg`}>
                <div className="absolute top-2 right-2 opacity-20">
                  <Icon className="h-16 w-16" />
                </div>
                <Icon className="h-6 w-6 mb-2 opacity-90" />
                <div className="text-3xl font-bold font-serif">{value}</div>
                <div className="text-sm opacity-80 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Clubs */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3" style={{ background: 'linear-gradient(135deg, #ede9fe, #dbeafe)', color: '#4f46e5' }}>Student Life</span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold tracking-tight mb-2">Featured Societies</h2>
              <p className="text-muted-foreground">Find where you belong from our vibrant student communities.</p>
            </div>
            <Link href="/clubs" className="hidden md:flex items-center gap-1 text-primary font-semibold hover:underline text-sm">
              View all clubs <ChevronRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {isLoadingClubs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-[260px] rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredClubs.map((club, i) => (
                <Link key={club.id} href={`/clubs/${club.slug}`}>
                  <Card className="h-full group hover:shadow-xl transition-all duration-400 border-border/50 hover:border-primary/30 cursor-pointer overflow-hidden flex flex-col card-hover rounded-2xl">
                    <div
                      className="h-28 w-full bg-muted relative overflow-hidden"
                      style={{ backgroundColor: club.accentColor || '#6366f1' }}
                    >
                      {club.coverUrl ? (
                        <img src={club.coverUrl} alt={club.name} className="w-full h-full object-cover opacity-60 mix-blend-overlay group-hover:opacity-80 group-hover:scale-105 transition-all duration-500" />
                      ) : (
                        <div className="absolute inset-0 opacity-20" style={{ background: 'repeating-linear-gradient(45deg, rgba(255,255,255,.1) 0px, rgba(255,255,255,.1) 2px, transparent 2px, transparent 12px)' }} />
                      )}
                    </div>
                    <CardHeader className="relative pt-11 flex-1 pb-3">
                      <div className="absolute -top-10 left-5 h-18 w-18 rounded-xl border-4 border-card bg-background overflow-hidden shadow-md flex items-center justify-center" style={{ width: '4.5rem', height: '4.5rem' }}>
                        {club.logoUrl ? (
                          <img src={club.logoUrl} alt={club.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="font-serif font-bold text-2xl text-primary">{club.name.substring(0, 2)}</span>
                        )}
                      </div>
                      <Badge className="w-fit mb-2 text-[10px] uppercase tracking-wider font-semibold" style={{ background: `${club.accentColor}22`, color: club.accentColor || '#6366f1', border: `1px solid ${club.accentColor}44` }}>{club.category}</Badge>
                      <CardTitle className="text-xl font-serif group-hover:text-primary transition-colors line-clamp-1">{club.name}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1.5 text-sm leading-relaxed">{club.shortDescription}</CardDescription>
                    </CardHeader>
                    <CardFooter className="border-t border-border/40 bg-muted/10 py-3 text-xs text-muted-foreground flex justify-between">
                      <span className="flex items-center gap-1.5"><UsersIcon className="h-3.5 w-3.5" /> {club.memberCount} members</span>
                      <span className="flex items-center gap-1.5"><CalendarIcon className="h-3.5 w-3.5" /> {club.eventCount} events</span>
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

      {/* Events & Notices Split Section */}
      <section className="py-20 border-t border-border/50" style={{ background: 'linear-gradient(180deg, hsl(var(--muted)/0.3) 0%, hsl(var(--background)) 100%)' }}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Upcoming Events */}
            <div>
              <div className="flex justify-between items-end mb-8">
                <div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3" style={{ background: 'linear-gradient(135deg, #fce7f3, #ffe4e6)', color: '#e11d48' }}>What's On</span>
                  <h2 className="text-2xl font-serif font-bold tracking-tight flex items-center gap-2">
                    <CalendarIcon className="h-6 w-6 text-rose-500" />
                    Upcoming Events
                  </h2>
                </div>
                <Link href="/events" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                  View all <ChevronRightIcon className="h-4 w-4" />
                </Link>
              </div>

              <div className="space-y-4">
                {isLoadingEvents ? (
                  [1, 2, 3].map(i => <Skeleton key={i} className="h-[100px] rounded-xl" />)
                ) : upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event, i) => (
                    <Link key={event.id} href={`/events/${event.id}`}>
                      <Card className="hover:shadow-lg transition-all duration-300 border-border/50 cursor-pointer group rounded-xl overflow-hidden" style={{ animationDelay: `${i * 60}ms` }}>
                        <CardContent className="p-0 flex">
                          <div className="flex-shrink-0 flex flex-col items-center justify-center w-20 bg-gradient-to-br from-rose-500 to-pink-600 text-white py-4">
                            <span className="text-xs font-bold uppercase tracking-wider opacity-80">{format(new Date(event.startsAt), 'MMM')}</span>
                            <span className="text-3xl font-bold font-serif leading-tight">{format(new Date(event.startsAt), 'd')}</span>
                          </div>
                          <div className="flex-1 min-w-0 p-4">
                            <p className="text-xs font-semibold text-muted-foreground mb-0.5 line-clamp-1 uppercase tracking-wide">{event.clubName}</p>
                            <h3 className="font-bold text-base line-clamp-1 group-hover:text-primary transition-colors">{event.title}</h3>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> {format(new Date(event.startsAt), 'h:mm a')}</span>
                              <span className="flex items-center gap-1 truncate"><MapPinIcon className="h-3 w-3" /> {event.venue}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                ) : (
                  <Card className="border-dashed bg-transparent shadow-none border-border/60 rounded-xl">
                    <CardContent className="flex flex-col items-center justify-center p-10 text-center">
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
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3" style={{ background: 'linear-gradient(135deg, #fef9c3, #fde68a)', color: '#92400e' }}>Announcements</span>
                  <h2 className="text-2xl font-serif font-bold tracking-tight flex items-center gap-2">
                    <BellIcon className="h-6 w-6 text-amber-500" />
                    Important Notices
                  </h2>
                </div>
                <Link href="/notices" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                  View all <ChevronRightIcon className="h-4 w-4" />
                </Link>
              </div>

              <div className="space-y-4">
                {isLoadingNotices ? (
                  [1, 2, 3].map(i => <Skeleton key={i} className="h-[100px] rounded-xl" />)
                ) : pinnedNotices.length > 0 ? (
                  pinnedNotices.map((notice, i) => (
                    <Card key={notice.id} className="border-border/50 overflow-hidden hover:shadow-lg transition-all duration-300 rounded-xl" style={{ animationDelay: `${i * 60}ms` }}>
                      <div className="flex">
                        <div className={`w-1.5 flex-shrink-0 ${notice.scope === 'university' ? 'bg-gradient-to-b from-indigo-500 to-violet-600' : 'bg-gradient-to-b from-amber-400 to-orange-500'}`} />
                        <CardContent className="p-4 flex-1">
                          <div className="flex items-start justify-between gap-3 mb-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {notice.pinned && (
                                <Badge className="text-[10px] py-0 px-1.5" style={{ background: '#fef3c7', color: '#92400e' }}>
                                  <PinIcon className="h-2.5 w-2.5 mr-0.5" /> Pinned
                                </Badge>
                              )}
                              <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${notice.scope === 'university' ? 'border-indigo-300 text-indigo-700 bg-indigo-50' : 'border-amber-300 text-amber-700 bg-amber-50'}`}>
                                {notice.scope === 'university' ? 'University' : notice.clubName || 'Club'}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground flex-shrink-0">{format(new Date(notice.publishAt), 'MMM d')}</span>
                          </div>
                          <h3 className="font-semibold text-sm line-clamp-1 mb-1">{notice.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{notice.body}</p>
                        </CardContent>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="border-dashed bg-transparent shadow-none border-border/60 rounded-xl">
                    <CardContent className="flex flex-col items-center justify-center p-10 text-center">
                      <BellIcon className="h-10 w-10 text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground font-medium">No notices yet</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #1d4ed8 100%)' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.3) 0%, transparent 70%)' }} />
        <div className="container relative mx-auto px-4 text-center z-10">
          <SparklesIcon className="h-10 w-10 mx-auto mb-5 text-violet-300" />
          <h2 className="text-3xl md:text-5xl font-serif font-bold mb-4">Ready to get involved?</h2>
          <p className="text-xl text-white/70 mb-8 max-w-xl mx-auto">Create an account, find your club, and start making memories at MU.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="text-base h-13 px-8 font-semibold" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 'none', color: 'white' }}>
                Create Free Account
              </Button>
            </Link>
            <Link href="/clubs">
              <Button size="lg" variant="outline" className="text-base h-13 px-8 font-semibold border-white/30 text-white hover:bg-white/10">
                Explore Clubs
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
