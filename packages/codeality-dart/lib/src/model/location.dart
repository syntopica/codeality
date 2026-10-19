/// A position in a project, with a project-relative POSIX path.
final class Location {
  const Location(this.path, this.line, this.column);

  final String path;
  final int line;
  final int column;
}
