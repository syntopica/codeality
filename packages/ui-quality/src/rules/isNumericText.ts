import { DATE_TEXT } from '@/rules/DATE_TEXT.js'
import { NUMBER_TEXT } from '@/rules/NUMBER_TEXT.js'
import { TIME_TEXT } from '@/rules/TIME_TEXT.js'

/** Whether a cell's text is a number, an amount, a date or a time. */
export const isNumericText = (text: string): boolean =>
  NUMBER_TEXT.test(text) || DATE_TEXT.test(text) || TIME_TEXT.test(text)
