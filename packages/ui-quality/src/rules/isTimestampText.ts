import { DATE_TEXT } from '@/rules/DATE_TEXT.js'
import { MAX_TIME_TEXT_LENGTH } from '@/rules/MAX_TIME_TEXT_LENGTH.js'
import { MONTH_DATE_TEXT } from '@/rules/MONTH_DATE_TEXT.js'
import { RELATIVE_TIME_TEXT } from '@/rules/RELATIVE_TIME_TEXT.js'

/** The whole text is a relative time or a date. */
export const isTimestampText = (text: string): boolean =>
  text.length <= MAX_TIME_TEXT_LENGTH &&
  (RELATIVE_TIME_TEXT.test(text) ||
    DATE_TEXT.test(text) ||
    MONTH_DATE_TEXT.test(text))
