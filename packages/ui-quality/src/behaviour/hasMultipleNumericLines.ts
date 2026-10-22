/** Whether separate display lines contain digits, excluding unit-only lines. */
export const hasMultipleNumericLines = (text: string): boolean =>
  /\d[\n\r\u2028\u2029]+\d/u.test(text.replace(/[^\d\n\r\u2028\u2029]/gu, ''))
