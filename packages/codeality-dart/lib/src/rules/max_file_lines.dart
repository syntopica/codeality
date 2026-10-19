import '../config/dart_config.dart';
import '../model/finding.dart';
import '../model/location.dart';
import '../model/module_role.dart';
import '../model/rule_code.dart';
import '../parsing/source_file.dart';
import 'count_code_lines.dart';
import 'rule.dart';

/// BDT004: cap occupied lines per file.
final class MaxFileLines implements Rule {
  @override
  RuleCode get code => RuleCode.bdt004;

  @override
  Iterable<Finding> check(SourceFile file, DartConfig config) sync* {
    final limit = file.role == ModuleRole.test
        ? config.testMaxFileLines
        : config.maxFileLines;
    final count = countCodeLines(file);
    if (count > limit) {
      yield Finding(
        code: code,
        message: '$count code lines, over the limit of $limit; split the file',
        location: Location(file.path, 1, 1),
        subject: '$count',
      );
    }
  }
}
