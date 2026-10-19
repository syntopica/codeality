import Foundation
import Testing

@testable import CodealitySwiftCore

private let report = """
    {"duplicates": [{"format": "swift", "lines": 12, "tokens": 90,
      "fragment": "let a = 1\\n  let b = 2", "isNew": false,
      "firstFile": {"name": "Sources/B.swift", "start": 3, "end": 14,
        "startLoc": {"line": 3, "column": 1}, "endLoc": {"line": 14, "column": 2}},
      "secondFile": {"name": "Sources/A.swift", "start": 7, "end": 18,
        "startLoc": {"line": 7, "column": 1}, "endLoc": {"line": 18, "column": 2}}}],
     "statistics": {"total": {"percentage": 2.5, "clones": 1, "lines": 480}}}
    """

private let block = """
    func score(_ values: [Int]) -> Int {
      var total = 0
      for value in values {
        if value > 10 {
          total += value * 2
        } else if value > 5 {
          total += value + 3
        } else {
          total -= value
        }
      }
      return total + values.count * 7 - (values.first ?? 0)
    }

    """

@Suite struct DuplicatesTests {
    @Test func parsesClonesAndThePercentage() throws {
        let parsed = try parseJscpdReport(report)
        #expect(parsed.percentage == 2.5)
        let clone = try #require(parsed.clones.first)
        #expect(clone.code == "duplicate")
        #expect(clone.location.path == "Sources/B.swift")
        #expect(clone.location.line == 3)
        #expect(clone.message.contains("Sources/A.swift:7"))
        #expect(clone.fingerprint.count == 16)
    }

    @Test func pairOrderAndWhitespaceDoNotChangeTheFingerprint() {
        #expect(
            cloneFingerprint("S/a.swift", "S/b.swift", "let a = 1\n  let b")
                == cloneFingerprint("S/b.swift", "S/a.swift", "let a = 1 let b"))
    }

    @Test func matchesTheDartFingerprintForTheSameClone() {
        // codeality-dart's cloneFingerprint('lib/a.dart', 'lib/b.dart', 'x  y') is the same sha256 material.
        #expect(
            cloneFingerprint("lib/a.dart", "lib/b.dart", "x  y")
                == fingerprint(
                    section: "duplicates", code: "duplicate", path: "lib/a.dart|lib/b.dart", context: "x y"))
    }

    @Test func aRecordedClonePassesAndAnUnrecordedOneFails() async throws {
        let fixture = Fixture()
        fixture.config("roots: [Sources]\n")
        fixture.write("Sources/A.swift", block)
        fixture.write("Sources/B.swift", block.replacingOccurrences(of: "score", with: "rank"))
        let config = try loadConfig(projectRoot: fixture.root)
        let first = await duplicatesStage(projectRoot: fixture.root, config: config, baseline: nil)
        #expect(first.status == .findings)
        let baseline = BaselineFile(sections: [
            "duplicates": fingerprintCounts(first.findings.map(\.fingerprint))
        ])
        #expect(
            await duplicatesStage(projectRoot: fixture.root, config: config, baseline: baseline).status
                == .passed)
    }
}
