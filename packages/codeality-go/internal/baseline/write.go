package baseline

import (
	"encoding/json"
	"fmt"
	"os"
)

const filePermissions = 0o644

// Write stores file as the baseline of the module in dir. Keys are sorted,
// so the file diffs cleanly.
func Write(dir string, file *File) error {
	raw, err := json.MarshalIndent(file, "", "  ")
	if err != nil {
		return fmt.Errorf("encode baseline: %w", err)
	}

	root, err := os.OpenRoot(dir)
	if err != nil {
		return fmt.Errorf("open %s: %w", dir, err)
	}

	defer func() { _ = root.Close() }()

	if err := root.WriteFile(FileName, append(raw, '\n'), filePermissions); err != nil {
		return fmt.Errorf("write %s: %w", FileName, err)
	}

	return nil
}
