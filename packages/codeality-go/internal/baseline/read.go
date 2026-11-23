package baseline

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"os"
)

// Read loads the baseline of the module in dir. A module without one is
// not an error: found is false and the file is nil.
func Read(dir string) (file *File, found bool, err error) {
	root, err := os.OpenRoot(dir)
	if err != nil {
		return nil, false, fmt.Errorf("open %s: %w", dir, err)
	}

	defer func() { _ = root.Close() }()

	raw, err := root.ReadFile(FileName)
	if errors.Is(err, fs.ErrNotExist) {
		return nil, false, nil
	}

	if err != nil {
		return nil, false, fmt.Errorf("read %s: %w", FileName, err)
	}

	file = New("")
	if err := json.Unmarshal(raw, file); err != nil {
		return nil, false, fmt.Errorf("%w: %s: %w", ErrUnreadable, FileName, err)
	}

	if file.SchemaVersion != schemaVersion {
		return nil, false, fmt.Errorf("%w: %s: unsupported schema version %d", ErrUnreadable, FileName, file.SchemaVersion)
	}

	return file, true, nil
}
