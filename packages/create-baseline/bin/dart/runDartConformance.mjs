import { checkActionPins } from '../conformance/checkActionPins.mjs'
import { checkDartPins } from './checkDartPins.mjs'
import { checkGateJobs } from './checkGateJobs.mjs'
import { checkLintsDependency } from './checkLintsDependency.mjs'
import { loadDartContext } from './loadDartContext.mjs'

const CHECKS = [
  checkLintsDependency,
  checkGateJobs,
  checkActionPins,
  checkDartPins,
]

/**
 * Whether a Dart project's gate is wired, not merely installed: the lints
 * as a dev dependency, its job in the root codeality.yml, pinned actions
 * and current releases. Shared checks keep their ids (`action-pin:*`).
 */
export async function runDartConformance(root, versions) {
  const context = await loadDartContext(root, versions)
  return { context, findings: CHECKS.flatMap((check) => check(context)) }
}
