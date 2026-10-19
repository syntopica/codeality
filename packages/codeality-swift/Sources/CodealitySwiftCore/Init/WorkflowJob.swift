import Yams

/// Job [jobId] of the workflow [text], or nil when it has none.
func workflowJob(_ text: String, _ jobId: String) -> Node? {
    (try? Yams.compose(yaml: text))?["jobs"]?[Node(jobId)]
}
