import type { TSESTree } from '@typescript-eslint/utils'

import { createRule } from '@/utils/create-rule.js'
import { getEnclosingComponent } from '@/utils/get-enclosing-component.js'
import { isComponentNode } from '@/utils/is-component-node.js'

type Options = []

type MessageIds = 'noReactHooks' | 'noInlineHandlers'

export default createRule<Options, MessageIds>({
  name: 'view-logic-separation',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforces strict separation of logic from views. React views (.tsx) must not contain state, lifecycle effects, or inline handler declarations. Move logic to a custom hook.',
    },
    schema: [],
    messages: {
      noReactHooks:
        'Strict View Separation: The hook "{{name}}" is forbidden in a view component. Extract your state/effects to a separate use{{componentName}} hook.',
      noInlineHandlers:
        'Strict View Separation: Inline function or handler declaration ({{name}}) inside a view component is forbidden. Return it from your custom hook instead.',
    },
  },
  defaultOptions: [],
  create(context) {
    const filename = context.filename

    // Only run this rule on .tsx files
    if (!filename.endsWith('.tsx')) {
      return {}
    }

    return {
      'FunctionDeclaration, ArrowFunctionExpression, FunctionExpression'(
        node:
          | TSESTree.FunctionDeclaration
          | TSESTree.ArrowFunctionExpression
          | TSESTree.FunctionExpression,
      ) {
        if (!isComponentNode(node)) {
          const component = getEnclosingComponent(node)
          if (
            component &&
            node.parent &&
            (node.parent.type === 'VariableDeclarator' ||
              node.type === 'FunctionDeclaration')
          ) {
            let name = 'anonymous function'
            if (node.type === 'FunctionDeclaration' && node.id?.name) {
              name = node.id.name
            } else if (
              node.parent.type === 'VariableDeclarator' &&
              node.parent.id.type === 'Identifier'
            ) {
              name = node.parent.id.name
            }

            context.report({
              node,
              messageId: 'noInlineHandlers',
              data: { name },
            })
          }
        }
      },

      CallExpression(node: TSESTree.CallExpression) {
        if (node.callee.type === 'Identifier') {
          const name = node.callee.name
          if (
            /^use(State|Effect|Reducer|Callback|Memo|Ref|ImperativeHandle|LayoutEffect|DebugValue|DeferredValue|Transition|Id|SyncExternalStore|InsertionEffect|Query|Mutation)$/.test(
              name,
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
})
