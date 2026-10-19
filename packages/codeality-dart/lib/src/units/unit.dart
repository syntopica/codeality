import 'package:analyzer/dart/ast/ast.dart';

/// One counted top-level declaration, with the declarations grouped into it.
final class Unit {
  const Unit(this.name, this.node);

  final String name;
  final CompilationUnitMember node;

  bool get isPublic => !name.startsWith('_');
}
