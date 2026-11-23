package baseline

// Classification is the result of comparing current findings with a
// recorded section.
type Classification struct {
	// States holds StateNew or StateKnown for each fingerprint given.
	States []State
	New    int
	Known  int
	// Resolved counts recorded findings that no longer occur. Reporting
	// them is what stops dead debt being carried forever.
	Resolved int
}

// Classify compares fingerprints, in order, with a recorded section.
func Classify(section map[string]int, fingerprints []string) Classification {
	remaining := make(map[string]int, len(section))
	result := Classification{States: make([]State, 0, len(fingerprints))}

	for fingerprint, count := range section {
		remaining[fingerprint] = count
		result.Resolved += count
	}

	for _, fingerprint := range fingerprints {
		if remaining[fingerprint] == 0 {
			result.States = append(result.States, StateNew)
			result.New++

			continue
		}

		remaining[fingerprint]--
		result.States = append(result.States, StateKnown)
		result.Known++
		result.Resolved--
	}

	return result
}
