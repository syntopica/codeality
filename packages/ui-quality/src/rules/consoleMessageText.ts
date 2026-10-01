import { CONSOLE_MESSAGE_LENGTH } from '@/rules/CONSOLE_MESSAGE_LENGTH.js'

/**
 * A console message as one readable line: printf placeholders (`%c`, `%s`)
 * and their CSS arguments dropped, whitespace collapsed, length capped.
 */
export const consoleMessageText = (message: string): string =>
  message
    .replaceAll(/%[csdifoO]/g, '')
    .replaceAll(/(?:background|color|border-radius)\s*:[^;]*;?/g, '')
    .replaceAll(/\s+/g, ' ')
    .trim()
    .slice(0, CONSOLE_MESSAGE_LENGTH)
