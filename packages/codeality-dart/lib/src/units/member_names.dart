import 'package:analyzer/dart/ast/ast.dart';

/// The names a top-level member declares. A variable list declares one name
/// per variable; an unnamed extension declares none.
List<String> memberNames(CompilationUnitMember member) => switch (member) {
  ClassDeclaration(:final namePart) => [namePart.typeName.lexeme],
  EnumDeclaration(:final namePart) => [namePart.typeName.lexeme],
  ExtensionTypeDeclaration(:final namePart) => [namePart.typeName.lexeme],
  MixinDeclaration(:final name) => [name.lexeme],
  ExtensionDeclaration(:final name) => [?name?.lexeme],
  FunctionDeclaration(:final name) => [name.lexeme],
  TypeAlias(:final name) => [name.lexeme],
  TopLevelVariableDeclaration(:final variables) => [
    for (final variable in variables.variables) variable.name.lexeme,
  ],
  _ => const [],
};
