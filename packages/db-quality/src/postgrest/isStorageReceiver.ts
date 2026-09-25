import ts from 'typescript'

/** True when a chain root's receiver is `<expr>.storage`, e.g. `supabase.storage.from('bucket')`: Supabase Storage, not PostgREST. */
export const isStorageReceiver = (expression: ts.Expression): boolean =>
  ts.isPropertyAccessExpression(expression) &&
  expression.name.text === 'storage'
