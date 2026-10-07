import type { ElementBox } from '@/model/ElementBox.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'
import type { Rule } from '@/rules/Rule.js'
import { soleIconPaint } from '@/rules/soleIconPaint.js'

// A solid glyph beside an outline one in one repeated column (a Font Awesome
// WhatsApp mark next to a Lucide envelope) reads as two icon sets. Navigation
// is left out: a filled icon there usually marks the active entry.
export const mixedIconFamily: Rule = (snapshot) => {
  const groups = new Map<string, ElementBox[]>()
  for (const element of snapshot.elements) {
    if (element.parent === null) continue
    if (ancestorsOf(element, snapshot.elements).some((a) => a.tag === 'nav'))
      continue
    const key = `${String(element.parent)} ${element.tag}`
    groups.set(key, [...(groups.get(key) ?? []), element])
  }
  return [...groups.values()].flatMap((siblings) => {
    if (siblings.length < 2) return []
    const paints = new Set(
      siblings
        .map((item) => soleIconPaint(item, snapshot.elements))
        .filter(Boolean),
    )
    const parent = snapshot.elements[siblings[0]?.parent ?? -1]
    if (paints.size < 2 || !parent) return []
    return [
      {
        rule: 'mixed-icon-family',
        severity: 'warn',
        message:
          'one repeated group mixes filled and outline icons, which reads as two icon sets; draw them from one family',
        subject: parent.selector,
        identity: parent.selector,
      },
    ]
  })
}
