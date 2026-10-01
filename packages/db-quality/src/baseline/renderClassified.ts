import { renderFindings } from '@/check/renderFindings.js'
import type { Finding } from '@/model/Finding.js'
import type { ClassifiedFindings } from '@syntopica/gate-kit/ClassifiedFindings'

/** The counts line, then the new findings when there are any. */
export const renderClassified = (
  classified: ClassifiedFindings<Finding>,
): string => {
  const counts = `${String(classified.new.length)} new, ${String(classified.known.length)} known, ${String(classified.resolved.length)} resolved`
  return classified.new.length > 0
    ? `${counts}\n${renderFindings(classified.new)}`
    : counts
}
