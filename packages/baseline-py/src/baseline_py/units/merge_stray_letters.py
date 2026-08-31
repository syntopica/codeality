"""Fold a one-letter segment into the segment that follows it."""


def merge_stray_letters(segments: list[str]) -> list[str]:
    """Return the segments with stray single letters merged forward.

    The case-boundary split leaves ``o`` in front of ``auth`` and ``i`` in
    front of ``pv6``; merging them yields oauth and ipv6.
    """
    merged: list[str] = []
    carried = ""
    last_index = len(segments) - 1
    for index, segment in enumerate(segments):
        candidate = carried + segment
        carried = ""
        if len(candidate) == 1 and index != last_index:
            carried = candidate
            continue
        merged.append(candidate)
    return merged or [carried]
