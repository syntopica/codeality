// codeality-swift: ignore-file[BSW005] reason: SQL samples are the input under test.
import Foundation
import Testing

@testable import CodealitySwiftCore

@Suite struct CheckCommandTests {
    func project() -> Fixture {
        let fixture = Fixture()
        fixture.config("roots: [Sources]\n")
        fixture.write("Sources/A.swift", "struct A {}\nstruct B {}\n")
        fixture.write("Sources/Clean.swift", "struct Clean {}\n")
        return fixture
    }

    @Test func textIsOneLinePerFindingPlusASummary() throws {
        let fixture = project()
        let result = try runBinary(["check", "--project", fixture.root])
        #expect(result.status == 1)
        let lines = result.stdout.split(separator: "\n")
        #expect(lines.first?.hasPrefix("Sources/A.swift:1:1: BSW001 one-primary-unit: ") == true)
        #expect(lines.last == "1 findings in 2 files under Sources")
    }

    @Test func jsonHasTheFrozenTopLevelShape() throws {
        let fixture = project()
        let result = try runBinary(["check", "--project", fixture.root, "--format", "json"])
        let document = try #require(
            try JSONSerialization.jsonObject(with: Data(result.stdout.utf8)) as? [String: Any])
        #expect(
            Set(document.keys) == [
                "schema_version", "tool", "roots", "scanned_files", "findings", "warnings", "summary",
            ])
        let finding = try #require((document["findings"] as? [[String: Any]])?.first)
        #expect(finding["code"] as? String == "BSW001")
        #expect((finding["fingerprint"] as? String)?.count == 16)
        #expect((document["summary"] as? [String: Int])?["total"] == 1)
    }

    @Test func aCleanProjectExitsZeroAndCheckNeverWrites() throws {
        let fixture = Fixture()
        fixture.config("roots: [Sources]\n")
        fixture.write("Sources/Clean.swift", "struct Clean {}\n")
        #expect(try runBinary(["check", "--project", fixture.root]).status == 0)
        #expect(!FileManager.default.fileExists(atPath: fixture.root + "/" + BaselineFile.fileName))
    }

    @Test func baselineCreateRefusesToOverwriteAndUpdateDoes() throws {
        let fixture = project()
        #expect(try runBinary(["baseline", "create", "--project", fixture.root]).status == 0)
        #expect(try runBinary(["baseline", "check", "--project", fixture.root]).status == 0)
        #expect(try runBinary(["baseline", "create", "--project", fixture.root]).status == 2)
        fixture.write("Sources/Q.swift", "struct Q {}\nlet q = \"DELETE FROM users\"\n")
        let grown = try runBinary(["baseline", "check", "--project", fixture.root])
        #expect(grown.status == 1)
        #expect(grown.stdout.contains("BSW005"))
        #expect(try runBinary(["baseline", "update", "--project", fixture.root]).status == 0)
        #expect(try runBinary(["baseline", "check", "--project", fixture.root]).status == 0)
    }

    @Test func aConfigurationErrorExitsTwo() throws {
        let fixture = Fixture()
        fixture.config("roots: [Sources]\ntypo: 1\n")
        let result = try runBinary(["check", "--project", fixture.root])
        #expect(result.status == 2)
        #expect(result.stderr.contains("typo"))
    }

    @Test func pathsRestrictTheReport() throws {
        let fixture = project()
        #expect(try runBinary(["check", "--project", fixture.root, "Sources/Clean.swift"]).status == 0)
    }

    @Test func failFastStopsAfterTheFirstFileWithFindings() throws {
        let fixture = project()
        fixture.write("Sources/Z.swift", "struct Y {}\nstruct Z {}\n")
        let result = try runBinary(["check", "--project", fixture.root, "--fail-fast"])
        #expect(!result.stdout.contains("Sources/Z.swift"))
    }
}
