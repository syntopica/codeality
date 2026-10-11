import type { HookReach } from '@/model/HookReach.js'
import type { Observation } from '@/model/Observation.js'
import { hookRunsSuite } from '@/observations/hookRunsSuite.js'

/** What the git hooks run that is worth knowing but asks for no change. */
export const hookObservations = (reaches: HookReach[]): Observation[] =>
  reaches.flatMap(({ hook, reached, scripts }) =>
    hookRunsSuite(reached, scripts, hook),
  )
