export const FREE_EMAIL_DOMAINS = [
  'gmail.com','yahoo.com','hotmail.com','outlook.com',
  'rediffmail.com','ymail.com','protonmail.com'
]

const COMPANY_SIGNALS = ['cisco','google','microsoft','apple',
  'amazon','meta','netflix','salesforce','hubspot','slack','notion']
const DOMAIN_SIGNALS = ['.com','.io','.ai','.co','.net']

export function cleanDomain(raw: string): string {
  raw = raw.trim().toLowerCase()
  try {
    if (raw.startsWith('http')) raw = new URL(raw).hostname
  } catch {}
  return raw.replace('www.','').split('/')[0]
}

export function validateDomain(domain: string): string[] {
  const cleaned = cleanDomain(domain)
  if (!cleaned) return ["Domain is required"]
  if (!/^[a-zA-Z0-9][a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}$/.test(cleaned))
    return [`'${domain}' is not a valid domain`]
  return []
}

export function validateSenderEmail(email: string, senderDomain: string): string[] {
  if (!email || !email.includes('@')) return ["Valid email required"]
  const domain = email.split('@')[1].toLowerCase()
  const errors: string[] = []
  if (FREE_EMAIL_DOMAINS.includes(domain))
    errors.push(`${domain} gets spam-filtered. Use a business email`)
  if (senderDomain && domain !== cleanDomain(senderDomain))
    errors.push(`Email domain must match sender domain (${senderDomain})`)
  return errors
}

export function validateGeography(geo: string): string | null {
  const lower = geo.trim().toLowerCase()
  if (COMPANY_SIGNALS.includes(lower))
    return `'${geo}' looks like a company name not a country`
  for (const s of DOMAIN_SIGNALS)
    if (lower.includes(s)) return `'${geo}' looks like a domain`
  if (lower.length < 2) return "Too short"
  return null
}

export function validateConfidenceThreshold(val: number): string[] {
  if (val < 30) return ["Minimum is 30"]
  if (val > 95) return ["Maximum is 95"]
  return []
}

export function validateDailySendCap(val: number): string[] {
  if (val <= 0) return ["Must be positive"]
  if (val > 30) return [`${val} is high for a new domain. Start at 10-20.`]
  return []
}

/* ---- error vs warning split (red blocks submit, yellow allows it) ---- */

export interface FieldIssue {
  error: string | null
  warn: string | null
}

const SENDER_NAME_SIGNALS = [
  'inc', 'ltd', 'pvt', 'team', 'support', 'sales',
  'marketing', 'noreply', 'hello', 'info',
]

/** sender_name: red error if empty, yellow warning if it looks like a company. */
export function validateSenderName(name: string): FieldIssue {
  const v = name.trim()
  if (!v) return { error: "Required", warn: null }
  const lower = v.toLowerCase()
  if (SENDER_NAME_SIGNALS.some((s) => lower.includes(s)))
    return { error: null, warn: "Use a person's name for better reply rates" }
  return { error: null, warn: null }
}

/** sender_email: red error only for a malformed address; free-email / domain
 *  mismatch are yellow warnings (deliverability advice, not blockers). */
export function senderEmailIssues(email: string, senderDomain: string): FieldIssue {
  const v = email.trim()
  if (!v) return { error: null, warn: null } // empty handled by required-ness elsewhere
  if (!v.includes('@')) return { error: "Enter a valid email (missing @)", warn: null }
  const domain = v.split('@')[1].toLowerCase()
  if (FREE_EMAIL_DOMAINS.includes(domain))
    return { error: null, warn: `${domain} gets spam-filtered. Use a business email.` }
  if (senderDomain && domain !== cleanDomain(senderDomain))
    return { error: null, warn: `Doesn't match sender domain (${cleanDomain(senderDomain)})` }
  return { error: null, warn: null }
}

/** voice_anchor: red error if empty or < 5 chars (matches backend). */
export function validateVoiceAnchor(voice: string): FieldIssue {
  const v = voice.trim()
  if (!v) return { error: "Required", warn: null }
  if (v.length < 5) return { error: "Too short — describe the writing style (5+ chars)", warn: null }
  if (v.length > 200) return { error: "Max 200 chars", warn: null }
  return { error: null, warn: null }
}

/** confidence_threshold → the live label shown under the slider. */
export function thresholdLabel(val: number): string {
  if (val <= 50) return "Almost everything sends autonomously"
  if (val <= 70) return "Balanced — recommended ✓"
  return "Most emails go to review queue"
}

/** daily_send_cap: yellow warning over 30, red error if non-positive. */
export function dailySendCapIssue(val: number): FieldIssue {
  if (!Number.isFinite(val) || val <= 0) return { error: "Must be a positive number", warn: null }
  if (val > 30)
    return { error: null, warn: "High for a new domain. Start at 10-20 to protect deliverability." }
  return { error: null, warn: null }
}
