import 'package:analyzer/dart/ast/ast.dart';

/// `Counter` for a class written `extends State<Counter>`, otherwise null.
String? stateTarget(CompilationUnitMember member) {
  if (member is! ClassDeclaration) return null;
  final superclass = member.extendsClause?.superclass;
  if (superclass == null || superclass.name.lexeme != 'State') return null;
  final arguments = superclass.typeArguments?.arguments;
  if (arguments == null || arguments.length != 1) return null;
  final argument = arguments.single;
  return argument is NamedType ? argument.name.lexeme : null;
}
