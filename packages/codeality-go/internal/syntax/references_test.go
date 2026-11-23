package syntax_test

import (
	"go/parser"
	"go/token"
	"maps"
	"slices"
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/syntax"
)

func TestReferences(t *testing.T) {
	t.Parallel()

	const source = `package p

import (
	"fmt"
	alias "os"
)

type Lease struct {
	owner ownerID
	fence
}

var table = map[string]int{mapKey: 1}

var list = []int{indexKey: 2}

func own() {}

func (l *Lease) method() { own() }

func Use(param int) (result string) {
	local := helper(param)
	fmt.Println(alias.Args, local.field, limit)
	_ = Lease{owner: ownerValue}
	_ = &other{name: 1}

	for index, item := range items {
		_, _ = index, item
	}

	var declared = seed

outer:
	for {
		break outer
	}

	shadow := 1
	_ = func(inner int) int { return inner + shadow + captured }
	_ = declared

	return result
}
`

	file, err := parser.ParseFile(token.NewFileSet(), "p.go", source, parser.SkipObjectResolution)
	if err != nil {
		t.Fatal(err)
	}

	got := slices.Sorted(maps.Keys(syntax.References(file)))
	want := []string{
		"captured", "fence", "helper", "indexKey", "int", "items", "limit", "mapKey",
		"other", "ownerID", "ownerValue", "seed", "string",
	}

	if !slices.Equal(got, want) {
		t.Errorf("References = %v\nwant %v", got, want)
	}
}
