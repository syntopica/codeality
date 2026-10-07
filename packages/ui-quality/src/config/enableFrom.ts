import { expectConfig } from '@/config/expectConfig.js'
import { OPT_IN_RULES } from '@/config/OPT_IN_RULES.js'
import { stringList } from '@/config/stringList.js'

/** `enable`: the opt-in rules a project switches on. */
export const enableFrom = (value: unknown): string[] => {
  const ids = stringList(value, 'enable')
  for (const id of ids)
    expectConfig(
      OPT_IN_RULES.includes(id),
      `enable names "${id}", which is not an opt-in rule (${OPT_IN_RULES.join(', ')})`,
    )
  return ids
}
