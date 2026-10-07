import type { Lab } from '@/color/Lab.js'

/** Lab chroma: how far a colour sits from grey. */
export const chromaOf = ([, a, b]: Lab): number => Math.hypot(a, b)
