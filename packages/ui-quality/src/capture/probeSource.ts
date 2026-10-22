import { readFileSync } from 'node:fs'

import { assetPath } from '@/assetPath.js'
import { PROBE_BUNDLE_NAME } from '@/capture/PROBE_BUNDLE_NAME.js'

/** A self-contained browser function expression with no page-global exports. */
export const probeSource = (): string =>
  `(() => {
${readFileSync(assetPath('generated/probe.global.js'), 'utf8')}
return ${PROBE_BUNDLE_NAME}.default
})()`
