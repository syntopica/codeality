import { cliTsupOptions } from '@syntopica/gate-kit/cliTsupOptions'
import { defineConfig } from 'tsup'

export default defineConfig(cliTsupOptions(import.meta.dirname))
