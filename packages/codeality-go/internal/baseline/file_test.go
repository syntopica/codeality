package baseline_test

import (
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/baseline"
)

func TestFileSection(t *testing.T) {
	t.Parallel()

	file := baseline.New("1.2.3")
	file.Record("structure", []string{"a", "a"})

	if section, ok := file.Section("structure"); !ok || section["a"] != 2 {
		t.Errorf("recorded section = %v, %v", section, ok)
	}

	if _, ok := file.Section("lint"); ok {
		t.Error("a section that was never recorded exists")
	}

	var none *baseline.File
	if _, ok := none.Section("structure"); ok {
		t.Error("a nil baseline has a section")
	}
}
