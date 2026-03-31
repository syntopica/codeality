import base from '@repo/eslint-config/base'
import nextjs from '@repo/eslint-config/nextjs'
import { defineConfig } from 'eslint/config'

// Optional: add project-specific architecture rules in eslint.architecture.ts
// and spread them here as a third layer.

export default defineConfig([...base, ...nextjs])
