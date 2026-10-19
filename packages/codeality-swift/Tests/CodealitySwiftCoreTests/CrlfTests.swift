import Testing

@testable import CodealitySwiftCore

@Suite struct CrlfTests {
  @Test func lineContextReadsCrlfLines() {
    #expect(lineContext("a\r\n  b  c\r\nd", 2) == "b c")
  }

  @Test func suppressionsKeepTheirCrlfLineNumbers() {
    let text = "let a = 1\r\nlet b = 2 // codeality-swift: ignore[BSW005]\r\n"
    #expect(parseSuppressions(text) == [Suppression(code: "BSW005", line: 2)])
  }

  @Test func aGeneratedMarkerOnACrlfSecondLineCounts() {
    #expect(hasGeneratedMarker("// swiftlint:disable all\r\n// Generated using SwiftGen\r\n"))
  }

  @Test func removeJobFindsTheJobInACrlfWorkflow() {
    let workflow = "jobs:\r\n  swift:\r\n    runs-on: x\r\n  dart:\r\n    runs-on: y\r\n"
    #expect(!removeJob(workflow, "swift").contains("swift:"))
    #expect(removeJob(workflow, "swift").contains("dart:"))
  }
}
