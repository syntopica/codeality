import '../rules/barrel_only.dart';
import '../rules/file_matches_unit.dart';
import '../rules/max_file_lines.dart';
import '../rules/no_grab_bag_names.dart';
import '../rules/no_hand_written_part.dart';
import '../rules/no_inline_sql.dart';
import '../rules/one_primary_unit.dart';
import '../rules/rule.dart';

/// Every rule, in code order. BDT000 is produced by the engine itself.
List<Rule> ruleRegistry() => [
  OnePrimaryUnit(),
  FileMatchesUnit(),
  NoGrabBagNames(),
  MaxFileLines(),
  BarrelOnly(),
  NoInlineSql(),
  NoHandWrittenPart(),
];
