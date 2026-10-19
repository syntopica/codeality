import 'package:args/command_runner.dart';

/// A registered command whose behaviour lands in a later release step.
final class StubCommand extends Command<int> {
  StubCommand(this.name, this.description);

  @override
  final String name;

  @override
  final String description;

  @override
  Future<int> run() async => 0;
}
