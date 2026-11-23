package stage

// Baselined returns the stages whose findings the baseline records. The
// others (format, mod, test, audit) have no debt to carry: they pass or
// they do not.
func Baselined() []Stage {
	return []Stage{Lint(), Structure(), Duplicates()}
}
