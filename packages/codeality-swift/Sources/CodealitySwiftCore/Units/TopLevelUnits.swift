import SwiftSyntax

/// Every top-level unit of [tree], walking into `#if` clauses and counting
/// a name declared in several clauses once.
public func topLevelUnits(_ tree: SourceFileSyntax, _ converter: SourceLocationConverter) -> [Unit]
{
  var units: [Unit] = []
  func visit(_ items: CodeBlockItemListSyntax) {
    for item in items {
      if let ifConfig = item.item.as(IfConfigDeclSyntax.self) {
        for clause in ifConfig.clauses {
          if case .statements(let nested) = clause.elements { visit(nested) }
        }
        continue
      }
      guard let decl = item.item.as(DeclSyntax.self) else { continue }
      let line = converter.location(for: decl.positionAfterSkippingLeadingTrivia).line
      for unit in declarationUnits(decl, line: line)
      where !units.contains(where: { $0.name == unit.name && $0.kind == unit.kind }) {
        units.append(unit)
      }
    }
  }
  visit(tree.statements)
  return units
}
