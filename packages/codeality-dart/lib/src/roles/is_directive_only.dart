import 'package:analyzer/dart/ast/ast.dart';

/// Whether [unit] declares nothing and exports something.
bool isDirectiveOnly(CompilationUnit unit) =>
    unit.declarations.isEmpty &&
    unit.directives.any((directive) => directive is ExportDirective);
