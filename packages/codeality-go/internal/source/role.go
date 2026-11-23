package source

// Role says which rules apply to a file. Every file has exactly one.
type Role string

// The roles, in the order they are tried.
const (
	RoleGenerated   Role = "generated"
	RoleTest        Role = "test"
	RoleDoc         Role = "doc"
	RoleEntrypoint  Role = "entrypoint"
	RoleMethodsOnly Role = "methods-only"
	RoleData        Role = "data"
	RoleOrdinary    Role = "ordinary"
)
