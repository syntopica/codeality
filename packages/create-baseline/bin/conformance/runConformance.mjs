import { checkActionPins } from './checkActionPins.mjs'
import { checkCiWorkflow } from './checkCiWorkflow.mjs'
import { checkCoverageThresholds } from './checkCoverageThresholds.mjs'
import { checkGateCoverage } from './checkGateCoverage.mjs'
import { checkHooksInstalled } from './checkHooksInstalled.mjs'
import { checkLintFlag } from './checkLintFlag.mjs'
import { checkTsconfigPresets } from './checkTsconfigPresets.mjs'
import { checkTsconfigProjects } from './checkTsconfigProjects.mjs'
import { checkVersionRanges } from './checkVersionRanges.mjs'
import { loadContext } from './loadContext.mjs'
import { loadExceptions } from './loadExceptions.mjs'

const CHECKS = [
  checkLintFlag,
  checkGateCoverage,
  checkTsconfigProjects,
  checkTsconfigPresets,
  checkCiWorkflow,
  checkActionPins,
  checkCoverageThresholds,
  checkHooksInstalled,
  checkVersionRanges,
]

/**
 * Whether a repository's baseline gates are wired, not merely installed.
 *
 * The distinction is the reason this exists. `--check` used to assert that
 * four packages appeared in package.json, which it did happily for a
 * repository with no CI, a `lint` script that ignored warnings, and a
 * `check:ci` that skipped knip, jscpd, dependency-cruiser and type-coverage.
 * Adoption was measured by presence, so drift in enforcement was invisible by
 * construction, and every finding in the estate sweep traced back to it.
 *
 * Returns `{ findings, waived, context }`. Findings are ordered as declared
 * above: the wiring failures that make other gates unreachable come first.
 */
export async function runConformance(root, versions, today) {
  const context = await loadContext(root, versions)
  const exceptions = await loadExceptions(root, today)

  const raw = CHECKS.flatMap((check) => check(context))
  const findings = []
  const waived = []

  for (const finding of raw) {
    const waiver = exceptions.waived.get(finding.id)
    if (waiver) waived.push({ ...finding, waiver })
    else findings.push(finding)
  }

  return {
    context,
    waived,
    findings: [...exceptions.findings, ...findings],
  }
}
