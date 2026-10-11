import { describe, expect, it } from 'vitest'

import type { ElementBox } from '@/model/ElementBox.js'
import { narrowPage } from '@/rules/narrowPage.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

// A report capped at `max-w-4xl` (896px, 40px padding) centred on 1920px.
const main = elementBox({
  id: 0,
  isMain: true,
  x: 512,
  width: 896,
  height: 600,
  selector: 'main',
})
const heading = elementBox({
  id: 1,
  parent: 0,
  tag: 'h1',
  x: 552,
  width: 816,
  text: 'Is the evidence still current?',
})
const card = elementBox({
  id: 2,
  parent: 0,
  tag: 'section',
  x: 552,
  y: 100,
  width: 816,
  height: 200,
  borderRadius: 8,
  padding: [24, 24, 24, 24],
  shadowBlur: 6,
})
const cardText = elementBox({
  id: 3,
  parent: 2,
  x: 576,
  y: 124,
  width: 400,
  text: 'Revision 41: current',
})
const report = [main, heading, card, cardText]
const findingsAt = (width: number, elements: ElementBox[]) =>
  narrowPage(snapshotOf(elements, { viewportWidth: width }), ruleContext())

describe('narrowPage', () => {
  it('reports a report page capped narrow on a wide screen', () => {
    expect(findingsAt(1920, report).map((finding) => finding.message)).toEqual([
      'the page spans 816px of the 1920px left to it (43%, minimum 55%) at 1920px; widen its container or lay its sections side by side',
    ])
    expect(findingsAt(1920, report)[0]?.severity).toBe('error')
  })
  it('leaves narrower screens and a page that spans most of the screen alone', () => {
    expect(findingsAt(1440, report)).toEqual([])
    const wide = elementBox({ ...heading, x: 360, width: 1200 })
    expect(findingsAt(1920, [main, wide, card, cardText])).toEqual([])
  })
  it('measures against the screen less a side panel', () => {
    const shell = elementBox({ id: 4, x: 0, width: 1920, height: 900 })
    const sidebar = elementBox({
      id: 5,
      parent: 4,
      tag: 'nav',
      x: 0,
      width: 400,
      height: 900,
      text: 'Workspace',
    })
    const inShell = [
      elementBox({ ...main, parent: 4, x: 400, width: 1520 }),
      elementBox({ ...heading, x: 440, width: 900 }),
      elementBox({ ...card, x: 440, width: 900 }),
      elementBox({ ...cardText, x: 464 }),
      shell,
      sidebar,
    ]
    expect(findingsAt(1920, inShell)).toEqual([])
  })
  it('keeps the measure of a reading page and of a lone form', () => {
    const prose = elementBox({
      id: 2,
      parent: 0,
      tag: 'p',
      x: 552,
      y: 100,
      width: 816,
      text: 'The caller opened with the account number',
      lines: 6,
    })
    expect(findingsAt(1920, [main, heading, prose])).toEqual([])
    const field = elementBox({
      id: 3,
      parent: 2,
      tag: 'input',
      x: 576,
      y: 124,
      width: 400,
      isControl: true,
      isTextEntry: true,
    })
    expect(findingsAt(1920, [main, heading, card, field])).toEqual([])
  })
  it('leaves a data page whose column content-width reports to that rule', () => {
    const wideMain = elementBox({ ...main, x: 0, width: 1920 })
    const table = elementBox({
      id: 4,
      parent: 0,
      tag: 'table',
      x: 552,
      width: 816,
      text: 'Invoice',
    })
    expect(
      findingsAt(1920, [wideMain, heading, card, cardText, table]),
    ).toEqual([])
    expect(
      findingsAt(1920, [...report, { ...table, x: 552 }]).map(
        (finding) => finding.rule,
      ),
    ).toEqual(['narrow-page'])
  })
  it('needs a main region that paints something', () => {
    expect(findingsAt(1920, [heading, card, cardText])).toEqual([])
    expect(findingsAt(1920, [main])).toEqual([])
  })
})
