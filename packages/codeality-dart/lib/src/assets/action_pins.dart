/// The third-party actions and tools the generated workflow pins, by commit
/// SHA with the release in a comment, as this repository's own CI does.
abstract final class ActionPins {
  static const String checkout =
      'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1';
  static const String flutter =
      'subosito/flutter-action@1a449444c387b1966244ae4d4f8c696479add0b2 # v2.23.0';
  static const String dart =
      'dart-lang/setup-dart@2286a0c042b44434fe26d292bbce8d34f7ec662b # v1.8.2';
  static const String node =
      'actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7';
  static const String nodeVersion = '22';
  static const String osvScannerVersion = '2.7.0';
}
