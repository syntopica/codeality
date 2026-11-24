/** A single-select control rendered as a dropdown, regardless of its styling. */
export const isNativeDropdown = (element) =>
  element instanceof HTMLSelectElement && !element.multiple && element.size <= 1
