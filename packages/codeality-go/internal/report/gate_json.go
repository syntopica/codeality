package report

import (
	"github.com/syntopica/codeality/packages/codeality-go/internal/exitcode"
	"github.com/syntopica/codeality/packages/codeality-go/internal/stage"
)

// gateReport is the JSON form of a gate run.
type gateReport struct {
	SchemaVersion int            `json:"schema_version"`
	Tool          tool           `json:"tool"`
	ExitCode      exitcode.Code  `json:"exit_code"`
	Stages        []stage.Result `json:"stages"`
}

// GateJSON renders a gate run as versioned JSON.
func GateJSON(results []stage.Result, code exitcode.Code) (string, error) {
	stages := make([]stage.Result, len(results))
	for index := range results {
		stages[index] = results[index]
		// An empty list, never null: readers iterate it.
		stages[index].Items = append([]stage.Item{}, results[index].Items...)
	}

	return encode(gateReport{SchemaVersion: schemaVersion, Tool: thisTool(), ExitCode: code, Stages: stages})
}
