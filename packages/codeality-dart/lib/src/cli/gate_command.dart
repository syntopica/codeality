import 'dart:io';

import 'package:args/command_runner.dart';

import '../baseline/read_baseline.dart';
import '../config/load_config.dart';
import '../gate/default_gate_stages.dart';
import '../gate/run_gate.dart';
import '../report/render_gate_json.dart';
import '../report/render_gate_text.dart';
import 'project_root.dart';

/// `codeality-dart gate`: every stage, all by default.
final class GateCommand extends Command<int> {
  GateCommand(this._out) {
    argParser
      ..addOption('project', help: 'Project root (default: current directory).')
      ..addFlag(
        'fail-fast',
        negatable: false,
        help: 'Stop at the first failing stage.',
      )
      ..addFlag('json', negatable: false, help: 'Print the JSON report.');
  }

  final IOSink _out;

  @override
  String get name => 'gate';

  @override
  String get description =>
      'Run format, analyze, structure, duplicates, test and audit.';

  @override
  Future<int> run() async {
    final results = argResults!;
    final root = projectRoot(results);
    final config = loadConfig(root);
    final result = await runGate(
      defaultGateStages(root, config, readBaseline(root)),
      failFast: results.flag('fail-fast'),
    );
    _out.writeln(
      results.flag('json') ? renderGateJson(result) : renderGateText(result),
    );
    return result.exitCode;
  }
}
