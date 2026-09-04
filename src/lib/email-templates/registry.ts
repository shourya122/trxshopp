import type { ComponentType } from 'react'
import { template as orderConfirmationTemplate } from './order-confirmation'
import { template as orderDeliveredTemplate } from './order-delivered'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'order-confirmation': orderConfirmationTemplate,
  'order-delivered': orderDeliveredTemplate,
}
