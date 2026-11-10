/** The migration step the capturing driver is answering for. */
export type CompilingStep = { migration: string; step: 'up' | 'down' }
