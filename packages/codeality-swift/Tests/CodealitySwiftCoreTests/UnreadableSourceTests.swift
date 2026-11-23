import Foundation
import Testing

@testable import CodealitySwiftCore

@Suite struct UnreadableSourceTests {
  func project() -> Fixture {
    let fixture = Fixture()
    fixture.config("roots: [Sources]\n")
    fixture.write("Sources/Clean.swift", "struct Clean {}\n")
    let invalidUtf8 = Data([0x73, 0x74, 0xC3, 0x28, 0xFF, 0x0A])
    FileManager.default.createFile(
      atPath: fixture.root + "/Sources/Garbled.swift", contents: invalidUtf8)
    return fixture
  }

  @Test func anUnreadableFileThrowsInsteadOfParsingAsEmpty() throws {
    let fixture = project()
    let config = try loadConfig(projectRoot: fixture.root)
    #expect(throws: InfrastructureError.self) {
      try parseSourceFile(projectRoot: fixture.root, path: "Sources/Garbled.swift", config: config)
    }
  }

  @Test func checkExitsThreeAndNamesTheFile() throws {
    let fixture = project()
    let result = try runBinary(["check", "--project", fixture.root])
    #expect(result.status == 3)
    #expect(result.stderr.contains("cannot read Sources/Garbled.swift"))
  }
}
