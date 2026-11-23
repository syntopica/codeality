package scaffold

// callerWorkflow is what init writes when a repository has no CI of its
// own. The same text as the other codeality tools write.
const callerWorkflow = `name: Quality
on:
  push:
    branches: [main]
  pull_request:
permissions:
  contents: read
jobs:
  codeality:
    uses: ./.github/workflows/codeality.yml
`
