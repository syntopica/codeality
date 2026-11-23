package stage

// Result is the outcome of one stage.
type Result struct {
	Name    string  `json:"name"`
	Command string  `json:"command"`
	Status  Status  `json:"status"`
	Seconds float64 `json:"seconds"`
	Detail  string  `json:"detail"`
	Items   []Item  `json:"findings"`
	// New, Known and Resolved compare the items with the baseline; only
	// the stages that are baselined fill them.
	New      int `json:"new"`
	Known    int `json:"known"`
	Resolved int `json:"resolved"`
}
