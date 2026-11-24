import { FAILURE_WORD } from '@/behaviour/FAILURE_WORD.js'
import { SUCCESS_WORD } from '@/behaviour/SUCCESS_WORD.js'

export const isSuccessOnly = (message: string): boolean =>
  SUCCESS_WORD.test(message) && !FAILURE_WORD.test(message)
