/// No counted declaration, and one or more extensions, all of one type.
func isExtensionOnly(_ units: [Unit]) -> Bool {
  let extensions = units.filter { $0.kind == .extension }
  return !extensions.isEmpty
    && !units.contains { $0.kind == .declaration }
    && Set(extensions.map(\.name)).count == 1
}
