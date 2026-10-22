import type { Locator } from 'playwright'

/** Read only the tab list, excluding surrounding cards and their panels. */
export const tabListHeightOf = async (list: Locator): Promise<number> =>
  await list
    .boundingBox()
    .then((box) => box?.height ?? 0)
    .catch(() => 0)
