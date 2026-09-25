import type { ManagedFile } from '@/init/ManagedFile.js'

export const renderInitPlan = (plan: ManagedFile[]): string =>
  plan
    .map(
      (file) => `${file.disposition.padEnd(9)}  ${file.path}  ${file.detail}`,
    )
    .join('\n')
