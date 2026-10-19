import 'dart:convert';
import 'dart:io';

import 'package:path/path.dart' as p;

import '../assets/jscpd_defaults.dart';
import '../baseline/baseline_file.dart';
import '../config/dart_config.dart';
import 'classify_gate_findings.dart';
import 'infrastructure_failure.dart';
import 'jscpd_config.dart';
import 'parse_jscpd_report.dart';
import 'run_tool.dart';
import 'stage_kind.dart';
import 'stage_result.dart';
import 'stage_status.dart';
import 'tool_run.dart';

/// jscpd over the project's roots. With a `duplicates` baseline section the
/// stage fails on any new clone; without one, on the percentage threshold.
Future<StageResult> duplicatesStage(
  String projectRoot,
  DartConfig config,
  BaselineFile? baseline, {
  Map<String, String>? environment,
}) async {
  const name = 'duplicates';
  final scratch = Directory.systemTemp.createTempSync('codeality-jscpd-');
  try {
    final configFile = File(p.join(scratch.path, 'jscpd.json'))
      ..writeAsStringSync(jsonEncode(jscpdConfig(config, scratch.path)));
    final roots = [
      ...config.sourceRoots,
      ...config.testRoots,
    ].where((root) => Directory(p.join(projectRoot, root)).existsSync());
    final run = await runTool(
      'npx',
      [
        '--yes',
        'jscpd@${JscpdDefaults.version}',
        '--config',
        configFile.path,
        ...roots,
      ],
      workingDirectory: projectRoot,
      environment: environment,
    );
    final reportFile = File(p.join(scratch.path, 'jscpd-report.json'));
    if (run.missing || !reportFile.existsSync()) {
      return infrastructureFailure(name, StageKind.required, run);
    }
    final report = parseJscpdReport(
      reportFile.readAsStringSync(),
      projectRoot: projectRoot,
    );
    final section = baseline?.sections['duplicates'];
    final classified = classifyGateFindings(report.clones, section ?? const {});
    final threshold = config.duplicatesThreshold ?? JscpdDefaults.threshold;
    final failed = section == null
        ? report.percentage > threshold
        : classified.counts.newCount > 0;
    return StageResult(
      name: name,
      kind: StageKind.required,
      command: run.command,
      status: failed ? StageStatus.findings : StageStatus.passed,
      exitCode: run.exitCode,
      detail: '${report.percentage.toStringAsFixed(2)}% duplicated',
      findings: classified.findings,
      newCount: classified.counts.newCount,
      knownCount: classified.counts.knownCount,
      resolvedCount: classified.counts.resolvedCount,
    );
  } on FormatException catch (error) {
    return infrastructureFailure(
      name,
      StageKind.required,
      ToolRun(
        command: 'jscpd',
        exitCode: -1,
        stdout: '',
        stderr: 'unreadable report: ${error.message}',
      ),
    );
  } finally {
    scratch.deleteSync(recursive: true);
  }
}
