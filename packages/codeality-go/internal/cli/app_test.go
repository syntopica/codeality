package cli_test

import (
	"bytes"
	"maps"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/cli"
	"github.com/syntopica/codeality/packages/codeality-go/internal/exitcode"
	"github.com/syntopica/codeality/packages/codeality-go/internal/stagetest"
)

const (
	goMod = "module example.com/fixture\n\ngo 1.26\n"
	doc   = "// Package fixture is a module the tests run the tool on.\npackage fixture\n"
	greet = "package fixture\n\n// Greet returns a greeting.\nfunc Greet() string { return \"hello\" }\n"
	// two holds two exported units, which is one too many (BGO001).
	two = "package fixture\n\n// Left is one unit.\nfunc Left() {}\n\n// Right is another.\nfunc Right() {}\n"
)

// module writes a module made of files, on top of a clean one, and
// returns its directory.
func module(t *testing.T, files map[string]string) string {
	t.Helper()

	dir := t.TempDir()
	all := map[string]string{"go.mod": goMod, "doc.go": doc, "greet.go": greet}

	maps.Copy(all, files)

	for name, content := range all {
		target := filepath.Join(dir, name)
		if err := os.MkdirAll(filepath.Dir(target), 0o750); err != nil {
			t.Fatal(err)
		}

		if err := os.WriteFile(target, []byte(content), 0o600); err != nil {
			t.Fatal(err)
		}
	}

	return dir
}

// run runs the tool in dir with fake tools and returns its exit code and
// what it wrote to stdout and stderr.
func run(t *testing.T, dir string, tools *stagetest.Tools, args ...string) (code exitcode.Code, stdout, stderr string) {
	t.Helper()

	var out, errs bytes.Buffer

	app := cli.App{Dir: dir, Stdout: &out, Stderr: &errs, Runner: tools.Run}
	code = app.Main(t.Context(), args)

	return code, out.String(), errs.String()
}

func TestMain(t *testing.T) {
	t.Parallel()

	dir := module(t, nil)

	for _, test := range []struct {
		args   []string
		code   exitcode.Code
		stdout string
		stderr string
	}{
		{args: nil, code: exitcode.Config, stderr: "codeality-go gate"},
		{args: []string{"version"}, code: exitcode.Clean, stdout: "0."},
		{args: []string{"help"}, code: exitcode.Clean, stdout: "Exit codes"},
		{args: []string{"lint"}, code: exitcode.Config, stderr: `unknown command "lint"`},
		{args: []string{"gate", "--nope"}, code: exitcode.Config, stderr: "nope"},
		{args: []string{"baseline"}, code: exitcode.Config, stderr: "usage"},
		{args: []string{"baseline", "drop"}, code: exitcode.Config, stderr: "usage"},
		{args: []string{"baseline", "check"}, code: exitcode.Config, stderr: "baseline create"},
	} {
		code, stdout, stderr := run(t, dir, &stagetest.Tools{}, test.args...)
		if code != test.code || !strings.Contains(stdout, test.stdout) || !strings.Contains(stderr, test.stderr) {
			t.Errorf("%v = exit %d\nstdout: %s\nstderr: %s", test.args, code, stdout, stderr)
		}
	}
}

func TestMainRefusesABrokenConfiguration(t *testing.T) {
	t.Parallel()

	dir := module(t, map[string]string{"codeality-go.yaml": "schema-version: 1\nno-such-key: true\n"})

	for _, command := range [][]string{{"check"}, {"gate"}, {"baseline", "check"}} {
		if code, _, stderr := run(t, dir, &stagetest.Tools{}, command...); code != exitcode.Config {
			t.Errorf("%v = exit %d: %s", command, code, stderr)
		}
	}
}
