/// The stem BSW002 requires, or nil when the file has no single unit to be
/// named after.
func expectedFileStem(_ file: SourceFile) -> String? {
  if file.role == .extensionOnly {
    return file.units.first { $0.kind == .extension }.map { $0.name + "+" }
  }
  let declarations = file.units.filter { $0.kind == .declaration }
  return declarations.count == 1 ? declarations.first?.name : nil
}
