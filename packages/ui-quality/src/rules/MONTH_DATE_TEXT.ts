/** A date written with a month name, such as Oct 7, 2026 or 7 October 2026. */
export const MONTH_DATE_TEXT =
  /^(\d{1,2}\s)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?(\s\d{1,2})?,?\s\d{4}$|^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s\d{1,2}$/i
