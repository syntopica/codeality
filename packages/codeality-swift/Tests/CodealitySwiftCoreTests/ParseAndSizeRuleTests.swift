import Testing

@testable import CodealitySwiftCore

@Suite struct ParseAndSizeRuleTests {
  @Test func aMissingBraceIsOneParseErrorAndOtherRulesStillRun() throws {
    let body = (0..<160).map { "  let v\($0) = \($0)" }.joined(separator: "\n")
    let found = try codes("Sources/Broken.swift", "struct Broken {\n\(body)\n")
    #expect(found.filter { $0 == .bsw000 }.count == 1)
    #expect(found.contains(.bsw004))
  }

  @Test func overTheLineCapIsAFinding() throws {
    let body = (0..<151).map { "  let v\($0) = \($0)" }.joined(separator: "\n")
    #expect(try codes("Sources/Big.swift", "struct Big {\n\(body)\n}\n").contains(.bsw004))
  }

  @Test func commentsAndBlankLinesDoNotCount() throws {
    let comments = (0..<200).map { "// note \($0)\n" }.joined()
    #expect(try codes("Sources/Small.swift", "\(comments)\nstruct Small {}\n").isEmpty)
  }

  @Test func testsHaveTheHigherCap() throws {
    let body = (0..<200).map { "  let v\($0) = \($0)" }.joined(separator: "\n")
    #expect(try codes("Tests/BigTests.swift", "struct BigTests {\n\(body)\n}\n").isEmpty)
  }

  @Test func grabBagNamesInDirectoriesAndStems() throws {
    #expect(try codes("Sources/Utils/Foo.swift", "struct Foo {}\n") == [.bsw003])
    #expect(try codes("Sources/Helpers.swift", "struct Helpers {}\n") == [.bsw003])
    #expect(try codes("Sources/Utilsx.swift", "struct Utilsx {}\n").isEmpty)
  }
}
