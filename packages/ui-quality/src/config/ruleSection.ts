import { expectConfig } from '@/config/expectConfig.js'
import { isRecord } from '@/config/isRecord.js'

/** One rule's options object inside `rules`, empty when absent. */
export const ruleSection = (
  rules: Record<string, unknown>,
  name: string,
): Record<string, unknown> => {
  const section = rules[name] ?? {}
  expectConfig(isRecord(section), `rules.${name} must be an object`)
  return section
}
