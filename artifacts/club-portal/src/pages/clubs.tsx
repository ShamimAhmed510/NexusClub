import { useState } from "react";
import { useListClubs } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SearchIcon, UsersIcon, CalendarIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Clubs() {
  const { data: clubs, isLoading } = useListClubs();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = clubs 
    ? Array.from(new Set(clubs.map(c => c.category))).sort()
    : [];

  const filteredClubs = clubs?.filter(club => {
    const matchesSearch = club.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          club.shortDescription.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? club.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  }) || [];

  return (
    <Layout>
      <div className="bg-muted/30 py-12 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-serif font-bold tracking-tight mb-4">Clubs & Societies</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Discover and join student-led organizations. From academics to arts, find your community at MU.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Search clubs..." 
                  className="pl-10 h-12 text-base bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {!isLoading && categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                <Badge 
                  variant={selectedCategory === null ? "default" : "secondary"}
                  className="cursor-pointer hover:bg-primary/90 hover:text-primary-foreground text-sm py-1"
                  onClick={() => setSelectedCategory(null)}
                >
                  All Categories
                </Badge>
                {categories.map(cat => (
                  <Badge 
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "secondary"}
                    className="cursor-pointer hover:bg-primary/90 hover:text-primary-foreground text-sm py-1"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-[300px] rounded-xl" />)}
          </div>
        ) : filteredClubs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.map((club, i) => (
              <Link key={club.id} href={`/clubs/${club.slug}`}>
                <Card 
                  className="h-full group hover:shadow-xl transition-all duration-500 border-border/50 hover:border-primary/20 cursor-pointer overflow-hidden flex flex-col"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div 
                    className="h-32 w-full bg-muted relative"
                    style={{ backgroundColor: club.accentColor || 'hsl(var(--primary))' }}
                  >
                    {club.coverUrl && (
                      <img src={club.coverUrl} alt={club.name} className="w-full h-full object-cover opacity-60 mix-blend-overlay group-hover:opacity-80 transition-opacity duration-500 group-hover:scale-105" />
                    )}
                  </div>
                  <CardHeader className="relative pt-12 flex-1 pb-4">
                    <div className="absolute -top-12 left-6 h-20 w-20 rounded-xl border-4 border-card bg-background overflow-hidden shadow-sm flex items-center justify-center">
                      {club.logoUrl ? (
                        <img src={club.logoUrl} alt={club.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="font-serif font-bold text-2xl text-primary">{club.name.substring(0, 2)}</span>
                      )}
                    </div>
                    <Badge variant="outline" className="w-fit mb-3 bg-muted/50 text-xs">{club.category}</Badge>
                    <CardTitle className="text-2xl font-serif group-hover:text-primary transition-colors leading-tight line-clamp-2">{club.name}</CardTitle>
                    <CardDescription className="line-clamp-3 mt-3 text-base leading-relaxed">{club.shortDescription}</CardDescription>
                  </CardHeader>
                  <CardFooter className="border-t border-border/40 bg-muted/10 py-4 text-sm text-muted-foreground flex gap-6">
                    <span className="flex items-center gap-1.5 font-medium"><UsersIcon className="h-4 w-4" /> {club.memberCount}</span>
                    <span className="flex items-center gap-1.5 font-medium"><CalendarIcon className="h-4 w-4" /> {club.eventCount}</span>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <h3 className="text-2xl font-serif font-semibold mb-2">No clubs found</h3>
            <p className="text-muted-foreground">Try adjusting your search or category filter.</p>
            <Button 
              variant="outline" 
              className="mt-6"
              onClick={() => { setSearchTerm(""); setSelectedCategory(null); }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}