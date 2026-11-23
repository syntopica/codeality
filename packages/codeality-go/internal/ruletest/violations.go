package ruletest

import (
	"fmt"
	"testing"
	"testing/fstest"

	"github.com/syntopica/codeality/packages/codeality-go/internal/config"
	"github.com/syntopica/codeality/packages/codeality-go/internal/rule"
	"github.com/syntopica/codeality/packages/codeality-go/internal/source"
)

// Violations loads files as the module example.com/demo and returns what
// checked reports, one "path:line subject" per violation, in file order.
// A nil cfg means the defaults.
func Violations(t *testing.T, checked rule.Rule, cfg *config.Config, files map[string]string) []string {
	t.Helper()

	if cfg == nil {
		cfg = config.Default()
	}

	fsys := fstest.MapFS{"go.mod": {Data: []byte("module example.com/demo\n\ngo 1.26.0\n")}}
	for name, content := range files {
		fsys[name] = &fstest.MapFile{Data: []byte(content)}
	}

	module, err := source.Load(fsys, cfg)
	if err != nil {
		t.Fatal(err)
	}

	in := rule.NewInput(module, cfg)
	reported := []string{}

	for _, file := range module.Files {
		if file.Role == source.RoleGenerated || (file.ParseErr != nil) != (checked.Code == "BGO000") {
			continue
		}

		for _, violation := range checked.Check(in, file) {
			reported = append(reported, fmt.Sprintf("%s:%d %s", file.Path, violation.Line, violation.Subject))
		}
	}

	return reported
}
