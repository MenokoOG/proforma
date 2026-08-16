# ProForma — open-source release commit sequence
#
# RUN ON WINDOWS, from F:\classHuman\proforma.
# Prepared in an agent sandbox; not executed there, because the sandbox holds
# no credentials (so `git fetch` cannot run) and repo state is measured on
# Windows.
#
# Eight commits, ordered so each one is coherent on its own and the
# whitespace-only reformat never mixes with a functional change.
#
# Review each diff as it goes past. Nothing here pushes.
# This file is gitignored — delete it when you are done.

$ErrorActionPreference = 'Stop'
Set-Location F:\classHuman\proforma

# --- Fetch before you branch. Not optional. -------------------------------
git fetch
git status

Write-Host "`nIf the working tree is not what you expect, stop here.`n" -ForegroundColor Yellow
Read-Host "Enter to cut the branch, Ctrl+C to abort"

git switch -c claude/oss-release

# --- 1. Remove the codeguard instruction set ------------------------------
git add -A .github/instructions
git commit -m "chore(repo): remove the codeguard instruction set from .github

An internal AI code-review ruleset, not project documentation. In .github/ it
sat next to the issue templates a newcomer reads first, and at 22 files it
dwarfed a repo whose selling point is having almost no surface area. It lives
in the prompt library; consume, don't fork.

History keeps it."

# --- 2. Tooling and project identity --------------------------------------
git add package.json package-lock.json tsconfig.json vite.config.ts `
        eslint.config.js .prettierrc.json .prettierignore `
        .editorconfig .nvmrc .env.example .gitignore
git commit -m "build: add ESLint, Prettier and Vitest, and fill in package identity

Adds lint, format, format:check, test and test:watch scripts, an engines field
pinning Node 22, and the description, keywords, licence, author, repository,
bugs and homepage fields a stranger's tooling reads. Stays private: true --
ProForma is an application with no importable API, so it is clone-and-run and
is not published to npm.

Prettier is set to printWidth 98, the width producing the smallest diff
against the existing hand-formatting. ESLint bans explicit any and switches
off react-refresh/only-export-components for ui.tsx and store.tsx, which
colocate primitives with components deliberately.

tsconfig gains Node types for the test suite, which reads app.css off disk.
vite.config gains a BASE_PATH override so CI can build for project pages
without changing local dev.

.gitignore now covers .env, the design handoff bundle and internal notes."

# --- 3. Prettier across the codebase --------------------------------------
git add .prettierrc.json .prettierignore `
        src/components/AssistPanel.tsx src/components/LineEditor.tsx `
        src/components/PrintReport.tsx src/lib/calc.ts src/lib/export.ts `
        src/lib/format.ts src/state/store.tsx `
        src/steps/Architecture.tsx src/steps/Benefits.tsx src/steps/Brief.tsx `
        src/steps/Costs.tsx src/steps/Export.tsx src/steps/Risks.tsx `
        src/steps/Roadmap.tsx src/steps/UseCaseStep.tsx
git commit -m "style: apply Prettier across the codebase

Whitespace only. Kept as its own commit so it cannot drown the functional
changes that follow.

