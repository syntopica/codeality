package check

import (
	"slices"
	"sort"

	"github.com/syntopica/codeality/packages/codeality-go/internal/baseline"
	"github.com/syntopica/codeality/packages/codeality-go/internal/config"
	"github.com/syntopica/codeality/packages/codeality-go/internal/finding"
	"github.com/syntopica/codeality/packages/codeality-go/internal/glob"
	"github.com/syntopica/codeality/packages/codeality-go/internal/rule"
	"github.com/syntopica/codeality/packages/codeality-go/internal/source"
)

// Run applies every rule to every file of module and returns the findings
// the configuration does not override, ordered by path, position and code.
func Run(module *source.Module, cfg *config.Config) []finding.Finding {
	in := rule.NewInput(module, cfg)
	rules := rule.All()

	var findings []finding.Finding

	for _, file := range module.Files {
		if file.Role == source.RoleGenerated {
			continue
		}

		applicable := rules[1:]
		if file.ParseErr != nil {
			applicable = rules[:1]
		}

		for _, current := range applicable {
			if overridden(cfg, file.Path, current.Code) {
				continue
			}

			for _, violation := range current.Check(in, file) {
				findings = append(findings, finding.Finding{
					Path:    file.Path,
					Line:    violation.Line,
					Column:  violation.Column,
					Code:    current.Code,
					Rule:    current.Name,
					Message: violation.Message,
					Subject: violation.Subject,
					Fingerprint: baseline.Fingerprint(
						Section, current.Code, file.Path, violation.Subject),
				})
			}
		}
	}

	sort.SliceStable(findings, func(i, j int) bool { return findings[i].Compare(&findings[j]) < 0 })

	return findings
}

func overridden(cfg *config.Config, name, code string) bool {
	for _, override := range cfg.Overrides {
		if slices.Contains(override.Disable, code) && glob.Any(override.Paths, name) {
			return true
		}
	}

	return false
}
