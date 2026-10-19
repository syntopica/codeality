import 'package:analyzer/dart/ast/ast.dart';
import 'package:analyzer/dart/ast/visitor.dart';

/// Every string literal not nested in another one, so adjacent strings are
/// visited once as a whole.
final class OutermostStringLiterals extends RecursiveAstVisitor<void> {
  final List<StringLiteral> found = [];

  @override
  void visitAdjacentStrings(AdjacentStrings node) => found.add(node);

  @override
  void visitSimpleStringLiteral(SimpleStringLiteral node) => found.add(node);

  @override
  void visitStringInterpolation(StringInterpolation node) {
    found.add(node);
    super.visitStringInterpolation(node);
  }
}
