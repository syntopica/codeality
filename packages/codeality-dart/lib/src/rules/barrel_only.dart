import 'package:analyzer/dart/ast/ast.dart';

import '../config/dart_config.dart';
import '../model/finding.dart';
import '../model/location.dart';
import '../model/rule_code.dart';
import '../parsing/source_file.dart';
import 'rule.dart';

/// BDT005: a file that exports holds directives only.
final class BarrelOnly implements Rule {
  @override
  RuleCode get code => RuleCode.bdt005;

  @override
  Iterable<Finding> check(SourceFile file, DartConfig config) sync* {
    final exports = file.unit.directives.whereType<ExportDirective>();
    if (exports.isEmpty || file.unit.declarations.isEmpty) return;
    final location = file.lineInfo.getLocation(
      file.unit.declarations.first.offset,
    );
    yield Finding(
      code: code,
      message:
          'a file that exports holds only directives; move declarations out',
      location: Location(file.path, location.lineNumber, location.columnNumber),
    );
  }
}
