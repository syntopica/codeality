/// The index of the first line after the `jobs:` block of [lines]: the next
/// top-level key, or the end.
func jobsBlockEnd(_ lines: [Substring]) -> Int {
  guard let start = lines.firstIndex(where: { $0.hasPrefix("jobs:") }) else { return lines.count }
  return lines[(start + 1)...].firstIndex { line in
    guard let first = line.first else { return false }
    return !first.isWhitespace && first != "#"
  } ?? lines.count
}
