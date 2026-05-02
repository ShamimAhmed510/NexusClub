import { useState } from "react";
import { useListNotices, ListNoticesScope } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BellIcon, PinIcon, BuildingIcon, ShieldIcon, MegaphoneIcon } from "lucide-react";
import { format } from "date-fns";

const FILTER_OPTIONS = [
  { id: 'all' as const, label: "All Notices", color: "bg-slate-700 text-white border-slate-600" },
  { id: ListNoticesScope.pinned, label: "📌 Pinned", color: "bg-amber-600 text-white border-amber-500" },
  { id: ListNoticesScope.university, label: "🏛 University", color: "bg-indigo-600 text-white border-indigo-500" },
];

function ScopeIcon({ scope }: { scope: string }) {
  if (scope === 'university') return <BuildingIcon className="h-4 w-4 text-indigo-500" />;
  return <MegaphoneIcon className="h-4 w-4 text-amber-500" />;
}

export default function Notices() {
  const [filter, setFilter] = useState<ListNoticesScope | 'all'>('all');

  const { data: notices, isLoading } = useListNotices(
    filter !== 'all' ? { scope: filter } : undefined
  );

  return (
    <Layout>
      {/* Header */}
      <div className="relative py-16 text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #374151 60%, #0f172a 100%)' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 60% 50%, rgba(99,102,241,0.3) 0%, transparent 60%)' }} />
        <div className="absolute top-4 right-8 opacity-10">
          <BellIcon className="h-40 w-40" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-white/20" style={{ background: 'rgba(255,255,255,0.08)' }}>
              Announcements
            </span>
            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-3">Official Notices</h1>
            <p className="text-lg text-white/70 mb-8">
              Stay updated with the latest announcements from the university and your clubs.
            </p>

            <div className="flex flex-wrap gap-2">
              {FILTER_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setFilter(opt.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${filter === opt.id ? opt.color : "bg-white/10 text-white border-white/20 hover:bg-white/20"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notices List */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-36 w-full rounded-2xl" />)}
          </div>
        ) : notices && notices.length > 0 ? (
          <div className="space-y-5">
            {notices.map((notice, i) => {
              const isUniversity = notice.scope === 'university';
              const isPinned = notice.pinned;
              return (
                <Card
                  key={notice.id}
                  className={`overflow-hidden rounded-2xl border-border/50 hover:shadow-lg transition-all duration-300 animate-fade-up`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex">
                    {/* Left accent bar */}
                    <div
                      className="w-1.5 flex-shrink-0"
                      style={{ background: isUniversity ? 'linear-gradient(to bottom, #6366f1, #8b5cf6)' : isPinned ? 'linear-gradient(to bottom, #f59e0b, #f97316)' : 'linear-gradient(to bottom, #94a3b8, #64748b)' }}
                    />
                    <CardContent className="p-5 flex-1">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${isUniversity ? 'bg-indigo-50' : 'bg-amber-50'}`}>
                            <ScopeIcon scope={notice.scope} />
                          </div>
                          {isPinned && (
                            <Badge className="text-[10px] font-bold px-2 py-0.5 gap-1" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                              <PinIcon className="h-2.5 w-2.5" /> Pinned
                            </Badge>
                          )}
                          <Badge
                            className={`text-[10px] font-semibold px-2.5 py-0.5 ${isUniversity ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}
                            variant="outline"
                          >
                            {isUniversity ? 'University' : notice.clubName || 'Club'}
                          </Badge>
                          {notice.audienceRole && (
                            <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground">
                              For {notice.audienceRole}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-xs font-medium text-muted-foreground">
                            {format(new Date(notice.publishAt), 'MMM d, yyyy')}
                          </span>
                          {notice.expireAt && (
                            <p className="text-[10px] text-muted-foreground/60 mt-0.5">Expires {format(new Date(notice.expireAt), 'MMM d')}</p>
                          )}
                        </div>
                      </div>

                      <h3 className="text-lg font-bold font-serif text-foreground mb-2">{notice.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{notice.body}</p>
                    </CardContent>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-28 bg-muted/10 rounded-2xl border border-dashed border-border/60">
            <div className="h-20 w-20 mx-auto mb-5 rounded-full bg-muted/40 flex items-center justify-center">
              <BellIcon className="h-9 w-9 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-serif font-semibold mb-2">No notices found</h3>
            <p className="text-muted-foreground text-sm">There are no notices to display for the selected filter.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
