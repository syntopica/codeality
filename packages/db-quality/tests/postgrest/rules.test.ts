import { describe, expect, it } from 'vitest'

import { exactCountUnbounded } from '@/postgrest/exactCountUnbounded.js'
import { filterWithoutIndex } from '@/postgrest/filterWithoutIndex.js'
import type { PostgrestChain } from '@/postgrest/PostgrestChain.js'
import { queryInLoop } from '@/postgrest/queryInLoop.js'
import { starSelect } from '@/postgrest/starSelect.js'
import { unboundedList } from '@/postgrest/unboundedList.js'

const context = {
  knowledge: new Map([
    [
      'public.orders',
      { indexed: new Set(['id', 'status']), unique: new Set(['id']) },
    ],
  ]),
}
const chain = (
  calls: PostgrestChain['calls'],
  extra: Partial<PostgrestChain> = {},
): PostgrestChain => ({
  path: 'src/a.ts',
  line: 3,
  root: 'from',
  target: 'orders',
  calls,
  inLoop: false,
  text: 'supabase.from("orders")',
  ...extra,
})

describe('PostgREST rules', () => {
  it('BDB801 flags a star anywhere in the select list, not on rpc', () => {
    expect(
      starSelect.run(chain([{ name: 'select', args: ['*'] }]), context)?.code,
    ).toBe('BDB801')
    expect(
      starSelect.run(chain([{ name: 'select', args: [] }]), context)?.code,
    ).toBe('BDB801')
    expect(
      starSelect.run(
        chain([{ name: 'select', args: ['id, profile(*)'] }]),
        context,
      )?.subject,
    ).toBe('orders')
    expect(
      starSelect.run(chain([{ name: 'select', args: ['id'] }]), context),
    ).toBeUndefined()
    expect(
      starSelect.run(
        chain([{ name: 'select', args: ['*'] }], { root: 'rpc', target: 'f' }),
        context,
      ),
    ).toBeUndefined()
  })
  it('BDB802 flags a read with no bound and no unique equality', () => {
    expect(
      unboundedList.run(chain([{ name: 'select', args: ['id'] }]), context)
        ?.code,
    ).toBe('BDB802')
    expect(
      unboundedList.run(
        chain([
          { name: 'select', args: ['id'] },
          { name: 'limit', args: ['?'] },
        ]),
        context,
      ),
    ).toBeUndefined()
    expect(
      unboundedList.run(
        chain([
          { name: 'select', args: ['id'] },
          { name: 'eq', args: ['id', 'x'] },
        ]),
        context,
      ),
    ).toBeUndefined()
    expect(
      unboundedList.run(
        chain([
          { name: 'select', args: ['id'] },
          { name: 'eq', args: ['status', 'x'] },
        ]),
        context,
      )?.code,
    ).toBe('BDB802')
    expect(
      unboundedList.run(
        chain([{ name: 'select', args: ['id', '{head:true,count:exact}'] }]),
        context,
      ),
    ).toBeUndefined()
    expect(
      unboundedList.run(
        chain([
          { name: 'update', args: ['?'] },
          { name: 'eq', args: ['id', 'x'] },
        ]),
        context,
      ),
    ).toBeUndefined()
    expect(
      unboundedList.run(
        chain([{ name: 'select', args: ['id'] }], { target: 'unknown_view' }),
        context,
      ),
    ).toBeUndefined()
  })
  it('BDB803 flags a literal filter column without an index, on known tables only', () => {
    const finding = filterWithoutIndex.run(
      chain([
        { name: 'select', args: ['id'] },
        { name: 'eq', args: ['email', 'x'] },
      ]),
      context,
    )
    expect(finding?.code).toBe('BDB803')
    expect(finding?.subject).toBe('orders.email')
    expect(
      filterWithoutIndex.run(
        chain([
          { name: 'select', args: ['id'] },
          { name: 'eq', args: ['status', 'x'] },
        ]),
        context,
      ),
    ).toBeUndefined()
    expect(
      filterWithoutIndex.run(
        chain([
          { name: 'select', args: ['id'] },
          { name: 'eq', args: ['profile.id', 'x'] },
        ]),
        context,
      ),
    ).toBeUndefined()
    expect(
      filterWithoutIndex.run(
        chain([
          { name: 'select', args: ['id'] },
          { name: 'eq', args: ['?', 'x'] },
        ]),
        context,
      ),
    ).toBeUndefined()
    expect(
      filterWithoutIndex.run(
        chain(
          [
            { name: 'select', args: ['id'] },
            { name: 'eq', args: ['email', 'x'] },
          ],
          { target: 'v' },
        ),
        context,
      ),
    ).toBeUndefined()
  })
  it('BDB804 flags any chain inside a loop', () => {
    expect(
      queryInLoop.run(
        chain([{ name: 'select', args: ['id'] }], { inLoop: true }),
        context,
      )?.code,
    ).toBe('BDB804')
    expect(
      queryInLoop.run(chain([{ name: 'select', args: ['id'] }]), context),
    ).toBeUndefined()
  })
  it('BDB805 flags an exact count with no bound', () => {
    expect(
      exactCountUnbounded.run(
        chain([{ name: 'select', args: ['id', '{count:exact}'] }]),
        context,
      )?.code,
    ).toBe('BDB805')
    expect(
      exactCountUnbounded.run(
        chain([
          { name: 'select', args: ['id', '{count:exact}'] },
          { name: 'range', args: ['?', '?'] },
        ]),
        context,
      ),
    ).toBeUndefined()
    expect(
      exactCountUnbounded.run(
        chain([{ name: 'select', args: ['id', '{count:exact,head:true}'] }]),
        context,
      ),
    ).toBeUndefined()
  })
  it('fingerprints on the chain text, not the line', () => {
    const a = starSelect.run(chain([{ name: 'select', args: ['*'] }]), context)
    const b = starSelect.run(
      chain([{ name: 'select', args: ['*'] }], { line: 99 }),
      context,
    )
    expect(a?.fingerprint).toBe(b?.fingerprint)
  })
})
