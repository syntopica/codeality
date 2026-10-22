import { probeSource } from '@/capture/probeSource.js'
import type { ProbeResult } from '@/model/ProbeResult.js'
import { crowdedMetaLine } from '@/rules/crowdedMetaLine.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'
import { chromium } from 'playwright'
import { describe, expect, it } from 'vitest'

describe('crowded metadata line clamps', () => {
  const accountText = 'Synthetic customer account for operations'
  it.each([
    {
      name: 'clamped stub',
      width: 40,
      clamp: 1,
      text: accountText,
      style: '',
      expected: true,
    },
    {
      name: 'fitting clamp',
      width: 300,
      clamp: 1,
      text: 'Short',
      style: '',
      expected: false,
    },
    {
      name: 'roomy clamp',
      width: 220,
      clamp: 1,
      text: accountText,
      style: '',
      expected: false,
    },
    {
      name: 'two visible lines',
      width: 100,
      clamp: 2,
      text: accountText,
      style: '',
      expected: false,
    },
    {
      name: 'unapplied declaration',
      width: 40,
      clamp: 1,
      text: accountText,
      style: 'display:block',
      expected: false,
    },
    {
      name: 'legacy ellipsis stub',
      width: 40,
      clamp: 0,
      text: accountText,
      style: 'display:block;white-space:nowrap;text-overflow:ellipsis',
      expected: true,
    },
    {
      name: 'roomy legacy ellipsis',
      width: 220,
      clamp: 0,
      text: accountText,
      style: 'display:block;white-space:nowrap;text-overflow:ellipsis',
      expected: false,
    },
  ])('$name', async ({ name, width, clamp, text, style, expected }) => {
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage()
      await page.route('**/*', async (route) => route.abort())
      await page.setContent(
        `<style>body{font:16px/24px monospace}.row{display:flex;align-items:start;gap:8px}#label{flex:none;width:${String(width)}px;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:${clamp ? String(clamp) : 'none'};overflow:hidden;${style}}</style><main><div class="row"><span>Code</span><span id="label">${text}</span><span>Value</span></div></main>`,
      )
      const probe = await page.evaluate<ProbeResult>(
        `(${probeSource()})('main')`,
      )
      const label = probe.elements.find((box) => box.selector === 'span#label')
      expect(label).toBeDefined()
      expect(label?.lineClamp).toBe(clamp)
      const measurements = new Map([
        ['clamped stub', [24, 120, 5]],
        ['fitting clamp', [24, 24, 1]],
        ['roomy clamp', [24, 48, 2]],
        ['two visible lines', [48, 120, 5]],
        ['unapplied declaration', [120, 120, 5]],
        ['legacy ellipsis stub', [24, 24, 1]],
        ['roomy legacy ellipsis', [24, 24, 1]],
      ])
      expect([label?.clientHeight, label?.scrollHeight, label?.lines]).toEqual(
        measurements.get(name),
      )
      const findings = crowdedMetaLine(
        snapshotOf(probe.elements),
        ruleContext(),
      )
      expect(findings.map((finding) => finding.subject)).toEqual(
        expected ? ['span#label'] : [],
      )
    } finally {
      await browser.close()
    }
  })
})
