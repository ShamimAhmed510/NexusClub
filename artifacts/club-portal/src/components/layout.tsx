import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "/clubs", label: "Clubs" },
  { href: "/events", label: "Events" },
  { href: "/notices", label: "Notices" },
  { href: "/university", label: "University" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { session, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-serif font-bold text-xl tracking-tight text-primary">MU Portal</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              {NAV_LINKS.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`transition-colors hover:text-primary ${location.startsWith(link.href) ? "text-primary" : "text-muted-foreground"}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              {session ? (
                <>
                  <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    Dashboard
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={session.user.avatarUrl || ""} alt={session.user.fullName} />
                          <AvatarFallback>{session.user.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{session.user.fullName}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {session.user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="cursor-pointer w-full">Dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive cursor-pointer"
                        onClick={() => logoutMutation.mutate()}
                      >
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    Log in
                  </Link>
                  <Link href="/register">
                    <Button size="sm">Register</Button>
                  </Link>
                </>
              )}
            </div>

            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="md:hidden px-2">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4 mt-8">
                  {NAV_LINKS.map((link) => (
                    <Link 
                      key={link.href} 
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`text-lg font-medium transition-colors hover:text-primary ${location.startsWith(link.href) ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {link.label}
                    </Link>
                  ))}
                  {session ? (
                    <>
                      <Link 
                        href="/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-lg font-medium text-muted-foreground hover:text-primary"
                      >
                        Dashboard
                      </Link>
                      <Button 
                        variant="ghost" 
                        className="justify-start px-0 text-lg font-medium text-destructive hover:text-destructive hover:bg-transparent"
                        onClick={() => {
                          logoutMutation.mutate();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        Log out
                      </Button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2 mt-4 pt-4 border-t">
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full justify-start">Log in</Button>
                      </Link>
                      <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full justify-start">Register</Button>
                      </Link>
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="border-t border-border/40 py-12 md:py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
            <div className="md:col-span-2">
              <span className="font-serif font-bold text-xl text-primary mb-4 block">Metropolitan University</span>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                Empowering student life and academic excellence through organized, vibrant, and engaging club activities. The official portal for all MU societies.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4">Discover</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/clubs" className="hover:text-primary transition-colors">Clubs & Societies</Link></li>
                <li><Link href="/events" className="hover:text-primary transition-colors">Upcoming Events</Link></li>
                <li><Link href="/notices" className="hover:text-primary transition-colors">Official Notices</Link></li>
                <li><Link href="/university" className="hover:text-primary transition-colors">About MU</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Portal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {session ? (
                  <>
                    <li><Link href="/dashboard" className="hover:text-primary transition-colors">My Dashboard</Link></li>
                    <li>
                      <button onClick={() => logoutMutation.mutate()} className="hover:text-primary transition-colors text-left">
                        Sign Out
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li><Link href="/login" className="hover:text-primary transition-colors">Student Login</Link></li>
                    <li><Link href="/register" className="hover:text-primary transition-colors">Create Account</Link></li>
                  </>
                )}
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Metropolitan University. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}