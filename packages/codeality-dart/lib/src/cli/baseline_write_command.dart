import 'dart:io';

import 'package:args/command_runner.dart';
import 'package:path/path.dart' as p;

import '../baseline/baseline_file.dart';
import '../baseline/read_baseline.dart';
import '../baseline/structure_counts.dart';
import '../baseline/write_baseline.dart';
import '../config/config_error.dart';
import '../config/load_config.dart';
import '../engine/check_project.dart';
import '../report/exit_code.dart';
import 'project_root.dart';

/// `baseline create` (refuses to overwrite) and `baseline update`.
final class BaselineWriteCommand extends Command<int> {
  BaselineWriteCommand(this._out, {required this._overwrite}) {
    argParser.addOption('project', help: 'Project root.');
  }

  final IOSink _out;
  final bool _overwrite;

  @override
  String get name => _overwrite ? 'update' : 'create';

  @override
  String get description => _overwrite
      ? 'Re-record the current debt.'
      : 'Record the current debt; refuses when a baseline exists.';

  @override
  Future<int> run() async {
    final root = projectRoot(argResults!);
    final existing = readBaseline(root);
    if (existing != null && !_overwrite) {
      throw ConfigError(
        '${BaselineFile.fileName} already exists; use `baseline update`',
      );
    }
    final result = checkProject(root, loadConfig(root));
    final baseline = (existing ?? const BaselineFile(sections: {})).withSection(
      'structure',
      structureCounts(result.findings),
    );
    writeBaseline(root, baseline);
    _out.writeln(
      'recorded ${result.findings.length} structure findings in '
      '${p.join(root, BaselineFile.fileName)}',
    );
    return ExitCode.ok.value;
  }
}
