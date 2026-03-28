import recommended from './configs/recommended.js'
import strict from './configs/strict.js'
import react from './configs/react.js'
import next from './configs/next.js'

import atomicFile from './rules/atomic-file.js'
import noInlineTypes from './rules/no-inline-types.js'
import viewLogicSeparation from './rules/view-logic-separation.js'
import publicApiImports from './rules/public-api-imports.js'
import noCrossModuleDeepImports from './rules/no-cross-module-deep-imports.js'

const plugin = {
  meta: {
    name: 'eslint-plugin-code-policy',
    version: '0.1.0',
  },
  rules: {
    'atomic-file': atomicFile,
    'no-inline-types': noInlineTypes,
    'view-logic-separation': viewLogicSeparation,
    'public-api-imports': publicApiImports,
    'no-cross-module-deep-imports': noCrossModuleDeepImports,
  },
  configs: {
    recommended,
    strict,
    react,
    next,
  },
}

export default plugin
export { plugin }
