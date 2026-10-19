import '../model/finding.dart';

/// Order by path, line, column, then rule code.
int compareFindings(Finding a, Finding b) {
  final byPath = a.location.path.compareTo(b.location.path);
  if (byPath != 0) return byPath;
  final byLine = a.location.line.compareTo(b.location.line);
  if (byLine != 0) return byLine;
  final byColumn = a.location.column.compareTo(b.location.column);
  if (byColumn != 0) return byColumn;
  return a.code.code.compareTo(b.code.code);
}
