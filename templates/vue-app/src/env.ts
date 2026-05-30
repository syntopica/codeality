import { envSchema } from '@/envSchema'

export const env = envSchema.parse(import.meta.env)
