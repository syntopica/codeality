import { useEffect, useState } from 'react'

import { fetchUsersWithTeams } from '../services/fetchUsersWithTeams'
import type { UserWithTeam } from '../types/UserWithTeam'

export function useUserList(ids: string[]): UserWithTeam[] {
  const [users, setUsers] = useState<UserWithTeam[]>([])
  useEffect(() => {
    const load = async () => {
      setUsers(await fetchUsersWithTeams(ids))
    }
    void load()
  }, [ids])
  return users
}
