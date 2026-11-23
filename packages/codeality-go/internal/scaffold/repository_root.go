package scaffold

import (
	"os"
	"path/filepath"
)

// repositoryRoot returns the nearest directory at or above dir that holds
// a .git entry, or dir itself outside a repository.
func repositoryRoot(dir string) string {
	for current := dir; ; current = filepath.Dir(current) {
		if _, err := os.Lstat(filepath.Join(current, ".git")); err == nil {
			return current
		}

		if current == filepath.Dir(current) {
			return dir
		}
	}
}
