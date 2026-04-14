import type { Rule } from 'eslint'

import { DOCS_BASE_URL } from '@/utils/docs-base-url.js'

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce that atomic units are placed within their corresponding feature-local semantic folders.',
      recommended: true,
      url: `${DOCS_BASE_URL}/file-kind-placement.md`,
    },
    fixable: undefined,
    schema: [],
    messages: {
      invalidPlacement:
        'The file "{{basename}}" appears to be a {{kind}}, but it is not located in a "{{expectedFolder}}/" folder. Please respect placement boundaries.',
      invalidGenericFolder:
        'Generic grouping folders like "utils" or "helpers" are forbidden. Use semantic folders (e.g., formatters, validators, mappers, extractors).',
    },
  },
  create(context) {
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

    // Check for banned generic folders
    if (parentFolder === 'utils' || parentFolder === 'helpers') {
      return {
        Program(node) {
          context.report({
            node,
            messageId: 'invalidGenericFolder',
          })
        },
      }
    }

    let kind = ''
    let expectedFolder = ''

    if (basename.startsWith('use')) {
      kind = 'React hook'
      expectedFolder = 'hooks'
    } else if (basename.startsWith('format') || basename.endsWith('Formatter.ts')) {
      kind = 'formatter'
      expectedFolder = 'formatters'
    } else if (basename.startsWith('validate') || basename.endsWith('Validator.ts')) {
      kind = 'validator'
      expectedFolder = 'validators'
    } else if (
      basename.startsWith('map') ||
      basename.endsWith('Mapper.ts') ||
      basename.endsWith('Transformer.ts')
    ) {
      kind = 'mapper'
      expectedFolder = 'mappers'
    } else if (basename.startsWith('select') || basename.endsWith('Selector.ts')) {
      kind = 'selector'
      expectedFolder = 'selectors'
    }

    if (kind && expectedFolder && parentFolder !== expectedFolder) {
      return {
        Program(node) {
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
} as Rule.RuleModule
