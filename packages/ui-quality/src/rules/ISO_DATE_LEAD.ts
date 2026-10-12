/** An ISO date that is the whole text, or leads a meta line before a separator: "2026-09-30 · CUOTA". */
export const ISO_DATE_LEAD = /^\d{4}-\d{2}-\d{2}(?:$|\s*[·|•—–]\s?)/
