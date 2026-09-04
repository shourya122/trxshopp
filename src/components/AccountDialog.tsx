"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { X, ArrowRight, Package, LogOut, UserCircle } from "lucide-react";

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}



export function AccountDialog({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {

  const navigate = useNavigate();
  const [user, setUser] = useState<{
    id: string;
    email?: string;
    user_metadata?: { name?: string; avatar_url?: string };
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [newsOffers, setNewsOffers] = useState(false);

  useEffect(() => {
    if (!open) return;
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });
  }, [open]);

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: typeof window !== "undefined" ? window.location.origin : "",
    });
    if (result.error) {
      toast.error("Google sign-in failed", { description: result.error.message });
    }
    setLoading(false);
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailInput.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) {
      toast.error("Could not send code", { description: error.message });
      return;
    }
    try {
      sessionStorage.setItem("otp-pending-email", email);
    } catch {}
    onClose();
    navigate({
      to: "/verify-code",
      search: { email, newsletter: newsOffers ? "1" : undefined } as never,
    });
  };

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    setUser(null);
    onClose();
    toast.success("Signed out");
    navigate({ to: "/" });
  };

  const goToAccount = () => {
    onClose();
    navigate({ to: "/account" });
  };

  const goToAuth = () => {
    onClose();
    navigate({ to: "/signin" });
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <PopoverPrimitive.Trigger asChild>{children}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={12}
          collisionPadding={12}
          className="z-50 w-[calc(100vw-1.5rem)] max-w-[380px] rounded-2xl border border-white/10 bg-black p-0 text-white shadow-[0_24px_80px_rgba(0,0,0,0.6)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 origin-(--radix-popover-content-transform-origin)"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>


        <div className="p-6 space-y-5">
          <h2 className="font-['Rajdhani',sans-serif] text-xl font-bold uppercase tracking-wide text-white pr-8">
            Sign in or create account
          </h2>

          {!user ? (
            <>

              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white text-black font-medium text-sm hover:bg-white/90 transition-colors disabled:opacity-60"
              >
                <GoogleLogo className="w-5 h-5" />
                Continue with Google
              </button>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <span className="relative bg-black px-3 text-xs uppercase tracking-widest text-white/40">
                  OR
                </span>
              </div>

              <form onSubmit={handleEmail} className="space-y-4">
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="Email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full px-4 py-3.5 pr-12 rounded-xl bg-transparent border border-white/15 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#C9A961]/50 transition-colors"
                  />
                  {(() => {
                    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.trim());
                    return (
                      <button
                        type="submit"
                        disabled={loading || !isValidEmail}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed ${isValidEmail ? "bg-[#005bd1] text-white hover:bg-[#0050b8]" : "text-white/60 hover:text-[#C9A961]"}`}
                        aria-label="Continue with email"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    );
                  })()}
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={newsOffers}
                      onChange={(e) => setNewsOffers(e.target.checked)}
                      className="peer h-4 w-4 rounded border border-white/20 bg-transparent checked:bg-green-500 checked:border-green-500 appearance-none transition-colors"
                    />
                    <svg
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-black opacity-0 peer-checked:opacity-100 pointer-events-none"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                    Email me with news and offers
                  </span>
                </label>
              </form>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={goToAuth}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-white/10 text-sm font-medium hover:bg-white/5 transition-colors"
                >
                  <Package className="w-4 h-4" />
                  Orders
                </button>
                <button
                  onClick={goToAuth}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-white/10 text-sm font-medium hover:bg-white/5 transition-colors"
                >
                  <UserCircle className="w-4 h-4" />
                  Profile
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.03]">
                <div className="w-11 h-11 rounded-full bg-[#C9A961]/20 flex items-center justify-center shrink-0 overflow-hidden">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircle className="w-6 h-6 text-[#C9A961]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.user_metadata?.name || user.email || "Account"}
                  </p>
                  <p className="text-xs text-white/50 truncate">{user.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={goToAccount}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-white/10 text-sm font-medium hover:bg-white/5 transition-colors"
                >
                  <Package className="w-4 h-4" />
                  Orders
                </button>
                <button
                  onClick={goToAccount}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-white/10 text-sm font-medium hover:bg-white/5 transition-colors"
                >
                  <UserCircle className="w-4 h-4" />
                  Profile
                </button>
              </div>

              <button
                onClick={handleSignOut}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 text-white text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-60"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </>
          )}
        </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

