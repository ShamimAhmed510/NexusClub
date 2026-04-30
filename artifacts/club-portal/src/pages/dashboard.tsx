import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import StudentDashboard from "./dashboard/student";
import ClubAdminDashboard from "./dashboard/club-admin";
import OverseerDashboard from "./dashboard/overseer";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Dashboard() {
  const { session, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedAdminSlug, setSelectedAdminSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !session) {
      setLocation("/login");
    }
  }, [session, isLoading, setLocation]);

  useEffect(() => {
    if (session?.user.role === 'club_admin' && session.adminClubSlugs?.length > 0 && !selectedAdminSlug) {
      setSelectedAdminSlug(session.adminClubSlugs[0]);
    }
  }, [session, selectedAdminSlug]);

  if (isLoading || !session) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const { user, adminClubSlugs } = session;

  return (
    <Layout>
      {user.role === 'overseer' ? (
        <OverseerDashboard />
      ) : user.role === 'club_admin' ? (
        <div className="flex-1 flex flex-col">
          {adminClubSlugs && adminClubSlugs.length > 1 && (
             <div className="bg-muted/50 border-b border-border/50 py-3">
               <div className="container mx-auto px-4 flex items-center justify-between">
                 <span className="text-sm font-medium">Managing Multiple Clubs:</span>
                 <Select value={selectedAdminSlug || ""} onValueChange={setSelectedAdminSlug}>
                   <SelectTrigger className="w-[250px] bg-background">
                     <SelectValue placeholder="Select a club" />
                   </SelectTrigger>
                   <SelectContent>
                     {adminClubSlugs.map(slug => (
                       <SelectItem key={slug} value={slug}>{slug}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             </div>
          )}
          {selectedAdminSlug ? (
            <ClubAdminDashboard slug={selectedAdminSlug} />
          ) : (
             <div className="flex-1 flex items-center justify-center text-muted-foreground p-8 text-center">
               <p>No club selected or you do not have admin access to any clubs.</p>
             </div>
          )}
        </div>
      ) : (
        <StudentDashboard />
      )}
    </Layout>
  );
}