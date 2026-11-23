/**
 * A short relative time such as 5 min, 3h ago, 2 d, 5m, hace 3 horas or just
 * now. A bare `m` counts only unspaced ("5m") or followed by "ago", trailing
 * text allowed ("12 m ago (edited)"): spaced, "100 m" is as likely a length in
 * metres as a duration. The unit must end there: "7 días" names a period,
 * and \\b would end the unit before an accented letter.
 */
export const RELATIVE_TIME_TEXT =
  /^(\d+(\s?(min|mins|[hdw]|hr|hrs)|m|\sm\s+ago)(?![\p{L}\p{N}_]).*|.*\bago|hace \d.*|just now|yesterday|ayer)$/iu
