import { createFileRoute } from "@tanstack/react-router";
import LegalPage from "@/components/LegalPage";

export const Route = createFileRoute("/refund-and-cancellation")({
  head: () => ({
    meta: [
      { title: "Cancellation & Refund Policy — TRXSHOP" },
      { name: "description", content: "Cancellation and refund policy for orders placed on TRXSHOP." },
      { property: "og:title", content: "Cancellation & Refund Policy — TRXSHOP" },
      { property: "og:description", content: "Cancellation and refund policy for orders placed on TRXSHOP." },
      { property: "og:url", content: "https://trxshop.xyz/refund-and-cancellation" },
    ],
    links: [{ rel: "canonical", href: "https://trxshop.xyz/refund-and-cancellation" }],
  }),
  component: RefundPage,
});

function RefundPage() {
  return (
    <LegalPage title="Cancellation & Refund Policy" updated="23-06-2026 10:19:51">
      <p>
        MAMTA WASNIK believes in helping its customers as far as possible, and has therefore a liberal
        cancellation policy. Under this policy:
      </p>
      <ul>
        <li>
          Cancellations will be considered only if the request is made immediately after placing the order.
          However, the cancellation request may not be entertained if the orders have been communicated to
          the vendors/merchants and they have initiated the process of shipping them.
        </li>
        <li>
          MAMTA WASNIK does not accept cancellation requests for perishable items like flowers, eatables
          etc. However, refund/replacement can be made if the customer establishes that the quality of
          product delivered is not good.
        </li>
        <li>
          In case of receipt of damaged or defective items please report the same to our Customer Service
          team. The request will, however, be entertained once the merchant has checked and determined the
          same at his own end. This should be reported within 2 Days of receipt of the products. In case
          you feel that the product received is not as shown on the site or as per your expectations, you
          must bring it to the notice of our customer service within 2 Days of receiving the product. The
          Customer Service Team after looking into your complaint will take an appropriate decision.
        </li>
        <li>
          In case of complaints regarding products that come with a warranty from manufacturers, please
          refer the issue to them. In case of any Refunds approved by MAMTA WASNIK, it’ll take 9-15 Days
          for the refund to be processed to the end customer.
        </li>
      </ul>
    </LegalPage>
  );
}
