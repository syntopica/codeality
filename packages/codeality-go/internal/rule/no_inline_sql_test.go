package rule_test

import (
	"slices"
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/config"
	"github.com/syntopica/codeality/packages/codeality-go/internal/rule"
	"github.com/syntopica/codeality/packages/codeality-go/internal/ruletest"
)

func TestNoInlineSQL(t *testing.T) {
	t.Parallel()

	cfg := config.Default()

	cfg.SQLGlobs = []string{"**/*.sql", "internal/store/queries.go"}

	files := map[string]string{
		"internal/store/a.go": "package store\n\nconst a = \"SELECT id, state FROM jobs\"\n\n" +
			"const b = `\n\tUPDATE jobs\n\tSET state = ?`\n\nconst c = \"Select an option from the menu below\"\n\n" +
			"const d = \"select one from jobs where id = ?\"\n\nconst e = \"DROP TABLE jobs\"\n",
		"internal/store/a_test.go":  "package store\n\nconst q = \"DELETE FROM jobs\"\n",
		"internal/store/queries.go": "package store\n\nconst allowed = \"INSERT INTO jobs VALUES (1)\"\n",
	}
	want := []string{
		"internal/store/a.go:3 SELECT id, state FROM jobs",
		"internal/store/a.go:5 UPDATE jobs SET state = ?",
		"internal/store/a.go:11 select one from jobs where id = ?",
		"internal/store/a.go:13 DROP TABLE jobs",
		"internal/store/a_test.go:3 DELETE FROM jobs",
	}

	got := ruletest.Violations(t, rule.NoInlineSQL(), cfg, files)
	if !slices.Equal(got, want) {
		t.Errorf("violations = %q\nwant %q", got, want)
	}
}
