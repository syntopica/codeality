import 'package:analyzer/dart/ast/ast.dart';
import 'package:path/path.dart' as p;

import '../config/dart_config.dart';
import '../model/finding.dart';
import '../model/location.dart';
import '../model/rule_code.dart';
import '../parsing/source_file.dart';
import '../roles/is_generated_path.dart';
import 'rule.dart';

/// BDT007: `part` only for generated files, so one library cannot spread
/// over many small-looking hand-written files.
final class NoHandWrittenPart implements Rule {
  @override
  RuleCode get code => RuleCode.bdt007;

  @override
  Iterable<Finding> check(SourceFile file, DartConfig config) sync* {
    for (final directive in file.unit.directives) {
      final location = file.lineInfo.getLocation(directive.offset);
      final at = Location(
        file.path,
        location.lineNumber,
        location.columnNumber,
      );
      if (directive is PartOfDirective) {
        yield Finding(
          code: code,
          message:
              'part of is only for generated files; make this its own library',
          location: at,
        );
      } else if (directive is PartDirective) {
        final uri = directive.uri.stringValue ?? '';
        final target = p.posix.normalize(
          p.posix.join(p.posix.dirname(file.path), uri),
        );
        if (!isGeneratedPath(target, config)) {
          yield Finding(
            code: code,
            message: 'part "$uri" is hand-written; make it its own library',
            location: at,
            subject: uri,
          );
        }
      }
    }
  }
}
