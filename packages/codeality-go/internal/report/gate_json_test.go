package report_test

import (
	"encoding/json"
	"testing"

	"github.com/syntopica/codeality/packages/codeality-go/internal/exitcode"
	"github.com/syntopica/codeality/packages/codeality-go/internal/report"
	"github.com/syntopica/codeality/packages/codeality-go/internal/stage"
)

func TestGateJSON(t *testing.T) {
	t.Parallel()

	got, err := report.GateJSON([]stage.Result{{Name: "format", Status: stage.StatusPassed}}, exitcode.Clean)
	if err != nil {
		t.Fatal(err)
	}

	var decoded struct {
		ExitCode int `json:"exit_code"`
		Tool     struct {
			Name string `json:"name"`
		} `json:"tool"`
		Stages []struct {
			Name     string            `json:"name"`
			Status   string            `json:"status"`
			Findings []json.RawMessage `json:"findings"`
		} `json:"stages"`
	}
	if err := json.Unmarshal([]byte(got), &decoded); err != nil {
		t.Fatal(err)
	}

	if decoded.Tool.Name != "codeality-go" || decoded.ExitCode != 0 || len(decoded.Stages) != 1 {
		t.Fatalf("report = %s", got)
	}

	if first := decoded.Stages[0]; first.Name != "format" || first.Status != "passed" || first.Findings == nil {
		t.Errorf("stage = %+v", first)
	}
}
