/**
 * Every project tsconfig must extend an `@syntopica/tsconfig` preset.
 *
 * A repository can carry the dependency, pass every other column, and still
 * not be on the baseline: in consumer-g only `tsconfig.app.json` extended a
 * preset, while `tsconfig.node.json` and `tsconfig.next.json` were
 * hand-written and weaker than `base.json` - no `noUncheckedIndexedAccess`,
 * no `exactOptionalPropertyTypes`, no `noImplicitOverride`, `allowJs` on the
 * Next one. Nothing reported it, because nothing looked.
 *
 * The two root shapes are judged differently, and conflating them is the trap
 * this check must not fall into. A single-project root extends a preset
 * directly. A solution-style root must NOT: it stays
 * `{"files": [], "references": [...]}` and the presets go on the leaves,
 * because `baseline-type-coverage` walks a solution root's references to find
 * the projects - a root that extends instead of referencing hands the runner
 * one project and hides the rest.
 *
 * Only judged when the repository depends on `@syntopica/tsconfig`;
 * `checkVersionRanges` owns the case of the package missing entirely. A leaf
 * that failed to parse is skipped rather than judged - `checkTsconfigProjects`
 * and `tsc` itself surface an unreadable reference.
 */
export function checkTsconfigPresets({ tsconfigs, deps }) {
  if (!tsconfigs || !deps['@syntopica/tsconfig']) return []

  if (!tsconfigs.solution) {
    return extendsPreset(tsconfigs.root) ? [] : [finding('tsconfig.json')]
  }

  return tsconfigs.leaves
    .filter((leaf) => leaf.parsed && !extendsPreset(leaf.parsed))
    .map((leaf) => finding(leaf.config))
}

// `extends` is a string, or an array since TypeScript 5.0.
function extendsPreset(parsed) {
  const bases = Array.isArray(parsed.extends)
    ? parsed.extends
    : [parsed.extends]
  return bases.some(
    (base) =>
      typeof base === 'string' && base.startsWith('@syntopica/tsconfig'),
  )
}

function finding(config) {
  return {
    id: `tsconfig-preset:${config}`,
    level: 'error',
    message: `\`${config}\` does not extend an \`@syntopica/tsconfig\` preset`,
    detail:
      'A hand-written tsconfig drifts below the baseline silently. Extend ' +
      'the matching preset in this file; in a multi-project repository the ' +
      'presets go on the leaves and the solution root stays ' +
      '`{"files": [], "references": [...]}`.',
  }
}
