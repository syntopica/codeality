/// Line coverage in percent: the sum of `LH` over the sum of `LF`.
double readLcovLineCoverage(String lcov) {
  var found = 0;
  var hit = 0;
  for (final line in lcov.split('\n')) {
    if (line.startsWith('LF:')) found += int.tryParse(line.substring(3)) ?? 0;
    if (line.startsWith('LH:')) hit += int.tryParse(line.substring(3)) ?? 0;
  }
  return found == 0 ? 0 : hit * 100 / found;
}
