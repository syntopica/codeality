import { checkActionPins } from '../conformance/checkActionPins.mjs'
import { checkGoGateJob } from './checkGoGateJob.mjs'
import { checkGoPin } from './checkGoPin.mjs'
import { loadGoContext } from './loadGoContext.mjs'

const CHECKS = [checkGoGateJob, checkActionPins, checkGoPin]

/** Whether a Go module's gate is wired: its job, pinned actions, current release. */
export async function runGoConformance(root, versions) {
  const context = await loadGoContext(root, versions)
  return { context, findings: CHECKS.flatMap((check) => check(context)) }
}
