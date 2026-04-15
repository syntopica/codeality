import recommended from '@/configs/recommended.js'
import strict from '@/configs/strict.js'
import react from '@/configs/react.js'
import next from '@/configs/next.js'

import atomicFile from '@/rules/atomic-file.js'
import onePrimaryUnit from '@/rules/one-primary-unit.js'
import noHiddenTopLevelDeclarations from '@/rules/no-hidden-top-level-declarations.js'
import noInlineTypesInRuntimeFiles from '@/rules/no-inline-types-in-runtime-files.js'
import fileKindPlacement from '@/rules/file-kind-placement.js'

import noInlineTypes from '@/rules/no-inline-types.js'
import viewLogicSeparation from '@/rules/view-logic-separation.js'
import publicApiImports from '@/rules/public-api-imports.js'
import noCrossModuleDeepImports from '@/rules/no-cross-module-deep-imports.js'
import noMixedBarrel from '@/rules/no-mixed-barrel.js'

import { PLUGIN_VERSION } from '@/version.js'

const plugin = {
  meta: {
    name: 'eslint-plugin-code-policy',
    version: PLUGIN_VERSION,
  },
  rules: {
    'atomic-file': atomicFile,
    'one-primary-unit': onePrimaryUnit,
    'no-hidden-top-level-declarations': noHiddenTopLevelDeclarations,
    'no-inline-types-in-runtime-files': noInlineTypesInRuntimeFiles,
    'file-kind-placement': fileKindPlacement,
    'no-inline-types': noInlineTypes,
    'view-logic-separation': viewLogicSeparation,
    'public-api-imports': publicApiImports,
    'no-cross-module-deep-imports': noCrossModuleDeepImports,
    'no-mixed-barrel': noMixedBarrel,
  },
  configs: {
    recommended,
    strict,
    react,
    next,
  },
} as const

export default plugin
export { plugin }
