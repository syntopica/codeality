# Unhappy-path audit: enumeration and message rubric

Status: design only, no code yet (2026-11-02, revised 2026-11-11 after review).
Owner ask of 2026-11-02, from the `verticagtm` TODO "Unhappy-path e2e". This
document is the item's smallest step: decide what gets enumerated and how a
failure message is judged, using verticagtm's real failures, before any of it is
generalized.

## Problem

An app built by agents tends to be tested on the happy path. When the input is
wrong, missing, or a dependency fails, users see one of a few bad outcomes:
nothing at all, a spinner that never stops, a sentence the framework redacted, a
raw database or vendor string, a generic "Something went wrong", or a "Saved"
toast for a write that never landed. verticagtm has shipped every one of these,
and each was found by hand.

`@syntopica/ui-quality` already judges one case. `action-silent` submits the
first form of the main region while every write is answered with HTTP 500, and
fails when nothing visible changes
(`packages/ui-quality/src/capture/checkAction.ts`). The audit extends that rule
in three ways: it covers every form, it uses more input and failure classes, and
it judges the message that appears, not only whether something appeared.

## Evidence: verticagtm's real failures

The catalog below has 28 entries, read from `verticagtm/TODO_LOG.md` on
2026-11-02, grouped by what the user saw. The last column names the rubric
verdict (defined below) that would have caught each entry. A dash means this
audit cannot catch it: a DOM check cannot judge the message, or the failure
happens outside what the audit drives (a read, or a state seen only after a
reload). Which case reproduces each catchable entry is in the table under "Cases
per submit".

| #   | Surface and trigger                                              | What the user saw                                                              | Verdict          |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------- |
| 1   | invite action, permission                                        | "Could not send invite - An error occurred in the Server Components render..." | `redacted`       |
| 2   | 13 of 28 actions threw messages                                  | redacted in production                                                         | `redacted`       |
| 3   | research action, vendor quota thrown                             | generic wizard error, top-up path lost                                         | `generic`        |
| 4   | unapproved workspace, thrown                                     | each caller's wrong text ("Could not read the product pages")                  | -                |
| 5   | stale action id after deploy                                     | raw "Server Action ... was not found"                                          | `redacted`       |
| 6   | 17 persist callers, PostgREST error object                       | "Database write failed."                                                       | `generic`        |
| 7   | Add account form, non-uuid id                                    | "invalid input syntax for type uuid: acc-..."                                  | `raw`            |
| 8   | background job blocked                                           | "Blocked by marketingCollateral"                                               | `raw`            |
| 9   | multi-select                                                     | micro-vertical UUID instead of its label                                       | - (not a submit) |
| 10  | billing and usage loaders                                        | raw PostgREST errors                                                           | - (read)         |
| 11  | buy credits, Stripe test key                                     | Stripe's "No such price"                                                       | - (test mode)    |
| 12  | firm profile form, whitespace name and website "not-a-valid-url" | accepted; "Firm profile saved" shown first                                     | `accepted-wrong` |
| 13  | password change, eight spaces                                    | accepted                                                                       | `accepted-wrong` |
| 14  | "Generate all sections" on a finished plan                       | nothing                                                                        | `absent`         |
| 15  | micro-vertical proposal, trigger refusal                         | "Creating..." forever, Cancel disabled                                         | `hang`           |
| 16  | export, worker refused                                           | button spun forever                                                            | `hang`           |
| 17  | setup buttons disabled                                           | no reason given                                                                | -                |
| 18  | refused row inserted optimistically                              | vanished on reload                                                             | - (after reload) |
| 19  | autofill quota                                                   | "Autofill failed - Fill the steps manually"                                    | `generic`        |
| 20  | credit hold larger than the balance                              | "You are out of credits..." with credits left                                  | -                |
| 21  | failed RPC                                                       | "You're out of credits (0 / 0 used)"                                           | -                |
| 22  | credit refusal                                                   | "No web search results were found"                                             | -                |
| 23  | spending cap of 0                                                | banner promised billing that would not happen                                  | -                |
| 24  | product-research refusals                                        | every one titled "Out of credits"                                              | -                |
| 25  | failed reads: subscriptions, portal, Auth, DB, rate-limit RPC    | each shown as another state ("Upgrade", logged out, "Plan not found")          | -                |
| 26  | provider 5xx or missing key                                      | "found nothing"                                                                | -                |
| 27  | job still running                                                | shown as a failure                                                             | -                |
| 28  | invite already used                                              | told to ask for another                                                        | -                |

