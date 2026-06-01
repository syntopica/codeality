import type { TSESTree } from '@typescript-eslint/utils'

import { createRule } from '@/utils/create-rule.js'
import { startsWithCamelPrefix } from '@/utils/starts-with-camel-prefix.js'
import { stripFolderPrivacyPrefix } from '@/utils/strip-folder-privacy-prefix.js'

type Options = [
  {
    allowGenericFolders?: boolean
  }?,
]

type MessageIds = 'invalidPlacement' | 'invalidGenericFolder'

export default createRule<Options, MessageIds>({
  name: 'file-kind-placement',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce that atomic units are placed within their corresponding feature-local semantic folders.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          // Allow `utils/` and `helpers/` (at any depth) as homes for pure
          // helpers. Files under such a folder are then exempt from placement
          // checks. Off by default to keep the strict semantic-folder policy.
          allowGenericFolders: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      invalidPlacement:
        'The file "{{basename}}" appears to be a {{kind}}, but it is not located in a "{{expectedFolder}}/" folder. Please respect placement boundaries.',
      invalidGenericFolder:
        'Generic grouping folders like "utils" or "helpers" are forbidden. Use semantic folders (e.g., formatters, validators, mappers, extractors), or enable the "allowGenericFolders" option.',
    },
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const allowGenericFolders = options?.allowGenericFolders ?? false
    const filename = context.filename || context.physicalFilename || ''

    if (
      filename.endsWith('.config.ts') ||
      filename.endsWith('.config.js') ||
      filename.endsWith('.config.mjs') ||
      filename.endsWith('.config.cjs') ||
      filename.endsWith('.d.ts')
    ) {
      return {}
    }

    const normalizedFilename = filename.replaceAll('\\', '/')
    const pathParts = normalizedFilename.split('/')
    if (pathParts.length < 2) return {}

    const basename = pathParts[pathParts.length - 1] ?? ''
    const parentFolder = pathParts[pathParts.length - 2] ?? ''
    // Folder matching is Next.js `_`-private aware: `_hooks` matches `hooks`.
    const normalizedDirs = pathParts.slice(0, -1).map(stripFolderPrivacyPrefix)
    const normalizedParent = stripFolderPrivacyPrefix(parentFolder)

    // When generic folders are allowed, any file under a `utils/`/`helpers/`
    // ancestor is an accepted pure helper, exempt from placement checks.
    if (
      allowGenericFolders &&
      (normalizedDirs.includes('utils') || normalizedDirs.includes('helpers'))
    ) {
      return {}
    }

    // Otherwise, generic grouping folders are banned outright.
    if (normalizedParent === 'utils' || normalizedParent === 'helpers') {
      return {
        Program(node: TSESTree.Program) {
          context.report({
            node,
            messageId: 'invalidGenericFolder',
          })
        },
      }
    }

    let kind = ''
    let expectedFolder = ''

    if (startsWithCamelPrefix(basename, 'use')) {
      kind = 'hook or composable'
      expectedFolder = 'hooks'
    } else if (
      startsWithCamelPrefix(basename, 'format') ||
      basename.endsWith('Formatter.ts')
    ) {
      kind = 'formatter'
      expectedFolder = 'formatters'
    } else if (
      startsWithCamelPrefix(basename, 'validate') ||
      basename.endsWith('Validator.ts')
    ) {
      kind = 'validator'
      expectedFolder = 'validators'
    } else if (
      startsWithCamelPrefix(basename, 'map') ||
      basename.endsWith('Mapper.ts') ||
      basename.endsWith('Transformer.ts')
    ) {
      kind = 'mapper'
      expectedFolder = 'mappers'
    } else if (
      startsWithCamelPrefix(basename, 'select') ||
      basename.endsWith('Selector.ts')
    ) {
      kind = 'selector'
      expectedFolder = 'selectors'
    }

    // `use*` units may live in any framework-appropriate folder: React hooks
    // (hooks/), Vue composables (composables/), or stores (stores/, store/).
    const acceptedFolders = startsWithCamelPrefix(basename, 'use')
      ? ['hooks', 'composables', 'stores', 'store']
      : [expectedFolder]

    if (
      kind &&
      expectedFolder &&
      !acceptedFolders.some((folder) => normalizedDirs.includes(folder))
    ) {
      return {
        Program(node: TSESTree.Program) {
          context.report({
            node,
            messageId: 'invalidPlacement',
            data: { basename, kind, expectedFolder },
          })
        },
      }
    }

    return {}
  },
})
