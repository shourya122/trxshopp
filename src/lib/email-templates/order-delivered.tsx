import * as React from "react";
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import logoAsset from "@/assets/trxshop-logo.png.asset.json";
import type { TemplateEntry } from "./registry";

const LOGO_URL = `https://trxshop.in${logoAsset.url}`;


interface OrderItem {
  name: string;
  qty: number;
  price: number;
  edition?: string | null;
}

interface Props {
  siteName?: string;
  orderNumber?: string | null;
  orderId?: string;
  customerName?: string;
  items?: OrderItem[];
  productName?: string;
  currency?: string;
  price?: number | string;
  deliveryMessage?: string;
  downloadLink?: string;
}

const OrderDeliveredEmail = ({
  siteName = "TRXSHOP",
  orderNumber,
  orderId,
  customerName,
  items = [],
  productName,
  currency = "₹",
  price,
  deliveryMessage,
  downloadLink,
}: Props) => {
  const label = orderNumber || (orderId ? orderId.slice(0, 8).toUpperCase() : "");
  const resolvedProduct =
    productName ||
    (items.length <= 1
      ? items[0]?.name ?? "—"
      : `${items[0]?.name ?? "—"} + ${items.length - 1} more`);
  const totalPaid =
    price !== undefined && price !== null && price !== ""
      ? `${currency}${price}`
      : items.length
        ? `${currency}${items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 1), 0)}`
        : "";
  const delivery =
    deliveryMessage ||
    "Your digital product has been prepared and is ready to access anytime from your account.";
  const accessHref = downloadLink || "https://trxshop.in/account";

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your {siteName} order {label ? `#${label} ` : ""}is ready</Preview>
      <Body style={main}>
        <Container style={outer}>
          <Container style={card}>
            {/* HEADER */}
            <Section style={header}>
              <Img src={LOGO_URL} alt={siteName} width={160} style={logoImg} />
            </Section>


            {/* CONTENT */}
            <Section style={content}>
              <Heading as="h2" style={h2}>Your order is ready 🎉</Heading>

              <Text style={p}>
                Hi <strong style={strong}>{customerName || "there"}</strong>,
                <br />
                <br />
                Thank you for choosing <strong style={strong}>{siteName}</strong>. Your digital order
                has been prepared successfully and is ready to access anytime.
              </Text>

              {/* ORDER SUMMARY */}
              <Section style={summaryCard}>
                <Heading as="h3" style={h3}>Order Summary</Heading>

                {label ? (
                  <Row style={sumRow}>
                    <Column style={sumLabel}>Order ID</Column>
                    <Column style={sumValue}>#{label}</Column>
                  </Row>
                ) : null}

                <Row style={sumRow}>
                  <Column style={sumLabel}>Product</Column>
                  <Column style={sumValue}>{resolvedProduct}</Column>
                </Row>

                {totalPaid ? (
                  <Row style={sumRow}>
                    <Column style={sumLabel}>Total Paid</Column>
                    <Column style={{ ...sumValue, fontSize: "20px", fontWeight: 700 }}>
                      {totalPaid}
                    </Column>
                  </Row>
                ) : null}
              </Section>




              {/* BUTTON */}
              <Section style={{ marginTop: "35px", textAlign: "center" as const }}>
                <Button href={accessHref} style={btn}>Access Your Order →</Button>
              </Section>




            </Section>

            {/* FOOTER */}
            <Section style={footer}>
              <Text style={footerText}>
                Need help? Simply email support@trxshop.in and we will reach out to assist you.
                <br />
                <br />
                © {new Date().getFullYear()} {siteName}. All rights reserved.
              </Text>
            </Section>

          </Container>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: OrderDeliveredEmail,
  subject: (data: Record<string, any>) => {
    const label =
      data?.orderNumber || (typeof data?.orderId === "string" ? data.orderId.slice(0, 8).toUpperCase() : "");
    return label ? `Your TRXSHOP order #${label} is ready` : "Your TRXSHOP order is ready";
  },
  displayName: "Order delivered",
  previewData: {
    siteName: "TRXSHOP",
    orderNumber: "TRX-1042",
    customerName: "Alex",
    items: [{ name: "GTA V Enhanced (Steam Account)", qty: 1, price: 799 }],
    productName: "GTA V Enhanced (Steam Account)",
    currency: "₹",
    price: 799,
    deliveryMessage: "Log in on Steam, do not change the password, and enjoy your game.",
    downloadLink: "https://trxshop.in/account",
  },
} satisfies TemplateEntry;

