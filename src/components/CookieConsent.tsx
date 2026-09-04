import { useEffect, useState } from "react";
import { useLegalModal } from "@/components/legal/LegalModalProvider";

const STORAGE_KEY = "trxshop_cookie_consent_v1";

type Consent = "accepted" | "rejected";

export function getCookieConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "accepted" || v === "rejected" ? v : null;
}

export function analyticsAllowed(): boolean {
  return getCookieConsent() === "accepted";
}

function PrivacyLink() {
  const { open } = useLegalModal();
  return (
    <button
      type="button"
      onClick={() => open("privacy")}
      style={{ color: "#fff", textDecoration: "underline", background: "transparent", border: "none", cursor: "pointer", padding: 0, font: "inherit" }}
    >
      Privacy Policy
    </button>
  );
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getCookieConsent() === null) {
      const t = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(t);
    }
  }, []);

  const choose = (value: Consent) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {}
    window.dispatchEvent(new CustomEvent("cookie-consent-change", { detail: value }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 60,
        background: "rgba(0,0,0,0.95)",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 12,
        fontSize: 13,
        boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      <div style={{ flex: "1 1 240px", minWidth: 200 }}>
        We use cookies to improve your experience. See our <PrivacyLink />.
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => choose("rejected")}
          style={{ padding: "8px 14px", fontSize: 12, fontWeight: 600, borderRadius: 8, background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", cursor: "pointer" }}
        >
          Reject
        </button>
        <button
          onClick={() => choose("accepted")}
          style={{ padding: "8px 14px", fontSize: 12, fontWeight: 700, borderRadius: 8, background: "#fff", color: "#000", border: "none", cursor: "pointer" }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
