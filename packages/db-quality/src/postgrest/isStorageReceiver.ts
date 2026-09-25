import type ts from 'typescript'

import type { TypeScriptModule } from '@/postgrest/TypeScriptModule.js'

/** True when a chain root's receiver is `<expr>.storage`, e.g. `supabase.storage.from('bucket')`: Supabase Storage, not PostgREST. */
export const isStorageReceiver = (
  compiler: TypeScriptModule,
  expression: ts.Expression,
): boolean =>
  compiler.isPropertyAccessExpression(expression) &&
  expression.name.text === 'storage'
