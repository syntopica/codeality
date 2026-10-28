import { duplicateNavIcon } from '@/rules/duplicateNavIcon.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'
import { describe, expect, it } from 'vitest'

// Two 240px entries in a nav; `icon` places each entry's svg at that x.
const rail = (icons: { x: number; digest: string }[]) => [
  elementBox({ id: 0, tag: 'nav', width: 240 }),
  ...icons.flatMap(({ x, digest }, index) => [
    elementBox({
      id: 1 + index * 2,
      parent: 0,
      tag: 'button',
      x: 0,
      width: 240,
      text: `Section ${String(index + 1)}`,
    }),
    elementBox({
      id: 2 + index * 2,
      parent: 1 + index * 2,
      tag: 'svg',
      x,
      width: 16,
      svgDigest: digest,
    }),
  ]),
]

describe('duplicateNavIcon', () => {
  it('reports two entries that lead with the same icon', () => {
    const found = duplicateNavIcon(
      snapshotOf(
        rail([
          { x: 8, digest: 'user' },
          { x: 8, digest: 'user' },
        ]),
      ),
      ruleContext(),
    )
    expect(found.map((finding) => finding.subject)).toEqual([
      'Section 1 / Section 2',
    ])
  })

  // False positive: a rail whose entries all end in the same status check.
  it('leaves entries alone that share only a trailing status icon', () => {
    expect(
      duplicateNavIcon(
        snapshotOf(
          rail([
            { x: 216, digest: 'check' },
            { x: 216, digest: 'check' },
          ]),
        ),
        ruleContext(),
      ),
    ).toEqual([])
  })
})
