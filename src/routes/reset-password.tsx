import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — TRXSHOP" },
      { name: "description", content: "Choose a new password for your TRXSHOP account. Complete the secure reset flow to regain access and continue buying game keys with instant digital delivery." },
      { property: "og:url", content: "https://trxshop.xyz/reset-password" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://trxshop.xyz/reset-password" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [hasRecovery, setHasRecovery] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (hash.includes("type=recovery")) setHasRecovery(true);
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setHasRecovery(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated");
      navigate({ to: "/account" });
    } catch (err) {
      toast.error("Failed", { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#0A0B0E] text-white flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-['Rajdhani',sans-serif] text-3xl font-bold uppercase tracking-wide">Reset Password</h1>
          <p className="text-sm text-white/50">
            {hasRecovery ? "Choose a new password." : "Use the link from your reset email."}
          </p>
        </div>
        {hasRecovery ? (
          <form onSubmit={submit} className="space-y-4">
            <input type="password" required minLength={6} placeholder="New password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-[2px] bg-white/[0.03] border border-white/10 text-sm focus:outline-none focus:border-[#C9A961]/50" />
            <input type="password" required minLength={6} placeholder="Confirm password"
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-3 rounded-[2px] bg-white/[0.03] border border-white/10 text-sm focus:outline-none focus:border-[#C9A961]/50" />
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-[2px] bg-[#C9A961] text-black text-xs font-semibold uppercase tracking-[0.2em] hover:opacity-90 disabled:opacity-60 inline-flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Update Password
            </button>
          </form>
        ) : (
          <div className="text-center">
            <Link to="/signin" className="text-xs text-[#C9A961] uppercase tracking-[0.2em]">← Back to sign in</Link>
          </div>
        )}
      </div>
    </div>
  );
}
