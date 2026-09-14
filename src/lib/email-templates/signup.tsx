import * as React from 'react'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components'
import { EmailBrand } from './email-brand'

interface SignupEmailProps {
  siteName: string
  token: string
}

export const SignupEmail = ({
  siteName,
  token,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your {siteName} verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <EmailBrand siteName={siteName} />
        <Heading style={h1}>Your verification code</Heading>
        <Text style={text}>
          Enter this 6-digit code on {siteName} to confirm your email and
          finish signing up. This code will expire shortly.
        </Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', padding: '20px 0' }
const container = {
  backgroundColor: '#000000',
  padding: '32px 28px',
  borderRadius: '12px',
  maxWidth: '520px',
}
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#ffffff',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#c9cbd1',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const codeStyle = {
  fontFamily: "'SF Mono', 'Menlo', 'Consolas', 'Courier New', monospace",
  fontSize: '36px',
  fontWeight: 'bold' as const,
  letterSpacing: '14px',
  color: '#00e676',
  backgroundColor: '#07120d',
  border: '2px solid #00e676',
  borderRadius: '14px',
  padding: '22px 28px',
  textAlign: 'center' as const,
  margin: '0 0 30px',
}
const footer = { fontSize: '12px', color: '#8a8d94', margin: '30px 0 0' }
