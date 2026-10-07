import { describe, expect, it } from 'vitest'

import { compileErrorFindings } from '@/adapters/kysely/rules/compileErrorFindings.js'
import { floatMoneyFindings } from '@/adapters/kysely/rules/floatMoneyFindings.js'
import { inlineReferencesFindings } from '@/adapters/kysely/rules/inlineReferencesFindings.js'
import { nativeEnumFindings } from '@/adapters/kysely/rules/nativeEnumFindings.js'
import { orderFindings } from '@/adapters/kysely/rules/orderFindings.js'
import { withoutDownFindings } from '@/adapters/kysely/rules/withoutDownFindings.js'
import type { Finding } from '@/model/Finding.js'
import { locatedFixture } from '@tests/adapters/kysely/locatedFixture.js'

const codes = (findings: Finding[]): string[][] =>
  findings.map((f) => [f.code, f.subject, f.severity])

describe('Kysely migration rules', () => {
  it('migration-without-down warns on a migration with no down, unless disabled', () => {
    const migrations = [
      locatedFixture('a', {}),
      locatedFixture('b', {}, { hasDown: false }),
    ]
    expect(codes(withoutDownFindings(migrations, []))).toEqual([
      ['BDB320/migration-without-down', 'b', 'warn'],
    ])
    expect(
      withoutDownFindings(migrations, [
        { code: 'BDB320/migration-without-down', reason: 'forward only' },
      ]),
    ).toEqual([])
  })
  it('migration-order catches a name out of order and a new one before a released one', () => {
    const [a, c, b] = ['2026_01', '2026_03', '2026_02'].map((name) =>
      locatedFixture(name, {}),
    )
    if (!a || !b || !c) throw new Error('fixture')
    const outOfOrder = orderFindings([a, c, b], [], [])
    expect(outOfOrder.map((f) => f.message)).toEqual([
      '"2026_02" does not sort after "2026_03": Kysely runs migrations in name order, not declaration order',
    ])
    const late = orderFindings([a, b, c], ['2026_01', '2026_03'], [])
    expect(late.map((f) => [f.subject, f.message])).toEqual([
      [
        '2026_02',
        'new migration "2026_02" sorts before the released "2026_03": Kysely\'s migrator refuses to run it on a database that already ran "2026_03"',
      ],
    ])
    expect(orderFindings([a, b, c], ['2026_01', '2026_02'], [])).toEqual([])
  })
  it('native-enum needs two dialects and ignores enum( inside a string', () => {
    const pg = locatedFixture('e', {
      postgres: ['create type "mood" as enum (\'a\')'],
    })
    const mysql = locatedFixture('m', {
      mysql: ["create table `t` (`s` enum('a', 'b'))"],
    })
    const quoted = locatedFixture('q', {
      postgres: ['insert into "t" values (\'enum(x)\')'],
    })
    expect(nativeEnumFindings([pg, mysql, quoted], ['postgres'], [])).toEqual(
      [],
    )
    expect(
      codes(nativeEnumFindings([pg, mysql, quoted], ['postgres', 'mysql'], [])),
    ).toEqual([
      ['BDB320/native-enum', 'e', 'warn'],
      ['BDB320/native-enum', 'm', 'warn'],
    ])
  })
  it('float-money flags floats and unscaled decimals on money-named columns, once per column', () => {
    const migration = locatedFixture('f', {
      postgres: [
        'create table "o" ("price" real, "fee" numeric(10), "total" decimal(10, 2), "unit_amount" double precision, "count" real)',
      ],
      mysql: ['create table `o` (`price` float, `tax_amount` decimal)'],
    })
    expect(
      floatMoneyFindings([migration], []).map((f) => f.message.split(':')[0]),
    ).toEqual([
      'money column "price" is typed real',
      'money column "fee" is typed numeric',
      'money column "unit_amount" is typed double precision',
      'money column "tax_amount" is typed decimal',
    ])
  })
  it('inline-references flags a column-level references in the MySQL SQL only', () => {
    const inline = locatedFixture('i', {
      mysql: [
        'create table `pet` (`owner_id` bigint references `account` (`id`))',
        'alter table `pet` add column `vet_id` bigint references `vet` (`id`)',
      ],
      postgres: [
        'create table "pet" ("owner_id" bigint references "account" ("id"))',
      ],
    })
    const tableLevel = locatedFixture('t', {
      mysql: [
        'create table `pet` (`owner_id` bigint, constraint `fk` foreign key (`owner_id`) references `account` (`id`))',
        'alter table `pet` add constraint `fk2` foreign key (`vet_id`) references `vet` (`id`)',
        "insert into `note` (`body`) values ('references')",
      ],
    })
    expect(codes(inlineReferencesFindings([inline, tableLevel], []))).toEqual([
      ['BDB320/inline-references', 'i', 'error'],
      ['BDB320/inline-references', 'i', 'error'],
    ])
  })
  it('a throw while compiling fails on SQLite, and does not compile elsewhere', () => {
    const migration = locatedFixture('x', {})
    migration.dialects = {
      sqlite: { up: [], down: [], error: 'up: boom' },
      mysql: { up: [], down: [], error: 'down: bang' },
      postgres: { up: [], down: [] },
    }
    expect(
      compileErrorFindings([migration], []).map((f) => [f.code, f.message]),
    ).toEqual([
      [
        'BDB320/migration-fails-on-sqlite',
        'migration throws while compiling for sqlite: up: boom',
      ],
      [
        'BDB320/migration-does-not-compile',
        'migration throws while compiling for mysql: down: bang',
      ],
    ])
  })
})
