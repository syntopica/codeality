declare const supabase: {
  from: (table: string) => any
  rpc: (fn: string, args?: unknown) => any
}
declare const table: string

export const listAll = async () => supabase.from('orders').select('*')

export const listSome = async () =>
  supabase
    .from('orders')
    .select('id, status', { count: 'exact' })
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(20)

export const one = async () =>
  supabase.from('orders').select('id').eq('id', 'x').maybeSingle()

export const dynamic = async () => supabase.from(table).select('id')

export const call = async () => supabase.rpc('reap_jobs', { limit: 5 })

export const write = async () =>
  supabase.from('orders').update({ status: 'closed' }).eq('id', 'x')
