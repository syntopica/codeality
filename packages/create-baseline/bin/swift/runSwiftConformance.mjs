import { checkActionPins } from '../conformance/checkActionPins.mjs'
import { checkSwiftGateJob } from './checkSwiftGateJob.mjs'
import { checkSwiftPin } from './checkSwiftPin.mjs'
import { loadSwiftContext } from './loadSwiftContext.mjs'

const CHECKS = [checkSwiftGateJob, checkActionPins, checkSwiftPin]

/** Whether a Swift project's gate is wired: its job, pinned actions, current release. */
export async function runSwiftConformance(root, versions) {
  const context = await loadSwiftContext(root, versions)
  return { context, findings: CHECKS.flatMap((check) => check(context)) }
}
