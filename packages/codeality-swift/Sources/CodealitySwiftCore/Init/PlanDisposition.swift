/// What init would do to one path.
public enum PlanDisposition: String, Sendable {
  case create
  case merge
  case conflict
  case unchanged
}
