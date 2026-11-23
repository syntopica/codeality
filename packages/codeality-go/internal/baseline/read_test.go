package baseline_test

import (
	"errors"
	"os"
	"path/filepath"
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/baseline"
)

func TestReadRoundTrip(t *testing.T) {
	t.Parallel()

	dir := t.TempDir()

	if _, found, err := baseline.Read(dir); found || err != nil {
		t.Fatalf("Read of a module without a baseline = found %v, %v", found, err)
	}

	written := baseline.New("1.2.3")
	written.Record("structure", []string{"a", "a", "b"})

	if err := baseline.Write(dir, written); err != nil {
		t.Fatal(err)
	}

	read, found, err := baseline.Read(dir)
	if err != nil || !found {
		t.Fatalf("Read = found %v, %v", found, err)
	}

	section, ok := read.Section("structure")
	if !ok || section["a"] != 2 || section["b"] != 1 || read.ToolVersion != "1.2.3" {
		t.Errorf("read back %+v", read)
	}
}

func TestReadRejectsUnusableFiles(t *testing.T) {
	t.Parallel()

	for name, content := range map[string]string{
		"not json":      "{",
		"wrong version": `{"schemaVersion": 9, "sections": {}}`,
	} {
		t.Run(name, func(t *testing.T) {
			t.Parallel()

			dir := t.TempDir()
			if err := os.WriteFile(filepath.Join(dir, baseline.FileName), []byte(content), 0o600); err != nil {
				t.Fatal(err)
			}

			if _, _, err := baseline.Read(dir); !errors.Is(err, baseline.ErrUnreadable) {
				t.Fatalf("Read error = %v, want ErrUnreadable", err)
			}
		})
	}
}
