import '../config/dart_config.dart';
import '../model/finding.dart';
import '../model/location.dart';
import '../model/rule_code.dart';
import '../parsing/source_file.dart';
import 'looks_like_sql.dart';
import 'outermost_string_literals.dart';
import 'rule.dart';
import 'string_literal_text.dart';

/// BDT006: SQL lives in resource files (drift `.drift`, `.sql`), not in
/// string literals.
final class NoInlineSql implements Rule {
  @override
  RuleCode get code => RuleCode.bdt006;

  @override
  Iterable<Finding> check(SourceFile file, DartConfig config) sync* {
    final visitor = OutermostStringLiterals();
    file.unit.accept(visitor);
    final globs = config.sqlGlobs.join(' or ');
    for (final literal in visitor.found) {
      if (!looksLikeSql(stringLiteralText(literal))) continue;
      final location = file.lineInfo.getLocation(literal.offset);
      yield Finding(
        code: code,
        message:
            'inline SQL; move this query into $globs and load it from there',
        location: Location(
          file.path,
          location.lineNumber,
          location.columnNumber,
        ),
      );
    }
  }
}
