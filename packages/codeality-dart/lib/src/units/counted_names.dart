import 'package:analyzer/dart/ast/ast.dart';

import 'member_names.dart';

/// The unit names [member] contributes; an unnamed extension still counts.
List<String> countedNames(CompilationUnitMember member) {
  final names = memberNames(member);
  return names.isEmpty ? const ['<unnamed extension>'] : names;
}
