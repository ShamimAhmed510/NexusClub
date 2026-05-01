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
import { Menu, LayoutDashboard, LogOut } from "lucide-react";
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
    <div className="min-h-[100dvh] flex flex-col text-foreground">
      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-50 w-full glass-card border-b border-white/40 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo + Nav */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg transition-transform group-hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
              >
                MU
              </div>
              <span
                className="font-serif font-bold text-xl tracking-tight hidden sm:block"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
              >
                Portal
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-0.5 text-sm font-medium">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-xl transition-all duration-200 font-medium ${
                    location.startsWith(link.href)
                      ? "bg-primary/10 text-primary font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/60"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3">
              {session ? (
                <>
                  <Link
                    href="/dashboard"
                    className={`text-sm font-medium flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 ${
                      location.startsWith('/dashboard')
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/60'
                    }`}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={session.user.avatarUrl || ""} alt={session.user.fullName} />
                          <AvatarFallback className="text-xs font-bold" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white' }}>
                            {session.user.fullName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 glass-card border-white/40 shadow-xl" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal py-3">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-semibold leading-none">{session.user.fullName}</p>
                          <p className="text-xs leading-none text-muted-foreground mt-1">{session.user.email}</p>
                          <span className="text-[10px] uppercase tracking-wider font-bold mt-1.5 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary w-fit">{session.user.role}</span>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="cursor-pointer w-full flex items-center gap-2">
                          <LayoutDashboard className="h-4 w-4" /> Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive cursor-pointer flex items-center gap-2"
                        onClick={() => logoutMutation.mutate()}
                      >
                        <LogOut className="h-4 w-4" /> Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors px-3 py-2 rounded-xl hover:bg-white/60">
                    Log in
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="rounded-xl px-4 shadow-md font-semibold" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                      Register
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="md:hidden px-2 rounded-xl hover:bg-white/60">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[360px] glass-card border-l border-white/40">
                <div className="flex items-center gap-2.5 mb-8 mt-2">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>MU</div>
                  <span className="font-serif font-bold text-xl" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Portal</span>
                </div>
                <nav className="flex flex-col gap-2">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`text-base font-medium transition-all px-4 py-3 rounded-xl ${
                        location.startsWith(link.href)
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/60"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                  {session ? (
                    <>
                      <Link
                        href="/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-base font-medium text-muted-foreground hover:text-primary px-4 py-3 rounded-xl hover:bg-white/60 flex items-center gap-2"
                      >
                        <LayoutDashboard className="h-4 w-4" /> Dashboard
                      </Link>
                      <button
                        className="justify-start px-4 py-3 text-base font-medium text-destructive hover:bg-red-50 rounded-xl flex items-center gap-2 w-full text-left"
                        onClick={() => { logoutMutation.mutate(); setIsMobileMenuOpen(false); }}
                      >
                        <LogOut className="h-4 w-4" /> Log out
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border/40">
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full rounded-xl">Log in</Button>
                      </Link>
                      <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full rounded-xl" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>Register</Button>
                      </Link>
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* ─── MAIN ─── */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/40 py-12 md:py-16 glass-card mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>MU</div>
                <span className="font-serif font-bold text-xl" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Metropolitan University</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                Empowering student life and academic excellence through organized, vibrant, and engaging club activities. The official portal for all MU societies.
              </p>
              <div className="flex gap-2 mt-4">
                {['🎓', '🏆', '🌟'].map((emoji, i) => (
                  <span key={i} className="text-xl">{emoji}</span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider text-muted-foreground">Discover</h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { href: "/clubs", label: "Clubs & Societies" },
                  { href: "/events", label: "Upcoming Events" },
                  { href: "/notices", label: "Official Notices" },
                  { href: "/university", label: "About MU" },
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-muted-foreground hover:text-primary transition-colors font-medium">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider text-muted-foreground">Portal</h4>
              <ul className="space-y-2.5 text-sm">
                {session ? (
                  <>
                    <li><Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors font-medium">My Dashboard</Link></li>
                    <li>
                      <button onClick={() => logoutMutation.mutate()} className="text-muted-foreground hover:text-primary transition-colors font-medium text-left">
                        Sign Out
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li><Link href="/login" className="text-muted-foreground hover:text-primary transition-colors font-medium">Student Login</Link></li>
                    <li><Link href="/register" className="text-muted-foreground hover:text-primary transition-colors font-medium">Create Account</Link></li>
                  </>
                )}
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Metropolitan University. All rights reserved.</p>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              All systems operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
