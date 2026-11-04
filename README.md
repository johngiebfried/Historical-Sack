# The Sack of Constantinople

The Classic Sack for the *Reacting to the Past* Fourth Crusade game, rebuilt from the sources.

- **Students** play privately on a phone or laptop with the **Map and Leaf**: a route of three scenes through one region of the city, the silver confession, and a result code.
- **The instructor** runs claiming, collects codes, and narrates the class's sack from a console.

There is no server. Everything travels in short codes, and the whole site works offline once loaded.

**Status: phase 2 of 6 (the student page).** The core (phase 1) and the student's Map and Leaf (phase 2) are built; the map is a placeholder until the instructor's map arrives (phase 5). The instructor console (phase 3) comes next. See [docs/BUILD_PLAN.md](docs/BUILD_PLAN.md).

## What's here

| Path | What it is |
|---|---|
| `content/*.md` | **The scenes, the source of truth.** Five regions, 41 scenes, each with its source note. Edit these |
| `src/data/sack.json` | Built from `content/` by `npm run content`. Don't edit by hand |
| `src/data/sack-student.json` | Built alongside it: the same, less nefas and the instructor's notes. The student page ships only this |
| `src/data/map.json` | Where each scene stands on the plan, and the placeholder plan itself. Replaced in phase 5 |
| `src/data/roster.json` | The 52 characters, copied from the siege (`fourth-crusade-siege/src/data/characters.json`) |
| `src/core/` | The rules, as plain JavaScript with no dependencies: order of play, scoring, claiming, codes, the class tally |
| `src/play/` | The student page: `play.html`, or `play.html#preview` for any place |
| `src/styles/`, `src/fonts/` | The manuscript look shared with the siege, and the bundled MedievalSharp (OFL), cut to the characters the content uses |
| `scripts/` | Build, checks, the whole-sack simulation, the mutation suite, the balance report |
| `docs/RULINGS.md` | Every decision and who made it. **Read before changing a rule** |
| `docs/BALANCE.md` | What the current numbers add up to. Regenerate with `npm run balance` |

## Running it

```bash
npm install
```

```bash
npm run check
```

`npm run check` runs every suite:

1. The data file matches the content.
2. The content is well formed: coding, reward ranges, no exclusive prize at position 6, no banned phrases or quotations, a source note on every scene.
3. Every path through every place encodes and decodes, and the check letter catches typos.
4. Claiming follows the IM.
5. The class tally matches hand-worked arithmetic.
6. Whole simulated classes run end to end.
7. Every scene has a stop on the map, every character in the text is in the bundled font, and the student data carries no nefas or notes.
8. Twenty-two deliberately broken copies of the code each make some check fail.

On your own machine, with Chromium and Playwright installed, two more suites play the built page in a browser. CI doesn't run these.

```bash
npm run check:play
```

This plays all 31 places (all 41 scenes) on a phone-sized screen, decodes every result code against the rules, reloads mid-scene and after sealing, and runs once on a desktop with the banner walking, once in preview, and once with the keyboard alone. It fails on any console error or anything wider than the screen.

```bash
npm run check:play-mutants
```

This breaks the page eight ways (wrong pick recorded, silver off by one, progress not saved, nefas shown, a prize card hidden, a leaf too wide for a phone, preview broken, a console error) and confirms the browser check catches each, after an unbroken control passes.

To look at the page while editing:

```bash
npm run dev
```

Then open `/play.html#preview` to play any place, with the instructor's source note under each outcome.

```bash
npm run check:release
```

This is the stricter gate for a release. It also requires a student gloss and an approval on every scene, so it fails today, by design.

## Editing a scene

Each scene in `content/*.md` looks like this:

```markdown
## G-1 · Position 1 · The Empress

*Unique question 3 · Tuesday 13 April · The Bucoleon · Tier: highest.*

**Prompt.** What the player reads.

**A.** The choice.
> The outcome.
`marks 0 · fama +1 · nefas +2 · prize: Empress Margaret (+2 votes in the imperial election) · tags: named-person`

...B, C, D...

**Student gloss.** One to three plain sentences on what the sources say, for students. (Needed for release.)

**Approved.** John Giebfried, 2026-11-20. (Needed for release.)

**Source note.** For the instructor: what is attested, adapted or invented, with citations.
```

- **Shared scenes** add the quality to each choice: `**A · Violence.**`.
- **After editing,** run `npm run content`, then `npm run check`.
- **If the numbers changed,** also run `npm run balance`.

## Codes

| Kind | Example | Parts |
|---|---|---|
| Join code (from claiming) | `05H2-K` | Character 05, the Golden Horn, position 2, check letter |
| Result code (from the student) | `05H2CCA-375-Q` | Choices C, C, A; 375 marks handed in; check letter |

Old codes from the single-file Sack Module (such as `01P1ABC-140`) are recognised and refused with a pointer to the old Decoder.

## What students can and can't see

The student page never shows nefas or the instructor's notes, and its data file doesn't contain them. That keeps them out of anything a curious student finds by opening the page's code. It isn't a lock: this is a static site with no server, so preview mode and (in phase 3) the instructor console load the full data from the same site. A student who goes looking for those files can find them. The same was true of the old module.

## Rules that must hold

These come from the siege project and carry over.

- **No fetched assets.** The site runs offline. The one font is bundled.
- **No chronicle quotations in anything a student sees.** Paraphrase and cite. The content check flags quoted runs of text.
- **Never write history from memory.** Uncertain points in the source notes are marked **M** until checked, and points resting on a source not yet in hand are marked **P**.
- **Nefas is never shown to students.**
- **Don't use "he" for the player.** The roster includes Agnes.
