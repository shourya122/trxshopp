import * as React from 'react'
import { createAuthEmailHandler } from '@lovable.dev/email-js'
import type { AuthEmailHookData } from '@lovable.dev/email-js'
import { createFileRoute } from '@tanstack/react-router'
import { SignupEmail } from '@/lib/email-templates/signup'
import { InviteEmail } from '@/lib/email-templates/invite'
import { MagicLinkEmail } from '@/lib/email-templates/magic-link'
import { RecoveryEmail } from '@/lib/email-templates/recovery'
import { EmailChangeEmail } from '@/lib/email-templates/email-change'
import { ReauthenticationEmail } from '@/lib/email-templates/reauthentication'

const SITE_NAME = 'trxxshop'
const SENDER_DOMAIN = 'notify.trxshop.in'
const ROOT_DOMAIN = 'trxshop.in'
const FROM_DOMAIN = 'trxshop.in'

function props(data: AuthEmailHookData) {
  return {
    siteName: SITE_NAME,
    siteUrl: `https://${ROOT_DOMAIN}`,
    recipient: data.email,
    confirmationUrl: data.url,
    token: data.token,
    email: data.email,
    oldEmail: data.old_email,
    newEmail: data.new_email,
  }
}

export const Route = createFileRoute('/lovable/email/auth/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env['LOVABLE_API_KEY']
        if (!apiKey) {
          console.error('LOVABLE_API_KEY not configured')
          return Response.json({ error: 'Server configuration error' }, { status: 500 })
        }

        const handler = createAuthEmailHandler({
          apiKey,
          from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
          senderDomain: SENDER_DOMAIN,
          emails: {
            signup: {
              subject: 'Confirm your email',
              render: (data) => React.createElement(SignupEmail as never, props(data)),
            },
            invite: {
              subject: "You've been invited",
              render: (data) => React.createElement(InviteEmail as never, props(data)),
            },
            magiclink: {
              subject: 'TrxShop Verification Code',
              render: (data) => React.createElement(MagicLinkEmail as never, props(data)),
            },
            recovery: {
              subject: 'Reset your password',
              render: (data) => React.createElement(RecoveryEmail as never, props(data)),
            },
            email_change: {
              subject: 'Confirm your new email',
              render: (data) => React.createElement(EmailChangeEmail as never, props(data)),
            },
            reauthentication: {
              subject: 'Your verification code',
              render: (data) => React.createElement(ReauthenticationEmail as never, props(data)),
            },
          },
        })

        return handler(request)
      },
    },
  },
})
