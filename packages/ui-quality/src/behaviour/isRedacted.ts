import { REDACTED_PHRASE } from '@/behaviour/REDACTED_PHRASE.js'

export const isRedacted = (message: string): boolean =>
  REDACTED_PHRASE.test(message)
