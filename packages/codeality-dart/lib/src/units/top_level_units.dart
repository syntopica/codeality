import 'package:analyzer/dart/ast/ast.dart';

import 'counted_names.dart';
import 'extension_target.dart';
import 'member_names.dart';
import 'state_target.dart';
import 'superclass_name.dart';
import 'unit.dart';

/// The counted units of [unit]. A `State<W>` class joins the unit of the
/// `StatefulWidget` `W` declared beside it, and an extension joins the unit of
/// the type it extends; everything else is a unit of its own.
List<Unit> topLevelUnits(CompilationUnit unit) {
  final members = unit.declarations;
  final statefulWidgets = {
    for (final member in members)
      if (superclassName(member) == 'StatefulWidget') ...memberNames(member),
  };
  final declaredTypes = {
    for (final member in members)
      if (member is! ExtensionDeclaration &&
          member is! FunctionDeclaration &&
          member is! TopLevelVariableDeclaration)
        ...memberNames(member),
  };
  return [
    for (final member in members)
      if (!statefulWidgets.contains(stateTarget(member)) &&
          !declaredTypes.contains(extensionTarget(member)))
        for (final name in countedNames(member)) Unit(name, member),
  ];
}
