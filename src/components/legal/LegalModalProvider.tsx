import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LEGAL_PAGES, LegalKey } from "./contents";

type Ctx = { open: (key: LegalKey) => void; close: () => void };
const LegalModalContext = createContext<Ctx | null>(null);

export function useLegalModal() {
  const ctx = useContext(LegalModalContext);
  if (!ctx) throw new Error("useLegalModal must be used within LegalModalProvider");
  return ctx;
}

export function LegalModalProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<LegalKey | null>(null);
  const [loading, setLoading] = useState(false);

  const open = useCallback((key: LegalKey) => {
    setLoading(true);
    setActive(key);
  }, []);
  const close = useCallback(() => {
    setActive(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!active) {
      setLoading(false);
      return;
    }
    const timer = setTimeout(() => setLoading(false), 500);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [active, close]);

  const page = active ? LEGAL_PAGES[active] : null;

  return (
    <LegalModalContext.Provider value={{ open, close }}>
      {children}
      {page && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={page.title}
          onClick={close}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.78)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
            animation: "legalFade 180ms ease-out",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "44rem",
              maxHeight: "85vh",
              background: "var(--bg, #0a0a0a)",
              color: "var(--text, #fff)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "1rem",
              boxShadow: "0 30px 80px -20px rgba(0,0,0,0.7)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              animation: "legalPop 180ms ease-out",
              willChange: "transform",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                background: "color-mix(in oklab, var(--bg, #0a0a0a) 80%, transparent)",
                position: "sticky",
                top: 0,
              }}
            >
              <div>
                {loading ? (
                  <>
                    <Skeleton style={{ height: "1.25rem", width: "12rem", margin: 0, backgroundColor: "var(--muted)" }} />
                    <Skeleton style={{ height: "0.75rem", width: "8rem", marginTop: "0.25rem", backgroundColor: "var(--muted)" }} />
                  </>
                ) : (
                  <>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, fontFamily: "'Geist', sans-serif" }}>
                      {page.title}
                    </h2>
                    <p style={{ opacity: 0.55, fontSize: "0.75rem", margin: "0.25rem 0 0", fontFamily: "'Geist Mono', monospace" }}>
                      Last updated: {page.updated}
                    </p>
                  </>
                )}
              </div>
              <button
                onClick={close}
                aria-label="Close"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text, #fff)",
                  cursor: "pointer",
                  padding: "0.4rem",
                  borderRadius: "0.5rem",
                  display: "inline-flex",
                  opacity: 0.7,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
              >
                <X size={20} />
              </button>
            </div>
            <div
              className="legal-modal-body legal-prose"
              style={{
                overflowY: "auto",
                padding: "1.5rem 1.75rem 2rem",
                fontFamily: "'Geist Mono', monospace",
                fontSize: "0.92rem",
                lineHeight: 1.7,
              }}
            >
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <Skeleton style={{ height: "0.9rem", width: "100%", backgroundColor: "var(--muted)" }} />
                  <Skeleton style={{ height: "0.9rem", width: "92%", backgroundColor: "var(--muted)" }} />
                  <Skeleton style={{ height: "0.9rem", width: "96%", backgroundColor: "var(--muted)" }} />
                  <Skeleton style={{ height: "1.1rem", width: "7rem", marginTop: "0.75rem", backgroundColor: "var(--muted)" }} />
                  <Skeleton style={{ height: "0.9rem", width: "100%", backgroundColor: "var(--muted)" }} />
                  <Skeleton style={{ height: "0.9rem", width: "88%", backgroundColor: "var(--muted)" }} />
                  <Skeleton style={{ height: "0.9rem", width: "95%", backgroundColor: "var(--muted)" }} />
                  <Skeleton style={{ height: "1.1rem", width: "8rem", marginTop: "0.75rem", backgroundColor: "var(--muted)" }} />
                  <Skeleton style={{ height: "0.9rem", width: "100%", backgroundColor: "var(--muted)" }} />
                  <Skeleton style={{ height: "0.9rem", width: "90%", backgroundColor: "var(--muted)" }} />
                </div>
              ) : (
                page.body
              )}
            </div>
          </div>
          <style>{`
            @keyframes legalFade { from { opacity: 0 } to { opacity: 1 } }
            @keyframes legalPop {
              from { opacity: 0; transform: translateY(8px) scale(0.98) }
              to   { opacity: 1; transform: translateY(0) scale(1) }
            }
            .legal-modal-body h2 { font-size: 1.05rem; font-weight: 700; margin: 1.5rem 0 0.5rem; font-family: 'Geist', sans-serif; }
            .legal-modal-body h3 { font-size: 0.95rem; font-weight: 600; margin: 1.1rem 0 0.4rem; font-family: 'Geist', sans-serif; }
            .legal-modal-body p { margin: 0.6rem 0; opacity: 0.85; }
            .legal-modal-body ul { margin: 0.6rem 0 0.6rem 1.25rem; opacity: 0.85; }
            .legal-modal-body li { margin: 0.35rem 0; list-style: disc; }
            .legal-modal-body a { color: inherit; text-decoration: underline; font-weight: 700; font-family: 'Geist', sans-serif; }
          `}</style>
        </div>
      )}
    </LegalModalContext.Provider>
  );
}
