import { isNativeDropdown } from './isNativeDropdown.js'
import { isSelectOnlyPopup } from './isSelectOnlyPopup.js'

/** Record only dropdowns for which the rendered DOM establishes missing search. */
export const markDropdownsWithoutSearch = (elements, visible) => {
  for (const [element, id] of visible) {
    if (isNativeDropdown(element) || isSelectOnlyPopup(element, visible))
      elements[id].dropdownWithoutSearch = true
  }
}
