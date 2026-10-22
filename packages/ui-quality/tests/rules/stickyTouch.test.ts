import { touchTarget } from '@/rules/touchTarget.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'
import { describe, expect, it } from 'vitest'

describe('confirmed sticky tap coverage', () => {
  it.each([
    { y: 48, height: 48, bottom: 64, count: 1 },
    {
      cover: { x: 0, y: 0, width: 390, height: 64 },
      y: 48,
      height: 48,
      bottom: 64,
      count: 0,
    },
    {
      cover: { x: 0, y: 0, width: 390, height: 64 },
      y: 16,
      height: 48,
      bottom: 48,
      count: 0,
    },
    {
      cover: { x: 0, y: 0, width: 390, height: 64 },
      y: 48,
      height: 48,
      bottom: 80,
      count: 1,
    },
    {
      cover: { x: 0, y: 0, width: 390, height: 64 },
      y: 64,
      height: 48,
      bottom: 112,
      count: 1,
    },
    {
      cover: { x: 0, y: 0, width: 390, height: 64 },
      y: 48,
      height: 48,
      bottom: 66,
      count: 0,
    },
    {
      cover: { x: 0, y: 0, width: 390, height: 64 },
      y: 48,
      height: 48,
      bottom: 67,
      count: 1,
    },
  ] as const)(
    'keeps exposed overlap and the 2px tolerance: $y/$height/$bottom/$count',
    (state) => {
      const { y, height, bottom, count } = state
      const cover = 'cover' in state ? state.cover : undefined
      const header = elementBox({
        id: 0,
        tag: 'button',
        selector: '#sort',
        signature: '#sort',
        tappable: true,
        x: 16,
        y: 0,
        width: 120,
        height: bottom,
        tapWidth: 100,
        tapHeight: 48,
      })
      const row = elementBox({
        id: 1,
        tag: 'button',
        selector: '#row',
        signature: '#row',
        tappable: true,
        x: 0,
        y,
        width: 120,
        height,
        tapWidth: 120,
        tapHeight: 48,
        ...(cover === undefined ? {} : { tapOcclusion: cover }),
      })
      const findings = touchTarget(
        snapshotOf([header, row], {
          screen: {
            route: '/',
            viewport: { width: 390, height: 844 },
            colorScheme: 'light',
          },
        }),
        ruleContext(),
      )
      expect(findings).toHaveLength(count)
      expect(
        findings.map(({ rule, identity, subject }) => ({
          rule,
          identity,
          subject,
        })),
      ).toEqual(
        count
          ? [
              {
                rule: 'touch-target',
                identity: 'overlap #sort',
                subject: '#sort',
              },
            ]
          : [],
      )
    },
  )
})
