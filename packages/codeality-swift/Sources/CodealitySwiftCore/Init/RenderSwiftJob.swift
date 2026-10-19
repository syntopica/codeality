/// The gate job, as text indented to sit under `jobs:`. It builds
/// codeality-swift from its release tag, caching `.build` per toolchain.
func renderSwiftJob(workingDirectory: String) -> String {
    let tool = ".codeality-swift/packages/codeality-swift"
    return """
          \(swiftJobId):
            name: codeality-swift (\(workingDirectory))
            runs-on: ubuntu-latest
            container: \(ActionPins.swiftImage)
            defaults:
              run:
                working-directory: \(workingDirectory)
            steps:
              - uses: \(ActionPins.checkout)
                with:
                  persist-credentials: false
              - uses: \(ActionPins.checkout)
                with:
                  repository: syntopica/codeality
                  ref: codeality-swift-v\(packageVersion)
                  path: .codeality-swift
                  persist-credentials: false
              - uses: \(ActionPins.node)
                with:
                  node-version: \(ActionPins.nodeVersion)
                  package-manager-cache: false
              - name: Hash the toolchain
                id: toolchain
                run: echo "hash=$(swift --version | sha256sum | cut -c1-16)" >> "$GITHUB_OUTPUT"
              - uses: \(ActionPins.cache)
                with:
                  path: \(tool)/.build
                  key: codeality-swift-${{ runner.os }}-${{ runner.arch }}-${{ steps.toolchain.outputs.hash }}-v\(packageVersion)
              - name: Build codeality-swift
                run: swift build -c release --package-path "$GITHUB_WORKSPACE/\(tool)"
              - name: Run the gate
                run: '"$GITHUB_WORKSPACE/\(tool)/.build/release/codeality-swift" gate'

        """
}
