package source

import (
	"bufio"
	"bytes"
	"errors"
	"io/fs"
	"strings"
)

// ModulePath reads the module path from the go.mod at the root of fsys.
func ModulePath(fsys fs.FS) (string, error) {
	raw, err := fs.ReadFile(fsys, "go.mod")
	if err != nil {
		return "", errors.Join(ErrNoModule, err)
	}

	scanner := bufio.NewScanner(bytes.NewReader(raw))
	for scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		if len(fields) == 2 && fields[0] == "module" {
			return strings.Trim(fields[1], `"`), nil
		}
	}

	return "", ErrNoModule
}
