package config

import (
	"bytes"
	"errors"
	"io/fs"
	"os"

	"go.yaml.in/yaml/v3"
)

// Load reads codeality-go.yaml from dir. A missing file yields the defaults;
// an unknown key or an invalid value is an [InvalidError].
func Load(dir string) (*Config, error) {
	cfg := Default()

	root, err := os.OpenRoot(dir)
	if err != nil {
		return nil, &InvalidError{Reason: err.Error()}
	}

	defer func() { _ = root.Close() }()

	raw, err := root.ReadFile(FileName)
	if errors.Is(err, fs.ErrNotExist) {
		return cfg, nil
	}

	if err != nil {
		return nil, &InvalidError{Reason: err.Error()}
	}

	decoder := yaml.NewDecoder(bytes.NewReader(raw))
	decoder.KnownFields(true)

	if err := decoder.Decode(cfg); err != nil {
		return nil, &InvalidError{Reason: err.Error()}
	}

	if err := cfg.Validate(); err != nil {
		return nil, err
	}

	return cfg, nil
}
