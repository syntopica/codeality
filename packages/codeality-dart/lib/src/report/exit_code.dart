/// The four exit codes the CLI ever returns. A skipped required tool can
/// never produce [ok].
enum ExitCode {
  ok(0),
  findings(1),
  configuration(2),
  infrastructure(3);

  const ExitCode(this.value);

  final int value;
}
