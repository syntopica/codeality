import { clippedPopover } from '@/rules/clippedPopover.js'
import { darkSchemeIncomplete } from '@/rules/darkSchemeIncomplete.js'
import { pageScrollThread } from '@/rules/pageScrollThread.js'
import type { Rule } from '@/rules/Rule.js'
import { zIndexSprawl } from '@/rules/zIndexSprawl.js'

/** The rules about layers, theming and scrolling: popovers, z-index, the dark scheme and long threads. */
export const STRUCTURE_RULES: Rule[] = [
  clippedPopover,
  darkSchemeIncomplete,
  pageScrollThread,
  zIndexSprawl,
]
