package rule

// Violation is what a rule reports about one file. The engine adds the
// file path and the rule's code and name to make a finding.
type Violation struct {
	// Line and Column are 1-based; a file-level violation sits at 1:1.
	Line   int
	Column int
	// Subject identifies the violation within its file for the baseline.
	Subject string
	Message string
}
