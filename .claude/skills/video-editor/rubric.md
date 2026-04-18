# B-Roll Emotion Role Rubric

Every B-roll choice must serve one of four roles. The role determines what kind of footage to pick — not just what the narration says. The role balance target is director-specific (see `directors/<name>.md`) but the role definitions below are universal.

## 1. Literal
**Definition:** Footage that directly shows the subject of the narration.
**When to use:** For factual anchoring — the viewer needs to see exactly what's being described.
**Example:** Narration says "Xiaomi launched SU7 in March 2024" → footage of the actual SU7 launch event.
**Risk:** Overuse feels like a news bulletin.

## 2. Emotional
**Definition:** Footage that mirrors the emotional charge of the narration, not the literal topic.
**When to use:** When the narration carries stakes, tension, vulnerability, triumph, or despair.
**Example:** Narration says "Lei Jun bet his reputation on this car" → Lei Jun alone backstage, pensive, NOT the car.
**Key test:** If you remove the audio, does the image still convey the feeling?

## 3. Implication
**Definition:** Footage that hints at the consequence or scale of what's being said, without naming it.
**When to use:** For "therefore" moments — narration states cause, B-roll shows effect.
**Example:** "Traditional automakers are decades behind on software" → long tracking shot down an assembly line of gas cars, feeling antiquated.
**Key test:** Would a savvy viewer nod "oh, I see what you did there"?

## 4. Contrast
**Definition:** Footage that deliberately opposes the narration to create irony, tension, or reframing.
**When to use:** For editorial-angle moments — channel's thesis is "what the West assumes vs. what China is actually doing".
**Example:** "Western analysts called it a vanity project" → triumphant crowd at the SU7 reveal, 200K preorders.
**Key test:** Does the image push back on the words? Good. Does it just repeat them? Then it's literal, not contrast.

## Director-specific targets

Each director has a preferred role balance (in `directors/<name>.md`). Curtis favors contrast (3-4 per part), Morris favors emotional (3+ per part), Gibney favors literal (4+ per part). The validator checks against the SELECTED director's targets, not a global average.

## Integration with sequence kinds (Plan A)

When the sequence `kind` is `chart`, `title`, or `quote`, the rubric does not apply — those sequences have their own visual treatment. Only apply roles to `kind: "video"` sequences.
