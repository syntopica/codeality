import { exactCountUnbounded } from '@/postgrest/exactCountUnbounded.js'
import { filterWithoutIndex } from '@/postgrest/filterWithoutIndex.js'
import type { PostgrestRule } from '@/postgrest/PostgrestRule.js'
import { queryInLoop } from '@/postgrest/queryInLoop.js'
import { starSelect } from '@/postgrest/starSelect.js'
import { unboundedList } from '@/postgrest/unboundedList.js'

export const POSTGREST_RULES: PostgrestRule[] = [
  starSelect,
  unboundedList,
  filterWithoutIndex,
  queryInLoop,
  exactCountUnbounded,
]
