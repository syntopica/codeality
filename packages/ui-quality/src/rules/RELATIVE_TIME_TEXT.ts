/**
 * A short relative time such as 5 min, 3h ago, 2 d, 5m, hace 3 horas or just
 * now. A bare `m` counts only unspaced ("5m") or followed by "ago", trailing
 * text allowed ("12 m ago (edited)"): spaced, "100 m" is as likely a length in
 * metres as a duration.
 */
export const RELATIVE_TIME_TEXT =
  /^(\d+(\s?(min|mins|[hdw]|hr|hrs)|m|\sm\s+ago)\b.*|.*\bago|hace \d.*|just now|yesterday|ayer)$/i
