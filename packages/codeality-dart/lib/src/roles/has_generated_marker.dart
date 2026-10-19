import 'generated_marker_pattern.dart';
import 'generated_marker_window.dart';

/// Whether a comment in the first five lines declares the file generated.
bool hasGeneratedMarker(String text) => text
    .split('\n')
    .take(generatedMarkerWindow)
    .any(generatedMarkerPattern.hasMatch);
