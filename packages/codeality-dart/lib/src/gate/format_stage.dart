import '../config/dart_config.dart';
import '../model/gate_finding.dart';
import '../model/location.dart';
import 'dart_for_project.dart';
import 'existing_roots.dart';
import 'infrastructure_failure.dart';
import 'run_tool.dart';
import 'stage_kind.dart';
import 'stage_result.dart';
import 'stage_status.dart';

final RegExp _changed = RegExp(r'^Changed (.+)$', multiLine: true);

/// `dart format --output=none --set-exit-if-changed` over the roots.
Future<StageResult> formatStage(
  String projectRoot,
  DartConfig config, {
  Map<String, String>? environment,
}) async {
  const name = 'format';
  final dart = dartForProject(projectRoot)?.dart ?? 'dart';
  final run = await runTool(
    dart,
    [
      'format',
      '--output=none',
      '--set-exit-if-changed',
      ...existingRoots(projectRoot, config),
    ],
    workingDirectory: projectRoot,
    environment: environment,
  );
  if (run.missing || (run.exitCode != 0 && run.exitCode != 1)) {
    return infrastructureFailure(name, StageKind.required, run);
  }
  final findings = [
    for (final match in _changed.allMatches(run.stdout))
      GateFinding(
        code: 'format',
        message: 'not formatted; run dart format',
        location: Location(match[1]!.trim(), 1, 1),
      ),
  ];
  return StageResult(
    name: name,
    kind: StageKind.required,
    command: run.command,
    status: run.exitCode == 0 ? StageStatus.passed : StageStatus.findings,
    exitCode: run.exitCode,
    findings: findings,
    newCount: findings.length,
  );
}
