// BadComponent.tsx uses inline types
interface BadProps {
  id: string
}

function hiddenHelper() {
  return 'hidden'
}

export const AnotherUnit = () => <div />

export function BadComponent(props: BadProps) {
  return (
    <div>
      {props.id} {hiddenHelper()}
    </div>
  )
}
