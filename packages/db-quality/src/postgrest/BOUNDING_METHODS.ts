/** PostgREST methods that cap the rows a chain can return. */
export const BOUNDING_METHODS = new Set([
  'limit',
  'range',
  'single',
  'maybeSingle',
  'csv',
])
