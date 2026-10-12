import { ENGLISH_UI_WORDS } from '@/rules/ENGLISH_UI_WORDS.js'

/** Whether a whole text is an English UI word that is not also a word of `language`. */
export const isEnglishLeak = (text: string, language: string): boolean => {
  const natives = ENGLISH_UI_WORDS.get(text.toLowerCase())
  return natives !== undefined && !natives.includes(language)
}
