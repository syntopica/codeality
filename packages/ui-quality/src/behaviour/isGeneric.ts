import { GENERIC_SEGMENT } from '@/behaviour/GENERIC_SEGMENT.js'
import { GENERIC_TAIL } from '@/behaviour/GENERIC_TAIL.js'

/** Every segment left after dropping tails and fallbacks is a generic phrase. */
export const isGeneric = (message: string): boolean =>
  message !== '' &&
  message
    .toLowerCase()
    .split(/\s-\s|:\s|[.!?]+(?:\s|$)/)
    .map((segment) => segment.trim().replace(/[.!?]+$/, ''))
    .filter((segment) => segment !== '' && !GENERIC_TAIL.test(segment))
    .every((segment) => GENERIC_SEGMENT.test(segment))
