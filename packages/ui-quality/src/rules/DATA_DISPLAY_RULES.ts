import { crowdedMetaLine } from '@/rules/crowdedMetaLine.js'
import { dateLocale } from '@/rules/dateLocale.js'
import { labelWrap } from '@/rules/labelWrap.js'
import { listDanglingRule } from '@/rules/listDanglingRule.js'
import { moneyWithoutUnit } from '@/rules/moneyWithoutUnit.js'
import { monospaceProse } from '@/rules/monospaceProse.js'
import { redundantTotal } from '@/rules/redundantTotal.js'
import type { Rule } from '@/rules/Rule.js'
import { unbreakableOverflow } from '@/rules/unbreakableOverflow.js'
import { untranslatedText } from '@/rules/untranslatedText.js'

/** The rules about how data reads in lists and panels: dates, amounts, totals, labels, dividers and type. */
export const DATA_DISPLAY_RULES: Rule[] = [
  crowdedMetaLine,
  dateLocale,
  labelWrap,
  listDanglingRule,
  moneyWithoutUnit,
  monospaceProse,
  redundantTotal,
  unbreakableOverflow,
  untranslatedText,
]
