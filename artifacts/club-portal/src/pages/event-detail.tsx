import { useGetEvent, useRsvpEvent } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { useRoute, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, MapPinIcon, UsersIcon, ArrowLeftIcon } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetEventQueryKey } from "@workspace/api-client-react";

export default function EventDetail() {
  const [, params] = useRoute("/events/:id");
  const id = Number(params?.id);
  const { data: eventDetail, isLoading } = useGetEvent(id, { query: { enabled: !!id } });
  const { mutate: rsvpEvent } = useRsvpEvent();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-64 w-full rounded-2xl mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div>
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!eventDetail) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-2">Event not found</h2>
          <Link href="/events"><Button variant="outline">Back to Events</Button></Link>
        </div>
      </Layout>
    );
  }

  const { event, attendees } = eventDetail;

  const handleRsvp = () => {
    rsvpEvent({ id, data: {} }, {
      onSuccess: () => {
        toast({ title: "RSVP updated", description: "Your RSVP status has been successfully updated." });
        queryClient.invalidateQueries({ queryKey: getGetEventQueryKey(id) });
      }
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link href="/events" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to Events
        </Link>
        
        {event.coverUrl ? (
          <div className="w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-8 border border-border/50 relative">
            <img src={event.coverUrl} alt={event.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex items-end p-6">
               <Badge className="bg-primary text-primary-foreground text-sm py-1 px-3 mb-2">{event.clubName}</Badge>
            </div>
          </div>
        ) : (
           <div className="w-full h-32 md:h-48 rounded-2xl bg-muted border border-border/50 mb-8 flex items-end p-6">
              <Badge className="bg-primary text-primary-foreground text-sm py-1 px-3 mb-2">{event.clubName}</Badge>
           </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <h1 className="text-3xl md:text-5xl font-serif font-bold tracking-tight mb-4">{event.title}</h1>
            
            <div className="flex flex-wrap items-center gap-6 mb-8 py-4 border-y border-border/50">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <CalendarIcon className="h-5 w-5" />
                 </div>
                 <div>
                    <p className="text-sm font-medium text-muted-foreground">Date & Time</p>
                    <p className="font-medium">{format(new Date(event.startsAt), 'MMMM d, yyyy')}</p>
                    <p className="text-sm">{format(new Date(event.startsAt), 'h:mm a')} {event.endsAt && `- ${format(new Date(event.endsAt), 'h:mm a')}`}</p>
                 </div>
              </div>
              
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <MapPinIcon className="h-5 w-5" />
                 </div>
                 <div>
                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                    <p className="font-medium">{event.venue}</p>
                 </div>
              </div>
            </div>
            
            <div className="prose dark:prose-invert max-w-none">
              <h3 className="font-serif text-2xl font-bold mb-4">About this event</h3>
              <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground text-lg">{event.description}</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <Card className="border-border/50 shadow-md sticky top-24">
              <CardHeader>
                <CardTitle className="text-xl font-serif">Registration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center text-sm">
                   <span className="text-muted-foreground">Status</span>
                   <Badge variant="outline" className="capitalize">{event.status}</Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                   <span className="text-muted-foreground">Attending</span>
                   <span className="font-medium flex items-center gap-1.5">
                     <UsersIcon className="h-4 w-4" /> {event.rsvpCount} {event.capacity ? `/ ${event.capacity}` : ''}
                   </span>
                </div>
                
                <div className="pt-4">
                  <Button 
                    className="w-full h-12 text-base" 
                    variant={event.viewerHasRsvp ? "secondary" : "default"}
                    onClick={handleRsvp}
                  >
                    {event.viewerHasRsvp ? "You're Going" : "RSVP Now"}
                  </Button>
                  {event.viewerHasRsvp && (
                    <p className="text-center text-xs text-muted-foreground mt-3">
                      You are registered for this event.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {attendees && attendees.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-serif">Attendees ({event.rsvpCount})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {attendees.slice(0, 10).map((user) => (
                      <div 
                        key={user.id} 
                        className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium border-2 border-background"
                        title={user.fullName}
                      >
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full rounded-full object-cover" />
                        ) : (
                          user.fullName.substring(0, 2)
                        )}
                      </div>
                    ))}
                    {attendees.length > 10 && (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium border-2 border-background text-muted-foreground">
                        +{attendees.length - 10}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}