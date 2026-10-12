import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { CODE_TAGS } from '@/rules/CODE_TAGS.js'
import { isEnglishLeak } from '@/rules/isEnglishLeak.js'
import type { Rule } from '@/rules/Rule.js'

// "rate", "calculation", "none" in a list on a Spanish page: an English key
// or enum value printed where its translation belongs. Only a text that is
// wholly one word of a small dictionary is judged, so a sentence or a brand
// is not; identifiers ("purchase:7905") are raw-placeholder's, in any
// language.
export const untranslatedText: Rule = (snapshot) => {
  const language = snapshot.lang.split('-')[0] ?? ''
  if (language === '' || language === 'en') return []
  return snapshot.elements.flatMap((element) => {
    if (!isEnglishLeak(element.text, language) || element.isTextEntry) return []
    const chain = [element, ...ancestorsOf(element, snapshot.elements)]
    if (chain.some((box) => CODE_TAGS.has(box.tag))) return []
    return [
      {
        rule: 'untranslated-text',
        severity: 'error',
        message: `"${element.text}" is English on a page in "${snapshot.lang}"; translate the label`,
        subject: element.selector,
        identity: element.signature,
      },
    ]
  })
}
