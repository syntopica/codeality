package naming_test

import (
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/naming"
)

func TestSnake(t *testing.T) {
	t.Parallel()

	cases := map[string]string{
		"Lease":           "lease",
		"CompleteAttempt": "complete_attempt",
		"HTTPServer":      "http_server",
		"JobID":           "job_id",
		"JobIDs":          "job_ids",
		"IDsByQueue":      "ids_by_queue",
		"parseURL":        "parse_url",
		"V2Client":        "v2_client",
		"sha256Sum":       "sha256_sum",
		"main":            "main",
		"already_snake":   "already_snake",
		"X":               "x",
	}

	for name, want := range cases {
		t.Run(name, func(t *testing.T) {
			t.Parallel()

			if got := naming.Snake(name); got != want {
				t.Errorf("Snake(%q) = %q, want %q", name, got, want)
			}
		})
	}
}
