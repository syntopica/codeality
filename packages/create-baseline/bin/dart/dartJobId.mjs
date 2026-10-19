/**
 * The CI job id codeality-dart init gives a project: `dart-` plus its
 * repository-relative path with `/` and `_` turned into `-`.
 */
export function dartJobId(projectPath) {
  return projectPath === '' || projectPath === '.'
    ? 'dart'
    : `dart-${projectPath.replaceAll(/[/_]/g, '-')}`
}
