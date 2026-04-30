import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { MapPinIcon, BookOpenIcon, UsersIcon, AwardIcon } from "lucide-react";

export default function University() {
  return (
    <Layout>
      {/* Hero */}
      <div className="relative py-24 bg-primary text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary/90 mb-6">About MU</Badge>
          <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight mb-6">
            Metropolitan University
          </h1>
          <p className="text-xl text-primary-foreground/80 leading-relaxed">
            Empowering the next generation of leaders, thinkers, and innovators since 2003.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-muted/50 border-b border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="flex justify-center mb-4"><UsersIcon className="h-8 w-8 text-secondary" /></div>
              <h3 className="text-3xl font-bold font-serif mb-1">5,000+</h3>
              <p className="text-sm text-muted-foreground uppercase tracking-wider">Students</p>
            </div>
            <div>
              <div className="flex justify-center mb-4"><BookOpenIcon className="h-8 w-8 text-secondary" /></div>
              <h3 className="text-3xl font-bold font-serif mb-1">20+</h3>
              <p className="text-sm text-muted-foreground uppercase tracking-wider">Programs</p>
            </div>
            <div>
              <div className="flex justify-center mb-4"><AwardIcon className="h-8 w-8 text-secondary" /></div>
              <h3 className="text-3xl font-bold font-serif mb-1">15+</h3>
              <p className="text-sm text-muted-foreground uppercase tracking-wider">Active Clubs</p>
            </div>
            <div>
              <div className="flex justify-center mb-4"><MapPinIcon className="h-8 w-8 text-secondary" /></div>
              <h3 className="text-3xl font-bold font-serif mb-1">1</h3>
              <p className="text-sm text-muted-foreground uppercase tracking-wider">Smart Campus</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-serif font-bold mb-6">Our Mission</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              To provide affordable and quality education to students of all backgrounds. We aim to foster a culture of academic excellence, research, and holistic personal development.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Through our diverse range of clubs and societies, we encourage students to discover their passions, build leadership skills, and create lifelong connections outside the classroom.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop" alt="Campus life" className="rounded-2xl object-cover h-64 w-full" />
            <img src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=2070&auto=format&fit=crop" alt="Students studying" className="rounded-2xl object-cover h-64 w-full mt-8" />
          </div>
        </div>
      </div>

      <div className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-serif font-bold text-center mb-12">Academic Departments</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {['Computer Science & Engineering', 'Electrical & Electronic Engineering', 'Business Administration', 'English', 'Law & Justice', 'Economics'].map((dept) => (
              <Card key={dept} className="hover:shadow-md transition-shadow border-border/50">
                <CardContent className="p-6 text-center">
                  <h3 className="font-bold text-lg">{dept}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
      {children}
    </span>
  );
}