import { expectConfig } from '@/config/expectConfig.js'
import { isRecord } from '@/config/isRecord.js'
import { optionalString } from '@/config/optionalString.js'
import type { RouteConfig } from '@/config/RouteConfig.js'
import { stringField } from '@/config/stringField.js'
import { stringList } from '@/config/stringList.js'
import { stringMap } from '@/config/stringMap.js'

/** A route is either a bare path or an object with a path. */
export const routeFrom = (value: unknown, index: number): RouteConfig => {
  const where = `routes[${String(index)}]`
  const record = typeof value === 'string' ? { path: value } : value
  expectConfig(isRecord(record), `${where} must be a path or an object`)
  const path = stringField(record, 'path', '', where)
  expectConfig(path.startsWith('/'), `${where}.path must start with "/"`)
  return {
    path,
    main: stringField(record, 'main', 'main', where),
    waitFor: optionalString(record, 'waitFor', where),
    localStorage: stringMap(record['localStorage'], `${where}.localStorage`),
    click: stringList(record['click'], `${where}.click`),
    scroll: optionalString(record, 'scroll', where),
    hover: optionalString(record, 'hover', where),
    focus: optionalString(record, 'focus', where),
  }
}