The audit can catch 13 of the 28 entries (1-3, 5-8, 12-16, 19). The other 15 are
out of scope (see "Not judged"). Entries 4, 17 and 20-28 are messages that are
present and specific but give the wrong reason. Judging those requires knowing
the true cause, and the audit only knows the cause it set up. They stay with the
agentic, exploratory half of verticagtm's suite. Entry 10 is a failed read, and
the audit fails writes only. Entry 18 looked like a success until the next
reload, and the audit judges one observation per submit. Entry 9 is a filter
control that showed an id as its label: no submit and no write is involved, so
nothing here drives it. Entry 11 was closed in verticagtm as not a production
defect (a Stripe test-mode key on localhost that cannot see live prices), and
"No such price" carries no machine marker the rubric could match without also
matching ordinary product copy.

One way verticagtm is built shapes the design. 57 `'use server'` files live in
`src/app-actions/`, and only 2 forms post through `<form action>`. Every other
form is controlled state, with an `onSubmit` handler or a `use*Page().save` hook
that calls an action. Enumeration therefore cannot depend on form libraries or
on `<form action>`. What every one of these submits shares is the request on the
wire.

## Enumeration

There are two layers. The runtime layer is generic and produces findings. The
static layer is per-framework and only reports coverage.

### Runtime: every submit the configured routes expose

For each route in `codeality-ui.json`, after the route's `click` steps:

1. Find every visible, enabled submit control inside a `form` in the main
   region, plus every `button` whose accessible name starts with a write verb.
   The verb list is configurable, defaulting to save, create, add, send, invite,
   generate, export, delete, update, confirm and continue. Buttons outside a
   `form` cover controlled-state UIs like verticagtm's.
2. Reload the route before each case, so one case cannot leave state behind for
   the next.
3. For each control, record the fields of its scope and their constraints from
   the DOM: `type`, `required`, `pattern`, `min` and `max`, `minlength`,
   `maxlength`, and `aria-required`. Fields are identified by accessible name,
   because verticagtm's inputs often have neither `name` nor `id` (the invite
   dialog's email field is labelled "Email" and has neither).

A control's scope is what owns its fields. It is the control's `form` when it
has one. verticagtm's `AddAccountDialog` has no `form` element, so otherwise it
is the nearest ancestor that is a dialog (`dialog`, `role="dialog"` or
`role="alertdialog"`), and failing that the nearest ancestor `fieldset`,
`section`, `role="group"` or `role="region"` that holds at least one field. A
control with none of these has no fields: it runs the transport cases and
`as-is` only, and the report says so in a coverage line rather than guessing
that every field in the main region is its own.

### Valid inputs: the baseline every server case starts from

A form rendered empty does not reach the server. verticagtm's invite dialog
opens with an empty email, and `sendTeammateInvite` toasts "Enter a valid email"
and returns before `inviteUser` is called. A server case that submits that form
as rendered judges the client's validation, never the permission failure of #1.

So each route can declare the valid values its forms need:

```json
{
  "path": "/settings/team",
  "click": ["role=button[name='Invite teammate']"],
  "inputs": {
    "Send invite": { "Email": "audit-invite@example.test" }
  }
}
```

`inputs` maps a control's accessible name to the fields of its scope, each by
accessible name. A field with no configured value keeps what the page rendered.
The audit does not guess valid values: a guessed email, date or id fails the
app's own checks as often as it passes them, and that would hide the server.

### Did the server run?

A server case is only evidence about the server if a write left the browser. For
every case the audit records whether a non-GET request was sent between the
submit and the deadline. When none was, the observation is tagged `client`:

