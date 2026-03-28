import type { Rule } from 'eslint'

/**
 * Determines whether a function node is a top-level component declaration.
 * Top-level means it is directly under Program, ExportNamedDeclaration,
 * ExportDefaultDeclaration, or assigned as a top-level VariableDeclarator.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isComponentNode(node: any): boolean {
  if (!node.parent) return false
  const isTopLevel =
    node.parent.type === 'Program' ||
    node.parent.type === 'ExportNamedDeclaration' ||
    node.parent.type === 'ExportDefaultDeclaration' ||
    (node.parent.type === 'VariableDeclarator' &&
      (node.parent.parent?.parent?.type === 'Program' ||
        node.parent.parent?.parent?.type === 'ExportNamedDeclaration'))
  return isTopLevel
}

/**
 * Walks up the AST to find the nearest enclosing top-level function component.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getEnclosingComponent(node: any): any {
  let curr = node.parent
  while (curr) {
    if (
      (curr.type === 'FunctionDeclaration' ||
        curr.type === 'ArrowFunctionExpression' ||
        curr.type === 'FunctionExpression') &&
      isComponentNode(curr)
    ) {
      return curr
    }
    curr = curr.parent
  }
  return null
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforces strict separation of logic from views. React views (.tsx) must not contain state, lifecycle effects, or inline handler declarations. Move logic to a custom hook.',
      recommended: true,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filename = context.filename || (context as any).physicalFilename || ''

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
              if (node.id && node.id.name) name = node.id.name
              else if (
                node.parent.type === 'VariableDeclarator' &&
                node.parent.id &&
                node.parent.id.name
              )
                name = node.parent.id.name

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
        if (node.callee && node.callee.type === 'Identifier') {
          const name = node.callee.name
          if (
            /^use(State|Effect|Reducer|Callback|Memo|Ref|ImperativeHandle|LayoutEffect|DebugValue|DeferredValue|Transition|Id|SyncExternalStore|InsertionEffect|Query|Mutation)$/.test(
              name
            )
          ) {
            const component = getEnclosingComponent(node)
            if (component) {
              const componentNameBase =
                filename.split('/').pop()?.replace('.tsx', '') || 'Component'
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
