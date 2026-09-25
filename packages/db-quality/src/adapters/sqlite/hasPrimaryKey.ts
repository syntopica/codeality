export const hasPrimaryKey = (createSql: string): boolean => {
  const text = createSql.toLowerCase()
  return text.startsWith('create virtual table') || text.includes('primary key')
}
