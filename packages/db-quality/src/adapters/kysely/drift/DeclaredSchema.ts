import type { DeclaredProperty } from '@/adapters/kysely/drift/DeclaredProperty.js'

/** The hand-written type's shape: each table to its own location and its columns' locations. */
export type DeclaredSchema = Map<
  string,
  { property: DeclaredProperty; columns: Map<string, DeclaredProperty> }
>
