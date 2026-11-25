import { controlInset } from '@/rules/controlInset.js'
import { controlRowRagged } from '@/rules/controlRowRagged.js'
import { crampedSelectCaret } from '@/rules/crampedSelectCaret.js'
import { inputIconMisaligned } from '@/rules/inputIconMisaligned.js'
import type { Rule } from '@/rules/Rule.js'
import { searchableDropdown } from '@/rules/searchableDropdown.js'

/** The rules about boxed form controls: their inset in the card they sit in, how a line of them lines up where a select's caret sits and where a field's icon sits. */
export const CONTROL_RULES: Rule[] = [
  controlInset,
  controlRowRagged,
  crampedSelectCaret,
  inputIconMisaligned,
  searchableDropdown,
]
