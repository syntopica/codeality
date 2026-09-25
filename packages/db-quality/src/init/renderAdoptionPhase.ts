import { ADOPTION_LADDER } from '@/init/ADOPTION_LADDER.js'

/** Renders the ladder with the current phase marked and the next step named. */
export const renderAdoptionPhase = (phase: 0 | 1 | 2 | 3 | 4): string => {
  const rungs = ADOPTION_LADDER.map(
    (rung) =>
      `${rung.phase === phase ? '*' : ' '} ${String(rung.phase)}  ${rung.does}`,
  )
  const current = ADOPTION_LADDER.find((rung) => rung.phase === phase)
  return [
    `adoption phase ${String(phase)} of 4`,
    ...rungs,
    `next: ${current?.next ?? ''}`,
  ].join('\n')
}
