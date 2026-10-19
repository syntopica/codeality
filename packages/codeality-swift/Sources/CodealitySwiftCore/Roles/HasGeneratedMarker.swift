/// Whether a comment in the first five lines declares the file generated.
func hasGeneratedMarker(_ text: String) -> Bool {
  sourceLines(text).prefix(5)
    .contains { $0.firstMatch(of: generatedMarkerPattern) != nil }
}
