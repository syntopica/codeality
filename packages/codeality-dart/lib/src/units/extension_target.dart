import 'package:analyzer/dart/ast/ast.dart';

/// The written name of the type an extension is `on`, or null.
String? extensionTarget(CompilationUnitMember member) {
  if (member is! ExtensionDeclaration) return null;
  final extended = member.onClause?.extendedType;
  return extended is NamedType ? extended.name.lexeme : null;
}
