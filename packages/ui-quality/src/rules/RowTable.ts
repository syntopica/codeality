import type { ElementBox } from '@/model/ElementBox.js'

/** A run of repeated rows under one parent, each row split into its cells. */
export type RowTable = { parent: ElementBox | undefined; cells: ElementBox[][] }
