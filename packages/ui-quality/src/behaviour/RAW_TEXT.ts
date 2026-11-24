/** Machine text that needs no page comparison: database fragments, stack frames, JSON, bare statuses. */
export const RAW_TEXT =
  /invalid input syntax for type|violates .* constraint|duplicate key|\bPGRST\d+\b|^\s*at .+:\d+:\d+|\{\s*"[^"]+"\s*:|\[object Object\]|internal server error|^\s*(?:http\s*)?[1-5]\d\d\s*$/im
