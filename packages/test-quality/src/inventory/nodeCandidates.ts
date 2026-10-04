import { effectiveEnvironment } from '@/inventory/effectiveEnvironment.js'
import { mentionsDom } from '@/inventory/mentionsDom.js'
import { DOM_ENVIRONMENTS } from '@/model/DOM_ENVIRONMENTS.js'
import type { NodeCandidates } from '@/model/NodeCandidates.js'
import type { TestFile } from '@/model/TestFile.js'

/** Splits the files that run under a DOM into those that name one and the rest. */
export const nodeCandidates = (
  files: TestFile[],
  readSource: (file: string) => string,
): NodeCandidates => {
  const candidates: string[] = []
  let domFileCount = 0
  for (const { file, environment } of files) {
    const source = readSource(file)
    if (!DOM_ENVIRONMENTS.includes(effectiveEnvironment(source, environment))) {
      continue
    }
    domFileCount += 1
    if (!mentionsDom(source)) candidates.push(file)
  }
  return { candidates: [...new Set(candidates)], domFileCount }
}
