// Fire-and-forget Discord webhook notifications for orders.
// Server-only: never import into client-reachable modules at top level.

type OrderItem = {
  name: string;
  qty: number;
  price: number;
  edition_name?: string;
};

type ShippingAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
} | null;

export interface NewOrderPayload {
  orderId: string;
  orderNumber?: string | null;
  provider: "cashfree" | "oxapay" | string;
  amountInr: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerDiscord?: string;
  shipping?: ShippingAddress;
  items: OrderItem[];
}

export interface OrderPaidPayload {
  orderId: string;
  orderNumber?: string | null;
  provider: "cashfree" | "oxapay" | string;
  amountInr: number;
  paymentRef?: string;
}

function fmtAddress(s: ShippingAddress): string {
  if (!s) return "—";
  return [s.line1, s.line2, s.city, s.state, s.postal_code, s.country]
    .filter(Boolean)
    .join(", ") || "—";
}

function fmtItems(items: OrderItem[]): string {
  if (!items?.length) return "—";
  const lines = items.slice(0, 15).map((i) => {
    const ed = i.edition_name ? ` (${i.edition_name})` : "";
    return `• ${i.qty}× ${i.name}${ed} — ₹${(i.price * i.qty).toFixed(2)}`;
  });
  if (items.length > 15) lines.push(`…+${items.length - 15} more`);
  return lines.join("\n").slice(0, 1000);
}

function send(body: unknown): void {
  const url = process.env.DISCORD_ORDERS_WEBHOOK_URL;
  if (!url) return;
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch((e) => console.error("[discord] webhook failed", e));
}

export function postNewOrderToDiscord(p: NewOrderPayload): void {
  const refField = p.orderNumber
    ? [{ name: "Order #", value: `\`${p.orderNumber}\``, inline: false }]
    : [];
  const embed = {
    title: `🛒 New order — ${p.provider.toUpperCase()}`,
    color: p.provider === "cashfree" ? 0x10b981 : 0xf59e0b,
    fields: [
      ...refField,
      { name: "Order ID", value: `\`${p.orderId}\``, inline: false },
      { name: "Amount", value: `₹${p.amountInr.toFixed(2)}`, inline: true },
      { name: "Provider", value: p.provider, inline: true },
      { name: "Name", value: p.customerName || "—", inline: true },
      { name: "Email", value: p.customerEmail || "—", inline: true },
      { name: "Phone", value: p.customerPhone || "—", inline: true },
      { name: "Discord", value: p.customerDiscord || "—", inline: true },
      { name: "Address", value: fmtAddress(p.shipping ?? null).slice(0, 1024) },
      { name: "Items", value: fmtItems(p.items) },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "TRXSHOP • pending payment" },
  };
  send({ username: "TRXSHOP Orders", embeds: [embed] });
}

export function postOrderPaidToDiscord(p: OrderPaidPayload): void {
  const refField = p.orderNumber
    ? [{ name: "Order #", value: `\`${p.orderNumber}\``, inline: false }]
    : [];
  const embed = {
    title: `✅ Payment received — ${p.provider.toUpperCase()}`,
    color: 0x22c55e,
    fields: [
      ...refField,
      { name: "Order ID", value: `\`${p.orderId}\``, inline: false },
      { name: "Amount", value: `₹${p.amountInr.toFixed(2)}`, inline: true },
      { name: "Provider", value: p.provider, inline: true },
      { name: "Payment Ref", value: p.paymentRef ? `\`${p.paymentRef}\`` : "—", inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: "TRXSHOP • paid" },
  };
  send({ username: "TRXSHOP Orders", embeds: [embed] });
}
