/// A fresh `codeality-swift.yaml` for the given roots.
func codealitySwiftYaml(roots: [String], testRoots: [String], entrypoints: [String]) -> String {
    """
    # codeality-swift configuration - https://github.com/syntopica/codeality
    schema-version: 1
    roots: \(flowList(roots))
    test-roots: \(flowList(testRoots))
    roles:
      entrypoint: \(flowList(entrypoints))

    """
}
