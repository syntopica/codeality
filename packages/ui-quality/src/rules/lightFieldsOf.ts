import { rgbaToLab } from '@/color/rgbaToLab.js'
import type { ElementBox } from '@/model/ElementBox.js'
import { LIGHT_FIELD_LIGHTNESS } from '@/rules/LIGHT_FIELD_LIGHTNESS.js'
import { NATIVE_FIELD_TAGS } from '@/rules/NATIVE_FIELD_TAGS.js'
import { OPAQUE_ALPHA } from '@/rules/OPAQUE_ALPHA.js'

/** The native fields that paint a light, opaque fill. */
export const lightFieldsOf = (elements: ElementBox[]): ElementBox[] =>
  elements.filter(
    (element) =>
      NATIVE_FIELD_TAGS.has(element.tag) &&
      element.backgroundColor !== null &&
      element.backgroundColor[3] >= OPAQUE_ALPHA &&
      rgbaToLab(element.backgroundColor)[0] > LIGHT_FIELD_LIGHTNESS,
  )
