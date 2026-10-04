import { describe, expect, it } from 'vitest'

import { nodeCandidates } from '@/inventory/nodeCandidates.js'

const SOURCES: Record<string, string> = {
  '/r/pure.test.ts': 'expect(add(1, 2)).toBe(3)',
  '/r/hook.test.ts': 'renderHook(() => useThing())',
  '/r/storage.test.ts': 'window.localStorage.clear()',
  '/r/opted.test.ts': '// @vitest-environment node\nexpect(1).toBe(1)',
  '/r/server.test.ts': 'expect(1).toBe(1)',
}

describe('nodeCandidates', () => {
  it('proposes DOM-environment files that name no DOM API', () => {
    const result = nodeCandidates(
      [
        { file: '/r/pure.test.ts', project: 'all', environment: 'jsdom' },
        { file: '/r/hook.test.ts', project: 'all', environment: 'jsdom' },
        { file: '/r/storage.test.ts', project: 'all', environment: 'jsdom' },
        { file: '/r/opted.test.ts', project: 'all', environment: 'jsdom' },
        { file: '/r/server.test.ts', project: 'node', environment: 'node' },
      ],
      (file) => SOURCES[file] ?? '',
    )
    // opted.test.ts already runs on node through its docblock, and the node
    // project's file is not a DOM file at all.
    expect(result).toEqual({ candidates: ['/r/pure.test.ts'], domFileCount: 3 })
  })
})
