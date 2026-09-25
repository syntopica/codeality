declare const supabase: { from: (table: string) => any }
declare const ids: string[]

export const inFor = async () => {
  for (const id of ids) {
    await supabase.from('orders').select('id').eq('id', id)
  }
}

export const inMap = () =>
  Promise.all(
    ids.map((id) => supabase.from('orders').select('id').eq('id', id)),
  )

export const helper = () => {
  const load = () => supabase.from('orders').select('id').limit(1)
  return load
}

export const Component = () => <div>{ids.length}</div>
