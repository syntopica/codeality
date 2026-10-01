/** A text with every digit replaced, so generated names and stamped dates collapse to their template. */
export const digitTemplate = (text: string): string =>
  text.replaceAll(/\d/g, '0')
