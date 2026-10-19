import 'dart:io';

import 'package:args/command_runner.dart';
import 'package:path/path.dart' as p;

import '../gate/is_flutter_project.dart';
import '../init/apply_init.dart';
import '../init/local_sdk_version.dart';
import '../init/plan_disposition.dart';
import '../init/plan_init.dart';
import '../report/exit_code.dart';
import 'project_root.dart';

/// `codeality-dart init`: plan by default, merge on request, never shadow.
final class InitCommand extends Command<int> {
  InitCommand(this._out) {
    argParser
      ..addOption('project', help: 'Project root (default: current directory).')
      ..addFlag(
        'check',
        negatable: false,
        help: 'Plan only; exit 2 on a conflict.',
      )
      ..addFlag('apply', negatable: false, help: 'Write creates and merges.')
      ..addFlag('force', negatable: false, help: 'Also replace conflicts.')
      ..addFlag('ci', negatable: false, help: 'Also merge the CI job.')
      ..addOption(
        'profile',
        allowed: ['app', 'package'],
        help: 'Default: app for Flutter projects, package otherwise.',
      );
  }

  final IOSink _out;

  @override
  String get name => 'init';

  @override
  String get description => 'Merge codeality config into a project.';

  @override
  Future<int> run() async {
    final results = argResults!;
    final root = projectRoot(results);
    final profile =
        results.option('profile') ??
        (isFlutterProject(root) ? 'app' : 'package');
    final plan = planInit(
      root,
      ci: results.flag('ci'),
      profile: profile,
      sdkVersion: localSdkVersion(root),
    );
    for (final planned in plan) {
      final shown = p.isWithin(root, planned.path)
          ? p.relative(planned.path, from: root)
          : planned.path;
      _out.writeln(
        '${planned.disposition.name.padLeft(9)}  $shown  (${planned.detail})',
      );
    }
    final force = results.flag('force');
    if (results.flag('apply') || force) {
      _out.writeln('wrote ${applyInit(plan, force: force).length} files');
    }
    final conflict = plan.any((f) => f.disposition == PlanDisposition.conflict);
    if (conflict && results.flag('check')) return ExitCode.configuration.value;
    return ExitCode.ok.value;
  }
}
