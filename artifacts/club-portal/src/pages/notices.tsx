import { useState } from "react";
import { useListNotices, ListNoticesScope } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BellIcon, PinIcon } from "lucide-react";
import { format } from "date-fns";

export default function Notices() {
  const [filter, setFilter] = useState<ListNoticesScope | 'all'>('all');
  
  // Use 'all' scope when asking for all notices, the API handles it
  const { data: notices, isLoading } = useListNotices(
    filter !== 'all' ? { query: { queryKey: ["/api/notices", { scope: filter }] } } : undefined
  );

  return (
    <Layout>
      <div className="bg-muted/30 py-12 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-serif font-bold tracking-tight mb-4">Official Notices</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Stay updated with the latest announcements from the university and your favorite clubs.
            </p>
            
            <div className="flex flex-wrap gap-2 mt-6">
              <Badge 
                variant={filter === 'all' ? "default" : "secondary"}
                className="cursor-pointer text-sm py-1.5 px-4"
                onClick={() => setFilter('all')}
              >
                All Notices
              </Badge>
              <Badge 
                variant={filter === ListNoticesScope.pinned ? "default" : "secondary"}
                className="cursor-pointer text-sm py-1.5 px-4"
                onClick={() => setFilter(ListNoticesScope.pinned)}
              >
                Pinned
              </Badge>
              <Badge 
                variant={filter === ListNoticesScope.university ? "default" : "secondary"}
                className="cursor-pointer text-sm py-1.5 px-4"
                onClick={() => setFilter(ListNoticesScope.university)}
              >
                University
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
          </div>
        ) : notices && notices.length > 0 ? (
          <div className="space-y-6">
            {notices.map((notice) => (
              <Card 
                key={notice.id} 
                className={`overflow-hidden border-border/50 transition-all hover:shadow-md ${
                  notice.pinned ? "border-l-4 border-l-secondary" : ""
                } ${
                  notice.scope === 'university' ? "border-l-4 border-l-primary" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-2">
                        {notice.pinned && (
                          <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground hover:bg-secondary/30">
                            <PinIcon className="h-3 w-3 mr-1" /> Pinned
                          </Badge>
                        )}
                        <Badge variant="outline" className={notice.scope === 'university' ? "border-primary text-primary" : ""}>
                          {notice.scope === 'university' ? 'University' : notice.clubName || 'Club'}
                        </Badge>
                        {notice.audienceRole && (
                          <Badge variant="secondary" className="bg-muted text-muted-foreground">
                            For {notice.audienceRole}
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-xl font-bold font-serif text-foreground">{notice.title}</h3>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-sm font-medium text-muted-foreground">
                        {format(new Date(notice.publishAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{notice.body}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-muted/10 rounded-xl border border-dashed border-border/60">
            <BellIcon className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-serif font-semibold mb-2">No notices found</h3>
            <p className="text-muted-foreground">There are no notices to display for the selected filter.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}