import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface OrderItem {
  name: string
  qty: number
  price: number
  edition?: string | null
}

interface Props {
  siteName?: string
  orderNumber?: string | null
  orderId?: string
  customerName?: string
  items?: OrderItem[]
  amountInr?: number
  provider?: string
  paymentRef?: string | null
}

const fmt = (n: number) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const OrderConfirmationEmail = ({
  siteName = 'TRXSHOP',
  orderNumber,
  orderId,
  customerName,
  items = [],
  amountInr = 0,
  provider,
  paymentRef,
}: Props) => {
  const label = orderNumber || (orderId ? orderId.slice(0, 8).toUpperCase() : '')
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your {siteName} order {label} is confirmed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Payment received 🎉</Heading>
          <Text style={text}>
            {customerName ? `Hi ${customerName}, ` : 'Hi there, '}
            thanks for your order at {siteName}. Your payment has been received and
            your order is now being processed.
          </Text>

          <Section style={orderBox}>
            <Text style={orderLabel}>ORDER</Text>
            <Text style={orderNum}>#{label}</Text>
          </Section>

          <Heading as="h2" style={h2}>Items</Heading>
          <Section style={itemsBox}>
            {items.length === 0 ? (
              <Text style={text}>No items listed.</Text>
            ) : (
              items.map((it, i) => (
                <Section key={i} style={i === items.length - 1 ? rowLast : row}>
                  <Text style={itemName}>{it.name}</Text>
                  {it.edition ? <Text style={itemEdition}>{it.edition}</Text> : null}
                  <Text style={itemMeta}>
                    Qty {it.qty} · {fmt(it.price)}
                  </Text>
                </Section>
              ))
            )}
          </Section>

          <Hr style={hr} />
          <Section style={totalRow}>
            <Text style={totalLabel}>Total paid</Text>
            <Text style={totalValue}>{fmt(amountInr)}</Text>
          </Section>

          {provider || paymentRef ? (
            <Text style={meta}>
              {provider ? `Paid via ${provider}` : null}
              {provider && paymentRef ? ' · ' : ''}
              {paymentRef ? `Ref: ${paymentRef}` : null}
            </Text>
          ) : null}

          <Text style={footer}>
            We'll follow up with delivery details shortly. If you have any questions,
            simply email support@trxshop.in and we will reach out to assist you.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: OrderConfirmationEmail,
  subject: (data: Record<string, any>) => {
    const label =
      data?.orderNumber ||
      (typeof data?.orderId === 'string' ? data.orderId.slice(0, 8).toUpperCase() : '')
    return label ? `Your TRXSHOP order #${label} is confirmed` : 'Your TRXSHOP order is confirmed'
  },
  displayName: 'Order confirmation',
  previewData: {
    siteName: 'TRXSHOP',
    orderNumber: 'TRX-1042',
    customerName: 'Alex',
    items: [
      { name: 'GTA V Enhanced (Steam Account)', qty: 1, price: 799, edition: 'Premium Edition' },
      { name: 'Spotify Premium (1 month)', qty: 2, price: 149 },
    ],
    amountInr: 1097,
    provider: 'cashfree',
    paymentRef: 'cf_123456',
  },
} satisfies TemplateEntry

export default OrderConfirmationEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', padding: '20px 0' }
const container = {
  backgroundColor: '#000000',
  padding: '32px 28px',
  borderRadius: '12px',
  maxWidth: '560px',
}
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#ffffff', margin: '0 0 16px' }
const h2 = { fontSize: '14px', fontWeight: 'bold' as const, color: '#ffffff', margin: '24px 0 10px', letterSpacing: '0.5px' }
const text = { fontSize: '14px', color: '#c9cbd1', lineHeight: '1.55', margin: '0 0 20px' }
const orderBox = {
  backgroundColor: '#0a1f14',
  border: '1px solid #00e676',
  borderRadius: '10px',
  padding: '14px 18px',
  margin: '0 0 8px',
}
const orderLabel = { fontSize: '11px', color: '#00e676', margin: '0 0 4px', letterSpacing: '1.5px', fontWeight: 'bold' as const }
const orderNum = { fontSize: '20px', color: '#ffffff', margin: 0, fontWeight: 'bold' as const, letterSpacing: '1px' }
const itemsBox = { backgroundColor: '#0d0d0d', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '4px 16px' }
const row = { padding: '14px 0', borderBottom: '1px solid #1f1f1f' }
const rowLast = { padding: '14px 0' }
const itemName = { fontSize: '14px', color: '#ffffff', margin: 0, fontWeight: 'bold' as const }
const itemEdition = { fontSize: '12px', color: '#00e676', margin: '2px 0 0' }
const itemMeta = { fontSize: '12px', color: '#8a8d94', margin: '4px 0 0' }
const hr = { borderColor: '#1f1f1f', margin: '18px 0' }
const totalRow = { padding: '0' }
const totalLabel = { fontSize: '13px', color: '#c9cbd1', margin: '0 0 4px' }
const totalValue = { fontSize: '22px', color: '#00e676', margin: 0, fontWeight: 'bold' as const }
const meta = { fontSize: '12px', color: '#8a8d94', margin: '14px 0 0' }
const footer = { fontSize: '12px', color: '#8a8d94', margin: '24px 0 0', lineHeight: '1.5' }
