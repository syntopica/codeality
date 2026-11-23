package stage

// All returns the stages of the gate, in the order they run: the cheap
// ones first, so a formatting slip is reported before the suite runs.
func All() []Stage {
	return []Stage{Format(), Mod(), Lint(), Structure(), Duplicates(), Tests(), Audit()}
}
