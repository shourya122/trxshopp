import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import trxshopLogo from "@/assets/trxshop-logo.png";
import { playSuccessSound } from "@/lib/success-sound";

type Search = { email?: string; newsletter?: string };

export const Route = createFileRoute("/verify-code")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    email: typeof s.email === "string" ? s.email : undefined,
    newsletter: typeof s.newsletter === "string" ? s.newsletter : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Enter verification code — TRXSHOP" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: VerifyCodePage,
});

function VerifyCodePage() {
  const navigate = useNavigate();
  const { email } = useSearch({ from: "/verify-code" });
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!email) {
      navigate({ to: "/" });
      return;
    }
    let allowed = false;
    try {
      allowed = sessionStorage.getItem("otp-pending-email") === email;
    } catch {}
    if (!allowed) navigate({ to: "/" });
  }, [email, navigate]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  useEffect(() => {
    if (!errorMsg) return;
    const t = setTimeout(() => setErrorMsg(""), 1500);
    return () => clearTimeout(t);
  }, [errorMsg]);

  const code = digits.join("");
  const complete = code.length === 6 && /^\d{6}$/.test(code);

  const setDigitAt = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "").slice(0, 1);
    if (errorMsg) setErrorMsg("");
    setDigits((prev) => {
      const next = [...prev];
      next[i] = clean;
      return next;
    });
    if (clean && i < 5) inputsRef.current[i + 1]?.focus();
  };


  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) inputsRef.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) inputsRef.current[i + 1]?.focus();
  };

  const verifyCode = async (fullCode: string) => {
    if (!email || fullCode.length !== 6) return;
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: fullCode,
      type: "email",
    });
    setLoading(false);
    if (error) {
      setErrorMsg("Enter the correct 6-digit code");
      setDigits(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();
      return;
    }
    setErrorMsg("");
    try { sessionStorage.removeItem("otp-pending-email"); } catch {}
    playSuccessSound();
    navigate({ to: "/" });

  };

  useEffect(() => {
    if (complete && !loading) {
      verifyCode(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete]);


  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setResending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setResending(false);
    if (error) {
      toast.error("Could not resend code", { description: error.message });
      return;
    }
    toast.success("Code resent");
    setCooldown(30);
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
        padding: "1.5rem",
      }}
    >
      <Link
        to="/"
        aria-label="TRXSHOP home"
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "1.5rem",
          marginBottom: "3rem",
        }}
      >
        <img
          src={trxshopLogo}
          alt="TRXSHOP logo"
          style={{ height: "6rem", width: "auto" }}
        />
      </Link>
      <div
        style={{
          width: "100%",
          maxWidth: "26rem",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            letterSpacing: "-0.01em",
            margin: 0,
          }}
        >
          Enter Verification Code
        </h1>
        <p
          style={{
            marginTop: "0.75rem",
            fontSize: "0.95rem",
            color: "rgba(255,255,255,0.7)",
            lineHeight: 1.5,
          }}
        >
          Sent to{" "}
          <span style={{ color: "#fff", fontWeight: 500 }}>{email ?? ""}</span>{" "}
          <Link
            to="/signin"
            style={{
              color: "#5aa2ff",
              textDecoration: "underline",
              marginLeft: 4,
            }}
          >
            change
          </Link>
        </p>

        <div style={{ marginTop: "2rem" }}>
          <div
            key={errorMsg ? "err" : "ok"}
            className={errorMsg ? "otp-shake" : ""}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: "0.6rem",
            }}
          >
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputsRef.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={d}
                disabled={loading}
                onChange={(e) => setDigitAt(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                onMouseDown={(e) => {
                  const firstEmpty = digits.findIndex((x) => !x);
                  const target = firstEmpty === -1 ? 5 : firstEmpty;
                  if (i !== target) {
                    e.preventDefault();
                    inputsRef.current[target]?.focus();
                  }
                }}
                aria-label={`Digit ${i + 1}`}
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  textAlign: "center",
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  color: "#fff",
                  background: "transparent",
                  border: `1px solid ${errorMsg ? "#ff4d4f" : d ? "#005bd1" : "rgba(255,255,255,0.18)"}`,
                  borderRadius: "0.75rem",
                  outline: "none",
                  caretColor: errorMsg ? "#ff4d4f" : "#005bd1",
                  transform: d ? "scale(1.05)" : "scale(1)",
                  transition:
                    "border-color 0.25s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.25s ease",
                  boxShadow: errorMsg
                    ? "0 0 0 3px rgba(255,77,79,0.18)"
                    : d ? "0 0 0 3px rgba(0,91,209,0.15)" : "none",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = errorMsg ? "#ff4d4f" : "#005bd1";
                }}
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = errorMsg
                    ? "#ff4d4f"
                    : d ? "#005bd1" : "rgba(255,255,255,0.18)")
                }
              />
            ))}
          </div>

          {errorMsg && (
            <div
              style={{
                marginTop: "0.75rem",
                fontSize: "0.85rem",
                color: "#ff4d4f",
                textAlign: "center",
                animation: "fadeIn 0.2s ease",
              }}
            >
              {errorMsg}
            </div>
          )}




          <div
            style={{
              marginTop: "1.5rem",
              display: "flex",
              justifyContent: "center",
              fontSize: "0.85rem",
              color: "rgba(255,255,255,0.6)",
            }}
          >

            {cooldown > 0 ? (
              <span>Resend code in {cooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#5aa2ff",
                  textDecoration: "underline",
                  cursor: resending ? "not-allowed" : "pointer",
                  opacity: resending ? 0.6 : 1,
                  padding: 0,
                  fontSize: "0.85rem",
                }}
              >
                {resending ? "Sending…" : "Resend code"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
