import type { DisableEntry } from '@/config/DisableEntry.js'
import { expectConfig } from '@/config/expectConfig.js'
import { isRecord } from '@/config/isRecord.js'
import { stringField } from '@/config/stringField.js'

export const disableEntryFrom = (
  value: unknown,
  index: number,
): DisableEntry => {
  const where = `disable[${String(index)}]`
  expectConfig(isRecord(value), `${where} must be an object`)
  return {
    rule: stringField(value, 'rule', '', where),
    route:
      value['route'] === undefined
        ? null
        : stringField(value, 'route', '', where),
    selector:
      value['selector'] === undefined
        ? null
        : stringField(value, 'selector', '', where),
    message:
      value['message'] === undefined
        ? null
        : stringField(value, 'message', '', where),
    reason: stringField(value, 'reason', '', where),
  }
}
