import base from '@repo/eslint-config/base'
import viteReact from '@repo/eslint-config/vite-react'
import { defineConfig } from 'eslint/config'

export default defineConfig([...base, ...viteReact])
