import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { beforeEach, describe, expect, it } from 'vitest'

import { findConsumers } from '../bin/estate/findConsumers.mjs'
import { formatEstate } from '../bin/estate/formatEstate.mjs'

let root

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'baseline-estate-'))
})

const repo = async (name, manifest) => {
  await mkdir(join(root, name), { recursive: true })
  await writeFile(join(root, name, 'package.json'), JSON.stringify(manifest))
}

describe('findConsumers', () => {
  it('finds the directories that depend on a baseline package', async () => {
    await repo('adopter', {
      devDependencies: { '@busirocket/tsconfig': '^0.2.1' },
    })
    await repo('unrelated', { dependencies: { react: '^19' } })
    const found = await findConsumers(root)
    expect(found.map((c) => c.name)).toEqual(['adopter'])
  })

  it('sorts by name so two runs of the report are diffable', async () => {
    await repo('zeta', {
      dependencies: { '@busirocket/prettier-config': '^0.2.0' },
    })
    await repo('alpha', {
      dependencies: { '@busirocket/prettier-config': '^0.2.0' },
    })
    expect((await findConsumers(root)).map((c) => c.name)).toEqual([
      'alpha',
      'zeta',
    ])
  })

  it('skips directories with no manifest and dotfiles', async () => {
    await mkdir(join(root, 'notaproject'), { recursive: true })
    await repo('.hidden', {
      dependencies: { '@busirocket/tsconfig': '^0.2.1' },
    })
    expect(await findConsumers(root)).toEqual([])
  })

  it('returns nothing for a directory that does not exist', async () => {
    expect(await findConsumers(join(root, 'missing'))).toEqual([])
  })
})

describe('formatEstate', () => {
  const row = (name, ids) => ({
    name,
    findings: ids.map((id) => ({ id, level: 'error' })),
  })

  it('marks a clean repository ok across every column', () => {
    const out = formatEstate([row('clean', [])])
    expect(out).not.toContain('FAIL')
    expect(out).toContain('1 consumers, 1 fully wired.')
  })

  it('marks the column a finding belongs to', () => {
    const out = formatEstate([row('x', ['ci-workflow'])])
    expect(out).toContain('FAIL')
    expect(out).toContain('0 fully wired')
  })

  // A repository with no check:* entrypoint reports `check-entrypoints`
  // instead of ten `gate:` findings; without that in the column, having none
  // of the wiring would read as having all of it.
  it('counts a missing entrypoint as a gate failure', () => {
    expect(formatEstate([row('x', ['check-entrypoints'])])).toContain('FAIL')
  })

  // An informational finding is a note, not a gap: colouring it would make
  // the estate look worse than it is.
  it('ignores informational findings', () => {
    const rows = [{ name: 'x', findings: [{ id: 'lint-flag', level: 'info' }] }]
    const out = formatEstate(rows)
    expect(out).not.toContain('FAIL')
    expect(out).toContain('1 fully wired')
  })

  // The report is most useful precisely when part of the estate is broken.
  it('prints the error for a repository it could not read', () => {
    const out = formatEstate([
      { name: 'broken', error: 'Unexpected end of JSON' },
    ])
    expect(out).toContain('Unexpected end of JSON')
    expect(out).toContain('0 fully wired')
  })
})
