package rule

// All returns every rule, in code order.
func All() []Rule {
	return []Rule{
		ParseError(),
		OneExportedUnit(),
		FileMatchesUnit(),
		NoGrabBagNames(),
		MaxFileLines(),
		PackageMatchesDirectory(),
		NoInlineSQL(),
		InternalByDefault(),
		HelperStaysLocal(),
		TestBesideUnit(),
	}
}
