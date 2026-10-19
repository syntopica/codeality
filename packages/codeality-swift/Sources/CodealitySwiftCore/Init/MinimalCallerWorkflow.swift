/// The caller init writes when a repository has no CI of its own. The same
/// text as codeality-dart's.
let minimalCallerWorkflow = """
    name: Quality

    on:
      push:
        branches: [main]
      pull_request:

    permissions:
      contents: read

    jobs:
      codeality:
        uses: ./.github/workflows/codeality.yml

    """
