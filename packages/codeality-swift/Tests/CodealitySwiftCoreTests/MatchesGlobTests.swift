import Testing

@testable import CodealitySwiftCore

@Suite struct MatchesGlobTests {
  @Test func doubleStarCrossesDirectories() {
    #expect(matchesGlob("a/b/c/GeneratedPluginRegistrant.swift", "**/GeneratedPluginRegistrant.*"))
    #expect(matchesGlob("GeneratedPluginRegistrant.m", "**/GeneratedPluginRegistrant.*"))
  }

  @Test func singleStarStaysInOneSegment() {
    #expect(matchesGlob("Sources/A.swift", "Sources/*.swift"))
    #expect(!matchesGlob("Sources/x/A.swift", "Sources/*.swift"))
  }

  @Test func dotsAreLiteral() {
    #expect(!matchesGlob("Sources/AXswift", "Sources/A.swift"))
  }
}
