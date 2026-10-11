import { contentWidth } from '@/rules/contentWidth.js'
import { narrowPage } from '@/rules/narrowPage.js'
import { raggedColumn } from '@/rules/raggedColumn.js'
import type { Rule } from '@/rules/Rule.js'

/** The rules for how much of its column, region and screen the content uses. */
export const WIDTH_RULES: Rule[] = [contentWidth, narrowPage, raggedColumn]
