import type { UserWithTeam } from '../types/UserWithTeam'

export async function fetchUsersWithTeams(
  ids: string[],
): Promise<UserWithTeam[]> {
  const query = new URLSearchParams({ ids: ids.join(','), include: 'team' })
  const response = await fetch(`/api/users?${query.toString()}`)
  return (await response.json()) as UserWithTeam[]
}
