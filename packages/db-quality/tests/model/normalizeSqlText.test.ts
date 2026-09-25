import { describe, expect, it } from 'vitest'

import { normalizeSqlText } from '@/model/normalizeSqlText.js'

describe('normalizeSqlText', () => {
  it('folds case and collapses whitespace', () => {
    expect(
      normalizeSqlText('  CREATE   POLICY "p"\n  ON public.t\tUSING (true) '),
    ).toBe('create policy "p" on public.t using (true)')
  })
})
