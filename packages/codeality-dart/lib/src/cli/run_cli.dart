import 'dart:io';

import 'package:args/command_runner.dart';

import '../report/exit_code.dart';
import '../version.dart';
import 'stub_command.dart';

/// Run the CLI and return its exit code. Output goes to [out], diagnostics
/// and usage errors to [err].
Future<int> runCli(
  List<String> args, {
  required IOSink out,
  required IOSink err,
}) async {
  final runner =
      CommandRunner<int>(
          'codeality-dart',
          'Strict quality gate for Dart and Flutter projects.',
        )
        ..argParser.addFlag(
          'version',
          negatable: false,
          help: 'Print the version.',
        )
        ..addCommand(StubCommand('check', 'Run the structural rules.'))
        ..addCommand(StubCommand('baseline', 'Create, update or check debt.'))
        ..addCommand(StubCommand('gate', 'Run every quality stage.'))
        ..addCommand(
          StubCommand('init', 'Merge codeality config into a project.'),
        );
  try {
    final parsed = runner.parse(args);
    if (parsed.flag('version')) {
      out.writeln('codeality-dart $packageVersion');
      return ExitCode.ok.value;
    }
    if (parsed.command == null && parsed.rest.isEmpty) {
      out.writeln(runner.usage);
      return ExitCode.ok.value;
    }
    return await runner.runCommand(parsed) ?? ExitCode.ok.value;
  } on UsageException catch (error) {
    err
      ..writeln(error.message)
      ..writeln()
      ..writeln(error.usage);
    return ExitCode.configuration.value;
  }
}
