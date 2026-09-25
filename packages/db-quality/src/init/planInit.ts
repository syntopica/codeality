import type { ManagedFile } from '@/init/ManagedFile.js'
import { planConfigFile } from '@/init/planConfigFile.js'
import { planPackageScript } from '@/init/planPackageScript.js'
import { planWorkflow } from '@/init/planWorkflow.js'

export const planInit = (root: string, force: boolean): ManagedFile[] => [
  planConfigFile(root, force),
  planPackageScript(root, force),
  planWorkflow(root, force),
]
