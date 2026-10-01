import type { ElementBox } from '@/model/ElementBox.js'
import type { Rgba } from '@/model/Rgba.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { isPainted } from '@/rules/isPainted.js'
import { WHITE } from '@/rules/WHITE.js'

/** The nearest painted fill behind an element; the canvas is taken as white. */
export const backdropOf = (element: ElementBox, elements: ElementBox[]): Rgba =>
  ancestorsOf(element, elements).find((ancestor) =>
    isPainted(ancestor.backgroundColor),
  )?.backgroundColor ?? WHITE
