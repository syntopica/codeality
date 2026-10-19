import '../config/dart_config.dart';
import '../model/finding.dart';
import '../model/module_role.dart';
import '../parsing/source_file.dart';
import '../rules/parse_error_finding.dart';
import '../suppression/is_suppressed.dart';
import '../suppression/parse_suppressions.dart';
import 'rule_registry.dart';

/// All structural findings for one file, minus suppressed ones. Generated
/// files are exempt from every rule.
List<Finding> checkSourceFile(SourceFile file, DartConfig config) {
  if (file.role == ModuleRole.generated || file.role == ModuleRole.excluded) {
    return const [];
  }
  final suppressions = parseSuppressions(file.text);
  return [
    ?parseErrorFinding(file),
    for (final rule in ruleRegistry()) ...rule.check(file, config),
  ].where((finding) => !isSuppressed(finding, suppressions)).toList();
}
