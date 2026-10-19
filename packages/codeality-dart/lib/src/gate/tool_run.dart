/// The result of running an external tool; [missing] when it is not
/// installed.
final class ToolRun {
  const ToolRun({
    required this.command,
    required this.exitCode,
    required this.stdout,
    required this.stderr,
    this.missing = false,
  });

  final String command;
  final int exitCode;
  final String stdout;
  final String stderr;
  final bool missing;
}
