import { grayOnColor } from '@/rules/grayOnColor.js'
import { lineLength } from '@/rules/lineLength.js'
import type { Rule } from '@/rules/Rule.js'

/** The rules about how text reads: its colour and its measure. */
export const READABILITY_RULES: Rule[] = [grayOnColor, lineLength]
