import { EVIDENCE_SHOWN } from '@/model/EVIDENCE_SHOWN.js'

/** One heading line and its evidence, cut past EVIDENCE_SHOWN lines. */
export const formatEntry = (heading: string, evidence: string[]): string => {
  const shown = evidence.slice(0, EVIDENCE_SHOWN)
  const more = evidence.length - shown.length
  return [
    heading,
    ...shown.map((line) => `  ${line}`),
    ...(more > 0 ? [`  ... ${String(more)} more (--json lists all)`] : []),
  ].join('\n')
}
