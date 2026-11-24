import { CAMEL_CASE_TEXT } from '@/behaviour/CAMEL_CASE_TEXT.js'
import { UUID_TEXT } from '@/behaviour/UUID_TEXT.js'

/** Whether the message holds a UUID or camelCase identifier the page did not already show. */
export const unseenMachineIdIn = (
  message: string,
  before: string[],
): boolean => {
  const page = before.join('\n')
  return [
    ...message.matchAll(UUID_TEXT),
    ...message.matchAll(CAMEL_CASE_TEXT),
  ].some(([id]) => !page.includes(id))
}
