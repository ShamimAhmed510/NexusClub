import { useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { LockKeyhole, CheckCircle, XCircle } from "lucide-react";

function useSearchParam(key: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(key);
}

export default function ResetPassword() {
  const token = useSearchParam("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }
    if (!token) {
      setMessage("Missing reset token. Please use the link from your email.");
      setStatus("error");
      return;
    }
    setIsPending(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setMessage((data as any).error || "Something went wrong. Please try again.");
      } else {
        setStatus("success");
        setMessage("Your password has been reset successfully.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Layout>
      <div
        className="flex-1 flex items-center justify-center py-12 px-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f0c29 0%, #1e1b4b 35%, #1a2d6b 70%, #0c1529 100%)" }}
      >
        <div className="absolute top-[-80px] right-[-80px] w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, #4338ca, transparent)" }} />
        <div className="absolute bottom-[-60px] left-[-60px] w-72 h-72 rounded-full opacity-15 blur-3xl" style={{ background: "radial-gradient(circle, #10b981, transparent)" }} />

        <div className="w-full max-w-md relative animate-scale-in">
          <div className="glass-card-dark rounded-2xl overflow-hidden shadow-2xl">
            <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #4338ca, #6366f1, #10b981)" }} />

            <div className="p-8">
              {status === "success" ? (
                <div className="text-center py-4">
                  <div className="mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl" style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}>
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-2xl font-serif font-bold text-white mb-3">Password Reset!</h1>
                  <p className="text-white/60 text-sm leading-relaxed mb-6">
                    Your password has been updated. You can now sign in with your new password.
                  </p>
                  <Link href="/login">
                    <Button className="w-full h-11 rounded-xl font-semibold" style={{ background: "linear-gradient(135deg, #4338ca, #6366f1)" }}>
                      Sign In Now
                    </Button>
                  </Link>
                </div>
              ) : status === "error" && !token ? (
                <div className="text-center py-4">
                  <div className="mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl" style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)" }}>
                    <XCircle className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-2xl font-serif font-bold text-white mb-3">Invalid Link</h1>
                  <p className="text-white/60 text-sm leading-relaxed mb-6">
                    This password reset link is invalid or has expired. Please request a new one.
                  </p>
                  <Link href="/forgot-password">
                    <Button className="w-full h-11 rounded-xl font-semibold" style={{ background: "linear-gradient(135deg, #4338ca, #6366f1)" }}>
                      Request New Link
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="text-center mb-8">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl" style={{ background: "linear-gradient(135deg, #4338ca, #6366f1)" }}>
                      <LockKeyhole className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-serif font-bold text-white mb-1">Set New Password</h1>
                    <p className="text-sm text-white/55">Choose a strong password for your account.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                        <input
                          type="password"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="Min. 6 characters"
                          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium text-white placeholder:text-white/30 border border-white/15 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 outline-none transition-all duration-200"
                          style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(4px)" }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                        <input
                          type="password"
                          value={confirm}
                          onChange={e => setConfirm(e.target.value)}
                          placeholder="Repeat your password"
                          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium text-white placeholder:text-white/30 border border-white/15 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 outline-none transition-all duration-200"
                          style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(4px)" }}
                        />
                      </div>
                      {message && (
                        <p className={`text-xs mt-1.5 ${status === "error" ? "text-red-400" : "text-red-400"}`}>
                          {message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 rounded-xl text-sm font-bold tracking-wide shadow-lg transition-all duration-200"
                      style={{ background: "linear-gradient(135deg, #4338ca, #6366f1)", boxShadow: "0 8px 24px rgba(67,56,202,0.4)" }}
                      disabled={isPending}
                    >
                      {isPending ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Resetting...
                        </span>
                      ) : "Reset Password →"}
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <Link href="/login" className="text-sm text-white/50 hover:text-white/80 transition-colors">
                      Back to Sign In
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
