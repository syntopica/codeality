import { asciiEllipsis } from '@/rules/asciiEllipsis.js'
import { labelPunctuation } from '@/rules/labelPunctuation.js'
import { placeholderAsLabel } from '@/rules/placeholderAsLabel.js'
import type { Rule } from '@/rules/Rule.js'
import { timeWithoutDatetime } from '@/rules/timeWithoutDatetime.js'

/** The rules about wording and labelling: ellipses, field labels and timestamps. */
export const COPY_RULES: Rule[] = [
  asciiEllipsis,
  labelPunctuation,
  placeholderAsLabel,
  timeWithoutDatetime,
]
