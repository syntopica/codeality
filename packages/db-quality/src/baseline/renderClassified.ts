import type { ClassifiedFindings } from '@/baseline/ClassifiedFindings.js'
import { renderFindings } from '@/check/renderFindings.js'

/** The counts line, then the new findings when there are any. */
export const renderClassified = (classified: ClassifiedFindings): string => {
  const counts = `${String(classified.new.length)} new, ${String(classified.known.length)} known, ${String(classified.resolved.length)} resolved`
  return classified.new.length > 0
    ? `${counts}\n${renderFindings(classified.new)}`
    : counts
}
