import Foundation
import Testing

@testable import CodealitySwiftCore

@Suite struct BaselineTests {
  @Test func occurrencesBeyondTheRecordedCountAreNew() {
    let classified = classifyFingerprints(["a", "a", "b"], ["a": 1])
    #expect(classified.states == ["known", "new", "new"])
    #expect(classified.newCount == 2)
    #expect(classified.knownCount == 1)
  }

  @Test func recordedOccurrencesNoLongerPresentAreResolved() {
    #expect(classifyFingerprints(["a"], ["a": 2, "c": 1]).resolvedCount == 2)
  }

  @Test func aMissingBaselineReadsAsNil() throws {
    let fixture = Fixture()
    #expect(try readBaseline(projectRoot: fixture.root) == nil)
  }

  @Test func roundTripsSectionsAndCounts() throws {
    let fixture = Fixture()
    try writeBaseline(projectRoot: fixture.root, BaselineFile(sections: ["structure": ["b": 1, "a": 2]]))
    #expect(try readBaseline(projectRoot: fixture.root)?.section("structure") == ["a": 2, "b": 1])
  }

  @Test func aNewerSchemaVersionIsRefused() {
    let fixture = Fixture()
    fixture.write(BaselineFile.fileName, #"{"schema_version": 2, "sections": {}}"#)
    #expect(throws: ConfigError.self) { try readBaseline(projectRoot: fixture.root) }
  }

  @Test func fingerprintsLeaveOutTheLineNumber() {
    let a = fingerprint(section: "structure", code: "BSW005", path: "S/a.swift", context: "let q = x")
    #expect(a.count == 16)
    #expect(a == fingerprint(section: "structure", code: "BSW005", path: "S/a.swift", context: "let q = x"))
    #expect(a != fingerprint(section: "structure", code: "BSW005", path: "S/b.swift", context: "let q = x"))
  }
}
