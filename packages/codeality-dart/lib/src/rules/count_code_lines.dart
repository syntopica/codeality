import 'package:analyzer/dart/ast/token.dart';

import '../parsing/source_file.dart';

/// Lines holding at least one token. Comments are not tokens, so blank and
/// comment-only lines drop out, and a multi-line string counts every line it
/// spans.
int countCodeLines(SourceFile file) {
  final lines = <int>{};
  for (
    Token? token = file.unit.beginToken;
    token != null && token.type != TokenType.EOF;
    token = token.next
  ) {
    final first = file.lineInfo.getLocation(token.offset).lineNumber;
    final last = file.lineInfo.getLocation(token.end).lineNumber;
    for (var line = first; line <= last; line++) {
      lines.add(line);
    }
    if (token.next == token) break;
  }
  return lines.length;
}
