import { pinFinding } from '../estate/pinFinding.mjs'
import { lintsSection } from './lintsSection.mjs'

const CARET = /^\^?(\d+\.\d+\.\d+)$/
const ACTIVATE =
  /dart pub global activate (?:--source git\b|codeality_dart\s+(\S+))/

/**
 * Both pins must be the current pub.dev releases: the codeality_lints
 * constraint and the codeality_dart version the CI job activates. A git or
 * path source is reported as not released rather than parsed as semver.
 */
export function checkDartPins({ pubspec, codealityWorkflow, versions }) {
  const findings = []
  const lints = lintsSection(pubspec)
  if (lints && versions.codeality_lints) {
    const pinned = CARET.exec(lints.constraint)?.[1] ?? null
    findings.push(
      ...pinFinding(
        'dart',
        'codeality_lints',
        pinned,
        versions.codeality_lints,
      ),
    )
  }
  const activate = ACTIVATE.exec(codealityWorkflow ?? '')
  if (activate && versions.codeality_dart) {
    findings.push(
      ...pinFinding(
        'dart',
        'codeality_dart',
        activate[1] ?? null,
        versions.codeality_dart,
      ),
    )
  }
  return findings
}
