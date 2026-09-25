import { PLATFORM_NOISE } from '@/perf/PLATFORM_NOISE.js'

export const isPlatformNoise = (text: string, ignore: string[]): boolean =>
  PLATFORM_NOISE.some((pattern) => pattern.test(text)) ||
  ignore.some((pattern) =>
    // eslint-disable-next-line security/detect-non-literal-regexp -- perf.ignore is the project's own configuration
    new RegExp(pattern).test(text),
  )
