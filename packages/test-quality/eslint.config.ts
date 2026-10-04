import { gateCliEslintConfig } from '@syntopica/gate-kit/gateCliEslintConfig'

export default gateCliEslintConfig(import.meta.dirname, ['tests/fixtures/**'])
