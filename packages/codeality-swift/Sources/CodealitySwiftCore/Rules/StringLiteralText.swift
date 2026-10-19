import SwiftSyntax

/// The static text of [literal]; each interpolation reads as `x`, as in
/// codeality-dart.
func stringLiteralText(_ literal: StringLiteralExprSyntax) -> String {
  literal.segments.map { $0.as(StringSegmentSyntax.self)?.content.text ?? "x" }.joined()
}
