import type { Migration } from 'kysely/migration'

import { account } from './account.js'
import { moodEnum } from './moodEnum.js'
import { noteWithoutDown } from './noteWithoutDown.js'
import { petInlineReferences } from './petInlineReferences.js'
import { uniqueEmail } from './uniqueEmail.js'

export const migrationList: Record<string, Migration> = {
  '2026_01_01_account': account,
  '2026_01_02_note_without_down': noteWithoutDown,
  '2026_01_03_mood_enum': moodEnum,
  '2026_01_04_unique_email': uniqueEmail,
  '2026_01_05_pet_inline_references': petInlineReferences,
}
