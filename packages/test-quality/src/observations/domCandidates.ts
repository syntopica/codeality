import { DOM_ENVIRONMENTS } from '@/model/DOM_ENVIRONMENTS.js'
import type { Observation } from '@/model/Observation.js'

/**
 * Files that build a DOM environment yet name nothing that needs one: the
 * candidates for node. Building a window per file was 61-72% of one suite's
 * time while two thirds of its files never touched it (verticagtm,
 * 2026-10-04). A source scan is a guess, so `check` only reports it; the
 * finding comes from `measure --node-candidates`, once a node run has
 * confirmed which candidates pass.
 */
export const domCandidates = (
  candidates: string[],
  domFileCount: number,
): Observation[] => {
  if (candidates.length === 0) return []
  return [
    {
      name: 'dom-environment-candidates',
      message: `${String(candidates.length)} of ${String(domFileCount)} files run under ${DOM_ENVIRONMENTS.join('/')} but name no DOM API; run \`codeality-test measure --node-candidates\` to confirm which pass under node`,
      evidence: candidates,
    },
  ]
}
