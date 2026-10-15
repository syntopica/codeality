import { controlInset } from '@/rules/controlInset.js'
import { controlRowRagged } from '@/rules/controlRowRagged.js'
import type { Rule } from '@/rules/Rule.js'

/** The rules about boxed form controls: their inset in the card they sit in and how a line of them lines up. */
export const CONTROL_RULES: Rule[] = [controlInset, controlRowRagged]
