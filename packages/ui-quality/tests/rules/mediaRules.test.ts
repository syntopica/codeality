import { describe, expect, it } from 'vitest'

import { brokenImage } from '@/rules/brokenImage.js'
import { contentHiddenAtRest } from '@/rules/contentHiddenAtRest.js'
import { unstableMediaSize } from '@/rules/unstableMediaSize.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

const media = [
  {
    tag: 'img',
    signature: 'img.logo',
    selector: 'img.logo',
    broken: true,
    sized: true,
  },
  {
    tag: 'img',
    signature: 'img.hero',
    selector: 'img.hero',
    broken: false,
    sized: false,
  },
  {
    tag: 'video',
    signature: 'video',
    selector: 'video',
    broken: false,
    sized: true,
  },
]

describe('brokenImage and unstableMediaSize', () => {
  it('report the broken image and the unsized one, each once', () => {
    const snapshot = snapshotOf([], { media })
    expect(brokenImage(snapshot, ruleContext()).map((f) => f.subject)).toEqual([
      'img.logo',
    ])
    expect(
      unstableMediaSize(snapshot, ruleContext()).map((f) => f.subject),
    ).toEqual(['img.hero'])
  })
})

describe('contentHiddenAtRest', () => {
  it('reports a main region a quarter or more invisible', () => {
    const [finding] = contentHiddenAtRest(
      snapshotOf([], {
        hiddenText: { total: 400, hidden: 100, selector: 'section.reveal' },
      }),
      ruleContext(),
    )
    expect(finding?.subject).toBe('section.reveal')
    expect(finding?.message).toContain('25% of the main region')
  })
  it('accepts a little hidden text and an empty region', () => {
    for (const hiddenText of [
      { total: 400, hidden: 99, selector: 'span' },
      { total: 0, hidden: 0, selector: '' },
    ])
      expect(
        contentHiddenAtRest(snapshotOf([], { hiddenText }), ruleContext()),
      ).toEqual([])
  })
})
