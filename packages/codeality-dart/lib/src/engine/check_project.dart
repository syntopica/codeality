import '../baseline/fingerprint.dart';
import '../baseline/fingerprint_context.dart';
import '../config/dart_config.dart';
import '../model/finding.dart';
import '../parsing/parse_source_file.dart';
import '../traversal/collect_source_files.dart';
import '../traversal/is_within_any.dart';
import 'check_result.dart';
import 'check_source_file.dart';
import 'compare_findings.dart';

/// Run every structural rule over the project, fingerprinting each finding.
/// [only] restricts the files; [failFast] stops after the first file with
/// findings.
CheckResult checkProject(
  String projectRoot,
  DartConfig config, {
  List<String> only = const [],
  bool failFast = false,
}) {
  final warnings = <String>[];
  final paths = collectSourceFiles(
    projectRoot,
    config,
    warn: warnings.add,
  ).where((path) => isWithinAny(path, only)).toList();
  final findings = <Finding>[];
  for (final path in paths) {
    final file = parseSourceFile(projectRoot, path, config);
    for (final finding in checkSourceFile(file, config)) {
      findings.add(
        finding.withBaseline(
          fingerprint(
            'structure',
            finding.code.code,
            finding.location.path,
            fingerprintContext(finding, file.text),
          ),
          'new',
        ),
      );
    }
    if (failFast && findings.isNotEmpty) break;
  }
  findings.sort(compareFindings);
  return CheckResult(
    roots: [...config.sourceRoots, ...config.testRoots],
    scannedFiles: paths.length,
    findings: findings,
    warnings: warnings,
  );
}
