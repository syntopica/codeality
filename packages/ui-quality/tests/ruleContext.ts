import { RULE_DEFAULTS } from '@/config/RULE_DEFAULTS.js'
import type { RuleContext } from '@/rules/RuleContext.js'

export const ruleContext = (
  overrides: Partial<RuleContext> = {},
): RuleContext => ({
  options: RULE_DEFAULTS,
  route: {
    path: '/inbox',
    main: 'main',
    waitFor: null,
    localStorage: {},
    click: [],
    scroll: null,
    hover: null,
    focus: null,
  },
  palette: null,
  ...overrides,
})
