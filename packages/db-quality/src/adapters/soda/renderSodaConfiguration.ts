import { dataSourceType } from '@/adapters/soda/dataSourceType.js'

export const renderSodaConfiguration = (name: string, url: string): string => {
  const type = dataSourceType(url)
  const parsed = new URL(url)
  const lines = [
    `data_source ${name}:`,
    `  type: ${type}`,
    `  host: ${parsed.hostname}`,
    `  port: ${parsed.port || (type === 'postgres' ? '5432' : '3306')}`,
    `  username: ${decodeURIComponent(parsed.username)}`,
    `  password: ${JSON.stringify(decodeURIComponent(parsed.password))}`,
    `  database: ${parsed.pathname.slice(1)}`,
    ...(type === 'postgres' ? ['  schema: public'] : []),
  ]
  return `${lines.join('\n')}\n`
}
