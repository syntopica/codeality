import 'dart:io';

import 'package:args/command_runner.dart';

import '../config/load_config.dart';
import '../engine/check_project.dart';
import '../report/exit_code.dart';
import '../report/render_json_report.dart';
import '../report/render_text_report.dart';
import 'project_root.dart';

/// `codeality-dart check`: the structural rules, read-only.
final class CheckCommand extends Command<int> {
  CheckCommand(this._out) {
    argParser
      ..addOption('project', help: 'Project root (default: current directory).')
      ..addOption('format', allowed: ['text', 'json'], defaultsTo: 'text')
      ..addFlag(
        'fail-fast',
        negatable: false,
        help: 'Stop at the first file with findings.',
      );
  }

  final IOSink _out;

  @override
  String get name => 'check';

  @override
  String get description => 'Run the structural rules. Never writes.';

  @override
  String get invocation => 'codeality-dart check [PATH...]';

  @override
  Future<int> run() async {
    final results = argResults!;
    final root = projectRoot(results);
    final result = checkProject(
      root,
      loadConfig(root),
      only: results.rest,
      failFast: results.flag('fail-fast'),
    );
    _out.writeln(
      results.option('format') == 'json'
          ? renderJsonReport(result)
          : renderTextReport(result),
    );
    return result.findings.isEmpty
        ? ExitCode.ok.value
        : ExitCode.findings.value;
  }
}
