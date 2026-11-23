package report

import (
	"encoding/json"
	"fmt"
)

// encode renders a report as indented JSON with a final newline.
func encode(report any) (string, error) {
	raw, err := json.MarshalIndent(report, "", "  ")
	if err != nil {
		return "", fmt.Errorf("encode report: %w", err)
	}

	return string(raw) + "\n", nil
}
