import 'package:analyzer/dart/ast/ast.dart';
import 'package:analyzer/diagnostic/diagnostic.dart';
import 'package:analyzer/source/line_info.dart';

import '../model/module_role.dart';

/// One parsed file and everything the rules need to know about it.
final class SourceFile {
  const SourceFile({
    required this.path,
    required this.text,
    required this.unit,
    required this.lineInfo,
    required this.role,
    required this.parseErrors,
  });

  /// Project-relative POSIX path.
  final String path;
  final String text;
  final CompilationUnit unit;
  final LineInfo lineInfo;
  final ModuleRole role;
  final List<Diagnostic> parseErrors;
}
