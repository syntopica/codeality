package config_test

import (
	"errors"
	"os"
	"path/filepath"
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/config"
)

func writeConfig(t *testing.T, content string) string {
	t.Helper()

	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, config.FileName), []byte(content), 0o600); err != nil {
		t.Fatal(err)
	}

	return dir
}

func TestLoadMissingFileIsDefault(t *testing.T) {
	t.Parallel()

	cfg, err := config.Load(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}

	if cfg.Limits.MaxFileLines != 200 || !cfg.Race || cfg.CoverageThreshold != 80 {
		t.Errorf("unexpected defaults: %+v", cfg)
	}
}

func TestLoadOverlaysDefaults(t *testing.T) {
	t.Parallel()

	dir := writeConfig(t, "schema-version: 1\nrace: false\nlimits:\n  max-file-lines: 120\n")

	cfg, err := config.Load(dir)
	if err != nil {
		t.Fatal(err)
	}

	if cfg.Race || cfg.Limits.MaxFileLines != 120 || cfg.Limits.TestMaxFileLines != 400 {
		t.Errorf("file did not overlay the defaults: %+v", cfg)
	}
}

func TestLoadRejects(t *testing.T) {
	t.Parallel()

	cases := map[string]string{
		"unknown key":             "schema-version: 1\nsurprise: true\n",
		"wrong schema":            "schema-version: 2\n",
		"zero limit":              "limits:\n  max-file-lines: 0\n",
		"coverage out of range":   "coverage-threshold: 101\n",
		"override without reason": "overrides:\n  - paths: [a.go]\n    disable: [BGO006]\n",
		"malformed yaml":          "limits: [\n",
	}

	for name, content := range cases {
		t.Run(name, func(t *testing.T) {
			t.Parallel()

			_, err := config.Load(writeConfig(t, content))

			if _, ok := errors.AsType[*config.InvalidError](err); !ok {
				t.Fatalf("Load error = %v, want InvalidError", err)
			}
		})
	}
}
