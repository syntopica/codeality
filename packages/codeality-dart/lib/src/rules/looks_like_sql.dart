import 'is_column_list.dart';
import 'sql_patterns.dart';

/// Whether [text] is a SQL statement rather than prose about one. A SELECT
/// needs a column list that reads as one, or another clause to back it up.
bool looksLikeSql(String text) {
  final normalised = text
      .replaceAll(SqlPatterns.whitespace, ' ')
      .trim()
      .toLowerCase();
  if (SqlPatterns.otherShapes.any((shape) => shape.hasMatch(normalised))) {
    return true;
  }
  final match = SqlPatterns.select.firstMatch(normalised);
  if (match == null) return false;
  return SqlPatterns.clauses.hasMatch(normalised) ||
      isColumnList(match.namedGroup('columns')!);
}
