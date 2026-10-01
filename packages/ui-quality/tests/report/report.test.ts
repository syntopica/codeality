import { describe, expect, it } from 'vitest'

import { screenshotName } from '@/capture/screenshotName.js'
import type { RawFinding } from '@/model/RawFinding.js'
import type { Screen } from '@/model/Screen.js'
import { mergeFindings } from '@/report/mergeFindings.js'
import { renderFindings } from '@/report/renderFindings.js'
import { renderFindingsJson } from '@/report/renderFindingsJson.js'
import { toFinding } from '@/report/toFinding.js'

const screen = (width: number, colorScheme: 'light' | 'dark'): Screen => ({
  route: '/inbox',
  viewport: { width, height: 900 },
  colorScheme,
})
const raw = (rule: string): RawFinding => ({
  rule,
  severity: 'error',
  message: 'm',
  subject: 's',
  identity: 'i',
})

describe('report', () => {
  it('merges a layout finding across viewports and schemes, keeps colour findings per scheme', () => {
    const layout = mergeFindings([
      toFinding(raw('row-misaligned'), screen(1920, 'light')),
      toFinding(raw('row-misaligned'), screen(1440, 'dark')),
    ])
    expect(layout).toHaveLength(1)
    expect(layout[0]?.screens).toEqual(['1920x900 light', '1440x900 dark'])
    const colour = mergeFindings([
      toFinding(raw('a11y/color-contrast'), screen(1920, 'light')),
      toFinding(raw('a11y/color-contrast'), screen(1920, 'dark')),
    ])
    expect(colour).toHaveLength(2)
  })
  it('renders text and JSON', () => {
    const findings = [toFinding(raw('palette'), screen(1440, 'light'))]
    expect(renderFindings(findings)).toBe(
      '/inbox [1440x900 light] error palette: m\n    at s\n1 findings',
    )
    expect(JSON.parse(renderFindingsJson(findings))).toEqual({ findings })
    expect(
      renderFindings([{ ...findings[0], subject: '' } as never]),
    ).not.toContain('at ')
  })
  it('names screenshots after route, size and scheme', () => {
    expect(screenshotName(screen(390, 'dark'))).toBe('inbox.390x900.dark.png')
    expect(screenshotName({ ...screen(390, 'dark'), route: '/' })).toBe(
      'root.390x900.dark.png',
    )
  })
})
