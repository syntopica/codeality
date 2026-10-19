import 'package:analyzer/dart/ast/ast.dart';

import '../config/dart_config.dart';
import '../model/finding.dart';
import '../model/location.dart';
import '../model/module_role.dart';
import '../model/rule_code.dart';
import '../parsing/source_file.dart';
import '../units/top_level_units.dart';
import '../units/unit.dart';
import 'rule.dart';

/// BDT001: one unit per ordinary file; a data file holds only variables; an
/// entrypoint holds only `main`.
final class OnePrimaryUnit implements Rule {
  @override
  RuleCode get code => RuleCode.bdt001;

  @override
  Iterable<Finding> check(SourceFile file, DartConfig config) sync* {
    final units = topLevelUnits(file.unit);
    final offenders = switch (file.role) {
      ModuleRole.ordinary => units.length > 1 ? units : const <Unit>[],
      ModuleRole.data => [
        for (final unit in units)
          if (unit.node is! TopLevelVariableDeclaration) unit,
      ],
      ModuleRole.entrypoint =>
        units.length == 1 && units.single.name == 'main'
            ? const <Unit>[]
            : units.where((unit) => unit.name != 'main').toList(),
      _ => const <Unit>[],
    };
    if (offenders.isEmpty) return;
    final names = units.map((unit) => unit.name).join(', ');
    yield Finding(
      code: code,
      message: switch (file.role) {
        ModuleRole.data =>
          'a data file holds only constants; move ${offenders.map((u) => u.name).join(', ')} out',
        ModuleRole.entrypoint =>
          'an entrypoint holds only main; move ${offenders.map((u) => u.name).join(', ')} out',
        _ =>
          '${units.length} top-level declarations ($names); keep one per file',
      },
      location: Location(file.path, 1, 1),
    );
  }
}
