/// Whether [path] is one of [targets] or lies under one. No targets means
/// everything is in scope.
bool isWithinAny(String path, List<String> targets) =>
    targets.isEmpty ||
    targets.any(
      (target) =>
          path == target ||
          path.startsWith('${target.replaceFirst(RegExp(r'/+$'), '')}/'),
    );
