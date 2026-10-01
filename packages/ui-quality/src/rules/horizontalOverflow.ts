import type { Rule } from '@/rules/Rule.js'

export const horizontalOverflow: Rule = (snapshot) =>
  snapshot.documentWidth > snapshot.viewportWidth + 1
    ? [
        {
          rule: 'horizontal-overflow',
          severity: 'error',
          message: `the page is ${String(snapshot.documentWidth)}px wide in a ${String(snapshot.viewportWidth)}px viewport and scrolls sideways`,
          subject: 'html',
          identity: 'document',
        },
      ]
    : []
