/// BSW001: one top-level type or function per file. Extensions of that
/// unit and its previews belong to it; an entrypoint's `@main` type is free.
struct OnePrimaryUnit: Rule {
  let code = RuleCode.bsw001

  func check(_ file: SourceFile, _ config: SwiftConfig) -> [Finding] {
    guard structuralUnitRoles.contains(file.role) else { return [] }
    let declarations = file.units.filter {
      $0.kind == .declaration && !(file.role == .entrypoint && $0.isMain)
    }
    let primary = declarations.count == 1 ? declarations.first?.name : nil
    let foreign = Set(file.units.filter { $0.kind == .extension && $0.name != primary }.map(\.name))
    let names =
      declarations.map(\.name) + (primary == nil && foreign.count < 2 ? [] : foreign.sorted())
    guard names.count > 1 else { return [] }
    return [
      Finding(
        code: code,
        message:
          "\(names.count) top-level units (\(names.joined(separator: ", "))); keep one per file",
        location: Location(file.path, 1, 1))
    ]
  }
}
