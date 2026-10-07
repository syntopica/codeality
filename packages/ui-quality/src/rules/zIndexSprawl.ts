import type { RawFinding } from '@/model/RawFinding.js'
import { isLayered } from '@/rules/isLayered.js'
import type { Rule } from '@/rules/Rule.js'

// Stacking order is a scale (content, sticky, dropdown, modal, toast), not a
// race: more than six distinct positive layers means they were set one at a
// time, and a value in the thousands is an arms race that has already been
// lost. `ceiling` is the value from which a layer is reported, so a project
// whose own scale starts higher raises it.
export const zIndexSprawl: Rule = (snapshot, context) => {
  const { maxLayers, ceiling } = context.options.zIndexSprawl
  const { elements } = snapshot
  const layered = elements.flatMap((element) =>
    element.zIndex !== null &&
    element.zIndex > 0 &&
    isLayered(element, elements)
      ? [{ element, zIndex: element.zIndex }]
      : [],
  )
  const findings: RawFinding[] = layered
    .filter(({ zIndex }) => zIndex >= ceiling)
    .map(({ element, zIndex }) => ({
      rule: 'z-index-sprawl',
      severity: 'warn',
      message: `z-index ${String(zIndex)} is past ${String(ceiling)}; keep layers on a short scale and raise the scale, not the number`,
      subject: element.selector,
      identity: `ceiling:${element.signature}`,
    }))
  const values = [...new Set(layered.map(({ zIndex }) => zIndex))].toSorted(
    (a, b) => a - b,
  )
  if (values.length > maxLayers)
    findings.push({
      rule: 'z-index-sprawl',
      severity: 'warn',
      message: `the page stacks ${String(values.length)} distinct z-index layers (${values.map(String).join(', ')}); keep them to ${String(maxLayers)} or fewer on one scale`,
      subject: elements.find((element) => element.isMain)?.selector ?? 'main',
      identity: 'layers',
    })
  return findings
}
