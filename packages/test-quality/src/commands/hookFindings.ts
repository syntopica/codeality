import type { Finding } from '@/model/Finding.js'
import type { HookReach } from '@/model/HookReach.js'
import { uncachedHookLint } from '@/rules/uncachedHookLint.js'

/** What the git hooks run that costs time for nothing. */
export const hookFindings = (reaches: HookReach[]): Finding[] =>
  reaches.flatMap(({ hook, reached, scripts }) =>
    uncachedHookLint(reached, scripts, hook),
  )
