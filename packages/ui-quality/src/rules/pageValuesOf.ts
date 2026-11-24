import type { ElementBox } from '@/model/ElementBox.js'
import { BREADCRUMB_LABEL } from '@/rules/BREADCRUMB_LABEL.js'
import { descendantsOf } from '@/rules/descendantsOf.js'

/** The texts a breadcrumb landmark or a combobox picker shows, which tell a person where they are. */
export const pageValuesOf = (elements: ElementBox[]): Set<string> => {
  const roots = elements.filter(
    (element) =>
      element.role === 'combobox' || BREADCRUMB_LABEL.test(element.label),
  )
  return new Set(
    roots
      .flatMap((root) => [root, ...descendantsOf(root, elements)])
      .map((element) => element.text)
      .filter((text) => text !== ''),
  )
}