- under `as-is`, a `client` observation that shows a message means the
  configured inputs are incomplete (the app refused them and said so). It is a
  coverage line naming the control, not a finding, and it never counts toward
  the catalog acceptance below. A `client` observation with no message, no
  dialog and no change of address is still a finding: `absent`, reported as a
  silent client no-op. That is #14, where "Generate all sections" on a finished
  plan queues no work, sends no write and shows nothing; a silent refusal is a
  defect whatever the inputs were;
- under `missing` and `wrong`, a client refusal is legitimate (the app caught
  the bad value itself). The rubric still judges its message, so a refusal with
  no message fails `absent`, but it is reported as client validation and never
  as a server outcome.

The subject of a finding is the route plus the control's accessible name, the
same subject `action-silent` uses. The fingerprint is rule, route, subject and
case. Viewport and colour scheme are left out, and the audit runs once per route
at the first viewport. It judges behaviour, not layout.

### Static: which actions no route reached (coverage only)

The server-action adapter for Next.js reads two facts, checked against the
installed `next@16.4.4` in verticagtm:

- every server-action request carries the `next-action` header (`ACTION_HEADER`
  in `next/dist/client/components/app-router-headers.js`);
- the build writes `server-reference-manifest.json` (`SERVER_REFERENCE_MANIFEST`
  in `next/dist/shared/lib/constants.js`), which maps action ids to modules.

During the runtime cases, the audit records the `next-action` id of each
intercepted write. After the run, it lists the manifest's actions that no case
sent. That list is a coverage line in the report, not a finding. It tells the
owner which actions need a route or `click` steps in the config. A run without a
build, or on a framework without an adapter, skips this layer and says so.

Other frameworks join later, each through an adapter that answers two questions:
how to recognize a request as an action, and where the list of all actions
lives. Plain `fetch` writes need no adapter: every non-GET request is already
intercepted.

## Cases per submit

Each case is one reload, an optional fill, a submit, and one observation. The
cases fall into two classes, and the difference decides what a finding proves.

**Transport cases** answer or hold the write in the browser, before it leaves.
The server never runs, so its validation, its error handling and the way Next.js
serializes and redacts a thrown error never run either. These cases prove only
that the client's error branch surfaces a transport failure: a proxy or CDN
error page, a rate limiter, an offline network, a timeout. That is a real class
of failure on its own, but it is not the one verticagtm shipped. None of the
catalog entries is reproduced by a transport case, because each was a server
outcome (a thrown error, a refusal, a raw database string) that the client then
mishandled.

