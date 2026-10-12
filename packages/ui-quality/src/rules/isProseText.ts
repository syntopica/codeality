import { CODE_TOKEN } from '@/rules/CODE_TOKEN.js'

/**
 * Whether a text reads as words rather than a code: it has a lower-case word,
 * and either two words or letters for most of it. "Sin dato" and "Casilla 29"
 * are words; "CBK26 014434854", "CUOTA 09/2026" and "src/main.ts" are codes.
 */
export const isProseText = (text: string): boolean => {
  if (CODE_TOKEN.test(text)) return false
  const words = text.split(/\s+/).filter((word) => /\p{L}{2,}/u.test(word))
  if (!words.some((word) => /\p{Ll}/u.test(word))) return false
  if (words.length >= 2) return true
  const letters = text.match(/\p{L}/gu)?.length ?? 0
  return letters >= 3 && letters / text.replace(/\s/g, '').length >= 0.6
}
