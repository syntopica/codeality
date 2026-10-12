import { beforeAll, describe, expect, it } from 'vitest'

import type { FixtureFinding } from './FixtureFinding.js'
import { fixtureFindings } from './fixtureFindings.js'

// Each defect has a page that shows it and a twin that comes close without
// it. The twins must stay silent on every rule this file covers.
const META_LINE = '/meta-line.html'
const DATE_PAGE = '/date-locale.html'
const DATE_RULE = 'date-locale'
const MODAL_PAGE = '/modal.html'
const UNTRANSLATED_PAGE = '/untranslated.html'
const MODAL_CLEAN = '/modal-clean.html'
const PAIRS: [string, string, string][] = [
  ['crowded-meta-line', META_LINE, '/meta-line-clean.html'],
  [DATE_RULE, DATE_PAGE, '/date-locale-clean.html'],
  ['money-without-unit', '/money.html', '/money-clean.html'],
  ['list-dangling-rule', '/dangling.html', '/dangling-clean.html'],
  ['monospace-prose', '/mono.html', '/mono-clean.html'],
  ['unbreakable-overflow', '/unbreakable.html', '/unbreakable-clean.html'],
  ['redundant-total', '/total.html', '/total-clean.html'],
  ['label-wrap', '/label-wrap.html', '/label-wrap-clean.html'],
  ['untranslated-text', UNTRANSLATED_PAGE, '/untranslated-clean.html'],
  ['fixed-overflow', '/sticky-panel.html', '/sticky-panel-clean.html'],
  ['modal-dismiss', MODAL_PAGE, MODAL_CLEAN],
]
const RULES = new Set([...PAIRS.map(([rule]) => rule), 'raw-placeholder'])
const CLICKED = new Set([MODAL_PAGE, MODAL_CLEAN])

let findings: FixtureFinding[] = []

const findingsOn = (route: string, rule: string): FixtureFinding[] =>
  findings.filter((finding) => finding.route === route && finding.rule === rule)

describe('codeality-ui data display rules', () => {
  beforeAll(async () => {
    findings = await fixtureFindings({
      routes: [
        ...PAIRS.flatMap(([, broken, clean]) => [broken, clean]).map((path) =>
          CLICKED.has(path) ? { path, click: ['#open'] } : path,
        ),
        '/date-locale-en.html',
      ],
    })
  }, 300_000)

  it.each(PAIRS)('%s fires on its page', (rule, broken) => {
    expect(findingsOn(broken, rule)).not.toEqual([])
  })

  it.each(PAIRS)(
    '%s stays silent on the near miss',
    (_rule, _broken, clean) => {
      expect(
        findings
          .filter(
            (finding) => finding.route === clean && RULES.has(finding.rule),
          )
          .map((finding) => `${finding.rule} ${finding.message}`),
      ).toEqual([])
    },
  )

  it('reports the stub of the account name, not the rest of the line', () => {
    expect(
      findingsOn(META_LINE, 'crowded-meta-line').map(
        (finding) => finding.subject,
      ),
    ).toEqual(['ul > li > div.meta > span.account'])
  })

  it('reports the bare date and the meta line it leads', () => {
    expect(findingsOn(DATE_PAGE, DATE_RULE)).toHaveLength(1)
    expect(findingsOn(DATE_PAGE, DATE_RULE)[0]?.message).toContain('and 1 more')
  })

  it('leaves ISO dates alone on an English page', () => {
    expect(findingsOn('/date-locale-en.html', DATE_RULE)).toEqual([])
  })

  it('says which ways of closing the drawer fail', () => {
    expect(
      findingsOn(MODAL_PAGE, 'modal-dismiss').map((finding) => finding.message),
    ).toEqual([expect.stringContaining('backdrop outside it and after Escape')])
  })

  it('takes identifiers for placeholders and English words for leaks', () => {
    expect(
      findingsOn(UNTRANSLATED_PAGE, 'raw-placeholder').map(
        (finding) => finding.message,
      ),
    ).toEqual([expect.stringContaining('"purchase:7905"')])
    expect(
      findingsOn(UNTRANSLATED_PAGE, 'untranslated-text').map(
        (finding) => finding.message,
      ),
    ).toEqual([expect.stringContaining('"rate"')])
  })
})