Verified behaviour-neutral rather than assumed: the production bundle was
built before and after and the artefacts are byte-identical -- SHA-256 match
on both dist/assets/*.js and dist/assets/*.css. Any future repo-wide reformat
should meet the same bar.

One non-whitespace change rides along, in format.ts. ESLint flagged the
escape in /[^0-9.\\-]/ as useless, in parseAmount and parseSigned. Removing it
was checked against every character code 0-255 and every parser test case
before the edit: the two regexes are identical. parseAmount is covered by
tests as of the following commits.

src/lib/calc.ts appears here and only here -- the calculation engine has no
substantive change in this release."

# --- 4. Palette and mobile Results ----------------------------------------
git add src/styles/app.css src/components/Chart.tsx src/components/ui.tsx `
        src/steps/ResultsStep.tsx
git commit -m "feat(ui): new palette and a mobile-first Results step

Palette. The warm cream ground and teal brand give way to a cool grey ground
and a blue brand. --brand and --benefit were previously the same teal, so
interface chrome and positive figures shared a hue; benefit is now a deep
green and cost a carmine, and the two never collide.

Adds --on-brand. Five rules hard-coded white on a brand fill, which drops to
roughly 1.6:1 against the light blue brand in dark mode. A sixth candidate,
.scale button[aria-pressed='true'], is deliberately left as #fff: it sits on
the fixed risk severity ramp, not on --brand.

--ink-3 moved in both themes -- #5f6873 light, #848f9f dark. It cleared only
3.85:1 on --surface and 3.43:1 on --paper, against a WCAG AA requirement of
4.5:1. That failure predates this palette; the old one failed too. Every
--ink-3 pairing now clears 4.5:1 on every ground in both themes.

Results below 760px. The seven-column table was a screen-and-a-half sideways
scroll at 375px, so Year 1 and the five-year total could never be read
together -- the one comparison the table exists for. It is replaced by one
expandable card per year showing the net, the running total and every non-zero
line, with the break-even year marked in place. The table stays mounted and is
one tap away.

The media query is scoped to 'screen' deliberately. PrintReport renders its
own .tablewrap, so an unscoped rule would blank the five-year table on
anything printed from a phone.

Chart below 600px gets a second geometry rather than being scaled down: at
720 wide in a 375px viewport a 10px axis label renders at about 4.8px.
Gridlines drop from five to two and the cumulative figure under each bar is
signed and coloured, because on a phone that row does the work the cumulative
line does on a desktop.

Stat values no longer break mid-number. \$1,230,000 was wrapping to \$1,23 /
0,000; secondary figures now compact below 600px and the hero keeps the exact
figure.

Deviates from the design handoff in two recorded places, both commented in
app.css: the --ink-3 contrast correction, and no compact prop on Stat -- the
value reaches Stat already formatted, so the prop would have been inert."

# --- 5. Industry rewrite and source attribution ---------------------------
git add src/data/industries.ts src/data/decisions.ts src/data/roadmap.ts `
        src/data/stakeholders.ts src/lib/defaults.ts
git commit -m "refactor(data): rewrite the industry bank and attribute every source file

The industry entries were the largest near-verbatim block in the repo. All 20
industries x predictive/generative/agentic are rewritten in ProForma's own
voice, framed around the cost and benefit shape a business case would actually
claim -- which benefit category the value lands in, which cost line moves --
rather than as encyclopedia summaries. The industry list and the
predictive/generative/agentic structure carry; the prose does not.

Unsourced performance figures inherited from the source material are removed
rather than repeated. 'Double-digit accuracy gains are typical' and 'cut
unplanned stops by around a quarter' are benchmark claims with no benchmark,
and Operating Doctrine applies to material we republish as much as to material
we write.

'Autonomous' is now absent from the codebase. It appeared twelve times,
including in AI_TYPE_META, where the agentic label read 'Autonomous actions &
decisions' and now reads 'Governed actions & decisions'.

Every file carrying framework content gains a header comment naming its source
document. roadmap.ts, stakeholders.ts and decisions.ts are attributed rather
than rewritten: they encode structure and method, and changing them would
change what the framework says rather than how ProForma says it."

# --- 6. Tests -------------------------------------------------------------
git add src/lib/__tests__ src/styles/__tests__
git commit -m "test: cover the calculation engine, the parser and colour contrast

96 tests. The repo had none.

The regression guard is the point: seeding the framework's own figures must
still produce Year 1 net -1,930,000, Years 2-5 net +790,000 each, a running
total of -1,930,000 / -1,140,000 / -350,000 / +440,000 / +1,230,000, total
cost 4,220,000, total benefit 6,850,000, total mitigation 1,400,000 and
payback in year 4. Those figures are verified against the source workbook, so
a change that moves one is wrong until proven otherwise.

Also covered: the spreading rule, payback interpolation to the fraction, the
never-breaks-even case, IRR returning null on a same-sign series and finding a
true zero when the flows cross, the token model's 0.1x cache multiplier and
overhead applied on top of the subtotal rather than inside it, parseAmount
across '1.2m' / '1,200' / '\$450k' / '(500)' / '', and hydrate() round-tripping
a document and tolerating missing, malformed and user-added keys.

parseAmount('(500)') returning 500 rather than -500 is pinned as intended
behaviour with a comment explaining why: amounts carry direction through their
line kind, not a minus sign. If that ever changes it is a product decision,
not a parser bug to quietly fix.

Contrast is tested rather than asserted. The suite reads the real token block
out of app.css and checks every text token against every ground it can land
on, in both themes, so the README's accessibility claim is enforced by CI.
Note the extractor merges all blocks per selector -- --on-brand is declared in
a second :root[data-theme='dark'] block, and an extractor that stopped at the
first one silently fell through to a default and reported a false failure."

# --- 7. Licence and documentation -----------------------------------------
git add LICENSE NOTICE CONTRIBUTING.md CODE_OF_CONDUCT.md SECURITY.md `
        CHANGELOG.md README.md
git commit -m "docs: Apache-2.0, source attribution, and the files a stranger needs

Apache-2.0, copyright 2026 classHuman AI LLC. Chosen over MIT for the express
patent grant and retaliation clause, and because it makes NOTICE a licence
term rather than a courtesy -- which is what the attribution below needs.

NOTICE credits Ed Donner and the AI Leadership: Commercial value with AI
module of the Proficient AI Engineer program, names all four source documents
and the files implementing them, and states plainly what is borrowed and what
is ours. The README carries the same credit prominently.

NOTICE carries a marked OUTSTANDING placeholder: written permission has been
requested but not received. Paste the reply there and delete the placeholder
before this repository is made public.

CONTRIBUTING covers setup, the architecture in a paragraph, how to add a step
or a line item, and the rules that are not negotiable. SECURITY states the
threat model and is explicit that the optional assist server holds an API key,
is unauthenticated by design, and must never be exposed to the public
internet. CHANGELOG is seeded at 1.0.0 in Keep a Changelog format.

CODE_OF_CONDUCT is the Contributor Covenant 2.1, transcribed from memory
because the canonical text could not be fetched -- diff it against
contributor-covenant.org before publishing. Its enforcement contact is a
marked placeholder.

README leads with the value proposition, badges and a thirty-second
quickstart, and marks where the screenshot goes."

# --- 8. CI ----------------------------------------------------------------
git add .github/workflows .github/ISSUE_TEMPLATE .github/pull_request_template.md
git commit -m "ci: verify on every push and pull request, deploy to Pages

Runs npm ci, lint, format:check, typecheck, test and build on Node 22 from
.nvmrc, and fails the build if the bundle exceeds 120 kB gzipped -- the small
bundle is a stated feature, so it is enforced rather than trusted. Currently
102,382 bytes.

A separate workflow deploys to GitHub Pages, building with BASE_PATH set to
the repo name because project pages are served from a subpath, and copying
index.html to 404.html so client-side routes resolve.

Issue templates for bugs and features, and a PR template. All three ask the
question that matters most here: does this change any number, and if so which
one, from what, to what."

# --- Done -----------------------------------------------------------------
Write-Host "`nEight commits on claude/oss-release.`n" -ForegroundColor Green
git log --oneline -8
git status --short

Write-Host "`nAnything still listed above is unstaged and intentional (BOARD-ENTRIES.md," -ForegroundColor Yellow
Write-Host "COMMIT-PLAN.ps1 and the design handoff bundle are all gitignored)." -ForegroundColor Yellow
Write-Host "`nBefore you push, run the gate from a clean clone:" -ForegroundColor Cyan
Write-Host "  npm ci; npm run lint; npm run format:check; npm run typecheck; npm test; npm run build" -ForegroundColor Cyan
Write-Host "`nThen: git push -u origin claude/oss-release" -ForegroundColor Cyan


# ==========================================================================
# PART TWO — the library repo (boards, governance, dashboard)
#
# Separate repo, separate branch, one commit. 58 insertions, 0 deletions,
# purely additive. Run this after Part One, or on its own.
# ==========================================================================

Write-Host "`n`n--- Part two: library repo ---`n" -ForegroundColor Magenta
Read-Host "Enter to continue, Ctrl+C to stop here"

Set-Location F:\classHuman\classHuman-M3n0ko0g-Prompt-Agent-mds-library

git fetch
git status
Read-Host "`nEnter to cut the branch, Ctrl+C to abort"

git switch -c claude/proforma-oss-release

git add governance/DECISIONS.md ops/BACKLOG.md ops/boards/BOARD-CEO.md `
        ops/boards/BOARD-CTO.md ops/dashboard.html
git commit -m "docs(governance): record the ProForma open-source release

Five decision entries, dated 2026-08-16: the Apache-2.0 ruling and why it beat
MIT here; the Ed Donner attribution and the permission still outstanding;
Operating Doctrine 4 applied to material we republish rather than only to
material we write; the design handoff accepted with two recorded deviations;
and Prettier adopted with the reformat proven byte-identical before it landed.

Backlog gains a ProForma section listing what shipped and what is left, and a
new open decision -- ProForma is neither client services nor the Ag3nt24
rebuild, so it needs placing under the two-focus ruling. The likely answer is
free published artifact, alongside /free and Asymptote. Asked rather than
assumed, because quietly making it a third focus is what the stop ruling was
written to prevent.

CEO board gets the two calls that are Lawrence's alone: emailing Ed Donner,
which gates going public, and the Code of Conduct enforcement contact. CTO
board gets the release status plus three findings that generalise beyond this
repo -- a contrast check that tests one background is not a contrast check;
repo-wide reformats should prove byte-identical artefacts before committing;
and calc.ts appearing only in the Prettier commit is the strongest available
evidence that the verified numbers did not move.

Dashboard registry gains the ProForma row.

Additive only: 58 insertions, 0 deletions, no existing line rewritten."

Write-Host "`nLibrary repo committed.`n" -ForegroundColor Green
git log --oneline -1
git status --short

Write-Host "`nThen: git push -u origin claude/proforma-oss-release" -ForegroundColor Cyan
Write-Host "`nWhen both are pushed, delete F:\classHuman\proforma\COMMIT-PLAN.ps1" -ForegroundColor Yellow
Write-Host "and F:\classHuman\proforma\BOARD-ENTRIES.md -- the boards are now the record." -ForegroundColor Yellow
