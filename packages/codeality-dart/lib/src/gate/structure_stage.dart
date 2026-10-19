import '../baseline/baseline_file.dart';
import '../config/dart_config.dart';
import '../engine/check_project.dart';
import '../model/gate_finding.dart';
import 'classify_gate_findings.dart';
import 'stage_kind.dart';
import 'stage_result.dart';
import 'stage_status.dart';

/// The structural rules, measured against the `structure` baseline section
/// when one is recorded.
Future<StageResult> structureStage(
  String projectRoot,
  DartConfig config,
  BaselineFile? baseline,
) async {
  final check = checkProject(projectRoot, config);
  final classified = classifyGateFindings([
    for (final finding in check.findings)
      GateFinding(
        code: '${finding.code.code} ${finding.code.slug}',
        message: finding.message,
        location: finding.location,
        fingerprint: finding.fingerprint,
      ),
  ], baseline?.section('structure') ?? const {});
  return StageResult(
    name: 'structure',
    kind: StageKind.required,
    command: baseline == null
        ? 'codeality-dart check'
        : 'codeality-dart baseline check',
    status: classified.counts.newCount == 0
        ? StageStatus.passed
        : StageStatus.findings,
    detail: [
      '${check.scannedFiles} files',
      ...check.warnings.map((w) => 'warning: $w'),
    ].join('; '),
    findings: classified.findings,
    newCount: classified.counts.newCount,
    knownCount: classified.counts.knownCount,
    resolvedCount: classified.counts.resolvedCount,
  );
}
