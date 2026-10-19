import 'plan_disposition.dart';

/// A path init would create, merge into, or leave alone. [content] is what
/// apply writes: for a conflict, what `--force` would write.
final class PlannedFile {
  const PlannedFile(this.path, this.disposition, this.detail, [this.content]);

  final String path;
  final PlanDisposition disposition;
  final String detail;
  final String? content;
}
