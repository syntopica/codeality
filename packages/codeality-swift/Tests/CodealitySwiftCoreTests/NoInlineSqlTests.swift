// codeality-swift: ignore-file[BSW005] reason: SQL samples are the input under test.
import Testing

@testable import CodealitySwiftCore

@Suite struct NoInlineSqlTests {
    @Test func proseIsNotSql() {
        #expect(!looksLikeSql("Select an option from the menu below"))
    }

    @Test func statementShapesAreSql() {
        #expect(looksLikeSql("SELECT id, name FROM users WHERE id = ?"))
        #expect(looksLikeSql("select\n  id\nfrom\n  users"))
        #expect(looksLikeSql("INSERT INTO users (id) VALUES (?)"))
        #expect(looksLikeSql("UPDATE users SET name = ?"))
        #expect(looksLikeSql("DELETE FROM users WHERE id = ?"))
        #expect(looksLikeSql("CREATE TABLE users (id INTEGER)"))
    }

    @Test func aSqlLiteralIsAFinding() throws {
        let found = try checkFile(
            "Sources/q.swift", "let q = \"SELECT id, name FROM songs WHERE id = ?\"\n")
        #expect(found.map(\.code) == [.bsw005])
        #expect(found.first?.location.line == 1)
    }

    @Test func multiLineLiteralsAreReadWhole() throws {
        #expect(
            try codes("Sources/q.swift", "let q = \"\"\"\n  SELECT id\n  FROM users\n  \"\"\"\n") == [
                .bsw005
            ])
    }

    @Test func interpolatedLiteralsUseTheirStaticParts() throws {
        #expect(
            try codes("Sources/q.swift", "func q(_ t: String) -> String { \"SELECT id FROM \\(t)\" }\n")
                == [.bsw005])
    }

    @Test func testsAreHeldToTheSameRule() throws {
        #expect(try codes("Tests/QTests.swift", "let q = \"DELETE FROM users\"\n") == [.bsw005])
    }

    @Test func ordinaryStringsPass() throws {
        #expect(
            try codes("Sources/s.swift", "let s = \"Select an option from the menu below\"\n").isEmpty)
    }

    @Test func anInlineSuppressionCoversItsOwnLineOnly() throws {
        let text =
            "let a = \"DELETE FROM users\" // codeality-swift: ignore[BSW005]\nlet b = \"DELETE FROM songs\"\n"
        let found = try checkFile("Tests/QTests.swift", text)
        #expect(found.map(\.location.line) == [2])
    }

    @Test func aFileWideSuppressionNeedsAReason() throws {
        let with =
            "// codeality-swift: ignore-file[BSW005] reason: samples\nlet a = \"DELETE FROM users\"\n"
        #expect(try codes("Tests/QTests.swift", with).isEmpty)
        let without = "// codeality-swift: ignore-file[BSW005]\nlet a = \"DELETE FROM users\"\n"
        #expect(try codes("Tests/QTests.swift", without) == [.bsw005])
    }

    @Test func aParseErrorIsNeverSuppressible() throws {
        let text = "// codeality-swift: ignore-file[BSW000] reason: no\nstruct A {\n"
        #expect(try codes("Sources/A.swift", text).contains(.bsw000))
    }
}
