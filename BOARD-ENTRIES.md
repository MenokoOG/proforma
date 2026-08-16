# Board and governance entries — ProForma open-source release

**Paste-ready. Not part of the ProForma repo — it is gitignored.**

These belong in `F:\classHuman\classHuman-M3n0ko0g-Prompt-Agent-mds-library`,
which was not mounted in the session that produced this work. Copy each block
into the file named, then delete this file.

---

## 1 → `governance/DECISIONS.md`

```markdown
### 2026-08-16 — ProForma licensed Apache-2.0, released under classHuman AI

**Decision.** ProForma ships open source under **Apache-2.0**, copyright
classHuman AI LLC, from **`MenokoOG/proforma`**, as a **clone-and-run
application** — `private: true`, never published to npm.

**Why Apache-2.0 over MIT.** It carries an express patent grant and a
patent-retaliation clause. Lawrence holds a patent (ForwardAssist) and the
company is moving toward defence work where IP provenance is read in
diligence. Apache also makes `NOTICE` a licence term rather than a courtesy,
which is what the Ed Donner attribution needs.

**Why MenokoOG and not the org.** Standing ruling of 2026-08-07: `MenokoOG/*`
is the source of truth and the org forks from personal, never the reverse. No
exception was needed, so none was made. An org-facing copy is a later,
optional step.

**Why not npm.** It is an application with no importable API surface. A
published package that only runs via `npm run dev` is noise, and it would
create a supply-chain surface the company would then own for no consumer.
"No effort on empty space" applies.

---

### 2026-08-16 — Attribution to Ed Donner recorded; permission still outstanding

**Decision.** ProForma's four frameworks come from the *AI Leadership:
Commercial value with AI* module of Ed Donner's Proficient AI Engineer
program. Attribution is now explicit in three places: a `NOTICE` file, a
prominent README section, and a header comment on every implementing file.

`src/data/industries.ts` was **rewritten in ProForma's own voice** — it was
the largest near-verbatim block in the repo. The industry list and the
predictive / generative / agentic structure carry; the prose does not.
`roadmap.ts`, `stakeholders.ts` and `decisions.ts` are **attributed rather
than rewritten**, because they encode structure and method, and changing them
would change what the framework says.

**Blocking the repo going public:** written permission from Ed Donner has been
requested but not received. `NOTICE` carries a marked `>>> OUTSTANDING <<<`
placeholder. **Paste his reply into `NOTICE` and delete the placeholder before
the repo is made public.** Nothing else is blocked by it.

---

### 2026-08-16 — Operating Doctrine 4 applied to ProForma's own copy

**Decision.** Unsourced performance figures inherited from the source material
were removed from `src/data/industries.ts` rather than repeated — phrases like
"double-digit accuracy gains are typical" and "cut unplanned stops by around a
quarter". No benchmark claims without a benchmark, including when the claim is
someone else's.

Separately, the word **"autonomous" is now absent from the ProForma
codebase.** It appeared twelve times, including in the agentic use-case label
(`AI_TYPE_META`), which read "Autonomous actions & decisions" and now reads
"Governed actions & decisions". The banned-word ruling of 2026-08-14 is
satisfied in this repo without a separate sweep.

---

### 2026-08-16 — Design handoff accepted with two recorded deviations

**Decision.** The Claude Design palette-and-mobile-Results handoff was
implemented in full. Two deviations from a handoff that declared fidelity
final, both recorded in comments in `app.css`:

1. **`--ink-3` changed in both themes for contrast.** The handoff's `#79838f`
   cleared only 3.85:1 on `--surface` and 3.43:1 on `--paper` against a WCAG
   AA requirement of 4.5:1 — a defect that **predates the handoff**, since the
   old palette failed too. Light is now `#5f6873`, dark `#848f9f`. Every
   `--ink-3` pairing clears 4.5:1 on every ground in both themes. This
   mattered because the README sells accessibility as verified.
2. **No `compact` prop on `Stat`.** The handoff specified one; the value
   reaches `Stat` already formatted, so the prop would have been inert. The
   formatter choice lives in `ResultsStep` instead.

**Also caught:** an unscoped `max-width: 759px` rule would have blanked the
five-year table on anything printed from a phone, because `PrintReport.tsx`
renders its own `.tablewrap`. Scoped to `@media screen`. Never shipped.

---

### 2026-08-16 — Prettier adopted; whitespace commit proven behaviour-neutral

**Decision.** Prettier at `printWidth: 98` — the width producing the smallest
diff against the existing hand-formatting. Adoption reformats ~414 lines
across 26 files.

**It lands as its own commit, separate from every functional change**, so the
real diff stays reviewable.

**Evidence it changed nothing:** the production bundle was built before and
after the reformat and the artefacts are **byte-identical** — SHA-256 match on
both the JS and the CSS. That is proof rather than assurance, and it is the
standard any future repo-wide reformat should meet.
```

---

## 2 → `ops/BACKLOG.md`

```markdown
### ProForma — open-source release

- [x] Licence ruled: Apache-2.0, classHuman AI LLC
- [x] `NOTICE` + README attribution + per-file source headers
- [x] `industries.ts` rewritten in ProForma's voice (20 industries × 3)
- [x] `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CHANGELOG.md`
- [x] Vitest suite — 96 tests, workbook figures guarded
- [x] ESLint + Prettier passing; `lint` / `format` scripts
- [x] CI: lint, format, typecheck, test, build, bundle-size gate
- [x] GitHub Pages deploy workflow
- [x] Design handoff implemented (palette + mobile Results)
- [ ] **Ed Donner written permission** — paste into `NOTICE`, then public
- [ ] **CoC contact email** — `CODE_OF_CONDUCT.md` has a marked placeholder
- [ ] **Diff `CODE_OF_CONDUCT.md` against contributor-covenant.org** — written
      from memory; the canonical text could not be fetched
- [ ] **Browser sweep** at 320/375/414/600/768/900/1180 — not runnable from the
      agent sandbox
- [ ] **README screenshot** — placeholder comment marks the spot
- [ ] Enable GitHub Pages (Settings → Pages → source: GitHub Actions)
- [ ] Enable private vulnerability reporting (Settings → Security)
```

---

## 3 → `ops/SPRINT-03.md`

```markdown
### Carried in from 2026-08-16

ProForma release work landed ahead of Sprint 3 kickoff. Remaining items are
small and mostly not mine to do — see BACKLOG. The two that gate going public
are **Ed Donner's written permission** and **a human browser pass**.

**Note for the kickoff:** ProForma is a fifth thing. It is not client services
and it is not the Ag3nt24 rebuild, so under the two-focus ruling of 2026-08-15
it needs placing, the same way VarianceEngine and Project Poppy do. It is a
free published artifact — the category the ruling explicitly preserved
("free skills and published tooling stay") — so the likely answer is that it
sits with `/free` and Asymptote rather than becoming a third focus. **Ruling
requested rather than assumed.**
```

---

## 4 → `ops/dashboard.html` (control plane registry v0)

| Project | Status | Owner | Last activity |
|---|---|---|---|
| ProForma | ACTIVE · pre-public. Apache-2.0, `MenokoOG/proforma`. Blocked on written permission | Lawrence | 2026-08-16 |
