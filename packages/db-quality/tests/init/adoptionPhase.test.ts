import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { configFromDocument } from '@/config/configFromDocument.js'
import { adoptionPhase } from '@/init/adoptionPhase.js'
import { renderAdoptionPhase } from '@/init/renderAdoptionPhase.js'

describe('adoptionPhase', () => {
  it('climbs the ladder with the files and the flag', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    expect(adoptionPhase(root, configFromDocument({ schemaVersion: 1 }))).toBe(
      0,
    )
    const v2 = configFromDocument({ schemaVersion: 2 })
    expect(adoptionPhase(root, v2)).toBe(1)
    writeFileSync(join(root, '.codeality-db-perf.json'), '{}')
    expect(adoptionPhase(root, v2)).toBe(2)
    writeFileSync(join(root, '.codeality-db-bench.json'), '{}')
    expect(adoptionPhase(root, v2)).toBe(3)
    expect(
      adoptionPhase(
        root,
        configFromDocument({ schemaVersion: 2, perf: { inGate: true } }),
      ),
    ).toBe(4)
  })
  it('renders the ladder with the current phase and the next step', () => {
    const text = renderAdoptionPhase({ phase: 1 })
    expect(text).toMatch(/^adoption phase 1 of 4/m)
    expect(text).toMatch(/next: codeality-db perf snapshot/)
    expect(
      renderAdoptionPhase({ phase: 1, next: 'codeality-db baseline update' }),
    ).toMatch(/next: codeality-db baseline update$/)
  })
})
