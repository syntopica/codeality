import { describe, expect, it } from 'vitest'

import type { ElementBox } from '@/model/ElementBox.js'
import type { InputIcon } from '@/model/InputIcon.js'
import { inputIconMisaligned } from '@/rules/inputIconMisaligned.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

// A 240x40 field at (0, 0): 1px border, 12px padding, so the content centre is y 20.
const field = elementBox({
  id: 1,
  parent: 0,
  tag: 'input',
  inputType: 'date',
  width: 240,
  height: 40,
  borderWidths: [1, 1, 1, 1],
  padding: [0, 12, 0, 12],
})
const wrapper = elementBox({ id: 0, tag: 'div', position: 'relative' })
const nativeIcon = (y: number, x: number): InputIcon => ({
  element: 1,
  side: 'right',
  x,
  y,
  width: 16,
  height: 16,
})
const overlay = (y: number, x: number): ElementBox =>
  elementBox({
    id: 2,
    parent: 0,
    tag: 'svg',
    position: 'absolute',
    x,
    y,
    width: 16,
    height: 16,
  })

describe('inputIconMisaligned', () => {
  it('accepts a native picker icon centred and inset by the padding', () => {
    expect(
      inputIconMisaligned(
        snapshotOf([wrapper, field], { inputIcons: [nativeIcon(12, 211)] }),
        ruleContext(),
      ),
    ).toEqual([])
  })
  it('reports a native picker icon pushed down and in', () => {
    expect(
      inputIconMisaligned(
        snapshotOf([wrapper, field], { inputIcons: [nativeIcon(20, 201)] }),
        ruleContext(),
      )[0]?.message,
    ).toContain('8px off the field')
  })
  it('accepts a centred overlaid svg and reports a low one', () => {
    const run = (y: number, x: number) =>
      inputIconMisaligned(
        snapshotOf([wrapper, field, overlay(y, x)]),
        ruleContext(),
      )
    expect(run(12, 211)).toEqual([])
    expect(run(20, 216)).toHaveLength(1)
  })
})
