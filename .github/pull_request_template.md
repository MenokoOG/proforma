<!--
One concern per pull request. A palette change and a calculation fix are two.
See CONTRIBUTING.md.
-->

## What this changes

<!-- One or two sentences. What is different after this merges? -->

## Why

<!-- The problem, or a link to the issue this closes. -->

Closes #

## What you verified

<!--
What you actually checked, not what you expect to be true.
"Checked at 375px and 1180px in both themes" beats a screenshot.
-->

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build`

## Does this change any number?

<!--
The calculation engine is verified against the source workbook.
If any figure moves, say which one, from what, to what, and why the new
value is correct. If nothing moves, say so.
-->

- [ ] No figure changes.
- [ ] A figure changes, and the reasoning and a covering test are below.

## Checklist

- [ ] `CHANGELOG.md` updated under `## [Unreleased]`.
- [ ] No new runtime dependency. (Dev dependencies are fine.)
- [ ] No hex literal outside the token block in `app.css`.
- [ ] New or changed UI has labels, 44 px tap targets, and does not rely on
      colour alone.
- [ ] No horizontal page scroll at 320 px.
- [ ] Nothing secret is in the diff — no key, token, or real client figure.
- [ ] If a `Doc` field was added, `hydrate()` in `src/lib/storage.ts` handles
      its absence in older saved documents.

## Screenshots

<!-- For anything visual. Both themes if the change touches colour. -->
