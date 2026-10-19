import '../rules/max_file_lines.dart';
import '../rules/rule.dart';

/// Every rule, in code order. BDT000 is produced by the engine itself.
List<Rule> ruleRegistry() => [MaxFileLines()];
