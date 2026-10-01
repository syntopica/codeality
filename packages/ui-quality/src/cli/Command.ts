import type { CommandIo } from '@/commands/CommandIo.js'

export type Command = (argv: string[], io: CommandIo) => Promise<number>