**Server cases** let the request reach the real server, so the historical
failure happens the way it happened in production. Redaction (#1, #2) only
exists in a production build: the server sends a digest instead of the message,
and React's production client substitutes "An error occurred in the Server
Components render...". Server cases therefore run against `next build` plus
`next start` (or a deployed throwaway environment), never `next dev`, which
shows the original message and would let a redaction bug pass.

| Case           | Class     | What it does                                                                                                                                | Writes reach the server | Catalog              |
| -------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | -------------------- |
| `fail-500`     | transport | answer every write with HTTP 500, before it leaves the browser (today's `failWrites`)                                                       | no                      | none                 |
| `fail-status`  | transport | the same, once each with 403, 409 and 429                                                                                                   | no                      | none                 |
| `fail-hang`    | transport | hold every write without answering, then judge at the deadline                                                                              | no                      | none                 |
| `fail-action`  | transport | answer `next-action` writes with a non-RSC 500, once as `application/json` and once as `text/plain` with a marker body (see below)          | no                      | none                 |
| `stale-action` | server    | rewrite the `next-action` header to a well-formed id the build does not contain, and let the request through                                | no action runs          | 5                    |
| `as-is`        | server    | fill the configured valid inputs and submit, signed in as a fixture account whose state provokes the failure                                | **yes**                 | 1-3, 6, 8, 14-16, 19 |
| `missing`      | server    | from the valid baseline, clear one field at a time, set `noValidate` on the form, submit                                                    | **yes**                 | 12                   |
| `wrong`        | server    | from the valid baseline, replace one field at a time with a value its type should refuse (list below), set `noValidate` on the form, submit | **yes**                 | 2, 6, 7, 12, 13      |

The values `wrong` uses are: whitespace only, padded to the field's `minlength`
or to 8 characters when it has none (so "eight spaces" reaches the server past a
length check, as in #13); `not-a-valid-url`; `not-an-email`; a number outside
`min` and `max`; `maxlength + 1` characters; and a junk id such as `acc-1` in a
field whose name or valid value looks like an id (#7). Changing one field at a
time keeps one field's client check from hiding how the server treats another.

`fail-action` follows the installed client, not a guess. In `next@16.4.4`
(installed in verticagtm on 2026-11-11), `server-action-reducer.js` treats any
response whose `content-type` is not `text/x-component` as invalid, and picks
the error message with
`res.status >= 400 && contentType === 'text/plain' ? await res.text() : 'An unexpected response was received from the server.'`.
So the `application/json` variant must produce the generic placeholder, which
the rubric judges `redacted`, and the `text/plain` variant exposes whatever body
was sent, so the audit sends a marker string and the rubric judges it `raw` if
the marker reaches the page. Neither variant says anything about production
Server Components redaction, which only a server case in a production build
exercises.

`stale-action` reproduces #5 exactly and is safe without `allowWrites`. When the
action id is unknown, `action-handler.js` (`handleUnrecognizedAction`) answers
with `x-nextjs-action-not-found: 1` and a `text/plain` body before any action
runs, and the client reducer throws
`Server Action "<id>" was not found on the server.`, the string verticagtm users
saw after a deploy. It runs only where the Next.js adapter recognized the write
as an action.

`as-is` needs the failure's precondition to be true on the server, and the
form's valid inputs from the route's `inputs`: a member without invite rights
(#1, with a valid email), an organization out of research or autofill quota (#3
and #19), a finished plan (#14), a refusing trigger or worker (#15, #16). The
audit does not create that state. A throwaway environment provides it as fixture
accounts, and each fixture is its own `codeality-ui.json` whose `auth` signs in
as that account; `AuthConfig` already takes one session per config. The case set
is the same in every run.

`missing` and `wrong` both set `noValidate` on purpose. When the browser refuses
a form for its own validation, the user is told, and `action-silent` passes that
case. But the app's own validation and the server's are what verticagtm got
wrong (#12, #13), and native validation hides them. A control outside any `form`
has no `noValidate` to set; the app's own handler is all there is.

**Safety.** The transport cases never let a write reach the server, so they can
run against any environment, as `action-silent` already does. `stale-action`
reaches the server but no action runs. `as-is`, `missing` and `wrong` execute
real actions, so they run only when the config sets
`"unhappyPath": { "allowWrites": true }`. The README must say that this belongs
on a throwaway organization or database, as verticagtm's suite already assumes.
Without that flag, these three cases are skipped and the report lists them as
skipped.

## Observation

After the submit, the audit polls until the control's deadline, as `sawFeedback`
already does, and collects:

- new visible text lines, compared with the snapshot taken before
  (`newLinesOf`);
- new `FEEDBACK_SELECTOR` matches (alerts, `aria-invalid` fields, assertive live
  regions), along with the text of their `aria-describedby` and
  `aria-errormessage` targets;
- `window.alert` and `confirm` dialogs, with their text;
- a change of address;
- the busy state at the deadline: the control is still disabled, or an ancestor
  or the control itself has `aria-busy="true"`, or its text changed to a
  progressive verb ("Saving...", "Creating...").

The deadline is `CHANGE_TIMEOUT_MS` (8 s) unless the route gives the control its
own. verticagtm's `useExportRun` allows 120 s (`PLAN_EXPORT_TIMEOUT_MS`) before
it reports a failure, so an 8 s deadline would call a healthy export a hang and
could not tell the fixed export from #16:

```json
{ "path": "/plan", "deadlines": { "Export": 125000 } }
```

`deadlines` maps a control's accessible name to milliseconds. The audit stops
polling as soon as the control is idle again or a message appears, so a longer
deadline costs time only on a control that is still busy. A control still busy
at the default deadline with no entry is reported as `hang` with a note naming
`deadlines`, since the audit cannot know the app meant to wait longer.

A busy label is not feedback. `newLinesOf` reports a button whose text changed
from "Create" to "Creating..." as a new line, so before judging, the audit drops
from the new lines the submit control's own current text and any other line that
is only a progressive verb (one word ending in "ing", with or without a trailing
ellipsis, "..." or the single character). Those lines count toward the busy
state, never toward the message. Without this, #15 would show "Creating..." as
its message and pass `hang`.

The message under judgment is the remaining new feedback text, joined in order:
alerts and their described-by text first, then the other new lines. A route
whose idle page already changes text on its own (a clock, a live counter) has
the same problem `action-silent` has today, and gets the same answer: a
`disable` entry.

## Message rubric

The rubric is a pure function: verdict of (case, observation). It is unit-tested
on the catalog's real strings. The first matching verdict wins, in this order:

| Verdict          | Fails when                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hang`           | at the deadline, the control is still busy and no message appeared, busy labels excluded (`fail-hang` waits for its own longer deadline, then fails if the hold is never surfaced as a timeout message)                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `absent`         | no message, no dialog, no change of address (today's `action-silent`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `redacted`       | the message contains a framework placeholder: "An error occurred in the Server Components render", "digest", "Server Action ... was not found", "An unexpected response was received from the server", "Minified React error", "Application error: a client-side exception"                                                                                                                                                                                                                                                                                                                                                                                     |
| `raw`            | the message contains machine text: a UUID, a PostgREST or Postgres fragment ("invalid input syntax for type", "violates ... constraint", "duplicate key", `PGRST\d+`), a stack frame, a JSON object, `[object Object]`, the bare status ("500", "Internal Server Error"), the injected body, or a camelCase identifier (a lowercase word of two or more letters followed by one or more capitalized parts, as in `marketingCollateral`; `iPhone` and `eBay` do not match) that was not on the page before the submit                                                                                                                                            |
| `false-success`  | under a `fail-*` case only, the message contains a success word (saved, created, added, sent, updated, done) and no failure word: the audit failed the write, so any success-only message is false                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `generic`        | after the message is split into segments at " - ", ": " and sentence ends, and segments that are a generic tail or a fallback instruction are dropped, every remaining segment matches a generic phrase (so "Autofill failed - Fill the steps manually" is generic, and "Could not send invite - You need the Admin role" passes). Generic phrases: "something went wrong", "an error occurred", "error", "unknown error", "database write failed", "request failed", "<word> failed", "could not <word>". Tails and fallbacks: "please try again", "try again later", "try again", "contact support", "refresh the page", and any segment ending in "manually" |
| `accepted-wrong` | under `missing` or `wrong` only, the observation is not tagged `client`, and the address changed to a detail page or a success word appeared with no failure word, and no field was marked invalid: the server accepted the bad value                                                                                                                                                                                                                                                                                                                                                                                                                           |
| pass             | a message that is none of the above                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

`false-success` and `accepted-wrong` apply to disjoint cases, so their places in
the order never compete: "Password updated" after `wrong` filled eight spaces is
`accepted-wrong` (#13), and "Saved" after `fail-500` is `false-success`. No
catalog entry is `false-success`: verticagtm's optimistic "saved" toast is
followed by a save-failed toast when the write fails (the firm-profile entry of
its TODO_LOG), so the message carries a failure word. The verdict exists for a
client that toasts success whatever the response.

Dialog text from a dialog with no other message is judged the same way. Phrase
lists are lowercased and matched on word boundaries. Each list is configurable,
so a product can add its own generic phrases. Its own copy can always be
exempted with a `disable` entry, which needs a reason.

`raw` is the verdict most at risk of false positives. A product can legitimately
show an id ("Invoice INV-2026-0042"). For that reason, UUIDs and camelCase
identifiers count only when they are not already in the page's visible text
before the submit. Order numbers and other ids the product chose to show stay
quiet.

## Not judged

- **Wrong reasons**: catalog 4, 17, and 20-28. The message is specific but names
  the wrong cause. The audit knows only the cause it set up, and knowing that a
  500 should not read "Out of credits" would require product copy rules. That
  belongs to verticagtm's agentic half, which turns each finding into a
  Playwright spec.
- **After a reload, or later**: failures that surface minutes later in a
  background job, or only after a reload, like #18's vanished row. The audit
  judges one observation per submit.
- **Reads**: the cases fail writes only. Failing reads (catalog #10, #25) would
  blank most screens and judge loaders, not actions. Read failures are a
  candidate follow-up.
- **Not a submit, or not a defect**: #9 was a filter control that displayed an
  id, with no write behind it; #11 was a test-mode Stripe key, closed in
  verticagtm as not a production defect.

## Shape in the package

There is one new opt-in rule, `action-message`, with the verdict as its `kind`.
It is not one rule per verdict: the PM note asks for precision, not new rule
sprawl, and one rule needs only one `disable` entry when a team opts out.
`action-silent` stays as it is, so current users see no change. When
`action-message` is enabled, it takes over the `absent` verdict for the routes
it covers, and `action-silent` steps aside on those routes so the same submit is
not reported twice.

## Remaining steps (each its own commit, each with tests)

1. A pure rubric, `actionMessageVerdictOf(case, observation)`, with fixtures
   drawn from the catalog strings above. This includes a negative fixture for
   every verdict, a specific message that must pass, and these contracts:
   "Blocked by marketingCollateral" is `raw`; "Buy the new iPhone" passes;
   "Password updated" under `wrong` is `accepted-wrong`; "Saved" under
   `fail-500` is `false-success`; "Enter a valid email" under `wrong` tagged
   `client` passes; a control whose only new line is its own label changed to
   "Creating..." (as `newLinesOf` returns it) and still disabled at the deadline
   is `hang`, not pass (#15); an `as-is` observation tagged `client` with no
   message, dialog or change of address is `absent` (#14), while one tagged
   `client` that shows "Enter a valid email" is a coverage line, not a finding.
2. Enumerate every submit control on the route, not only the first, resolve each
   one's scope (a fixture dialog with no `form` owns its fields; a bare button
   owns none), and read the route's `inputs` and `deadlines` (a control busy for
   10 s that then shows a message passes with a 15 s deadline and is `hang`
   without one).
3. The transport injections `fail-status`, `fail-hang` and `fail-action`, next
   to `failWrites`, each tested against a fixture page whose client mishandles
   that failure.
4. The server cases `as-is`, `missing` and `wrong` behind `allowWrites`, built
   on the valid baseline and tagging `client` observations, plus a README
   warning that they need a throwaway environment and a production build.
5. The Next.js adapter: `next-action` ids against
   `server-reference-manifest.json` for coverage, and the `stale-action` case.
6. A first run on a verticagtm throwaway org, against `next build` plus
   `next start`, with one config per fixture account. Its acceptance criterion:
   each of the 13 catchable catalog failures, reintroduced one at a time on a
   scratch branch there, is reported by the server case its row names in the
   case table, with the catalog's verdict. Transport-case findings from the same
   run are reported but do not count toward the 13, because they do not
   reproduce a catalog failure.

The throwaway environment for step 6 exists in verticagtm (checked 2026-11-23):
the isolated local lane under `scripts/isolated-db/`, started with
`start.sh <work-dir>` and seeded with `seed-demo-copy.sh <work-dir>`, which
writes the local owner's sign-in to `<work-dir>/owner.env`. It carries
production's schema and no production data, sends no mail and blanks the Stripe,
Resend and model keys. Roles there are owner, admin and member;
`src/test/isolated-db/` seeds any of them. Its `dev.sh` runs `next dev` only, so
step 6 starts by adding a sibling script that runs `next build` and `next start`
under the same environment. Nothing launched with verticagtm's plain
`.env.local` is safe: it points at production.
