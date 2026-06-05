# Docs Versioning — Status, Blocker & Open Decisions

> **Read this first.** It explains where the versioned-docs effort stands, the
> one hard problem blocking it, what's already been ruled out, and the decision
> that needs to be made before any more code is written.
>
> - **Branch:** `claude/sweet-einstein-khan4`
> - **Last updated:** 2026-06-05
> - **Companion doc:** [`README.md`](./README.md) describes the as-built
>   machinery. **This doc supersedes its claim that the build fits Vercel** — it
>   does not at the current version count (see §4).

---

## TL;DR

We can give users per-version docs (dropdown + banners + `/versions`), and the
machinery is built and working. **But the full version set won't build on
Vercel.** Building all ~23 stable versions needs **~14 GB RAM**; a standard
Vercel builder has **8 GB**. This is not an architecture bug — it's the size of
the job (large docs × all-versions-in-one-process). Tuning can't close a 2× gap.

**A decision is required (coverage vs. infra):**

| Path | Coverage | Builds on | Extra infra | Status |
| --- | --- | --- | --- | --- |
| **A. One stable per minor (~6 versions)** | 1.83→now, minor granularity | plain Vercel (8 GB) | none | ✅ recommended-simplest |
| **B. All ~23 stable, GitHub Actions** | every stable + rc | GH Actions (16 GB) → deploy | one workflow + deploy step | needs build-out |
| **C. All ~23 stable, bigger Vercel** | every stable + rc | Vercel Enhanced Builds | paid Vercel upgrade | needs account change |

No path has been committed to yet. **§5 has the full trade-offs.**

---

## 1. The goal

LiteLLM ships frequently. A user pinned to an older `litellm` release reads
`docs.litellm.ai`, which only ever shows the *latest* docs, so they can't tell
what their version actually supports or what changed since. We want **versioned
docs**: pick your release from a dropdown and read the docs as they were then.

Concretely, the desired UX:
- Version **dropdown** in the navbar; latest stable is the default at `/docs/`.
- **Banners**: unreleased (`main`, latest rc), unmaintained (older stables).
- A **`/versions`** index page listing everything.
- Users find their version with `litellm --version` / `pip show litellm`.

This is standard Docusaurus versioning — the feature itself is solved. The only
hard part is the build cost (§4), driven by how large LiteLLM's docs are.

## 2. Scope — which versions

**Stable releases only, 1.83.x onward, plus the latest rc** (23 total today):

- **1.83.x line** → only the `-stable` promotions: `1.83.3-stable`,
  `1.83.7-stable`, `1.83.10-stable`, `1.83.14-stable`.
- **1.84.0+** → every final `X.Y.Z` (post-PEP-440, each final *is* the stable):
  `1.84.0 … 1.84.5`, `1.85.0 … 1.85.4`, `1.86.0 … 1.86.4`, `1.87.0`, `1.87.1`.
- **latest rc** → one only: `1.88.0rc3`.

`release_notes/` and `blog/` are intentionally **not** versioned; the entire
`docs/` tree is. The source of truth for the set is
[`manifest.json`](./manifest.json).

> Pre-1.83 was deliberately dropped (the original attempt did all 73 pip
> releases — see §6).

## 3. Current state — what's built and what works

The machinery exists and is committed on the branch. Snapshots are **derived
artifacts, not committed** — they're regenerated from git history at build time:

```
npm run build
  ├─ prebuild: versioning/prepare-snapshots.sh   # regenerate versioned_docs/ from manifest + git history
  └─ build:    docusaurus build                   # render current + versions
```

**Verified working:**
- ✅ `DOCS_VERSIONS_BUILD_LIMIT=current` (current docs only) — fast, low memory.
- ✅ A small set (~5 versions) builds and renders correctly end-to-end.
- ✅ Snapshot reconstruction from git history (`generate_versions.sh`), including
  the historical-content fix-ups (images, sibling paths, sidebars — see §7).
- ✅ rspack bundler + graceful-fs preload (needed for many-version builds).

**Not working:** the full ~23-version build (§4).

Key config knob — `DOCS_VERSIONS_BUILD_LIMIT` (env):
- `all` (default) — every version + rc + main.
- `current` — current docs only (fast preview; no snapshots).
- `<N>` — main + latest N versions.

## 4. THE BLOCKER — build memory

Building all 23 versions exceeds available RAM and gets OOM-killed. Evidence:

| Build | Versions | Bundler | Tweak | Result | Peak RSS / time |
| --- | --- | --- | --- | --- | --- |
| current-only | 0 | rspack | — | ✅ success | low |
| small set | ~5 | rspack | — | ✅ success | fits |
| full | 23 | webpack | — | ❌ OOM (V8 heap >8 GB) | — |
| full | 23 | rspack | `--max-old-space-size=7168` | ❌ OS OOM-killed | **~16 GB RSS**, 593 s |
| full | 23 | rspack | link-checking **off** | ❌ OS OOM-killed | **~14 GB RSS**, 338 s |

(Times are on a 4-core dev box; Vercel is 2-core, so wall-clock ~2× — but **time
is not the problem, memory is**.)

**Root cause:** Docusaurus builds *every version in a single process*, and
LiteLLM's docs are large (~700 pages/version). So RAM scales with
versions × pages. ~23 versions ≈ 16k pages ≈ ~14 GB. A standard Vercel builder
is **8 GB**. The gap is ~2×.

**Why tuning won't save it (already tested):**
- Capping the V8 heap (`--max-old-space-size`) doesn't help — the memory is
  mostly *native* (rspack/Rust + worker threads + SSG buffers), not the JS heap.
  RSS hit ~16 GB with the heap capped at 7 GB.
- Disabling broken-link checking (a known memory hog) **didn't help** — still
  ~14 GB. So it's the core SSG/bundling, not link validation.
