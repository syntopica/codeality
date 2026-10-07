import { isSupabaseProject } from '@/config/isSupabaseProject.js'
import type { ManagedFile } from '@/init/ManagedFile.js'
import { planBenchReadme } from '@/init/planBenchReadme.js'
import { planConfigFile } from '@/init/planConfigFile.js'
import { planPackageScript } from '@/init/planPackageScript.js'
import { planWorkflow } from '@/init/planWorkflow.js'

// The shipped workflow passes the Supabase access token and database password
// to the gate; a project that is not a Supabase one gets no workflow from
// init, and `init --check` does not ask for one.
export const planInit = (root: string, force: boolean): ManagedFile[] => [
  planConfigFile(root, force),
  planPackageScript(root, force),
  ...(isSupabaseProject(root) ? [planWorkflow(root, force)] : []),
  planBenchReadme(root),
]
