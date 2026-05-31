import { format, formatDistanceToNow } from 'date-fns'

export function formatTime(ts) {
  if (!ts) return ''
  try {
    const d = new Date(ts)
    return format(d, 'HH:mm')
  } catch { return '' }
}

export function formatDate(ts) {
  if (!ts) return ''
  try {
    const d = new Date(ts)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) return 'Today'
    return format(d, 'MMM d')
  } catch { return '' }
}

export function formatRelative(ts) {
  if (!ts) return ''
  try { return formatDistanceToNow(new Date(ts), { addSuffix: true }) } catch { return '' }
}

export function formatPhone(phone) {
  if (!phone) return ''
  const clean = phone.replace(/\D/g, '')
  if (clean.length >= 10) return `+${clean}`
  return phone
}
