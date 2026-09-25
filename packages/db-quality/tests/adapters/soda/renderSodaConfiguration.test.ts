import { describe, expect, it } from 'vitest'

import { dataSourceType } from '@/adapters/soda/dataSourceType.js'
import { renderSodaConfiguration } from '@/adapters/soda/renderSodaConfiguration.js'
import { ConfigError } from '@/config/ConfigError.js'

describe('renderSodaConfiguration', () => {
  it('renders the postgres block from the URL', () => {
    expect(
      renderSodaConfiguration(
        'codeality',
        'postgresql://user:pa%40ss@db.example.com:6543/postgres',
      ),
    ).toBe(
      'data_source codeality:\n  type: postgres\n  host: db.example.com\n  port: 6543\n  username: user\n  password: "pa@ss"\n  database: postgres\n  schema: public\n',
    )
  })
  it('defaults the port and omits the schema for mysql', () => {
    expect(renderSodaConfiguration('c', 'mysql://u:p@h/d')).toBe(
      'data_source c:\n  type: mysql\n  host: h\n  port: 3306\n  username: u\n  password: "p"\n  database: d\n',
    )
    expect(renderSodaConfiguration('c', 'postgres://u:p@h/d')).toContain(
      'port: 5432',
    )
  })
  it('knows the two source types and rejects others', () => {
    expect(dataSourceType('mysql://u:p@h/d')).toBe('mysql')
    expect(() => dataSourceType('sqlite:///x.db')).toThrow(ConfigError)
  })
})
