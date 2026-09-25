import { CONFIG_FILENAME } from '@/config/CONFIG_FILENAME.js'
import type { DbQualityConfig } from '@/config/DbQualityConfig.js'

/** One line for stderr when the file predates the strict mode; nothing under schemaVersion 2. */
export const legacyConfigNotice = (
  config: DbQualityConfig,
): string | undefined =>
  config.schemaVersion === 1
    ? `${CONFIG_FILENAME} is schemaVersion 1; "codeality-db init --apply" upgrades it to 2 and asks a reason for every disabled rule`
    : undefined
