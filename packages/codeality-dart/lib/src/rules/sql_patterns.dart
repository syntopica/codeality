/// The regular expressions behind `looksLikeSql`, ported from codeality-py.
abstract final class SqlPatterns {
  static final RegExp whitespace = RegExp(r'\s+');
  static final RegExp select = RegExp(
    r'\bselect\b(?<columns>.+?)\bfrom\b\s+(?<source>[\w."`\[]+)',
  );
  static final List<RegExp> otherShapes = [
    RegExp(r'\binsert\s+into\b\s+[\w."`\[]+'),
    RegExp(r'\bupdate\b\s+[\w."`\[]+\s+set\b'),
    RegExp(r'\bdelete\s+from\b\s+[\w."`\[]+'),
    RegExp(r'\b(create|alter|drop)\s+(table|index|view|trigger)\b'),
  ];
  static final RegExp clauses = RegExp(
    r'\b(where|join|group\s+by|order\s+by|having|limit|union|returning)\b',
  );
}