export default OrderDeliveredEmail;

// styles
const main = {
  margin: 0,
  padding: 0,
  backgroundColor: "#ffffff",
  fontFamily: "Inter, Segoe UI, Arial, sans-serif",
};
const outer = { backgroundColor: "#000000", padding: "40px 20px", maxWidth: "700px" };
const card = {
  backgroundColor: "#0B0B0B",
  border: "1px solid #1A1A1A",
  borderRadius: "20px",
  overflow: "hidden" as const,
  maxWidth: "620px",
  padding: 0,
};
const header = {
  padding: "50px 40px",
  textAlign: "center" as const,
  borderBottom: "1px solid #1A1A1A",
  backgroundColor: "#000000",
};
const brand = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "36px",
  fontWeight: 700 as const,
  letterSpacing: "-1px",
};
const tagline = { marginTop: "12px", color: "#7A7A7A", fontSize: "15px" };
const logoImg = { display: "block", margin: "0 auto", height: "auto" };

const content = { padding: "45px" };
const h2 = { margin: 0, color: "#FFFFFF", fontSize: "30px", fontWeight: 700 as const };
const h3 = { marginTop: 0, color: "#FFFFFF", fontSize: "20px", fontWeight: 700 as const };
const p = { marginTop: "20px", color: "#B3B3B3", lineHeight: "28px", fontSize: "16px" };
const strong = { color: "#FFFFFF" };
const summaryCard = {
  marginTop: "35px",
  backgroundColor: "#111111",
  border: "1px solid #1A1A1A",
  borderRadius: "16px",
  padding: "30px",
};
const sumRow = { padding: "10px 0" };
const sumLabel = { color: "#7A7A7A", fontSize: "14px" };
const sumValue = {
  color: "#FFFFFF",
  fontSize: "14px",
  fontWeight: 600 as const,
  textAlign: "right" as const,
};
const productBlueCard = {
  marginTop: "30px",
  backgroundColor: "#111827",
  border: "1px solid #2563EB",
  borderRadius: "16px",
  padding: "30px",
};
const productText = { color: "#D1D5DB", lineHeight: "28px", fontSize: "15px", margin: "10px 0 0" };
const btn = {
  display: "inline-block",
  padding: "18px 40px",
  backgroundColor: "#2563EB",
  color: "#FFFFFF",
  textDecoration: "none",
  borderRadius: "12px",
  fontWeight: 600 as const,
  fontSize: "16px",
};
const trustCard = {
  marginTop: "45px",
  padding: "25px",
  backgroundColor: "#111111",
  border: "1px solid #1A1A1A",
  borderRadius: "16px",
};
const trustHeading = { margin: 0, color: "#FFFFFF", fontWeight: 600 as const, fontSize: "15px" };
const trustList = { marginTop: "15px", color: "#B3B3B3", lineHeight: "30px", fontSize: "14px" };
const support = { marginTop: "35px", color: "#7A7A7A", fontSize: "15px", lineHeight: "28px" };
const footer = {
  padding: "35px",
  textAlign: "center" as const,
  borderTop: "1px solid #1A1A1A",
  backgroundColor: "#000000",
};
const footerBrand = { margin: 0, color: "#FFFFFF", fontWeight: 600 as const, fontSize: "15px" };
const footerText = { marginTop: "12px", color: "#FFFFFF", fontSize: "13px", lineHeight: "24px" };
