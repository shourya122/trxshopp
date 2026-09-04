import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import trxshopLogo from "@/assets/trxshop-logo.png";

export const Route = createFileRoute("/signin")({
  head: () => ({
    meta: [
      { title: "Sign in — TRXSHOP" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SignInPage,
});

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function SignInPage() {
  const navigate = useNavigate();
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.trim());

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
    if (!isValidEmail) return;
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
    try { sessionStorage.setItem("otp-pending-email", email); } catch {}
    navigate({ to: "/verify-code", search: { email } as never });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 1.5rem 1.5rem",
      }}
    >
      <Link
        to="/"
        aria-label="TRXSHOP home"
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "0",
          marginBottom: "1.5rem",
        }}
      >
        <img src={trxshopLogo} alt="TRXSHOP logo" style={{ height: "6rem", width: "auto" }} />
      </Link>
      <div
        style={{
          width: "100%",
          maxWidth: "26rem",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >



        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.01em", margin: 0 }}>
          Sign in
        </h1>
        <p style={{ marginTop: "0.5rem", fontSize: "0.95rem", color: "rgba(255,255,255,0.7)", margin: "0.5rem 0 0" }}>
          Sign in or create an account
        </p>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          style={{
            marginTop: "1.75rem",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.6rem",
            padding: "0.85rem 1rem",
            background: "transparent",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: "0.75rem",
            fontSize: "0.95rem",
            fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            transition: "border-color 0.2s ease, background 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)")}
        >
          <GoogleLogo className="h-5 w-5" />
          Continue with Google
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            margin: "1.25rem 0",
            color: "rgba(255,255,255,0.4)",
            fontSize: "0.8rem",
          }}
        >
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.12)" }} />
          or
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.12)" }} />
        </div>

        <form onSubmit={handleEmail} style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            disabled={loading}
            style={{
              flex: 1,
              padding: "0.85rem 1rem",
              background: "transparent",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: "0.75rem",
              fontSize: "0.95rem",
              outline: "none",
              transition: "border-color 0.2s ease",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#005bd1")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)")}
          />
          <button
            type="submit"
            aria-label="Continue with email"
            disabled={!isValidEmail || loading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "3rem",
              background: isValidEmail ? "#005bd1" : "rgba(255,255,255,0.1)",
              color: "#fff",
              border: "none",
              borderRadius: "0.75rem",
              cursor: isValidEmail && !loading ? "pointer" : "not-allowed",
              opacity: loading ? 0.6 : 1,
              transition: "background 0.2s ease",
            }}
          >
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
