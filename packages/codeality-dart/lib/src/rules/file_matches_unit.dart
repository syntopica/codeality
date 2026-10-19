import 'package:path/path.dart' as p;

import '../config/dart_config.dart';
import '../model/finding.dart';
import '../model/location.dart';
import '../model/module_role.dart';
import '../model/rule_code.dart';
import '../parsing/source_file.dart';
import '../units/snake_case.dart';
import '../units/top_level_units.dart';
import 'rule.dart';

/// BDT002: an ordinary file with one unit is named after it.
final class FileMatchesUnit implements Rule {
  @override
  RuleCode get code => RuleCode.bdt002;

  @override
  Iterable<Finding> check(SourceFile file, DartConfig config) sync* {
    if (file.role != ModuleRole.ordinary) return;
    final units = topLevelUnits(file.unit);
    if (units.length != 1) return;
    final name = units.single.name;
    final expected = '${snakeCase(name)}.dart';
    if (p.posix.basename(file.path) == expected) return;
    final location = file.lineInfo.getLocation(units.single.node.offset);
    yield Finding(
      code: code,
      message: 'the file declares $name; name it $expected',
      location: Location(file.path, location.lineNumber, location.columnNumber),
      subject: name,
    );
  }
}
