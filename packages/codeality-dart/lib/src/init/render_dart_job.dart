import '../assets/action_pins.dart';
import '../package_version.dart';

/// One project's gate job, as text indented to sit under `jobs:`.
String renderDartJob({
  required String jobId,
  required String workingDirectory,
  required bool flutter,
  required String sdkVersion,
}) {
  final toolchain = flutter
      ? '''
      - uses: ${ActionPins.flutter}
        with:
          channel: stable
          flutter-version: $sdkVersion
          cache: true'''
      : '''
      - uses: ${ActionPins.dart}
        with:
          sdk: $sdkVersion''';
  return '''
  $jobId:
    name: codeality-dart ($workingDirectory)
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: $workingDirectory
    steps:
      - uses: ${ActionPins.checkout}
        with:
          persist-credentials: false
$toolchain
      - uses: ${ActionPins.node}
        with:
          node-version: ${ActionPins.nodeVersion}
      - name: Install osv-scanner
        run: |
          curl -sSfL -o "\$RUNNER_TEMP/osv-scanner" \\
            https://github.com/google/osv-scanner/releases/download/v${ActionPins.osvScannerVersion}/osv-scanner_linux_amd64
          chmod +x "\$RUNNER_TEMP/osv-scanner"
          echo "\$RUNNER_TEMP" >> "\$GITHUB_PATH"
      - name: Install codeality-dart
        run: dart pub global activate codeality_dart $packageVersion
      - name: Run the gate
        run: dart pub global run codeality_dart gate
''';
}
