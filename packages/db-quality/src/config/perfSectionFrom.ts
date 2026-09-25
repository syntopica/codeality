import { ConfigError } from '@/config/ConfigError.js'
import { expectConfig } from '@/config/expectConfig.js'
import { isPositiveInteger } from '@/config/isPositiveInteger.js'
import { isStringList } from '@/config/isStringList.js'
import { PERF_DEFAULTS } from '@/config/PERF_DEFAULTS.js'
import type { PerfConfig } from '@/config/PerfConfig.js'
import { ROLE_NAME_PATTERN } from '@/config/ROLE_NAME_PATTERN.js'

export const perfSectionFrom = (
  raw: Record<string, unknown> | undefined,
): PerfConfig => {
  const merged: Record<string, unknown> = { ...PERF_DEFAULTS, ...raw }
  for (const key of [
    'slowMs',
    'regressionPercent',
    'minCalls',
    'seqScanRows',
    'benchRuns',
    'benchTimeoutMs',
  ])
    expectConfig(
      typeof merged[key] === 'number',
      `perf.${key} must be a number`,
    )
  for (const key of ['minCalls', 'benchRuns', 'benchTimeoutMs'])
    expectConfig(
      isPositiveInteger(merged[key]),
      `perf.${key} must be a positive integer`,
    )
  expectConfig(
    typeof merged['inGate'] === 'boolean',
    'perf.inGate must be a boolean',
  )
  expectConfig(
    typeof merged['benchDir'] === 'string',
    'perf.benchDir must be a string',
  )
  expectConfig(
    isStringList(merged['roles']),
    'perf.roles must be a list of strings',
  )
  expectConfig(
    isStringList(merged['ignore']),
    'perf.ignore must be a list of strings',
  )
  const roles = merged['roles'] as string[]
  expectConfig(roles.length > 0, 'perf.roles must name at least one role')
  const bad = roles.find((role) => !ROLE_NAME_PATTERN.test(role))
  if (bad !== undefined)
    throw new ConfigError(
      `perf.roles entries must match ${ROLE_NAME_PATTERN.source}: "${bad}"`,
    )
  return merged as PerfConfig
}
