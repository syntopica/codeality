import Testing

@testable import CodealitySwiftCore

@Suite struct UnitRuleTests {
    @Test func twoStructsAreTwoUnits() throws {
        #expect(try codes("Sources/A.swift", "struct A {}\nstruct B {}\n") == [.bsw001])
    }

    @Test func privateDeclarationsCountToo() throws {
        #expect(try codes("Sources/A.swift", "struct A {}\nprivate func helper() {}\n") == [.bsw001])
    }

    @Test func extensionsOfThePrimaryAreFine() throws {
        #expect(try codes("Sources/A.swift", "struct A {}\nextension A: Equatable {}\n").isEmpty)
    }

    @Test func anExtensionOfAnotherTypeIsASecondUnit() throws {
        #expect(try codes("Sources/A.swift", "struct A {}\nextension String {}\n") == [.bsw001])
    }

    @Test func previewsBelongToThePrimaryView() throws {
        let text = """
            import SwiftUI
            struct RemoteView: View { var body: some View { Text("x") } }
            #Preview { RemoteView() }
            struct RemoteView_Previews: PreviewProvider { static var previews: some View { RemoteView() } }
            """
        #expect(try codes("Sources/RemoteView.swift", text).isEmpty)
    }

    @Test func theSameNameInEveryIfConfigClauseIsOneUnit() throws {
        let text = """
            #if os(iOS)
            struct X { let a = 1 }
            #else
            struct X { let b = 2 }
            #endif
            """
        #expect(try codes("Sources/X.swift", text).isEmpty)
    }

    @Test func declarationsInsideIfConfigStillCount() throws {
        let text = "struct X {}\n#if canImport(WatchKit)\nstruct Y {}\n#endif\n"
        #expect(try codes("Sources/X.swift", text) == [.bsw001])
    }

    @Test func extensionOnlyFileNamedTypePlusTopic() throws {
        let text = "extension Beat { var a: Int { 1 } }\nextension Beat { var b: Int { 2 } }\n"
        #expect(try codes("Sources/Beat+Format.swift", text).isEmpty)
        #expect(try codes("Sources/Format.swift", text) == [.bsw002])
    }

    @Test func extensionOnlyUsesTheLastComponentWithoutGenerics() throws {
        #expect(try codes("Sources/Array+Beats.swift", "extension Array<Beat> {}\n").isEmpty)
        #expect(try codes("Sources/Bar+Topic.swift", "extension Foo.Bar {}\n").isEmpty)
    }

    @Test func extensionsOfTwoTypesAreTwoUnits() throws {
        #expect(try codes("Sources/Mixed.swift", "extension A {}\nextension B {}\n") == [.bsw001])
    }

    @Test func theMainTypeOfAnEntrypointIsExempt() throws {
        let yaml = "roots: [Sources]\nroles:\n  entrypoint: [Sources/StagebeatWatchApp.swift]\n"
        let text = """
            import SwiftUI
            @main
            struct StagebeatWatchApp: App { var body: some Scene { WindowGroup { Text("x") } } }
            #Preview { Text("x") }
            """
        #expect(try codes("Sources/StagebeatWatchApp.swift", text, yaml: yaml).isEmpty)
    }

    @Test func theFileIsNamedAfterItsUnit() throws {
        #expect(try codes("Sources/RemoteView.swift", "struct RemoteView {}\n").isEmpty)
        #expect(try codes("Sources/Remote.swift", "struct RemoteView {}\n") == [.bsw002])
        #expect(try codes("Sources/makeBeat.swift", "func makeBeat() {}\n").isEmpty)
    }

    @Test func testsAndGeneratedFilesAreExempt() throws {
        #expect(try codes("Tests/ATests.swift", "struct A {}\nstruct B {}\n").isEmpty)
        #expect(
            try codes("Sources/GeneratedPluginRegistrant.swift", "struct A {}\nstruct B {}\n").isEmpty)
    }

    @Test func aFreeFunctionMayLiveInItsUpperCamelFile() throws {
        #expect(try codes("Sources/LoadConfig.swift", "func loadConfig() {}\n").isEmpty)
        #expect(try codes("Sources/Config.swift", "func loadConfig() {}\n") == [.bsw002])
    }
}
