import type { ElementBox } from '@/model/ElementBox.js'
import type { TapRect } from '@/model/TapRect.js'

/** Unknown coverage is absent from the captured payload, including before JSON serialization. */
export const tapOcclusionFields = (
  cover: TapRect | undefined,
): Pick<ElementBox, 'tapOcclusion'> =>
  cover === undefined ? {} : { tapOcclusion: cover }
