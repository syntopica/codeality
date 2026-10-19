/// A required tool could not run. The CLI exits 3 on it.
final class InfrastructureError implements Exception {
  const InfrastructureError(this.message);

  final String message;

  @override
  String toString() => 'InfrastructureError: $message';
}
