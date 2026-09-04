import { createFileRoute } from "@tanstack/react-router";
import LegalPage from "@/components/LegalPage";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — TRXSHOP" },
      { name: "description", content: "How TRXSHOP collects, uses, and protects your personal information." },
      { property: "og:title", content: "Privacy Policy — TRXSHOP" },
      { property: "og:description", content: "How TRXSHOP collects, uses, and protects your personal information." },
      { property: "og:url", content: "https://trxshop.xyz/privacy-policy" },
    ],
    links: [{ rel: "canonical", href: "https://trxshop.xyz/privacy-policy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="11-07-2026">
      <p>
        This Privacy Policy describes how <strong>TRXSHOP</strong> (“we”, “us” or “our”)
        collects, uses, discloses and protects your information when you use our website and services
        (collectively, the “Services”). By using the Services you agree to the practices described here.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account information</strong> — name, email address, and (if you sign in with Google)
          your Google profile basics (name, email, avatar).
        </li>
        <li>
          <strong>Order information</strong> — billing name, phone number, shipping/billing address,
          Discord ID (if provided), items ordered, and order status.
        </li>
        <li>
          <strong>Payment information</strong> — processed directly by our payment providers
          (Cashfree for cards/UPI/netbanking, OxaPay/NOWPayments for crypto). We receive a transaction
          reference and status, but we do NOT store your full card number, UPI PIN, or wallet keys.
        </li>
        <li>
          <strong>Communications</strong> — messages you send us via email, contact form, or Discord.
        </li>
        <li>
          <strong>Technical data</strong> — IP address, browser type, device information, and
          basic analytics needed to operate and secure the site.
        </li>
        <li>
          <strong>Cookies</strong> — session cookies for authentication and cart, plus essential
          cookies required for the site to function.
        </li>
      </ul>

      <h2>How we use your information</h2>
      <ul>
        <li>To create and manage your account.</li>
        <li>To process orders, deliver digital products, and provide customer support.</li>
        <li>To send transactional messages (order confirmations, delivery, refunds, password resets).</li>
        <li>To detect fraud, abuse, and violations of our Terms.</li>
        <li>To comply with legal obligations and enforce our agreements.</li>
      </ul>

      <h2>Who we share information with</h2>
      <p>
        We do not sell your personal information. We share limited data only with service providers
        that help us run the Services:
      </p>
      <ul>
        <li><strong>Lovable Cloud</strong> — hosting, database, and authentication.</li>
        <li><strong>Google</strong> — if you choose Sign in with Google.</li>
        <li><strong>Cashfree Payments</strong> — card, UPI, netbanking, and wallet payments.</li>
        <li><strong>OxaPay / NOWPayments</strong> — cryptocurrency payments.</li>
        <li><strong>Cloudinary</strong> — image hosting.</li>
        <li><strong>Discord</strong> — order and support notifications (only if you interact with us there).</li>
        <li>Law enforcement or regulators, where required by applicable law.</li>
      </ul>

      <h2>Data retention</h2>
      <p>
        We keep account and order records for as long as your account is active and for a reasonable
        period afterward to meet tax, accounting, fraud-prevention, and legal requirements. You may
        request deletion of your account at any time (see “Your rights” below).
      </p>

      <h2>Security</h2>
      <p>
        We use industry-standard measures — encrypted transport (HTTPS), access controls, row-level
        security on our database, and hashed credentials — to protect your information. No method of
        transmission or storage is 100% secure, and we cannot guarantee absolute security.
      </p>

      <h2>Your rights</h2>
      <ul>
        <li>Access the personal information we hold about you.</li>
        <li>Correct inaccurate or outdated information.</li>
        <li>Request deletion of your account and associated personal data.</li>
        <li>Withdraw consent for optional processing at any time.</li>
        <li>Opt out of non-essential communications.</li>
      </ul>
      <p>To exercise any of these rights, contact us using the details below.</p>

      <h2>Children</h2>
      <p>
        The Services are not directed to children under 18. We do not knowingly collect personal
        information from children. If you believe a child has provided us information, please contact
        us and we will delete it.
      </p>

      <h2>International users</h2>
      <p>
        We operate from India. If you access the Services from outside India, your information will
        be transferred to and processed in India and other countries where our service providers
        operate.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Material changes will be posted on this
        page with a new “Last updated” date. Continued use of the Services after changes take effect
        constitutes acceptance of the revised policy.
      </p>

      <h2>Contact</h2>
      <p>
        Questions or requests about this Privacy Policy can be sent to
        {" "}<a href="mailto:trxshop@atomicmail.io">trxshop@atomicmail.io</a>.
      </p>
    </LegalPage>
  );
}
