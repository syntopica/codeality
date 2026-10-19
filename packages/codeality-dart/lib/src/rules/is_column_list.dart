/// Whether the text between SELECT and FROM names columns: a star, a comma
/// list, or a single identifier. Prose such as "an option" does not.
bool isColumnList(String columns) {
  final stripped = columns.trim();
  if (stripped.isEmpty) return false;
  if (stripped.contains('*') || stripped.contains(',')) return true;
  return stripped.split(RegExp(r'\s+')).length == 1;
}
