import type { Finding } from '@/model/Finding.js'

/** What one stage run produced: findings (possibly none), a flat "not applicable", or a named reason it skipped measuring anything. */
export type StageOutcome = Finding[] | 'not-applicable' | { skipped: string }
