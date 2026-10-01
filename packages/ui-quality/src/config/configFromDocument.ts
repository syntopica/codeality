import { authFrom } from '@/config/authFrom.js'
import { colorSchemesFrom } from '@/config/colorSchemesFrom.js'
import { DEFAULT_VIEWPORTS } from '@/config/DEFAULT_VIEWPORTS.js'
import { disableEntryFrom } from '@/config/disableEntryFrom.js'
import { expectConfig } from '@/config/expectConfig.js'
import { isRecord } from '@/config/isRecord.js'
import { listFrom } from '@/config/listFrom.js'
import { paletteFrom } from '@/config/paletteFrom.js'
import { routeFrom } from '@/config/routeFrom.js'
import { ruleOptionsFrom } from '@/config/ruleOptionsFrom.js'
import { stringField } from '@/config/stringField.js'
import type { UiQualityConfig } from '@/config/UiQualityConfig.js'
import { viewportFrom } from '@/config/viewportFrom.js'

export const configFromDocument = (document: unknown): UiQualityConfig => {
  expectConfig(isRecord(document), 'the configuration must be a JSON object')
  const baseUrl = stringField(document, 'baseUrl', '', 'config').replace(
    /\/$/,
    '',
  )
  const routes = listFrom(document['routes'], [], 'routes', routeFrom)
  expectConfig(routes.length > 0, 'routes must name at least one route')
  return {
    baseUrl,
    auth: authFrom(document['auth']),
    routes,
    viewports: listFrom(
      document['viewports'],
      DEFAULT_VIEWPORTS,
      'viewports',
      viewportFrom,
    ),
    colorSchemes: colorSchemesFrom(document['colorSchemes']),
    palette: paletteFrom(document['palette']),
    rules: ruleOptionsFrom(document['rules']),
    disable: listFrom(document['disable'], [], 'disable', disableEntryFrom),
  }
}
