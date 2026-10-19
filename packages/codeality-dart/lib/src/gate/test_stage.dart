import 'dart:io';

import 'package:path/path.dart' as p;

import '../config/dart_config.dart';
import 'dart_for_project.dart';
import 'infrastructure_failure.dart';
import 'is_flutter_project.dart';
import 'lcov_path.dart';
import 'read_lcov_line_coverage.dart';
import 'run_tool.dart';
import 'stage_kind.dart';
import 'stage_result.dart';
import 'stage_status.dart';
import 'tool_run.dart';

/// The test suite with line coverage, held to the configured floor. Running
/// past the time budget is reported, not failed.
Future<StageResult> testStage(String projectRoot, DartConfig config) async {
  const name = 'test';
  final tools = dartForProject(projectRoot);
  if (tools == null) {
    return infrastructureFailure(
      name,
      StageKind.required,
      const ToolRun(
        command: 'flutter test',
        exitCode: -1,
        stdout: '',
        stderr: 'flutter is not on PATH',
        missing: true,
      ),
    );
  }
  final flutter = isFlutterProject(projectRoot);
  final watch = Stopwatch()..start();
  final run = await runTool(
    flutter ? tools.pub : tools.dart,
    flutter
        ? ['test', '--coverage', '--coverage-path=$lcovPath']
        : ['test', '--coverage-path=$lcovPath'],
    workingDirectory: projectRoot,
  );
  final elapsed = watch.elapsed;
  if (run.missing) return infrastructureFailure(name, StageKind.required, run);
  final lcov = File(p.join(projectRoot, lcovPath));
  final budget = elapsed.inSeconds > config.testBudgetSeconds
      ? '; over the ${config.testBudgetSeconds}s budget '
            '(${elapsed.inSeconds}s), profile the suite'
      : '';
  if (run.exitCode != 0) {
    return StageResult(
      name: name,
      kind: StageKind.required,
      command: run.command,
      status: StageStatus.findings,
      exitCode: run.exitCode,
      detail: 'tests failed$budget',
      newCount: 1,
    );
  }
  final coverage = lcov.existsSync()
      ? readLcovLineCoverage(lcov.readAsStringSync())
      : 0.0;
  final below = coverage < config.coverageThreshold;
  return StageResult(
    name: name,
    kind: StageKind.required,
    command: run.command,
    status: below ? StageStatus.findings : StageStatus.passed,
    exitCode: run.exitCode,
    detail: below
        ? 'line coverage ${coverage.toStringAsFixed(1)}% is below the floor '
              'of ${config.coverageThreshold}%$budget'
        : 'line coverage ${coverage.toStringAsFixed(1)}%$budget',
    newCount: below ? 1 : 0,
  );
}
