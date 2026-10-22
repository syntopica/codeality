import { readFileSync } from 'node:fs'

import { probeSource } from '@/capture/probeSource.js'
import type { ProbeResult } from '@/model/ProbeResult.js'
import { labelWrap } from '@/rules/labelWrap.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'
import { chromium } from 'playwright'
import { describe, expect, it } from 'vitest'

describe('wrapped label SVG viewport alignment', () => {
  it.each([
    {
      name: 'block-centred icon with no spare value width',
      style: '',
      nested: false,
      extra: false,
      expected: 1,
    },
    {
      name: 'scrolled document',
      style:
        'main{margin-top:1000px}#label{align-items:flex-start}svg{margin-top:4px}',
      nested: false,
      extra: false,
      expected: 0,
    },
    {
      name: 'first-line aligned',
      style: '#label{align-items:flex-start}svg{margin-top:4px}',
      nested: false,
      extra: false,
      expected: 0,
    },
    {
      name: 'fractional aligned tolerance',
      style: '#label{align-items:flex-start}svg{margin-top:5px}',
      nested: false,
      extra: false,
      expected: 0,
    },
    {
      name: 'four-pixel shift',
      style: '#label{align-items:flex-start}svg{margin-top:8px}',
      nested: false,
      extra: false,
      expected: 1,
    },
    {
      name: 'nested branches',
      style: '',
      nested: true,
      extra: false,
      expected: 1,
    },
    {
      name: 'ambiguous extra icon',
      style: '',
      nested: false,
      extra: true,
      expected: 0,
    },
    {
      name: 'stacked icon',
      style: '#label{flex-direction:column}',
      nested: false,
      extra: false,
      expected: 0,
    },
    {
      name: 'legacy metadata',
      style: '',
      nested: false,
      extra: false,
      expected: 0,
    },
    {
      name: 'trailing icon',
      style: '',
      nested: false,
      extra: false,
      expected: 1,
    },
    {
      name: 'RTL adjacent icon',
      style: '#label{direction:rtl}',
      nested: false,
      extra: false,
      expected: 1,
    },
    {
      name: 'oversized illustration',
      style: '#label svg{width:64px;height:64px}',
      nested: false,
      extra: false,
      expected: 0,
    },
    {
      name: 'single-line label',
      style: '.text{width:250px}dl{grid-template-columns:300px 30px}',
      nested: false,
      extra: false,
      expected: 0,
    },
    {
      name: 'width and icon defect reported once',
      style: 'dl{grid-template-columns:150px 400px}',
      nested: false,
      extra: false,
      expected: 1,
    },
  ])('$name', async ({ name, style, nested, extra, expected }) => {
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage()
      await page.route('**/*', async (route) => route.abort())
      await page.setContent(
        readFileSync(
          new URL('../fixtures/site/label-icon.html', import.meta.url),
          'utf8',
        ),
      )
      if (style) await page.addStyleTag({ content: style })
      await page.evaluate(`(({ nested, extra, name }) => {
        const label = document.querySelector('#label')
        if (!label) throw new Error('Missing synthetic label')
        if (extra) {
          const icon = label.querySelector('svg')
          if (!icon) throw new Error('Missing synthetic SVG')
          label.prepend(icon.cloneNode(true))
        }
        if (nested) {
          for (const child of [...label.children]) {
            const wrapper = document.createElement('span')
            child.replaceWith(wrapper)
            wrapper.append(child)
          }
          const outer = document.createElement('span')
          outer.style.cssText = 'display:flex;align-items:center;gap:8px'
          outer.append(...label.childNodes)
          label.append(outer)
        }
        if (name === 'trailing icon') label.append(label.querySelector('svg'))
        if (name === 'scrolled document') window.scrollTo(0, 800)
      })(${JSON.stringify({ nested, extra, name })})`)
      const probe = await page.evaluate<ProbeResult>(
        `(${probeSource()})('main')`,
      )
      const scrollY = await page.evaluate<number>('window.scrollY')
      expect(scrollY > 0).toBe(name === 'scrolled document')
      const firstCentre = await page.evaluate<number>(`(() => {
        const range = document.createRange()
        range.selectNodeContents(document.querySelector('.text'))
        const first = [...range.getClientRects()].find(rect => rect.width > 0 && rect.height > 0)
        return first.top + first.height / 2 + window.scrollY
      })()`)
      expect(
        probe.elements.find((box) => box.text === 'Account status details')
          ?.firstTextLineCenterY,
      ).toBeCloseTo(firstCentre, 5)
      if (name === 'legacy metadata') {
        for (const box of probe.elements) delete box.firstTextLineCenterY
      }
      const findings = labelWrap(snapshotOf(probe.elements), ruleContext())
      expect(findings).toHaveLength(expected)
      expect(
        findings.map((finding) => finding.message.includes('first text line')),
      ).toEqual(expected ? [true] : [])
    } finally {
      await browser.close()
    }
  })
})