- rspack already replaced webpack (webpack OOM'd worse). This is the
  memory-efficient bundler.

**Conclusion:** with this docs size, the only real levers are **fewer versions**
or **more RAM**. Hence the §5 decision.

## 5. Options (the decision)

### A. One stable per minor line (~6 versions) — *simplest, recommended*
Render `1.83.14-stable, 1.84.5, 1.85.4, 1.86.4, 1.87.1, 1.88.0rc3`.
- **Fits plain Vercel (8 GB)** comfortably (5 versions already build fine).
- Zero extra infra; plain Docusaurus; ~fast builds.
- Covers the whole 1.83→now range at **minor** granularity: a user on 1.84.2
  reads 1.84.5 docs (close, not exact).
- **Trade-off:** no per-patch coverage.

### B. All ~23 stable via GitHub Actions
Build the full site on a 16 GB GH Actions runner (free), deploy the static
output; Vercel does fast `current`-only previews.
- **Full coverage**, exact per-release docs.
- **Trade-off:** one CI workflow + a deploy step (e.g. `vercel deploy
  --prebuilt`, or Pages/CDN). More moving parts. *(Note: an earlier
  archive/cross-domain variant of this was tried and abandoned for complexity —
  see §6. A single "CI builds whole site, then deploys it" workflow is simpler
  than that was.)*

### C. All ~23 stable on a bigger Vercel builder
Upgrade to Vercel **Enhanced Builds** (more RAM).
- **Full coverage**, ~1 line of config.
- **Trade-off:** paid Vercel upgrade; builds still ~25 min each.

**Open sub-decision (applies to whichever path):** keep regenerating snapshots at
build time (current design, repo stays clean) **vs.** commit `versioned_docs/`
the standard Docusaurus way (simpler build, but ~600 files/version in the repo —
~3.6k files for path A, ~14k for B/C). See §7.

## 6. Tried and ruled out (don't re-litigate)

- **All 73 pip releases** — the original scope. Far too large; root of every
  build problem. Cut to stable-only (§2).
- **GitHub Pages archive on a separate origin** (`DOCS_ARCHIVE_URL`, cross-domain
  version links) — built then **removed**: too complex for the benefit.
- **Split build: current-only on Vercel + full archive in CI** — superseded;
  folded into the simpler options in §5.
- **webpack bundler** — OOM'd worse than rspack. Switched to rspack.
- **Heap cap / link-check disable** — tested, don't fix the OOM (§4).

## 7. Secondary issues & details worth knowing

- **Version→commit mapping is best-effort (by date).** This docs repo has no
  release tags (pip releases are tagged in `berriai/litellm`). Each version maps
  to `git rev-list -1 --before="<PyPI upload time>" origin/main`. Docs edits that
  landed just after a release get attributed to the next version; same-day
  releases may share a commit. Exact mapping per version is in `manifest.json`.
- **Historical snapshots need fix-ups to build** (handled, but fragile):
  - `link_escaping_siblings.py` — symlinks repo-root `img/ src/ static/` into
    `versioned_docs/` so old escaping relative refs resolve.
  - `fill_missing_images.py` — restores images referenced by old snapshots but
    since deleted from `img/`.
  - `sanitize_sidebars.py` — drops versioned-sidebar entries pointing at doc ids
    a snapshot doesn't have.
  - `graceful-fs-preload.js` — bounds concurrent file ops (EMFILE on low-ulimit
    hosts during many-version builds).
- **Shallow clones:** `prepare-snapshots.sh` deepens history as needed; if
  history/python/git are missing it warns and falls back to current-only rather
  than failing the build.
- **Failing Vercel preview builds on this branch.** They run on every push and
  have been failing because the branch is mid-surgery (default `all` → OOM). To
  stop them: close the PR, or set Vercel's *Ignored Build Step* to `exit 0`, or
  add a `vercel.json` disabling deploys for this branch:
  ```json
  { "git": { "deploymentEnabled": { "claude/sweet-einstein-khan4": false } } }
  ```
  Landing a path from §5 that actually fits the builder also fixes this properly.

## 8. Recommended next steps (for planning)

1. **Make the §5 decision** (A / B / C) — this is the gate; everything else
   follows from it.
2. Make the §5 sub-decision (regenerate-at-build vs. commit snapshots).
3. Set `DOCS_VERSIONS_BUILD_LIMIT` default and the manifest to match the chosen
   scope; for path A, narrow the manifest to one `-stable`/final per minor.
4. Verify a real builder-sized build (right RAM/cores) end-to-end before merge.
5. Stop the failing Vercel previews in the meantime (§7).

## 9. Where to look (file map)

| File | Purpose |
| --- | --- |
| `versioning/manifest.json` | **Source of truth**: version → pip_version, channel, pypi_published, source_commit. |
| `versioning/build_manifest.py` | Selects the stable set (+ latest rc) from PyPI + git; writes manifest. |
| `versioning/generate_versions.sh` | Materializes each version's historical `docs/`+`sidebars.js`, runs `docusaurus docs:version`, applies fix-ups. |
| `versioning/prepare-snapshots.sh` | npm `prebuild` hook: regenerates snapshots at build time; degrades gracefully. |
| `versioning/link_escaping_siblings.py` / `fill_missing_images.py` / `sanitize_sidebars.py` | Historical-snapshot fix-ups (§7). |
| `versioning/graceful-fs-preload.js` | Bounds fs concurrency (EMFILE guard). |
| `docusaurus.config.js` | Versioning wiring: `lastVersion`, `onlyIncludeVersions`, banners, `DOCS_VERSIONS_BUILD_LIMIT`, rspack, dropdown. |
| `versioning/README.md` | As-built "how it works" (note: its Vercel-fits claim is corrected by §4). |
