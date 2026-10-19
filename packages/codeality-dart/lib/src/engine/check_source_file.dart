import '../config/dart_config.dart';
import '../model/finding.dart';
import '../model/module_role.dart';
import '../parsing/source_file.dart';
import '../rules/parse_error_finding.dart';
import 'rule_registry.dart';

/// All structural findings for one file. Generated files are exempt from
/// every rule.
List<Finding> checkSourceFile(SourceFile file, DartConfig config) {
  if (file.role == ModuleRole.generated || file.role == ModuleRole.excluded) {
    return const [];
  }
  return [
    ?parseErrorFinding(file),
    for (final rule in ruleRegistry()) ...rule.check(file, config),
  ];
}
