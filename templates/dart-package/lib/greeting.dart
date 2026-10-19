/// The greeting for [name]; a blank name greets the world.
String greeting(String name) {
  final trimmed = name.trim();
  return 'Hello, ${trimmed.isEmpty ? 'world' : trimmed}!';
}
