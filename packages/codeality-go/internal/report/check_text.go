package report

import (
	"fmt"
	"strings"

	"github.com/syntopica/codeality/packages/codeality-go/internal/finding"
)

// CheckText renders findings one per line, as compilers do, followed by a
// count.
func CheckText(findings []finding.Finding) string {
	var text strings.Builder

	for index := range findings {
		text.WriteString(findings[index].String())
		text.WriteByte('\n')
	}

	if len(findings) == 0 {
		text.WriteString("no findings\n")

		return text.String()
	}

	fmt.Fprintf(&text, "%d findings\n", len(findings))

	return text.String()
}
