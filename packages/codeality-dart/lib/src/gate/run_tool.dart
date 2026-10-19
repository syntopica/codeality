import 'dart:io';

import 'tool_run.dart';

/// Run [executable] and capture its output. A tool that is not installed is
/// reported as missing, never thrown.
Future<ToolRun> runTool(
  String executable,
  List<String> arguments, {
  required String workingDirectory,
  Map<String, String>? environment,
}) async {
  final command = [executable, ...arguments].join(' ');
  try {
    final result = await Process.run(
      executable,
      arguments,
      workingDirectory: workingDirectory,
      environment: environment,
    );
    return ToolRun(
      command: command,
      exitCode: result.exitCode,
      stdout: result.stdout as String,
      stderr: result.stderr as String,
    );
  } on ProcessException catch (error) {
    return ToolRun(
      command: command,
      exitCode: -1,
      stdout: '',
      stderr: error.message,
      missing: true,
    );
  }
}
