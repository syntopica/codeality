import 'package:analyzer/dart/ast/ast.dart';

/// The written name of the class [member] extends, or null.
String? superclassName(CompilationUnitMember member) =>
    member is ClassDeclaration
    ? member.extendsClause?.superclass.name.lexeme
    : null;
