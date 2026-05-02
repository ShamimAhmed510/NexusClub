import { useListEvents, ListEventsScope } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, MapPinIcon, UsersIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRsvpEvent } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getListEventsQueryKey } from "@workspace/api-client-react";

export default function Events() {
  const [scope, setScope] = useState<ListEventsScope>(ListEventsScope.upcoming);
  const { data: events, isLoading } = useListEvents({ scope });
  const { mutate: rsvpEvent } = useRsvpEvent();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleRsvp = (eventId: string, e: React.MouseEvent) => {
    e.preventDefault();
    rsvpEvent({ id: eventId }, {
      onSuccess: () => {
        toast({ title: "RSVP updated", description: "Your RSVP status has been successfully updated." });
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey({ scope }) });
      }
    });
  };

  return (
    <Layout>
      <div className="bg-muted/30 py-12 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-serif font-bold tracking-tight mb-4">University Events</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Discover what's happening around the campus. Join workshops, cultural fests, sports tournaments, and more.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="upcoming" onValueChange={(v) => setScope(v as ListEventsScope)}>
          <TabsList className="mb-8">
            <TabsTrigger value={ListEventsScope.upcoming}>Upcoming</TabsTrigger>
            <TabsTrigger value={ListEventsScope.past}>Past Events</TabsTrigger>
          </TabsList>
          
          <TabsContent value={ListEventsScope.upcoming} className="mt-0">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
              </div>
            ) : events && events.length > 0 ? (
              <div className="space-y-4">
                {events.map(event => (
                  <Link key={event.id} href={`/events/${event.id}`}>
                    <Card className="hover:shadow-md transition-all duration-200 border-border/50 cursor-pointer group">
                      <CardContent className="p-0 flex flex-col md:flex-row">
                        {event.coverUrl && (
                          <div className="w-full md:w-48 h-48 md:h-auto flex-shrink-0 bg-muted border-r border-border/50">
                            <img src={event.coverUrl} alt={event.title} className="w-full h-full object-cover rounded-t-xl md:rounded-l-xl md:rounded-tr-none" />
                          </div>
                        )}
                        <div className="p-6 flex-1 flex flex-col sm:flex-row gap-6">
                          <div className="flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-xl bg-primary/5 text-primary border border-primary/10">
                            <span className="text-sm font-medium uppercase tracking-wider">{format(new Date(event.startsAt), 'MMM')}</span>
                            <span className="text-2xl font-bold font-serif">{format(new Date(event.startsAt), 'd')}</span>
                          </div>
                          
                          <div className="flex-1 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs font-normal">{event.clubName}</Badge>
                            </div>
                            <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">{event.title}</h3>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1.5"><CalendarIcon className="h-4 w-4" /> {format(new Date(event.startsAt), 'h:mm a')}</span>
                              <span className="flex items-center gap-1.5"><MapPinIcon className="h-4 w-4" /> {event.venue}</span>
                              <span className="flex items-center gap-1.5"><UsersIcon className="h-4 w-4" /> {event.rsvpCount} going</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center sm:justify-end">
                            <Button 
                              variant={event.viewerHasRsvp ? "secondary" : "outline"}
                              className={event.viewerHasRsvp ? "bg-primary/10 text-primary hover:bg-primary/20" : ""}
                              onClick={(e) => handleRsvp(event.id, e)}
                            >
                              {event.viewerHasRsvp ? "Going" : "RSVP"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/10 rounded-xl border border-dashed border-border">
                <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-serif font-semibold mb-2">No upcoming events</h3>
                <p className="text-muted-foreground">Check back later for new events organized by our clubs.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value={ListEventsScope.past} className="mt-0">
             {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
              </div>
            ) : events && events.length > 0 ? (
              <div className="space-y-4">
                {events.map(event => (
                  <Link key={event.id} href={`/events/${event.id}`}>
                    <Card className="hover:shadow-md transition-all duration-200 border-border/50 cursor-pointer group opacity-80 hover:opacity-100">
                      <CardContent className="p-0 flex flex-col md:flex-row">
                        {event.coverUrl && (
                          <div className="w-full md:w-48 h-48 md:h-auto flex-shrink-0 bg-muted border-r border-border/50 grayscale group-hover:grayscale-0 transition-all">
                            <img src={event.coverUrl} alt={event.title} className="w-full h-full object-cover rounded-t-xl md:rounded-l-xl md:rounded-tr-none" />
                          </div>
                        )}
                        <div className="p-6 flex-1 flex flex-col sm:flex-row gap-6">
                          <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-muted text-muted-foreground border border-border">
                            <span className="text-xs font-medium uppercase tracking-wider">{format(new Date(event.startsAt), 'MMM')}</span>
                            <span className="text-lg font-bold font-serif">{format(new Date(event.startsAt), 'd')}</span>
                          </div>
                          
                          <div className="flex-1 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs font-normal text-muted-foreground">{event.clubName}</Badge>
                            </div>
                            <h3 className="font-bold text-lg mb-2">{event.title}</h3>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1.5"><CalendarIcon className="h-4 w-4" /> {format(new Date(event.startsAt), 'h:mm a')}</span>
                              <span className="flex items-center gap-1.5"><MapPinIcon className="h-4 w-4" /> {event.venue}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/10 rounded-xl border border-dashed border-border">
                <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-serif font-semibold mb-2">No past events</h3>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}