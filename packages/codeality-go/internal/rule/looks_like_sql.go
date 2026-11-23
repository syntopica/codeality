package rule

import (
	"regexp"
	"strings"
)

var (
	sqlSelect = regexp.MustCompile("\\bselect\\b(.+?)\\bfrom\\b\\s+[\\w.\"`\\[]+")
	sqlShapes = regexp.MustCompile(
		"\\binsert\\s+into\\b\\s+[\\w.\"`\\[]+" +
			"|\\bupdate\\b\\s+[\\w.\"`\\[]+\\s+set\\b" +
			"|\\bdelete\\s+from\\b\\s+[\\w.\"`\\[]+" +
			"|\\b(create|alter|drop)\\s+(table|index|view|trigger)\\b")
	sqlClauses = regexp.MustCompile(`\b(where|join|group\s+by|order\s+by|having|limit|union|returning)\b`)
)

// looksLikeSQL reports whether text is a SQL statement rather than prose
// about one. Substring matching would flag "Select an option from the menu
// below", so a SELECT needs a column list that reads as one, or another SQL
// clause to back it up. The detector is the one every codeality tool uses.
func looksLikeSQL(text string) bool {
	normalised := strings.ToLower(strings.Join(strings.Fields(text), " "))
	if sqlShapes.MatchString(normalised) {
		return true
	}

	match := sqlSelect.FindStringSubmatch(normalised)
	if match == nil {
		return false
	}

	return sqlClauses.MatchString(normalised) || isColumnList(match[1])
}

// isColumnList reports whether the text between SELECT and FROM names
// columns: a star, a comma-separated list or a single identifier.
func isColumnList(columns string) bool {
	columns = strings.TrimSpace(columns)
	if columns == "" {
		return false
	}

	return strings.ContainsAny(columns, "*,") || len(strings.Fields(columns)) == 1
}
