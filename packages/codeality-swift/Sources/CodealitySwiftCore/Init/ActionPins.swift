/// The actions and image the generated job pins, by commit SHA or digest,
/// as codeality-dart's job does.
enum ActionPins {
    static let checkout = "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1"
    static let node = "actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7"
    static let cache = "actions/cache@55cc8345863c7cc4c66a329aec7e433d2d1c52a9 # v6.1.0"
    static let nodeVersion = "22"
    static let swiftImage =
        "swift:6.4.1-noble@sha256:19cbe56bdaec1918f7cf5fdeba42b9bd55bdd8a6149c9990d0e0e3a89a127d63"
}
