// Server-only helper to send transactional emails from trusted server code
// (webhooks, cron, server functions). Mirrors the logic in
// src/routes/lovable/email/transactional/send.ts but skips the JWT auth check
// because the caller is server-side.
import * as React from 'react'
import { render } from '@react-email/render'
import { createClient } from '@supabase/supabase-js'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SITE_NAME = 'trxxshop'
const SENDER_DOMAIN = 'notify.trxshop.xyz'
const FROM_DOMAIN = 'trxshop.xyz'

function redact(email: string | null | undefined): string {
  if (!email) return '***'
  const [l, d] = email.split('@')
  if (!l || !d) return '***'
  return `${l[0]}***@${d}`
}

function newToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

interface Args {
  templateName: string
  recipientEmail: string
  idempotencyKey?: string
  templateData?: Record<string, any>
}

export async function sendTransactionalInternal({
  templateName,
  recipientEmail,
  idempotencyKey,
  templateData = {},
}: Args): Promise<{ ok: boolean; reason?: string; error?: string }> {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return { ok: false, error: 'server_misconfigured' }
  }
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const tpl = TEMPLATES[templateName]
  if (!tpl) return { ok: false, error: `template_not_found:${templateName}` }

  const to = (tpl.to || recipientEmail || '').trim()
  if (!to) return { ok: false, error: 'missing_recipient' }

  const messageId = crypto.randomUUID()
  const idem = idempotencyKey || messageId

  // Suppression check
  const { data: suppressed, error: supErr } = await supabase
    .from('suppressed_emails')
    .select('id')
    .eq('email', to.toLowerCase())
    .maybeSingle()
  if (supErr) {
    console.error('[email-internal] suppression check failed', supErr)
    return { ok: false, error: 'suppression_check_failed' }
  }
  if (suppressed) {
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: to,
      status: 'suppressed',
    })
    return { ok: false, reason: 'email_suppressed' }
  }

  // Unsubscribe token (upsert-or-reuse)
  const normalized = to.toLowerCase()
  let unsubscribeToken = ''
  const { data: existing } = await supabase
    .from('email_unsubscribe_tokens')
    .select('token, used_at')
    .eq('email', normalized)
    .maybeSingle()
  if (existing && !existing.used_at) {
    unsubscribeToken = existing.token
  } else if (!existing) {
    const t = newToken()
    await supabase
      .from('email_unsubscribe_tokens')
      .upsert({ token: t, email: normalized }, { onConflict: 'email', ignoreDuplicates: true })
    const { data: stored } = await supabase
      .from('email_unsubscribe_tokens')
      .select('token')
      .eq('email', normalized)
      .maybeSingle()
    unsubscribeToken = stored?.token || t
  } else {
    // Token used but not suppressed — skip.
    return { ok: false, reason: 'email_suppressed' }
  }

  // Render
  const element = React.createElement(tpl.component, templateData)
  const html = await render(element)
  const text = await render(element, { plainText: true })
  const subject = typeof tpl.subject === 'function' ? tpl.subject(templateData) : tpl.subject

  await supabase.from('email_send_log').insert({
    message_id: messageId,
    template_name: templateName,
    recipient_email: to,
    status: 'pending',
  })

  const { error: enqueueErr } = await supabase.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload: {
      message_id: messageId,
      to,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text,
      purpose: 'transactional',
      label: templateName,
      idempotency_key: idem,
      unsubscribe_token: unsubscribeToken,
      queued_at: new Date().toISOString(),
    },
  })

  if (enqueueErr) {
    console.error('[email-internal] enqueue failed', enqueueErr, {
      recipient: redact(to),
    })
    await supabase
      .from('email_send_log')
      .update({ status: 'failed', error_message: enqueueErr.message })
      .eq('message_id', messageId)
    return { ok: false, error: 'enqueue_failed' }
  }

  return { ok: true }
}
