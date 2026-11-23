package unit_test

import (
	"go/parser"
	"go/token"
	"slices"
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/unit"
)

func extract(t *testing.T, source string) unit.Extraction {
	t.Helper()

	file, err := parser.ParseFile(token.NewFileSet(), "p.go", "package p\n\n"+source, parser.SkipObjectResolution)
	if err != nil {
		t.Fatal(err)
	}

	return unit.Extract(file)
}

func TestExtractFoldsIntoType(t *testing.T) {
	t.Parallel()

	found := extract(t, `
import "fmt"

type State int

const (
	Pending State = iota
	Leased
	Done
)

var fallback = State(0)

var zero = &State{}

var _ fmt.Stringer = State(0)

func NewState(raw string) (State, error) { return Pending, nil }

func ParseState(raw string) *State { return nil }

func (s State) String() string { return "" }

func (s *State) set(next State) { *s = next }
`)

	if len(found.Units) != 1 || len(found.Orphans) != 0 {
		t.Fatalf("got %d units and %d orphans, want one type unit: %+v", len(found.Units), len(found.Orphans), found)
	}

	got := found.Units[0]
	if got.Name() != "State" || got.Kind != unit.KindType || !got.Exported() {
		t.Errorf("unit = %+v", got)
	}
}

func TestExtractSeparateUnits(t *testing.T) {
	t.Parallel()

	found := extract(t, `
type (
	Lease struct{}
	fence string
)

const (
	limit   = 3
	Timeout = 5
)

var ErrStale error

func CompleteAttempt() error { return nil }

func checkFence() {}

func (q *Queue) Len() int { return 0 }
`)

	type summary struct {
		name     string
		kind     unit.Kind
		exported bool
	}

	want := []summary{
		{"Lease", unit.KindType, true},
		{"fence", unit.KindType, false},
		{"limit", unit.KindValue, true},
		{"ErrStale", unit.KindValue, true},
		{"CompleteAttempt", unit.KindFunction, true},
		{"checkFence", unit.KindFunction, false},
	}

	got := make([]summary, 0, len(found.Units))
	for _, item := range found.Units {
		got = append(got, summary{item.Name(), item.Kind, item.Exported()})
	}

	if !slices.Equal(got, want) {
		t.Errorf("units = %+v, want %+v", got, want)
	}

	if len(found.Orphans) != 1 || found.Orphans[0].Receiver != "Queue" || found.Orphans[0].Method != "Len" {
		t.Errorf("orphans = %+v", found.Orphans)
	}
}

func TestExtractIotaBlockOfForeignType(t *testing.T) {
	t.Parallel()

	found := extract(t, "const (\n\tA Other = iota\n\tB\n)\n")

	if len(found.Units) != 1 || !slices.Equal(found.Units[0].Names, []string{"A", "B"}) {
		t.Errorf("units = %+v, want one value unit A, B", found.Units)
	}
}
