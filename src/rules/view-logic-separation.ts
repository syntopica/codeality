import type { Rule } from 'eslint'

import { isComponentNode } from '../utils/isComponentNode.js'
import { getEnclosingComponent } from '../utils/getEnclosingComponent.js'
import { DOCS_BASE_URL } from '../utils/docsBaseUrl.js'

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforces strict separation of logic from views. React views (.tsx) must not contain state, lifecycle effects, or inline handler declarations. Move logic to a custom hook.',
      recommended: true,
      url: `${DOCS_BASE_URL}/view-logic-separation.md`,
    },
    fixable: undefined,
    schema: [],
    messages: {
      noReactHooks:
        'Strict View Separation: The hook "{{name}}" is forbidden in a view component. Extract your state/effects to a separate use{{componentName}} hook.',
      noInlineHandlers:
        'Strict View Separation: Inline function or handler declaration ({{name}}) inside a view component is forbidden. Return it from your custom hook instead.',
    },
  },
  create(context) {
    const filename = context.filename

    // Only run this rule on .tsx files
    if (!filename.endsWith('.tsx')) {
      return {}
    }

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'FunctionDeclaration, ArrowFunctionExpression, FunctionExpression'(node: any) {
        if (!isComponentNode(node)) {
          const component = getEnclosingComponent(node)
          if (component) {
            if (
              node.parent &&
              (node.parent.type === 'VariableDeclarator' || node.type === 'FunctionDeclaration')
            ) {
              let name = 'anonymous function'
              if (node.id?.name) name = node.id.name
              else if (node.parent.type === 'VariableDeclarator' && node.parent.id?.name) {
                name = node.parent.id.name
              }

              context.report({
                node,
                messageId: 'noInlineHandlers',
                data: { name },
              })
            }
          }
        }
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      CallExpression(node: any) {
        if (node.callee?.type === 'Identifier') {
          const name = node.callee.name
          if (
            /^use(State|Effect|Reducer|Callback|Memo|Ref|ImperativeHandle|LayoutEffect|DebugValue|DeferredValue|Transition|Id|SyncExternalStore|InsertionEffect|Query|Mutation)$/.test(
              name
            )
          ) {
            const component = getEnclosingComponent(node)
            if (component) {
              const componentNameBase =
                filename.split('/').pop()?.replace('.tsx', '') ?? 'Component'
              context.report({
                node,
                messageId: 'noReactHooks',
                data: { name, componentName: componentNameBase },
              })
            }
          }
        }
      },
    }
  },
} as Rule.RuleModule
