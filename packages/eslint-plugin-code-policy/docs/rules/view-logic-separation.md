# code-policy/view-logic-separation

> Prevent state, effects, and inline handlers inside React view components.

React view components (`.tsx` files) are responsible for rendering only. State management, side effects, and event handler logic must live in a dedicated custom hook. This enforces a clean view/controller split.

**Category:** View / Logic  
**Recommended:** Yes  
**Fixable:** No

## Rule Details

This rule only runs on `.tsx` files. It detects two patterns inside top-level component function bodies:

1. **React hook calls** -- any function call matching `use(State|Effect|Reducer|Callback|Memo|Ref|ImperativeHandle|LayoutEffect|DebugValue|DeferredValue|Transition|Id|SyncExternalStore|InsertionEffect|Query|Mutation)`.
2. **Inline function declarations** -- any `function` or arrow function declared as a variable inside the component body (e.g., `const handleClick = () => { ... }`).

### Incorrect

```tsx
// src/UserCard.tsx -- logic inside a view
export function UserCard({ userId }: UserCardProps) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUser(userId).then(setUser)
  }, [userId])

  const handleDelete = () => {
    deleteUser(userId)
  }

  return <div onClick={handleDelete}>{user?.name}</div>
}
```

### Correct

```ts
// src/useUserCard.ts
export function useUserCard(userId: string) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUser(userId).then(setUser)
  }, [userId])

  const handleDelete = () => deleteUser(userId)

  return { user, handleDelete }
}
```

```tsx
// src/UserCard.tsx -- pure view
import { useUserCard } from './useUserCard'

export function UserCard({ userId }: UserCardProps) {
  const { user, handleDelete } = useUserCard(userId)
  return <div onClick={handleDelete}>{user?.name}</div>
}
```

## What Triggers This Rule

Inside `.tsx` files, the following are flagged when they appear inside a top-level component body:

| Pattern                                  | Message ID         |
| ---------------------------------------- | ------------------ |
| `useState(...)`                          | `noReactHooks`     |
| `useEffect(...)`                         | `noReactHooks`     |
| `useReducer(...)`                        | `noReactHooks`     |
| `useCallback(...)`                       | `noReactHooks`     |
| `useMemo(...)`                           | `noReactHooks`     |
| `useRef(...)`                            | `noReactHooks`     |
| `useQuery(...)`, `useMutation(...)`      | `noReactHooks`     |
| Any `use*` matching the built-in pattern | `noReactHooks`     |
| `const handleFoo = () => { ... }`        | `noInlineHandlers` |
| `function handleFoo() { ... }`           | `noInlineHandlers` |

## Options

This rule has no options.

## When Not To Use It

If your team prefers co-locating simple state (`useState` for a toggle) directly inside small components, disable this rule for specific files or directories. The rule is most valuable in medium-to-large codebases where strict view/logic separation pays off.
