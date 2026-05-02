import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEffect } from "react";
import { LockKeyhole, User } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { session, loginMutation } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (session) setLocation("/dashboard");
  }, [session, setLocation]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    loginMutation.mutate(data, {
      onSuccess: () => setLocation("/dashboard"),
    });
  };

  return (
    <Layout>
      <div
        className="flex-1 flex items-center justify-center py-12 px-4 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e0b4b 0%, #2e1065 35%, #1e3a8a 70%, #0f2050 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-[-80px] left-[-80px] w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
        <div className="absolute bottom-[-60px] right-[-60px] w-72 h-72 rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(circle, #2563eb, transparent)' }} />
        <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full opacity-10 blur-2xl" style={{ background: 'radial-gradient(circle, #ec4899, transparent)' }} />

        <div className="w-full max-w-md relative animate-scale-in">
          {/* Card */}
          <div className="glass-card-dark rounded-2xl overflow-hidden shadow-2xl">
            {/* Top gradient strip */}
            <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #7c3aed, #4f46e5, #2563eb)' }} />

            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                  <LockKeyhole className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-3xl font-serif font-bold text-white mb-1">Welcome Back</h1>
                <p className="text-sm text-white/60">Sign in to your MU Portal account</p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80 font-medium text-sm">Username</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                            <input
                              placeholder="Enter your username"
                              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium text-white placeholder:text-white/30 border border-white/15 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none transition-all duration-200"
                              style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(4px)' }}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80 font-medium text-sm">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                            <input
                              type="password"
                              placeholder="••••••••"
                              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium text-white placeholder:text-white/30 border border-white/15 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none transition-all duration-200"
                              style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(4px)' }}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl text-sm font-bold tracking-wide shadow-lg transition-all duration-200 mt-2"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)' }}
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Signing in...
                      </span>
                    ) : "Sign In →"}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center">
                <p className="text-sm text-white/50">
                  Don't have an account?{" "}
                  <Link href="/register" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
                    Register here
                  </Link>
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
