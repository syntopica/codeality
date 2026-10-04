import { ENVIRONMENT_DOCBLOCK } from '@/model/ENVIRONMENT_DOCBLOCK.js'

/** The environment a file runs in: its own docblock wins over its project's. */
export const effectiveEnvironment = (
  source: string,
  projectEnvironment: string,
): string => ENVIRONMENT_DOCBLOCK.exec(source)?.[1] ?? projectEnvironment
