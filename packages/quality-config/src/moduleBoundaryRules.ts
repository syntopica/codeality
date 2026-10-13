import type { IForbiddenRuleType } from 'dependency-cruiser'

/**
 * One rule per module root (`src/features`, say): a file in one module may
 * import another module only through that module's `index`. Matched on the
 * resolved path, so an alias, a re-export or a relative `../` all count, which
 * the ESLint import rules cannot see from the specifier string alone.
 */
export const moduleBoundaryRules = (roots: string[]): IForbiddenRuleType[] =>
  roots.map((root) => {
    const prefix = `^${root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/`
    return {
      name: 'no-deep-cross-module-import',
      severity: 'error',
      comment: `Import another module under ${root}/ through its index, not its internal files.`,
      from: { path: `${prefix}([^/]+)/` },
      to: {
        path: `${prefix}[^/]+/`,
        pathNot: [`${prefix}$1/`, `${prefix}[^/]+/index\\.[cm]?[jt]sx?$`],
      },
    }
  })
