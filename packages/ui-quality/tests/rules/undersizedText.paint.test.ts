import { expect, it } from 'vitest'

import { undersizedText } from '@/rules/undersizedText.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

it('ignores unpainted transparent text while retaining visible glyph controls', () => {
  const elements = [
    elementBox({
      id: 0,
      selector: '.textLayer > span',
      text: 'Synthetic PDF selection layer',
      fontSize: 9,
      color: [0, 0, 0, 0],
    }),
    elementBox({
      id: 1,
      selector: '.opaque',
      text: 'Visible small text',
      fontSize: 9,
    }),
    elementBox({
      id: 2,
      selector: '.gradient',
      text: 'Painted background glyphs',
      fontSize: 9,
      color: [0, 0, 0, 0],
      clipsText: true,
      hasGradient: true,
    }),
    elementBox({
      id: 3,
      selector: '.shadow',
      text: 'Painted shadow glyphs',
      fontSize: 9,
      color: [0, 0, 0, 0],
      textShadows: [
        { x: 0, y: 0, blur: 1, spread: 0, inset: false, color: [0, 0, 0, 1] },
      ],
    }),
  ]
  expect(
    undersizedText(snapshotOf(elements), ruleContext()).map(
      (finding) => finding.subject,
    ),
  ).toEqual(['.opaque', '.gradient', '.shadow'])
})
