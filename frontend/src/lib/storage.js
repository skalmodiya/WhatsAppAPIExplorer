import { LS_KEYS } from '../constants'

export function get(key, defaultValue = '') {
  try { return localStorage.getItem(key) ?? defaultValue } catch { return defaultValue }
}

export function set(key, value) {
  try { localStorage.setItem(key, value) } catch {}
}

export function remove(key) {
  try { localStorage.removeItem(key) } catch {}
}

export function clearAll() {
  Object.values(LS_KEYS).forEach(k => remove(k))
}
