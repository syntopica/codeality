import { expectConfig } from '@/config/expectConfig.js'
import { isRecord } from '@/config/isRecord.js'
import { numericOptions } from '@/config/numericOptions.js'
import { RULE_DEFAULTS } from '@/config/RULE_DEFAULTS.js'
import type { RuleOptions } from '@/config/RuleOptions.js'
import { ruleSection } from '@/config/ruleSection.js'

export const ruleOptionsFrom = (value: unknown): RuleOptions => {
  const rules = value ?? {}
  expectConfig(isRecord(rules), 'rules must be an object')
  const read = <T extends Record<string, number>>(
    name: string,
    defaults: T,
  ): T => numericOptions(ruleSection(rules, name), defaults, `rules.${name}`)
  return {
    rowMisaligned: read('row-misaligned', RULE_DEFAULTS.rowMisaligned),
    controlInset: read('control-inset', RULE_DEFAULTS.controlInset),
    edgeMisaligned: read('edge-misaligned', RULE_DEFAULTS.edgeMisaligned),
    contentWidth: read('content-width', RULE_DEFAULTS.contentWidth),
    palette: read('palette', RULE_DEFAULTS.palette),
    slowRequest: read('slow-request', RULE_DEFAULTS.slowRequest),
    zIndexSprawl: read('z-index-sprawl', RULE_DEFAULTS.zIndexSprawl),
  }
}
