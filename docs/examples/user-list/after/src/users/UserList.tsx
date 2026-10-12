import { formatName } from '../shared/formatters/formatName'
import type { UserListProps } from './types/UserListProps'

export function UserList({ users }: UserListProps) {
  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>
          {formatName(user.name)} - {user.team.name}
        </li>
      ))}
    </ul>
  )
}
