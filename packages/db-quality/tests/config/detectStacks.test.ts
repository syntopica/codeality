import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { detectStacks } from '@/config/detectStacks.js'

describe('detectStacks', () => {
  it('detects every stack it knows', () => {
    const root = mkdtempSync(join(tmpdir(), 'dbq-'))
    mkdirSync(join(root, 'supabase/migrations'), { recursive: true })
    mkdirSync(join(root, 'prisma'))
    writeFileSync(join(root, 'prisma/schema.prisma'), '')
    writeFileSync(join(root, 'drizzle.config.ts'), '')
    mkdirSync(join(root, 'src'))
    mkdirSync(join(root, 'data'))
    writeFileSync(join(root, 'data/app.db'), '')
    mkdirSync(join(root, 'node_modules/x'), { recursive: true })
    writeFileSync(join(root, 'node_modules/x/ignored.db'), '')
    mkdirSync(join(root, '.pnpm-store/v11'), { recursive: true })
    writeFileSync(join(root, '.pnpm-store/v11/index.db'), '')
    mkdirSync(join(root, 'deep/er/still'), { recursive: true })
    writeFileSync(join(root, 'deep/er/still/too-deep.db'), '')
    expect(detectStacks(root)).toEqual({
      supabase: { migrations: 'supabase/migrations' },
      prisma: { schema: 'prisma/schema.prisma' },
      drizzle: { roots: ['src'], objectNames: ['db', 'tx'] },
      sqlite: { files: ['data/app.db'] },
    })
  })
  it('returns nothing for an empty directory', () => {
    expect(detectStacks(mkdtempSync(join(tmpdir(), 'dbq-')))).toEqual({})
  })
})
