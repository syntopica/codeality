import { DATE_INPUT_MARK } from '@/capture/DATE_INPUT_MARK.js'

/** Removes the tags `MARK_DATE_INPUTS_SCRIPT` left on the page. */
export const UNMARK_DATE_INPUTS_SCRIPT = `document.querySelectorAll('[${DATE_INPUT_MARK}]').forEach((input) => input.removeAttribute('${DATE_INPUT_MARK}'))`
