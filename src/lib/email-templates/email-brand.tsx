import * as React from 'react'
import { Img, Section } from '@react-email/components'
import logoAsset from '@/assets/trxshop-email-logo.png.asset.json'

const LOGO_URL = `https://trxshop.in${logoAsset.url}`

export function EmailBrand({ siteName = 'Trx Shop' }: { siteName?: string }) {
  return (
    <Section style={header}>
      <Img src={LOGO_URL} alt={`${siteName} logo`} width="88" height="70" style={logo} />
    </Section>
  )
}

const header = {
  textAlign: 'center' as const,
  margin: '0 0 28px',
}

const logo = {
  display: 'block',
  margin: '0 auto',
  width: '88px',
  height: '70px',
  objectFit: 'contain' as const,
}