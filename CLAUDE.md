# CLAUDE.md

## graphify - READ THIS FIRST then docs folder PHASES.md

This project uses a Graphify knowledge graph at `graphify-out/`. Treat that folder as the canonical fast-context map for the codebase.

### What you MUST do at the start of every session
1. Read `graphify-out/GRAPH_REPORT.md` before opening source files or running broad searches.
2. Read `docs/README.md` for product/setup context.
3. If `graphify-out/wiki/index.md` exists, navigate it for relevant context before reading raw files.
4. If the user mentions a sprint, roadmap, tracker, or feature status, read the relevant tracker file (`docs/PHASES.md`).
5. For architecture questions, use `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"`.
6. If `graphify-out/GRAPH_REPORT.md` is missing, say the graph has not been generated yet, then read `docs/README.md` and continue with the narrowest useful file reads.

### Always read graph nodes before editing
- Before editing any file, query the graph for that file/symbol (`graphify explain "<file or symbol>"` or `graphify query "<what am I changing>"`) to pull in dependents and callers.
- Use `graphify path "A" "B"` to check blast radius before refactors.

### What you MUST NOT do
- Do not run `graphify extract .`, `/graphify`, or any full graph rebuild unless the user explicitly asks.
- Do not run broad searches before checking the graph for structure or dependency questions.
- Do not re-read files already summarized by the graph unless implementation details are needed.

### Keeping the graph fresh
- Run `graphify update .` after uncommitted code changes when the user asks about current structure, but do not run it automatically — only when the user asks.
- Git hooks are installed (`graphify hook install`) and handle normal commit/checkout updates:
  - `pre-commit` runs `graphify update .`, normalizes volatile metadata via `scripts/normalize-graphify-context.py`, and stages `graphify-out/` into the same commit.
  - `post-checkout` rebuilds the graph in the background on branch switches.
  - `pre-push` blocks a push if `graphify-out/` has uncommitted changes.
- Keep `graphify-out/` committed with the code after the first graph is generated; do not add it to `.gitignore`.
- Bypass once with `git commit --no-verify` only if the hook is broken.
