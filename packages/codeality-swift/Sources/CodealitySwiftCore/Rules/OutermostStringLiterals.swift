import SwiftSyntax

/// Collects string literals that are not nested inside another literal's
/// interpolation, so each is judged once, whole.
final class OutermostStringLiterals: SyntaxVisitor {
  private(set) var found: [StringLiteralExprSyntax] = []

  init() { super.init(viewMode: .sourceAccurate) }

  override func visit(_ node: StringLiteralExprSyntax) -> SyntaxVisitorContinueKind {
    found.append(node)
    return .skipChildren
  }
}
