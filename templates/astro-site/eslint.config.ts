import base from '@repo/eslint-config/base'
import astro from '@repo/eslint-config/astro'
import { defineConfig } from 'eslint/config'

export default defineConfig([...base, ...astro])
