package baseline_test

import (
	"slices"
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/baseline"
)

func TestClassifyIsAMultiset(t *testing.T) {
	t.Parallel()

	section := map[string]int{"a": 2, "gone": 1}
	got := baseline.Classify(section, []string{"a", "b", "a", "a"})

	want := []baseline.State{baseline.StateKnown, baseline.StateNew, baseline.StateKnown, baseline.StateNew}
	if !slices.Equal(got.States, want) || got.New != 2 || got.Known != 2 || got.Resolved != 1 {
		t.Errorf("Classify = %+v", got)
	}

	if section["a"] != 2 {
		t.Error("Classify changed the recorded section")
	}
}
