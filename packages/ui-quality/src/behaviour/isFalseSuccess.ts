import type { ActionMessageCase } from '@/behaviour/ActionMessageCase.js'
import { isSuccessOnly } from '@/behaviour/isSuccessOnly.js'

/** Under a `fail-*` case every write failed, so a success-only message is false. */
export const isFalseSuccess = (
  actionCase: ActionMessageCase,
  message: string,
): boolean => actionCase.startsWith('fail-') && isSuccessOnly(message)
