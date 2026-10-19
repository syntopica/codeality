/// The whitespace-normalised source of [line] (1-based), or empty.
String lineContext(String text, int line) {
  final lines = text.split('\n');
  if (line < 1 || line > lines.length) return '';
  return lines[line - 1].replaceAll(RegExp(r'\s+'), ' ').trim();
}
