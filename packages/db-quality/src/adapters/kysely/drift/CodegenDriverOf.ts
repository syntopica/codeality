/** The npm package kysely-codegen needs installed to talk to each dialect. */
export const CodegenDriverOf: Record<'postgres' | 'mysql', string> = {
  postgres: 'pg@8',
  mysql: 'mysql2@3',
}
