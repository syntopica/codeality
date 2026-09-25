import { ConfigError } from '@/config/ConfigError.js'

export const dataSourceType = (url: string): 'postgres' | 'mysql' => {
  const scheme = url.split(':')[0] ?? ''
  if (scheme === 'postgres' || scheme === 'postgresql') return 'postgres'
  if (scheme === 'mysql') return 'mysql'
  throw new ConfigError(
    `Soda supports postgres and mysql URLs, not "${scheme}"`,
  )
}
