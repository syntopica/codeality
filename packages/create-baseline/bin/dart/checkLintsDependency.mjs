import { lintsSection } from './lintsSection.mjs'

/**
 * codeality_lints belongs in `dev_dependencies`: under `dependencies` it
 * ships to every consumer of the package and still lints nothing extra.
 */
export function checkLintsDependency({ pubspec }) {
  const found = lintsSection(pubspec)
  if (!found) {
    return [
      {
        id: 'dart-lints',
        level: 'error',
        message: 'codeality_lints is not a dependency',
        detail: 'Run `codeality-dart init --apply`.',
      },
    ]
  }
  if (found.section === 'dev_dependencies') return []
  return [
    {
      id: 'dart-lints-not-dev-dependency',
      level: 'error',
      message: `codeality_lints is declared under ${found.section}`,
      detail: 'Move it to dev_dependencies.',
    },
  ]
}
