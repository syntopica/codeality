import type { Finding } from '@/model/Finding.js'
import { renderFindings } from '@/report/renderFindings.js'
import type { ClassifiedFindings } from '@syntopica/gate-kit/ClassifiedFindings'

/**
 * The counts line, then the new findings when there are any. Known findings
 * measured worse than recorded are counted among the new and named apart.
 */
export const renderClassified = (
  classified: ClassifiedFindings<Finding>,
): string => {
  const worsened =
    classified.worsened.length > 0
      ? ` (${String(classified.worsened.length)} worse than recorded)`
      : ''
  const counts = `${String(classified.new.length)} new${worsened}, ${String(classified.known.length)} known, ${String(classified.resolved.length)} resolved`
  return classified.new.length > 0
    ? `${counts}\n${renderFindings(classified.new)}`
    : counts
}
