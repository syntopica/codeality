import type { Team } from './Team'
import type { User } from './User'

export type UserWithTeam = {
  team: Team
} & User
