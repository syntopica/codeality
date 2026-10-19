import 'dart:io';

import 'package:path/path.dart' as p;

import 'infrastructure_failure.dart';
import 'run_tool.dart';
import 'stage_kind.dart';
import 'stage_result.dart';
import 'stage_status.dart';
import 'tool_run.dart';

/// `osv-scanner` over `pubspec.lock`: `dart pub` has no audit command.
Future<StageResult> auditStage(String projectRoot) async {
  const name = 'audit';
  if (!File(p.join(projectRoot, 'pubspec.lock')).existsSync()) {
    return infrastructureFailure(
      name,
      StageKind.required,
      const ToolRun(
        command: 'osv-scanner scan --lockfile pubspec.lock',
        exitCode: -1,
        stdout: '',
        stderr: 'pubspec.lock is missing; run pub get',
      ),
    );
  }
  final run = await runTool('osv-scanner', [
    'scan',
    '--lockfile',
    'pubspec.lock',
  ], workingDirectory: projectRoot);
  if (run.missing || (run.exitCode != 0 && run.exitCode != 1)) {
    return infrastructureFailure(name, StageKind.required, run);
  }
  return StageResult(
    name: name,
    kind: StageKind.required,
    command: run.command,
    status: run.exitCode == 0 ? StageStatus.passed : StageStatus.findings,
    exitCode: run.exitCode,
    detail: run.exitCode == 0
        ? 'no known vulnerabilities'
        : run.stdout.trim().split('\n').take(20).join('\n'),
    newCount: run.exitCode == 0 ? 0 : 1,
  );
}
