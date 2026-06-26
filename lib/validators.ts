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
