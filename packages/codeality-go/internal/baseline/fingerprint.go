package baseline

import (
	"crypto/sha256"
	"encoding/hex"
	"strings"
)

const (
	fingerprintVersion = "1"
	fingerprintLength  = 16
)

// Fingerprint identifies a finding by what it is, not by where it sits.
// The line number is deliberately left out: inserting a line above a
// finding must not make it look new. The context says which of the
// findings of that code in that file this one is.
func Fingerprint(section, code, path, context string) string {
	material := strings.Join([]string{fingerprintVersion, section, code, path, context}, "|")
	sum := sha256.Sum256([]byte(material))

	return hex.EncodeToString(sum[:])[:fingerprintLength]
}
