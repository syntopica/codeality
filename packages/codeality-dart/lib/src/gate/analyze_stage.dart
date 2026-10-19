import '../baseline/baseline_file.dart';
import 'classify_gate_findings.dart';
import 'dart_for_project.dart';
import 'fingerprint_analyzer_findings.dart';
import 'highest_diagnostic_exit.dart';
import 'infrastructure_failure.dart';
import 'parse_machine_output.dart';
import 'run_tool.dart';
import 'stage_kind.dart';
import 'stage_result.dart';
import 'stage_status.dart';
import 'tool_run.dart';

/// `dart analyze --format=machine --fatal-infos`, after `pub get`, measured
/// against the `analyzer` section of the baseline.
Future<StageResult> analyzeStage(
  String projectRoot,
  BaselineFile? baseline,
) async {
  const name = 'analyze';
  final tools = dartForProject(projectRoot);
  if (tools == null) {
    return infrastructureFailure(
      name,
      StageKind.required,
      const ToolRun(
        command: 'flutter pub get',
        exitCode: -1,
        stdout: '',
        stderr: 'flutter is not on PATH',
        missing: true,
      ),
    );
  }
  final get = await runTool(tools.pub, [
    'pub',
    'get',
  ], workingDirectory: projectRoot);
  if (get.missing || get.exitCode != 0) {
    return infrastructureFailure(name, StageKind.required, get);
  }
  final run = await runTool(tools.dart, [
    'analyze',
    '--format=machine',
    '--fatal-infos',
    '.',
  ], workingDirectory: projectRoot);
  final parsed = parseMachineOutput(
    '${run.stdout}\n${run.stderr}',
    projectRoot,
  );
  if (run.missing ||
      run.exitCode > highestDiagnosticExit ||
      (run.exitCode != 0 && parsed.isEmpty)) {
    return infrastructureFailure(name, StageKind.required, run);
  }
  final classified = classifyGateFindings(
    fingerprintAnalyzerFindings(parsed, projectRoot),
    baseline?.section('analyzer') ?? const {},
  );
  return StageResult(
    name: name,
    kind: StageKind.required,
    command: run.command,
    status: classified.counts.newCount == 0
        ? StageStatus.passed
        : StageStatus.findings,
    exitCode: run.exitCode,
    findings: classified.findings,
    newCount: classified.counts.newCount,
    knownCount: classified.counts.knownCount,
    resolvedCount: classified.counts.resolvedCount,
  );
}
