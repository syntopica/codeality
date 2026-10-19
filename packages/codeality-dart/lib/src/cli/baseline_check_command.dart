import 'dart:io';

import 'package:args/command_runner.dart';

import '../baseline/baseline_file.dart';
import '../baseline/classify_fingerprints.dart';
import '../baseline/read_baseline.dart';
import '../config/load_config.dart';
import '../engine/check_project.dart';
import '../report/exit_code.dart';
import '../report/render_finding_line.dart';
import 'project_root.dart';

/// `baseline check`: fail only on findings beyond the recorded debt.
final class BaselineCheckCommand extends Command<int> {
  BaselineCheckCommand(this._out) {
    argParser.addOption('project', help: 'Project root.');
  }

  final IOSink _out;

  @override
  String get name => 'check';

  @override
  String get description => 'Report new, known and resolved findings.';

  @override
  Future<int> run() async {
    final root = projectRoot(argResults!);
    final baseline = readBaseline(root) ?? const BaselineFile(sections: {});
    final result = checkProject(root, loadConfig(root));
    final classified = classifyFingerprints([
      for (final finding in result.findings) finding.fingerprint,
    ], baseline.section('structure'));
    for (var i = 0; i < result.findings.length; i++) {
      if (classified.states[i] == 'new') {
        _out.writeln(renderFindingLine(result.findings[i]));
      }
    }
    _out.writeln(
      '${classified.newCount} new, ${classified.knownCount} known, '
      '${classified.resolvedCount} resolved',
    );
    return classified.newCount == 0
        ? ExitCode.ok.value
        : ExitCode.findings.value;
  }
}
