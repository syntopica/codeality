import 'dart:io';

import 'package:args/command_runner.dart';
import 'package:path/path.dart' as p;

import '../baseline/baseline_file.dart';
import '../baseline/read_baseline.dart';
import '../baseline/record_sections.dart';
import '../baseline/write_baseline.dart';
import '../config/config_error.dart';
import '../report/exit_code.dart';
import 'project_root.dart';

/// `baseline create` (refuses to overwrite) and `baseline update`.
final class BaselineWriteCommand extends Command<int> {
  BaselineWriteCommand(this._out, {required this._overwrite}) {
    argParser
      ..addOption('project', help: 'Project root.')
      ..addMultiOption(
        'sections',
        allowed: ['structure', 'analyzer', 'duplicates'],
        defaultsTo: ['structure', 'analyzer', 'duplicates'],
      );
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
      throw const ConfigError(
        '${BaselineFile.fileName} already exists; use `baseline update`',
      );
    }
    final sections = argResults!.multiOption('sections');
    final baseline = await recordSections(
      root,
      existing ?? const BaselineFile(sections: {}),
      sections,
    );
    writeBaseline(root, baseline);
    final counts = [
      for (final section in sections)
        '$section ${baseline.section(section).values.fold(0, (a, b) => a + b)}',
    ];
    _out.writeln(
      'recorded ${counts.join(', ')} in ${p.join(root, BaselineFile.fileName)}',
    );
    return ExitCode.ok.value;
  }
}
