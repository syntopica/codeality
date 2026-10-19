import SwiftSyntax

/// Whether [clause] lists [type].
func conformsTo(_ clause: InheritanceClauseSyntax?, _ type: String) -> Bool {
  clause?.inheritedTypes.contains { $0.type.trimmedDescription == type } ?? false
}
