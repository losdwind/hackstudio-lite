# Director Profiles

Each `<name>.md` in this directory is a persona profile the editor skill can assume. The skill picks one via `collect-inputs.ts` (auto-score) or `--director <name>` (override).

## Authoring a new profile

Create `<name>.md` with these sections (exact heading names):

- `# <Display Name>`
- `## Identity` — one paragraph, first-person "You are editing...", used verbatim in the LLM system prompt
- `## Three Laws` — three numbered editorial principles
- `## Role Balance Preference (per 8-10 line part)` — four bullets: literal, emotional, implication, contrast, each with an `X-Y` range
- `## Rationale Voice` — 3+ example rationale sentences showing the director's voice
- `## Signature Moves` — concrete B-roll techniques
- `## Scoring Signals` — weighted keyword rules for auto-recommend. Format:
  - `**Strong signal (+N each):**` then a comma-separated list of phrases/patterns
  - `**Weak signal (0):**` — neutral traits
  - `**Negative signal (-N each):**` — patterns that should disqualify this director

The skill's `collect-inputs.ts` parses these sections to score directors against the current video's content and `perspectives.md`.

## Currently shipped

- `curtis.md` — Adam Curtis (essayistic, contrast-driven)
- `morris.md` — Errol Morris (psychological, interview-driven)
- `gibney.md` — Alex Gibney (forensic, evidence-driven)
