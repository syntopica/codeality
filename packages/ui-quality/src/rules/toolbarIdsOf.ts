import type { ElementBox } from '@/model/ElementBox.js'
import { childrenIndex } from '@/rules/childrenIndex.js'
import { isActionLike } from '@/rules/isActionLike.js'

/** Elements with two or more links or buttons among their visible children: action bars. */
export const toolbarIdsOf = (elements: ElementBox[]): Set<number> =>
  new Set(
    [...childrenIndex(elements)]
      .filter(([, children]) => children.filter(isActionLike).length >= 2)
      .map(([parent]) => parent),
  )
