import { controlInset } from '@/rules/controlInset.js'
import { controlRowRagged } from '@/rules/controlRowRagged.js'
import { crampedSelectCaret } from '@/rules/crampedSelectCaret.js'
import type { Rule } from '@/rules/Rule.js'

/** The rules about boxed form controls: their inset in the card they sit in, how a line of them lines up and where a select's caret sits. */
export const CONTROL_RULES: Rule[] = [
  controlInset,
  controlRowRagged,
  crampedSelectCaret,
]
