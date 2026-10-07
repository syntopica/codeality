/** How `character` changes the parenthesis and bracket depth of a selector. */
export const bracketDelta = (character: string): number => {
  if (character === '(' || character === '[') return 1
  if (character === ')' || character === ']') return -1
  return 0
}
