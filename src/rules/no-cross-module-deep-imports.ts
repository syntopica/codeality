import type { Rule } from 'eslint'

import { DOCS_BASE_URL } from '../utils/docsBaseUrl.js'

/**
 * no-cross-module-deep-imports
 *
 * Prevents modules within a monorepo from bypassing each other's public API.
 * A "deep import" is any relative import that traverses up two or more directory
 * levels and then descends into another module's internal directory.
 *
 * Example monorepo:
 *   packages/core/src/utils/helper.ts
 *   packages/ui/src/Button.tsx
 *
 * ❌ Wrong (from Button.tsx):
 *   import { helper } from '../../core/src/utils/helper'
 *
 * ✅ Correct:
 *   import { helper } from '@myorg/core'   // through published public API
 *
 * The rule detects the pattern by looking for relative imports that:
 *   1. Go up at least `minParentTraversals` levels (default: 2)
 *   2. Then descend into a directory matching one of `internalDirs` (default: ['src'])
 *
 * Options (object):
 *   - minParentTraversals: number (default 2) — how many `../` levels must be
 *     present before we start looking for an internal dir descent.
 *   - internalDirs: string[] (default ['src']) — directory names that signal
 *     internal code that should be accessed only via the public API.
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Forbid relative imports that bypass the public API of another module within the monorepo by importing directly from its internal directories.',
      recommended: true,
      url: `${DOCS_BASE_URL}/no-cross-module-deep-imports.md`,
    },
    fixable: undefined,
    schema: [
      {
        type: 'object',
        properties: {
          minParentTraversals: { type: 'number' },
          internalDirs: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      deepImport:
        'Cross-module deep import "{{importPath}}" bypasses the module\'s public API. Import from the module root (index) instead.',
    },
  },
  create(context) {
    const opts = (context.options[0] ?? {}) as {
      minParentTraversals?: number
      internalDirs?: string[]
    }
    const minParentTraversals: number = opts.minParentTraversals ?? 2
    const internalDirs: string[] = opts.internalDirs ?? ['src']

    return {
      ImportDeclaration(node) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const importPath = (node.source as any).value as string

        if (typeof importPath !== 'string') return
        if (!importPath.startsWith('.')) return // ignore absolute/alias imports

        // Count leading `../` segments
        const parts = importPath.split('/')
        let parentCount = 0
        for (const part of parts) {
          if (part === '..') parentCount++
          else break
        }

        if (parentCount < minParentTraversals) return

        // Check if any of the non-`..` segments is an internal dir
        const descendantParts = parts.slice(parentCount)
        const hasInternalSegment = descendantParts.some((p) => internalDirs.includes(p))

        if (hasInternalSegment) {
          context.report({
            node,
            messageId: 'deepImport',
            data: { importPath },
          })
        }
      },
    }
  },
} as Rule.RuleModule
