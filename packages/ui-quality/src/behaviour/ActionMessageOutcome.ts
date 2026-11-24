import type { ActionMessageVerdict } from '@/behaviour/ActionMessageVerdict.js'

/**
 * A verdict, `pass`, or `coverage`: an `as-is` submit the client refused with
 * a message, which means the configured inputs are incomplete, not a defect.
 */
export type ActionMessageOutcome = ActionMessageVerdict | 'pass' | 'coverage'
