import type { Rule } from '@/rules/Rule.js'

/** Project policy for dropdowns that must provide a search field. */
export const searchableDropdown: Rule = (snapshot, context) => {
  if (!context.enabled.includes('searchable-dropdown')) return []

  return snapshot.elements
    .filter((element) => element.dropdownWithoutSearch === true)
    .map((element) => ({
      rule: 'searchable-dropdown',
      severity: 'error',
      message:
        element.tag === 'select'
          ? 'replace the native dropdown with a custom picker that lets users search its options'
          : 'add an editable search field to the picker so users can search its options',
      subject: element.selector,
      identity: element.selector,
    }))
}
