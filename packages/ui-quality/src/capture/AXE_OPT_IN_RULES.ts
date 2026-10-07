/**
 * Rules axe-core ships disabled that the audit turns on. `target-size` is
 * WCAG 2.2 AA (2.5.8): a control under 24px with a neighbour too close to
 * tap it alone, which a default `AxeBuilder` run never reports.
 */
export const AXE_OPT_IN_RULES = { 'target-size': { enabled: true } }
