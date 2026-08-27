import { describe, expect, it } from 'vitest'

import { ACTION_PINS } from '../bin/scaffold/actionPins.mjs'
import { baselineScripts } from '../bin/scaffold/baselineScripts.mjs'
import { ciWorkflow } from '../bin/scaffold/ciWorkflow.mjs'
import { collectDeps } from '../bin/scaffold/collectDeps.mjs'
import { depCruiserConfig } from '../bin/scaffold/depCruiserConfig.mjs'
import { detectFramework } from '../bin/scaffold/detectFramework.mjs'
import { knipConfig } from '../bin/scaffold/knipConfig.mjs'
import { lefthookConfig } from '../bin/scaffold/lefthookConfig.mjs'
import { renovateConfig } from '../bin/scaffold/renovateConfig.mjs'

describe('detectFramework', () => {
  // Order matters: a Tauri app also carries vite and react, a Nuxt app also
  // carries vue. The most specific marker has to win or the wrong knip preset
  // is written.
  it.each([
    [{ '@tauri-apps/api': '^2', react: '^19', vite: '^7' }, 'tauri'],
    [{ nuxt: '^4', vue: '^3' }, 'nuxt'],
    [{ astro: '^5' }, 'astro'],
    [{ '@nestjs/core': '^11' }, 'nestjs'],
    [{ next: '^16', react: '^19' }, 'nextjs'],
    [{ '@tanstack/react-start': '^1', react: '^19' }, 'tanstack-start'],
    [{ vue: '^3' }, 'vite-vue'],
    [{ react: '^19' }, 'vite-react'],
    [{}, 'ts-package'],
  ])('reads %o as %s', (deps, expected) => {
    expect(detectFramework(deps)).toBe(expected)
  })
})

describe('collectDeps', () => {
  it('merges both dependency fields', () => {
    expect(
      collectDeps({ dependencies: { a: '1' }, devDependencies: { b: '2' } }),
    ).toEqual({
      a: '1',
      b: '2',
    })
  })

  it('handles a manifest that declares neither', () => {
    expect(collectDeps({})).toEqual({})
  })
})

describe('baselineScripts', () => {
  it('composes three entrypoints that between them reach every gate', () => {
    const scripts = baselineScripts()
    const all = [
      scripts['check:ci'],
      scripts['check:quality'],
      scripts['check:security'],
    ].join(' ')
    for (const gate of [
      'type-check',
      'lint',
      'format:check',
      'test',
      'dupes',
      'knip',
      'deps:graph',
      'type-coverage',
      'secrets:check',
      'audit:check',
    ]) {
      expect(all).toContain(gate)
    }
  })

  // A committed lefthook.yml is inert until `lefthook install` runs.
  it('wires prepare so the hooks reach .git/hooks', () => {
    expect(baselineScripts().prepare).toContain('lefthook install')
  })
})

describe('ciWorkflow', () => {
  it('runs all three entrypoints', () => {
    const yml = ciWorkflow()
    expect(yml).toContain('pnpm run check:ci')
    expect(yml).toContain('pnpm run check:quality')
    expect(yml).toContain('pnpm run check:security')
  })

  it('pins every action it uses to a commit SHA', () => {
    const yml = ciWorkflow({ hasBuild: true })
    const refs = [...yml.matchAll(/uses:\s*(\S+)/g)].map((m) => m[1])
    expect(refs.length).toBeGreaterThan(0)
    for (const ref of refs) expect(ref).toMatch(/@[0-9a-f]{40}$/)
  })

  it('omits the build job for a project with no build script', () => {
    expect(ciWorkflow({ hasBuild: false })).not.toContain('Production build')
    expect(ciWorkflow({ hasBuild: true })).toContain('Production build')
  })

  // gitleaks cannot see a secret committed three commits ago from a shallow
  // clone, which is the default.
  it('gives the secret scan a full clone', () => {
    expect(ciWorkflow()).toContain('fetch-depth: 0')
  })

  it('verifies the gitleaks download against its own checksum manifest', () => {
    expect(ciWorkflow()).toContain('sha256sum --ignore-missing -c')
  })

  it('honours a node version override', () => {
    expect(ciWorkflow({ node: 24 })).toContain('node-version: 24')
  })
})

describe('ACTION_PINS', () => {
  it('records the tag each SHA was resolved from', () => {
    for (const pin of Object.values(ACTION_PINS)) {
      expect(pin.uses).toMatch(/@[0-9a-f]{40}$/)
      expect(pin.tag).toMatch(/^v[\d.]+$/)
    }
  })
})

describe('static config renderers', () => {
  it('writes a knip config that defers to the shared preset', () => {
    expect(knipConfig('nextjs')).toContain("framework: 'nextjs'")
  })

  it('writes hooks that fail on warnings', () => {
    expect(lefthookConfig()).toContain('--max-warnings 0')
  })

  // A release-age cooldown is what gives a compromised package time to be
  // caught before a bot opens the PR that installs it.
  it('writes a renovate config with a cooldown', () => {
    expect(JSON.parse(renovateConfig()).minimumReleaseAge).toBe('3 days')
  })

  it('writes a dependency-cruiser config that resolves path aliases', () => {
    expect(depCruiserConfig()).toContain('tsConfigPath')
  })
})
