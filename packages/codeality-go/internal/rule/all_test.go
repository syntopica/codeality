package rule_test

import (
	"fmt"
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/rule"
)

func TestAllIsInCodeOrder(t *testing.T) {
	t.Parallel()

	for index, current := range rule.All() {
		if want := fmt.Sprintf("BGO%03d", index); current.Code != want || current.Name == "" || current.Check == nil {
			t.Errorf("rule %d = %s %q, want %s with a name and a check", index, current.Code, current.Name, want)
		}
	}
}
