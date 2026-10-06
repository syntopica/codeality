import { AXE_TIMEOUT_MS } from '@/config/AXE_TIMEOUT_MS.js'
import type { AxeConfig } from '@/config/AxeConfig.js'
import { expectConfig } from '@/config/expectConfig.js'
import { isRecord } from '@/config/isRecord.js'
import { numberField } from '@/config/numberField.js'
import { stringList } from '@/config/stringList.js'

export const axeConfigFrom = (value: unknown): AxeConfig => {
  const record = value ?? {}
  expectConfig(isRecord(record), 'axe must be an object')
  return {
    exclude: stringList(record['exclude'], 'axe.exclude'),
    timeoutMs: numberField(record, 'timeoutMs', AXE_TIMEOUT_MS, 'axe'),
  }
}
