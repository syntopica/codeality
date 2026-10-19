/// Order by path, line, column, then rule code.
func findingOrder(_ a: Finding, _ b: Finding) -> Bool {
  (a.location.path, a.location.line, a.location.column, a.code.code)
    < (b.location.path, b.location.line, b.location.column, b.code.code)
}
