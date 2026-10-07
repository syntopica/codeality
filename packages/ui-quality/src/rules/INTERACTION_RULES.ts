import { clickableNonSemantic } from '@/rules/clickableNonSemantic.js'
import { layoutAnimation } from '@/rules/layoutAnimation.js'
import { reducedMotionIgnored } from '@/rules/reducedMotionIgnored.js'
import type { Rule } from '@/rules/Rule.js'

/** The rules about what moves and what can be clicked: semantics of click targets and animation. */
export const INTERACTION_RULES: Rule[] = [
  clickableNonSemantic,
  layoutAnimation,
  reducedMotionIgnored,
]
