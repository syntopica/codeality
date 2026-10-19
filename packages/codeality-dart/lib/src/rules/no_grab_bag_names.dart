import 'package:path/path.dart' as p;

import '../config/dart_config.dart';
import '../model/finding.dart';
import '../model/location.dart';
import '../model/rule_code.dart';
import '../parsing/source_file.dart';
import 'grab_bag_names.dart';
import 'rule.dart';

/// BDT003: no `utils`, `helpers`, `misc` or `common` as a directory segment
/// or file stem, case-insensitively.
final class NoGrabBagNames implements Rule {
  @override
  RuleCode get code => RuleCode.bdt003;

  @override
  Iterable<Finding> check(SourceFile file, DartConfig config) sync* {
    final segments = [
      ...p.posix.split(p.posix.dirname(file.path)),
      p.posix.basenameWithoutExtension(file.path),
    ];
    for (final segment in segments) {
      if (grabBagNames.contains(segment.toLowerCase())) {
        yield Finding(
          code: code,
          message:
              '"$segment" names nothing; name the module after what it holds',
          location: Location(file.path, 1, 1),
          subject: segment,
        );
      }
    }
  }
}
