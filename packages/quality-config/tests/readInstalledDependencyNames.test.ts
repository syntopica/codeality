import { rmSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { readInstalledDependencyNames } from '../src/readInstalledDependencyNames'
import { createCruiseFixture } from './createCruiseFixture'

describe('installed runtime dependency metadata', () => {
  it.each([
    { manifest: '{invalid', expected: [] },
    { manifest: '{"dependencies":["eslint-config-prettier"]}', expected: [] },
    {
      manifest: '{"dependencies":{"eslint-config-prettier":""}}',
      expected: [],
    },
    {
      manifest: '{"dependencies":{"eslint-config-prettier":"   "}}',
      expected: [],
    },
    {
      manifest:
        '{"devDependencies":{"eslint-config-prettier":"^10"},"peerDependencies":{"eslint-config-prettier":">=9"}}',
      expected: [],
    },
    {
      manifest:
        '{"dependencies":{"eslint-config-prettier":"^10","invalid":false}}',
      expected: ['eslint-config-prettier'],
    },
  ])(
    'reads only valid runtime declarations from $manifest',
    ({ manifest, expected }) => {
      const root = createCruiseFixture({
        'node_modules/@syntopica/eslint-config/package.json': manifest,
      })
      try {
        expect(
          readInstalledDependencyNames(root, '@syntopica/eslint-config'),
        ).toEqual(expected)
      } finally {
        rmSync(root, { recursive: true, force: true })
      }
    },
  )

  it('preserves unknown-metadata fallback when the manifest is absent', () => {
    const root = createCruiseFixture({})
    try {
      expect(
        readInstalledDependencyNames(root, '@syntopica/eslint-config'),
      ).toEqual([])
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
