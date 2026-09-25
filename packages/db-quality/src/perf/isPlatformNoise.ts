import { PLATFORM_NOISE } from '@/perf/PLATFORM_NOISE.js'

/** Built-in noise by pattern; `perf.ignore` entries are plain substrings of the normalized text. */
export const isPlatformNoise = (text: string, ignore: string[]): boolean =>
  PLATFORM_NOISE.some((pattern) => pattern.test(text)) ||
  ignore.some((fragment) => text.includes(fragment))
