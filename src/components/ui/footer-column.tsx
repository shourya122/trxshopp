import { Link } from "@tanstack/react-router";
import { useLegalModal } from "@/components/legal/LegalModalProvider";
import { LEGAL_HREF_TO_KEY } from "@/components/legal/contents";
import logoAsset from "@/assets/trxshop-logo.png.asset.json";

const productLinks = [
  { text: "Home", href: "/" },
  { text: "All Games", href: "/games/all" },
  { text: "PlayStation", href: "/games/playstation-games" },
  { text: "Steam / PC", href: "/games/steam-games" },
  { text: "Subscriptions", href: "/games/subscriptions" },
];

const resourcesLinks = [
  { text: "Sign in", href: "/signin" },
  { text: "My Account", href: "/account" },
  { text: "Contact", href: "/contactus" },
  { text: "Discord", href: "https://discord.gg/4yJQJxgYh4" },
];

const legalLinks = [
  { text: "Terms of Service", href: "/terms" },
  { text: "Privacy Policy", href: "/privacy" },
  { text: "Refund Policy", href: "/refund" },
];

export default function Footer4Col({
  hideNewsletter: _hideNewsletter,
  minimal = false,
}: { hideNewsletter?: boolean; minimal?: boolean } = {}) {
  void _hideNewsletter;

  if (minimal) {
    return (
      <footer style={{ background: "#000", color: "#fff", width: "100%" }}>
        <div
          style={{
            maxWidth: "80rem",
            margin: "0 auto",
            padding: "1.25rem 1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.75rem",
            fontSize: "0.85rem",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          <p style={{ margin: 0 }}>© {new Date().getFullYear()} TRXSHOP. All rights reserved.</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="trx-footer relative overflow-hidden">
      <div className="trx-footer-glow" aria-hidden="true" />
      <span className="trx-footer-bigword" aria-hidden="true">trxshop</span>
      <div className="relative trx-footer-inner mx-auto max-w-7xl px-6 sm:px-10 py-16 sm:py-20">
        <div className="grid gap-12 sm:gap-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="trx-footer-brand">
            <img
              src={logoAsset.url}
              alt="TRXSHOP"
              className="trx-footer-logo"
              width={220}
              height={66}
              loading="lazy"
            />
            <p className="trx-footer-tag">Play more, Pay less.</p>
            <div className="trx-footer-socials" aria-label="Social links">
              <a href="https://www.youtube.com/@tyrekxx" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.73 3.5 12 3.5 12 3.5s-7.73 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.65.55 9.38.55 9.38.55s7.73 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.81zM9.55 15.5V8.5l6.27 3.5-6.27 3.5z"/></svg>
              </a>
              <a href="https://www.instagram.com/shouryauh/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85 0 3.2-.01 3.58-.07 4.85-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07-3.2 0-3.58-.01-4.85-.07-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85 0-3.2.01-3.58.07-4.85.15-3.24 1.67-4.77 4.92-4.92 1.27-.06 1.65-.07 4.85-.07zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c4.36-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C22.73 2.69 20.31.27 15.95.07 14.67.01 14.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm7.85-10.4a1.44 1.44 0 1 1 0 2.88 1.44 1.44 0 0 1 0-2.88z"/></svg>
              </a>
              <a href="https://discord.gg/4yJQJxgYh4" target="_blank" rel="noopener noreferrer" aria-label="Discord">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.32 4.37A19.8 19.8 0 0 0 15.37 2c-.08.14-.17.33-.24.48a18.35 18.35 0 0 0-5.4 0c-.07-.15-.16-.34-.24-.48a19.8 19.8 0 0 0-4.95 2.37C1.52 9.11 1 13.53 1.32 17.91c1.95 1.44 3.84 2.31 5.7 2.89.46-.62.87-1.28 1.22-1.98-.67-.25-1.31-.57-1.91-.95.16-.12.32-.24.47-.37 3.65 1.72 7.61 1.72 11.22 0 .15.13.31.25.47.37-.6.37-1.24.69-1.92.95.35.7.76 1.36 1.22 1.98 1.86-.58 3.75-1.45 5.7-2.89.38-5.05-.63-9.43-2.16-13.54zM8.52 14.96c-1.12 0-2.03-1.03-2.03-2.3 0-1.27.89-2.3 2.03-2.3 1.13 0 2.04 1.04 2.03 2.3 0 1.27-.91 2.3-2.03 2.3zm6.96 0c-1.12 0-2.03-1.03-2.03-2.3 0-1.27.89-2.3 2.03-2.3 1.13 0 2.04 1.04 2.03 2.3 0 1.27-.9 2.3-2.03 2.3z"/></svg>
              </a>
            </div>
            <p className="trx-footer-meta">© {new Date().getFullYear()} trxshop. All rights reserved.</p>
          </div>
          <FooterCol title="Product" links={productLinks} />
          <FooterCol title="Resources" links={resourcesLinks} />
          <FooterCol title="Legal" links={legalLinks} />
        </div>
      </div>

      <style>{`
        .trx-footer {
          position: relative;
          border-top: 1px solid rgba(255,255,255,0.08);
          background: #000;
          color: #fff;
        }
        .trx-footer-glow {
          position: absolute;
          inset: auto 0 -20%;
          height: 80%;
          pointer-events: none;
          z-index: 0;
          background: radial-gradient(ellipse 60% 100% at 50% 100%, rgba(0,69,163,0.22) 0%, rgba(0,69,163,0.08) 35%, transparent 70%);
          filter: blur(28px);
        }
        .trx-footer-bigword {
          position: absolute;
          left: 50%;
          bottom: -0.18em;
          transform: translateX(-50%);
          z-index: 0;
          pointer-events: none;
          user-select: none;
          font-family: 'Geist', system-ui, sans-serif;
          font-size: clamp(7rem, 22vw, 22rem);
          font-weight: 700;
          letter-spacing: -0.04em;
          line-height: 0.85;
          white-space: nowrap;
          color: rgba(255,255,255,0.04);
          background: linear-gradient(rgba(255,255,255,0.06), rgba(255,255,255,0.024) 55%, rgba(255,255,255,0)) text;
          -webkit-text-fill-color: transparent;
        }
        .trx-footer-inner { z-index: 1; }
        .trx-footer-logo {
          display: inline-block;
          height: auto;
          width: auto;
          max-width: 100%;
          max-height: 3.5rem;
          object-fit: contain;
        }
        .trx-footer-tag {
          margin-top: 0.85rem;
          font-size: 1.25rem;
          line-height: 1.35;
          letter-spacing: -0.01em;
          color: rgba(255,255,255,0.6);
          max-width: 26rem;
        }
        .trx-footer-meta {
          margin-top: 1.25rem;
          font-size: 0.78rem;
          line-height: 1.5;
          color: rgba(255,255,255,0.4);
          max-width: 22rem;
        }
        .trx-footer-socials {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          margin-top: 0.9rem;
        }
        .trx-footer-socials a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1.55rem;
          height: 1.55rem;
          color: rgba(255,255,255,0.6);
          transition: color 0.2s, transform 0.2s;
          will-change: transform;
        }
        .trx-footer-socials a:hover {
          color: #fff;
          transform: translateY(-2px);
        }
        .trx-footer-socials svg {
          width: 100%;
          height: 100%;
        }
        .trx-footer-heading {
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #fff;
          margin-bottom: 1rem;
        }
        .trx-footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .trx-footer-links a {
          display: inline-block;
          font-size: 0.875rem;
          color: rgba(255,255,255,0.6);
          text-decoration: none;
          transition: color 0.2s, transform 0.2s;
          will-change: transform;
          cursor: pointer;
        }
        .trx-footer-links a:hover {
          color: #fff;
          transform: translateX(4px);
        }
        @media (prefers-reduced-motion: reduce) {
          .trx-footer-links a { transition: color 0.2s; }
          .trx-footer-links a:hover { transform: none; }
        }
      `}</style>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { text: string; href: string }[];
}) {
  const isInternal = (href: string) => href.startsWith("/") && !href.includes("#");
  return (
    <div>
      <h4 className="trx-footer-heading">{title}</h4>
      <ul className="trx-footer-links">
        {links.map(({ text, href }) => (
          <li key={text}>
            {href in LEGAL_HREF_TO_KEY ? (
              <LegalLink href={href} text={text} />
            ) : isInternal(href) ? (
              <Link to={href}>{text}</Link>
            ) : (
              <a
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                {text}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LegalLink({ href, text }: { href: string; text: string }) {
  const { open } = useLegalModal();
  const key = LEGAL_HREF_TO_KEY[href];
  return (
    <a
      href={href}
      onClick={(e) => {
        if (!key) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        open(key);
      }}
    >
      {text}
    </a>
  );
}
