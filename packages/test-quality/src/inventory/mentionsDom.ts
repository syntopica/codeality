import { DOM_API_PATTERN } from '@/model/DOM_API_PATTERN.js'

/** Whether a test's source names anything that may need a window. */
export const mentionsDom = (source: string): boolean =>
  DOM_API_PATTERN.test(source)
