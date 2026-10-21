import { expect, it } from 'vitest'

import { asciiEllipsis } from '@/rules/asciiEllipsis.js'
import { bareUrl } from '@/rules/bareUrl.js'
import { typeScaleSprawl } from '@/rules/typeScaleSprawl.js'
import { undersizedText } from '@/rules/undersizedText.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

it.each([
  { name: 'ellipsis', rule: asciiEllipsis },
  { name: 'URL', rule: bareUrl },
  { name: 'type scale', rule: typeScaleSprawl },
  { name: 'font floor', rule: undersizedText },
])('excludes transparent selection glyphs from $name checks', ({ rule }) => {
  const main = elementBox({ id: 0, isMain: true })
  const glyphs = [8, 9, 10, 11, 12, 13, 14].map((fontSize, index) =>
    elementBox({
      id: index + 1,
      parent: 0,
      selector: `.textLayer > span:nth-child(${String(index + 1)})`,
      text: 'https://example.com ...',
      textTail: '...',
      fontSize,
      color: [0, 0, 0, 0],
    }),
  )
  expect(rule(snapshotOf([main, ...glyphs]), ruleContext())).toEqual([])
  for (const paint of ['opaque', 'gradient', 'shadow'] as const) {
    const visible = glyphs.map((glyph) =>
      elementBox({
        ...glyph,
        color: [0, 0, 0, paint === 'opaque' ? 1 : 0],
        clipsText: paint === 'gradient',
        hasGradient: paint === 'gradient',
        textShadows:
          paint === 'shadow'
            ? [
                {
                  x: 0,
                  y: 0,
                  blur: 1,
                  spread: 0,
                  inset: false,
                  color: [0, 0, 0, 1],
                },
              ]
            : [],
      }),
    )
    expect(
      rule(snapshotOf([main, ...visible]), ruleContext()).length,
    ).toBeGreaterThan(0)
  }
})
