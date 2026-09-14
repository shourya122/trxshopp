import { createFileRoute } from "@tanstack/react-router";
import LegalPage from "@/components/LegalPage";

export const Route = createFileRoute("/contactus")({
  head: () => ({
    meta: [
      { title: "Contact TRXSHOP — Support & Merchant Info" },
      { name: "description", content: "Contact TRXSHOP for order help and merchant details — phone, email, and registered address." },
      { property: "og:title", content: "Contact TRXSHOP — Support & Merchant Info" },
      { property: "og:description", content: "Reach TRXSHOP support — phone, email, and registered address." },
      { property: "og:url", content: "https://trxshop.xyz/contactus" },
    ],
    links: [{ rel: "canonical", href: "https://trxshop.xyz/contactus" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <LegalPage title="Contact Us" updated="23-06-2026 10:08:06">
      <p>You may contact us using the information below:</p>

      <h2>Merchant Legal Entity Name</h2>
      <p>MAMTA WASNIK</p>

      <h2>Registered Address</h2>
      <p>Sai nagar, Durg, Chattisgarh, PIN: 491001</p>

      <h2>Operational Address</h2>
      <p>Sai nagar, Durg, Chattisgarh, PIN: 491001</p>

      <h2>Telephone</h2>
      <p><a href="tel:+917000286871">7000286871</a></p>

      <h2>Email</h2>
      <p><a href="mailto:support@trxshop.in">support@trxshop.in</a></p>
    </LegalPage>
  );
}
