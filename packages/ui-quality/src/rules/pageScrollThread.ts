import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { childrenIndex } from '@/rules/childrenIndex.js'
import { MIN_THREAD_ITEMS } from '@/rules/MIN_THREAD_ITEMS.js'
import type { Rule } from '@/rules/Rule.js'
import { SCROLLABLE } from '@/rules/SCROLLABLE.js'
import { VIEWPORT_HEIGHTS_FOR_PAGE_SCROLL } from '@/rules/VIEWPORT_HEIGHTS_FOR_PAGE_SCROLL.js'

// A conversation or a feed belongs in a pane of its own height that scrolls
// inside (so the composer and the header stay where they are). A live
// region with a long list of children whose box and ancestors do not scroll
// grows the document instead: past three screens the whole page is the pane.
export const pageScrollThread: Rule = (snapshot) => {
  if (
    snapshot.documentHeight <=
    snapshot.viewportHeight * VIEWPORT_HEIGHTS_FOR_PAGE_SCROLL
  )
    return []
  const { elements } = snapshot
  const children = childrenIndex(elements)
  return elements.flatMap((thread) => {
    if (!thread.live) return []
    if ((children.get(thread.id) ?? []).length <= MIN_THREAD_ITEMS) return []
    const scrolls = [thread, ...ancestorsOf(thread, elements)].some((box) =>
      SCROLLABLE.has(box.overflowY),
    )
    if (scrolls) return []
    return [
      {
        rule: 'page-scroll-thread',
        severity: 'warn',
        message: `a thread of ${String((children.get(thread.id) ?? []).length)} items grows the page to ${String(snapshot.documentHeight)}px instead of scrolling in a pane; give it a fixed height and overflow-y: auto`,
        subject: thread.selector,
        identity: thread.signature,
      },
    ]
  })
}
