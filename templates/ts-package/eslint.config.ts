import base from '@repo/eslint-config/base'
import node from '@repo/eslint-config/node'
import { defineConfig } from 'eslint/config'

export default defineConfig([...base, ...node])
