import { describe, expect, it } from 'vitest'

import { authUidNotWrapped } from '@/rules/authUidNotWrapped.js'
import { migrationSetFrom } from '@tests/rules/migrationSetFrom.js'

describe('authUidNotWrapped', () => {
  it('flags a bare auth.uid() in a policy and accepts the wrapped form', () => {
    const set = migrationSetFrom({
      'm.sql': [
        'create policy "a" on public.t for select using (user_id = auth.uid());',
        'create policy "b" on public.t for select using (user_id = (select auth.uid()));',
        "create policy \"c\" on public.t for select using ((select auth.jwt()) ->> 'role' = 'admin');",
        "create policy \"d\" on public.t for select using (auth.jwt() ->> 'role' = 'admin');",
        'create function public.f() returns uuid as $$ select auth.uid() $$ language sql;',
      ].join('\n'),
    })
    expect(authUidNotWrapped.run(set).map((f) => f.line)).toEqual([1, 4])
  })
})
