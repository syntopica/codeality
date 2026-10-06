import { expectConfig } from '@/config/expectConfig.js'
import { isRecord } from '@/config/isRecord.js'
import { numberField } from '@/config/numberField.js'
import type { Viewport } from '@/model/Viewport.js'

export const viewportFrom = (value: unknown, index: number): Viewport => {
  const where = `viewports[${String(index)}]`
  expectConfig(isRecord(value), `${where} must be an object`)
  const mobile = value['mobile'] ?? false
  expectConfig(typeof mobile === 'boolean', `${where}.mobile must be a boolean`)
  return {
    width: numberField(value, 'width', 0, where),
    height: numberField(value, 'height', 0, where),
    ...(mobile ? { mobile } : {}),
  }
}
