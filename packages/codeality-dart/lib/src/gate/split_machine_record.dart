/// Split a machine record on `|`, honouring `\|` escapes.
List<String> splitMachineRecord(String line) {
  final fields = <String>[];
  final current = StringBuffer();
  for (var i = 0; i < line.length; i++) {
    final char = line[i];
    if (char == r'\' && i + 1 < line.length) {
      current.write(line[++i]);
    } else if (char == '|') {
      fields.add(current.toString());
      current.clear();
    } else {
      current.write(char);
    }
  }
  fields.add(current.toString());
  return fields;
}
