// swift-tools-version: 6.0
import PackageDescription

let package = Package(
  name: "codeality-swift",
  platforms: [.macOS(.v13)],
  products: [
    .executable(name: "codeality-swift", targets: ["CodealitySwift"]),
    .library(name: "CodealitySwiftCore", targets: ["CodealitySwiftCore"]),
  ],
  dependencies: [
    .package(url: "https://github.com/swiftlang/swift-syntax.git", from: "604.0.0"),
    .package(url: "https://github.com/apple/swift-argument-parser.git", from: "1.8.2"),
    .package(url: "https://github.com/jpsim/Yams.git", from: "6.2.2"),
    .package(url: "https://github.com/apple/swift-crypto.git", from: "5.0.1"),
  ],
  targets: [
    .executableTarget(
      name: "CodealitySwift",
      dependencies: [
        "CodealitySwiftCore",
        .product(name: "ArgumentParser", package: "swift-argument-parser"),
      ]
    ),
    .target(
      name: "CodealitySwiftCore",
      dependencies: [
        .product(name: "SwiftSyntax", package: "swift-syntax"),
        .product(name: "SwiftParser", package: "swift-syntax"),
        .product(name: "SwiftParserDiagnostics", package: "swift-syntax"),
        .product(name: "Yams", package: "Yams"),
        .product(name: "Crypto", package: "swift-crypto"),
      ]
    ),
    .testTarget(
      name: "CodealitySwiftCoreTests",
      dependencies: ["CodealitySwiftCore", "CodealitySwift"]
    ),
  ]
)
