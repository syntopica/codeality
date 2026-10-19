import '../rules/file_matches_unit.dart';
import '../rules/max_file_lines.dart';
import '../rules/one_primary_unit.dart';
import '../rules/rule.dart';

/// Every rule, in code order. BDT000 is produced by the engine itself.
List<Rule> ruleRegistry() => [
  OnePrimaryUnit(),
  FileMatchesUnit(),
  MaxFileLines(),
];
