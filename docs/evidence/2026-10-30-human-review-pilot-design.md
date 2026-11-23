# Human review time pilot: strict vs original patches (design)

Date: 2026-10-30. Status: designed and pre-registered, not run. Everything below
is fixed before any patch is generated or any reviewer is recruited; a change
after data collection starts is reported as a deviation, with its reason.

## Question

Does a person review a change made under the strict gate faster, and at least as
accurately, than the same change made without it?

The agent measurements in
[2026-10-12-agent-token-measurement.md](2026-10-12-agent-token-measurement.md)
found no token or correctness advantage for agents and ended on "a bet on longer
horizons and on human readers, which these runs do not measure". This pilot
measures the human-reader half of that bet. It is a pilot: its job is to decide
whether a full study is worth running and how large it must be, not to settle
the claim.

## Subject and material

[kbwo/ccmanager](https://github.com/kbwo/ccmanager) at commit `46fe720`, in the
two trees of the 20-task decay chain:

- **A (original)**: the original tree, checked by typecheck and the existing
  suite only.
- **B (strict)**: the strict tree, plus the strict judge as a ratchet.

Eight tasks T1-T8 are taken from the twenty-task chain, chosen before any patch
exists: the first eight tasks, in chain order, whose statement and hidden
acceptance test do not depend on any earlier task's change (judged from the task
text and the hidden test's imports). Every patch is generated against the
untouched tree at `46fe720`, original for A and strict for B, never against a
chain state, so no earlier chain run has to be reproduced. Generation uses the
chain's agent configuration, one fresh session per patch. A pair is usable only
when both patches pass the task's hidden tests, the existing suite and
`tsc --noEmit`, and (B) the ratchet. A failed generation is rerun up to twice; a
task with no usable pair after that is replaced by the next eligible task in
chain order, and the replacement is reported.

The raw patches from the October chain were not kept, so the pairs have to be
generated: about 16 agent runs. These runs cost money and need the owner's
approval before they start. If the chain's task statements and frozen hidden
tests are not recoverable either, eight new tasks are written and their hidden
tests frozen the same way before any run, and that is reported as a deviation.

### Seeded defects

Four of the eight tasks carry a planted behavioural defect, the same defect in
both patches of the pair, so detection measures the reviewer and not the patch.
The four tasks are drawn at random, once, after the pairs are built and before
any defect is written (`shuf -n 4` over T1-T8 is enough). The draw, its date and
the command are recorded in a sealed file that reviewers never see.

Each defect is written by hand before the pairs are shown to anyone, and must:

- change observable behaviour in a way a careful reviewer could reason out from
  the diff and the surrounding code (for example an off-by-one in a length
  budget, or an inverted guard on a symlink check);
- keep the hidden tests, the existing suite, the typecheck and the ratchet
  passing, so that tests cannot find it for the reviewer;
- touch the same logical line in A and B, differing only in where that line
  lives.

The sealed file has two parts. The first, for whoever prepares the material,
holds each defect's file and line in each patch. The second, for the scorers,
holds one sentence per defect stating the wrong behaviour and the input that
triggers it, with no file name, line number or other trace of the arm.

## Reviewers

Six, eight or ten reviewers, always an even number, because reviewers are
assigned in pairs. Eligibility: has reviewed TypeScript pull requests at work in
the last year; has not seen ccmanager or this repository; has not been told what
codeality is. Reviewers who know the owner's work on structural rules are
excluded, since they can guess the hypothesis.

Each reviewer reviews all eight tasks, four in A and four in B, and never sees
both versions of one task. A session takes about 3.5 hours with breaks. Whether
reviewers are paid, and how they are recruited, is the owner's decision.

## Assignment

Reviewers are numbered R1-R10 in recruitment order and grouped in pairs (R1 with
R2, R3 with R4, and so on). Both members of a pair review the tasks in the same
order, with complementary arms: arm pattern `ABBABAAB` by position for the odd
member and `BAABABBA` for the even one. So within every pair each task is
reviewed once in A and once in B.

Task orders are five rows taken from the cyclic 8x8 Latin square, with offsets
0, 4, 2, 6, 1 for pairs 1-5: position _p_ (1-8) holds task
`((p - 1 + offset) mod 8) + 1`.

| reviewer | pair | 1   | 2   | 3   | 4   | 5   | 6   | 7   | 8   |
| -------- | ---- | --- | --- | --- | --- | --- | --- | --- | --- |
| R1       | 1    | T1A | T2B | T3B | T4A | T5B | T6A | T7A | T8B |
| R2       | 1    | T1B | T2A | T3A | T4B | T5A | T6B | T7B | T8A |
| R3       | 2    | T5A | T6B | T7B | T8A | T1B | T2A | T3A | T4B |
| R4       | 2    | T5B | T6A | T7A | T8B | T1A | T2B | T3B | T4A |
| R5       | 3    | T3A | T4B | T5B | T6A | T7B | T8A | T1A | T2B |
| R6       | 3    | T3B | T4A | T5A | T6B | T7A | T8B | T1B | T2A |
| R7       | 4    | T7A | T8B | T1B | T2A | T3B | T4A | T5A | T6B |
| R8       | 4    | T7B | T8A | T1A | T2B | T3A | T4B | T5B | T6A |
| R9       | 5    | T2A | T3B | T4B | T5A | T6B | T7A | T8A | T1B |
| R10      | 5    | T2B | T3A | T4A | T5B | T6A | T7B | T8B | T1A |

Six reviewers use R1-R6, eight use R1-R8, ten use R1-R10. Properties, checked by
enumerating the table:

- Every reviewer has four A and four B reviews.
- Every task is reviewed _n_/2 times in each arm (3, 4 or 5), and every position
  holds _n_/2 reviews in each arm.
- Within a pair a task sits at the same position in both arms, so position and
  fatigue effects cancel in each pair's A-B contrast.
- Position balance across tasks is partial. Counted in pairs (each pair gives
  the task one review per arm at that position): with four pairs every task sits
  in the first half of the session for two pairs and in the second half for two.
  With three pairs, T1, T2, T7, T8 sit in the first half for one pair and in the
  second for two, and T3-T6 the reverse; with five pairs the split is 2/3 or
  3/2. No task sits in every position: that needs eight pairs.

## Procedure

Each patch is shown as a unified diff in one local diff viewer, the same for
both arms, with the whole tree at the patch's base browsable and searchable in
the same editor. No test runner, no agent and no network. The reviewer gets the
task statement the agent got, and is asked to review the change as they would a
colleague's pull request: decide approve or request changes, and list every
problem they would block on.

- **Blinding of reviewers.** Reviewers are told the study is about "how people
  review TypeScript changes". Arm labels never appear. The arm cannot be fully
  hidden, because strict patches visibly add more, smaller files; this is a
  known limit of the design and is reported, not corrected.
- **Blinding of the scorers.** Raw records carry arm codes X and Y. The scorers
  see the reviewers' comments with file paths and line numbers replaced by
  `<file>` and `<line>`, and the second, arm-free part of the sealed file. They
  score detection and blocking reports, the scoring is locked, the analysis
  script runs, and only then is the arm key opened. Code quoted inside a comment
  can still hint at the arm; that residual is reported, not corrected.
- **Time.** Start when the patch is opened, stop when the verdict is submitted,
  recorded by the form. Cap at 20 minutes per patch. A review stopped by the cap
  is recorded at 1200 seconds and flagged; its comments so far are scored for
  detection, and its verdict counts as not submitted, which is scored incorrect.

## Measures

Primary:

- **Review time** per patch, in seconds, capped at 1200, analysed on the log
  scale.

Guard (the primary result counts only when decision rule 2 does not fire):

- **Seeded-defect detection**: a seeded review counts as a detection when a
  blocking comment states the defect's wrong behaviour: what goes wrong, or for
  which input. A comment that only points at the defective line for another
  reason does not count. Two scorers score every seeded review independently
  against the sealed defect statement, resolve disagreements by discussion
  before the arm key is opened, and report their agreement before resolution
  (Cohen's kappa). If only one scorer is available, that is a deviation.

Secondary, reported but not used in the decision rules:

- false blocking reports (blocking comments on a correct line);
- verdict correctness (request changes on seeded patches, approve on the rest);
- comprehension: three short questions per task about what the change does,
  identical for A and B, answered after the verdict, scored 0-3;
- self-reported effort (1-7) and confidence (1-7).

## Analysis

All of it is fixed now and runs as one script on the locked records.

**Primary estimate.** Let _y_ be log review time. For pair _k_ and task _t_,
d<sub>kt</sub> = y(B) - y(A), the difference between the pair's two reviews of
that task. Each pair yields D<sub>k</sub> = mean over the eight tasks of
d<sub>kt</sub>, and the estimate is the geometric mean ratio

GMR = exp(mean over pairs of D<sub>k</sub>).

GMR below 1 means B is reviewed faster. Tasks are weighted equally. Only
complete pairs enter the analysis; _m_ is their number.

**Interval.** The pairs are independent of each other (different people, no
shared reviews), so D<sub>k</sub> are _m_ independent observations. The 95%
interval is exp(mean +- t_0.975(m - 1) * s / sqrt(m)), with _s_ the standard
deviation of D<sub>k</sub>. No bootstrap: three to five pairs give only 10 to
126 distinct resamples, too few for a percentile interval.

**Missing data.** A reviewer who withdraws, before or during the session, is
replaced by a new reviewer who takes the same slot from the start; the partial
records are kept and reported but not analysed. If a slot cannot be filled, the
pair is incomplete: it has no task with both arms, so it is left out of the
analysis and reported. A single capped review stays in, at 1200 seconds.

**Sensitivity.** A linear mixed model on log time, fitted by REML with R's
`lme4::lmer`:
`log(time) ~ arm + factor(position) + (1 | reviewer) + (1 | task)`. Reviewer,
not pair, is the random effect: pair adds nothing once both of its reviewers are
in. A singular fit or a convergence warning drops `(1 | task)` and refits; if
that also fails, the sensitivity result is reported as not available. Its arm
effect, exponentiated, is reported beside the GMR. The two disagree when one is
below 1 and the other above 1; equality with 1 is not a disagreement. A
sensitivity result that is not available is not a disagreement either: the pilot
goes on to the later rules on the GMR alone, and the report says the check could
not be made.

**Detection guard.** Each complete pair has four seeded reviews per arm, one per
seeded task. For pair _k_, e<sub>k</sub> = (detections in B - detections in A) /
4, and the detection difference is the mean of e<sub>k</sub>, with a _t_
interval computed the same way as for D<sub>k</sub>. Working per pair keeps the
reviewer clustering instead of treating the 4_m_ seeded reviews per arm as
independent trials. With three to five pairs this interval is exploratory, not
an assured 95% interval. When every e<sub>k</sub> is equal the estimated
variance is zero and the formula returns a single point: no interval is reported
then, only the common value and the statement that the pilot cannot bound the
difference. The result is conditional on these four defects: it says how
reviewers did on them, not on defects in general. A per-defect table (detections
in A and in B for each of the four) is always reported, since four defects are
too few for the rate alone to be read.

**Sample size for a full study.** The smallest effect worth claiming is a 20%
reduction in review time, GMR = 0.80, so delta = ln(0.80) = -0.223. With _s_ the
standard deviation of D<sub>k</sub> across the pilot's _m_ pairs, the pilot's
_s_ is inflated to its one-sided 80% upper confidence limit, because a
three-to-five-pair estimate is very noisy:

s_up = s * sqrt((m - 1) / chi2_0.20(m - 1))

where chi2_0.20(m - 1) is the 20th percentile of the chi-square distribution.
The factor is 2.12 for three pairs, 1.73 for four and 1.56 for five. The full
study needs, for two-sided alpha = 0.05 and power 0.80,

the smallest number of pairs _n_ whose paired _t_ test reaches that power:

power(n) = P(T > t_0.975(n - 1)), T noncentral _t_ with n - 1 degrees of freedom
and noncentrality 0.223 * sqrt(n) / s_up,

with reviewers = 2 * pairs and at least eight reviewers. R's
`power.t.test(delta = 0.223, sd = s_up, power = 0.80, type = "paired")` gives
the same number. The normal approximation, ceil(((1.960 + 0.842) * s_up /
0.223)^2), is not used: it undersizes the test the analysis actually runs. For
example, _s_ = 0.20 from four pairs gives s_up = 0.346, where the approximation
says 19 pairs (75.9% power) and the _t_ test needs 21 pairs, 42 reviewers.

## Decision rules

Applied in order; the first rule that matches decides, and the rest are not
consulted.

1. **Invalid, inconclusive.** Fewer than three complete pairs; or a usable pair
   of patches could not be built for eight tasks; or a scorer saw the arm key
   before scoring was locked; or the GMR and the mixed model disagree. Result:
   no claim either way, the cause is reported.
2. **Harm, drop the claim.** Over all complete pairs, the seeded reviews in B
   found at least `ceil(m / 2)` fewer defects than those in A (one fewer
   detection for every two pairs, a rate gap of 0.125 or more: 2 fewer of 12
   with three pairs, 2 of 16 with four, 3 of 20 with five). Result: the docs
   must not say strict patches are easier to review, and the per-defect table is
   published with the reason. A full study on time alone is not run.
3. **No signal, stop.** GMR above 0.90 (B is less than 10% faster, or slower).
   Result: the claim stays unsupported, the docs say it was piloted and not
   found, and no full study is run.
4. **Signal, run the full study.** GMR at or below 0.90 and the sample-size
   formula gives at most 40 reviewers. Result: run the full study with that many
   reviewers, the same material and this protocol, pre-registered again with the
   pilot's numbers.
5. **Signal, too costly to confirm.** GMR at or below 0.90 and the formula gives
   more than 40 reviewers. Result: the docs may say a pilot pointed in that
   direction, with its interval, and must not state it as a finding.

The pilot is not powered to establish non-inferiority of detection; rule 2 only
catches a visible harm. A full study under rule 4 re-tests detection with a
margin fixed in its own pre-registration.

## What is not settled here

Owner decisions, needed before anything runs:

- who the reviewers are, how they are recruited, and whether they are paid;
- approval for the ~16 agent runs that regenerate the patch pairs;
- where the raw records live (they identify reviewers by number only, but the
  recruitment list does not belong in this repository).

The other three measurements in the same backlog item (a lighter
cap/complexity/boundary gate against the full structural gate, first-run
adoption on clean fixtures, per-rule false-positive rate in report-only mode)
are not designed here.
