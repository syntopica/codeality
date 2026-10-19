import '../config/dart_config.dart';
import '../model/finding.dart';
import '../model/rule_code.dart';
import '../parsing/source_file.dart';

/// One structural rule.
abstract interface class Rule {
  RuleCode get code;

  Iterable<Finding> check(SourceFile file, DartConfig config);
}
