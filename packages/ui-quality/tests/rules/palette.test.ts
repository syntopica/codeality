import { describe, expect, it } from 'vitest'

import { hexToRgba } from '@/color/hexToRgba.js'
import { palette } from '@/rules/palette.js'
import { resolvePalette } from '@/rules/resolvePalette.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

const colors = resolvePalette(
  { variablePrefixes: ['--brand-'], colors: ['#ffffff'] },
  {
    '--brand-pink': hexToRgba('#f027a5'),
    '--brand-ink': hexToRgba('#111827'),
    '--other': hexToRgba('#2563eb'),
  },
)

describe('palette', () => {
  it('reports colours far from every palette entry, by kind', () => {
    const line = hexToRgba('#2563eb')
    const badge = elementBox({
      id: 0,
      text: '1',
      color: hexToRgba('#ffffff'),
      backgroundColor: hexToRgba('#2563eb'),
      borderWidths: [1, 0, 0, 0],
      borderColors: [line, null, null, null],
    })
    const findings = palette(
      snapshotOf([badge]),
      ruleContext({ palette: colors }),
    )
    expect(findings.map((finding) => finding.identity)).toEqual([
      'background:#2563eb',
      'border:#2563eb',
    ])
  })
  it('accepts palette colours, near misses and a project without a palette', () => {
    const pink = elementBox({ id: 0, text: 'ok', color: hexToRgba('#f128a6') })
    expect(
      palette(snapshotOf([pink]), ruleContext({ palette: colors })),
    ).toEqual([])
    expect(palette(snapshotOf([pink]), ruleContext())).toEqual([])
    expect(resolvePalette(null, {})).toBeNull()
  })
})
