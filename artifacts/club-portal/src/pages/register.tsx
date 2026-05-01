import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from "react";
import { RegisterBodyRole } from "@workspace/api-client-react";
import { UserPlus } from "lucide-react";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum([RegisterBodyRole.student, RegisterBodyRole.faculty]),
  studentId: z.string().optional(),
  department: z.string().optional(),
  batch: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

function GlassInput({ placeholder, type = "text", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl text-sm font-medium text-white placeholder:text-white/30 border border-white/15 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none transition-all duration-200"
      style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(4px)' }}
      {...props}
    />
  );
}

export default function Register() {
  const { session, registerMutation } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (session) setLocation("/dashboard");
  }, [session, setLocation]);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      role: RegisterBodyRole.student,
      studentId: "",
      department: "",
      batch: "",
    },
  });

  const role = form.watch("role");

  const onSubmit = async (data: RegisterFormValues) => {
    registerMutation.mutate(data, {
      onSuccess: () => setLocation("/dashboard"),
    });
  };

  return (
    <Layout>
      <div
        className="flex-1 flex items-center justify-center py-10 px-4 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e0b4b 0%, #2e1065 35%, #1e3a8a 70%, #0f2050 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-[-80px] right-[-80px] w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
        <div className="absolute bottom-[-60px] left-[-60px] w-72 h-72 rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(circle, #2563eb, transparent)' }} />

        <div className="w-full max-w-lg relative animate-scale-in">
          <div className="glass-card-dark rounded-2xl overflow-hidden shadow-2xl">
            <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #7c3aed, #4f46e5, #2563eb, #ec4899)' }} />

            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-7">
                <div className="mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-serif font-bold text-white mb-1">Create Account</h1>
                <p className="text-sm text-white/50">Join the MU Portal to connect with clubs</p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Full Name */}
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 text-xs font-semibold uppercase tracking-wider">Full Name</FormLabel>
                        <FormControl>
                          <GlassInput placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 text-xs font-semibold uppercase tracking-wider">Email Address</FormLabel>
                        <FormControl>
                          <GlassInput type="email" placeholder="john@student.metropolitan.ac.bd" {...field} />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Username + Password */}
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/70 text-xs font-semibold uppercase tracking-wider">Username</FormLabel>
                          <FormControl>
                            <GlassInput placeholder="johndoe" {...field} />
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
                          <FormLabel className="text-white/70 text-xs font-semibold uppercase tracking-wider">Password</FormLabel>
                          <FormControl>
                            <GlassInput type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Role */}
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 text-xs font-semibold uppercase tracking-wider">I am a...</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger
                              className="rounded-xl border border-white/15 text-white text-sm font-medium py-3 h-auto"
                              style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(4px)' }}
                            >
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="glass-card border-white/20">
                            <SelectItem value={RegisterBodyRole.student}>🎓 Student</SelectItem>
                            <SelectItem value={RegisterBodyRole.faculty}>👨‍🏫 Faculty</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Student-only fields */}
                  {role === RegisterBodyRole.student && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="studentId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white/70 text-xs font-semibold uppercase tracking-wider">Student ID <span className="text-white/30 normal-case">(optional)</span></FormLabel>
                              <FormControl>
                                <GlassInput placeholder="222-15-5678" {...field} />
                              </FormControl>
                              <FormMessage className="text-red-400 text-xs" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="batch"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white/70 text-xs font-semibold uppercase tracking-wider">Batch <span className="text-white/30 normal-case">(optional)</span></FormLabel>
                              <FormControl>
                                <GlassInput placeholder="Spring 2024" {...field} />
                              </FormControl>
                              <FormMessage className="text-red-400 text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white/70 text-xs font-semibold uppercase tracking-wider">Department <span className="text-white/30 normal-case">(optional)</span></FormLabel>
                            <FormControl>
                              <GlassInput placeholder="e.g. CSE, EEE, BBA" {...field} />
                            </FormControl>
                            <FormMessage className="text-red-400 text-xs" />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {/* Faculty department */}
                  {role === RegisterBodyRole.faculty && (
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/70 text-xs font-semibold uppercase tracking-wider">Department <span className="text-white/30 normal-case">(optional)</span></FormLabel>
                          <FormControl>
                            <GlassInput placeholder="e.g. CSE, EEE, BBA" {...field} />
                          </FormControl>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      )}
                    />
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl text-sm font-bold tracking-wide shadow-lg transition-all duration-200 mt-2"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)' }}
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <span className="flex items-center gap-2 justify-center">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Creating account...
                      </span>
                    ) : "Create Account →"}
                  </Button>
                </form>
              </Form>

              <div className="mt-5 text-center">
                <p className="text-sm text-white/40">
                  Already have an account?{" "}
                  <Link href="/login" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
                    Sign in here
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
