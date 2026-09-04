import { ReactNode } from "react";

export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div style={{ background: "var(--bg)", color: "var(--text)" }}>
      <main style={{ paddingTop: 96, paddingBottom: 64 }}>
        <article
          style={{
            maxWidth: "48rem",
            margin: "0 auto",
            padding: "0 1.25rem",
            lineHeight: 1.7,
            fontSize: "0.975rem",
            fontFamily: "'Geist Mono', monospace",
          }}
          className="legal-prose"
        >
          <h1 style={{ fontSize: "2.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>{title}</h1>
          <p style={{ opacity: 0.6, fontSize: "0.85rem", marginBottom: "2rem" }}>Last updated: {updated}</p>
          {children}
          <hr style={{ margin: "3rem 0 1.5rem", borderColor: "rgba(255,255,255,0.08)" }} />
          <p style={{ opacity: 0.7, fontSize: "0.875rem" }}>
            Questions? Reach us on{" "}
            <a href="https://discord.gg/4yJQJxgYh4" style={{ color: "#5865F2" }}>Discord</a>{" "}
            or email{" "}
            <a href="mailto:trxshop@atomicmail.io" style={{ color: "var(--text)", textDecoration: "underline" }}>
              trxshop@atomicmail.io
            </a>.
          </p>
        </article>
      </main>
      <style>{`
        .legal-prose h2 { font-size: 1.35rem; font-weight: 600; margin: 2rem 0 0.75rem; }
        .legal-prose h3 { font-size: 1.05rem; font-weight: 600; margin: 1.5rem 0 0.5rem; }
        .legal-prose p { margin: 0.75rem 0; opacity: 0.85; }
        .legal-prose ul { margin: 0.75rem 0 0.75rem 1.25rem; opacity: 0.85; }
        .legal-prose li { margin: 0.4rem 0; list-style: disc; }
        .legal-prose a { color: var(--text); text-decoration: underline; font-weight: 700; font-family: 'Geist', sans-serif; }
      `}</style>
    </div>
  );
}
