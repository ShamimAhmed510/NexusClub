import { useState } from "react";
import { useListClubs } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchIcon, UsersIcon, CalendarIcon, XIcon, FilterIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORY_COLORS: Record<string, string> = {
  Technology: "from-blue-500 to-indigo-600",
  Arts: "from-pink-500 to-rose-500",
  Sports: "from-green-500 to-emerald-600",
  Business: "from-amber-500 to-orange-500",
  Science: "from-cyan-500 to-teal-600",
  Music: "from-purple-500 to-violet-600",
  Drama: "from-red-500 to-rose-600",
  Cultural: "from-fuchsia-500 to-pink-600",
  Social: "from-sky-500 to-blue-600",
  General: "from-slate-500 to-gray-600",
};

function getCategoryGradient(cat: string) {
  return CATEGORY_COLORS[cat] || "from-indigo-500 to-purple-600";
}

export default function Clubs() {
  const { data: clubs, isLoading } = useListClubs();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = clubs
    ? Array.from(new Set(clubs.map(c => c.category))).sort()
    : [];

  const filteredClubs = clubs?.filter(club => {
    const matchesSearch =
      club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.shortDescription.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? club.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  }) || [];

  return (
    <Layout>
      {/* Page Header */}
      <div className="relative py-16 text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 45%, #2563eb 100%)' }}>
        <div className="absolute inset-0 opacity-8 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 80% 40%, rgba(139,92,246,0.35) 0%, transparent 55%)' }} />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-white/20" style={{ background: 'rgba(255,255,255,0.1)' }}>
              All Societies
            </span>
            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-3">Clubs & Societies</h1>
            <p className="text-lg text-white/70 mb-8 max-w-lg">
              Discover and join student-led organizations. From academics to arts, find your community at MU.
            </p>

            <div className="relative max-w-xl">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
              <Input
                placeholder="Search clubs by name or description..."
                className="pl-11 h-12 text-base bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-white/40 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            {!isLoading && categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                <button
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200 ${selectedCategory === null ? "bg-white text-indigo-800 border-white shadow-md" : "bg-white/10 text-white border-white/30 hover:bg-white/20"}`}
                  onClick={() => setSelectedCategory(null)}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200 ${selectedCategory === cat ? "bg-white text-indigo-800 border-white shadow-md" : "bg-white/10 text-white border-white/30 hover:bg-white/20"}`}
                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="container mx-auto px-4 py-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Loading..." : `Showing ${filteredClubs.length} club${filteredClubs.length !== 1 ? 's' : ''}`}
          {selectedCategory && ` in ${selectedCategory}`}
          {searchTerm && ` matching "${searchTerm}"`}
        </p>
        {(selectedCategory || searchTerm) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(""); setSelectedCategory(null); }} className="text-muted-foreground hover:text-foreground gap-1.5">
            <XIcon className="h-3.5 w-3.5" /> Clear filters
          </Button>
        )}
      </div>

      {/* Club Grid */}
      <div className="container mx-auto px-4 pb-16">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-[320px] rounded-2xl" />)}
          </div>
        ) : filteredClubs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.map((club, i) => (
              <Link key={club.id} href={`/clubs/${club.slug}`}>
                <Card
                  className="h-full group hover:shadow-2xl transition-all duration-400 border-border/50 hover:-translate-y-1 cursor-pointer overflow-hidden flex flex-col rounded-2xl"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div
                    className="h-36 w-full relative overflow-hidden"
                    style={{ backgroundColor: club.accentColor || '#6366f1' }}
                  >
                    {club.coverUrl ? (
                      <img
                        src={club.coverUrl}
                        alt={club.name}
                        className="w-full h-full object-cover opacity-60 mix-blend-overlay group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
                      />
                    ) : (
                      <>
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${getCategoryGradient(club.category)} opacity-80`}
                        />
                        <div className="absolute inset-0 opacity-15" style={{ background: 'repeating-linear-gradient(45deg, rgba(255,255,255,.15) 0px, rgba(255,255,255,.15) 1px, transparent 1px, transparent 14px)' }} />
                      </>
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge className="text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 bg-black/30 text-white border-0 backdrop-blur-sm">
                        {club.category}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="relative pt-10 flex-1 pb-3">
                    <div
                      className="absolute -top-10 left-5 rounded-xl border-4 border-card bg-white overflow-hidden shadow-lg flex items-center justify-center"
                      style={{ width: '4.5rem', height: '4.5rem' }}
                    >
                      {club.logoUrl ? (
                        <img src={club.logoUrl} alt={club.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="font-serif font-bold text-2xl" style={{ color: club.accentColor || '#6366f1' }}>{club.name.substring(0, 2)}</span>
                      )}
                    </div>
                    <CardTitle className="text-xl font-serif group-hover:text-primary transition-colors leading-tight line-clamp-2 mt-1">{club.name}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-2 text-sm leading-relaxed">{club.shortDescription}</CardDescription>
                  </CardHeader>
                  <CardFooter className="border-t border-border/40 bg-muted/20 py-3.5 text-sm text-muted-foreground flex gap-6">
                    <span className="flex items-center gap-1.5 font-medium">
                      <UsersIcon className="h-4 w-4 text-indigo-500" /> {club.memberCount} <span className="text-xs text-muted-foreground/70">members</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <CalendarIcon className="h-4 w-4 text-rose-500" /> {club.eventCount} <span className="text-xs text-muted-foreground/70">events</span>
                    </span>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-32">
            <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
              <FilterIcon className="h-9 w-9 text-muted-foreground/40" />
            </div>
            <h3 className="text-2xl font-serif font-semibold mb-2">No clubs found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your search or category filter.</p>
            <Button variant="outline" onClick={() => { setSearchTerm(""); setSelectedCategory(null); }}>
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
