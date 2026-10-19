import 'dart:io';

import 'package:args/command_runner.dart';

import '../report/exit_code.dart';
import '../baseline/infrastructure_error.dart';
import '../config/config_error.dart';
import '../package_version.dart';
import 'baseline_command.dart';
import 'check_command.dart';
import 'gate_command.dart';
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
        ..addCommand(CheckCommand(out))
        ..addCommand(BaselineCommand(out))
        ..addCommand(GateCommand(out))
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
  } on InfrastructureError catch (error) {
    err.writeln('infrastructure error: ${error.message}');
    return ExitCode.infrastructure.value;
  } on ConfigError catch (error) {
    err.writeln('configuration error: ${error.message}');
    return ExitCode.configuration.value;
  } on UsageException catch (error) {
    err
      ..writeln(error.message)
      ..writeln()
      ..writeln(error.usage);
    return ExitCode.configuration.value;
  }
}
