package stage

// Item is one thing a stage found.
type Item struct {
	Code          string `json:"code"`
	Message       string `json:"message"`
	Path          string `json:"path"`
	Line          int    `json:"line"`
	Column        int    `json:"column"`
	BaselineState string `json:"baseline_state"`
	Fingerprint   string `json:"fingerprint"`
}
