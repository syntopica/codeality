// A whole hexadecimal id (a job id, a hash, a UUID): every one has the same
// length by construction, so a column of them ties at its longest length
// without anything having been cut.
export const HEX_IDENTIFIER =
  /^(?:[0-9a-f]{8,}|[0-9A-F]{8,}|[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$/
