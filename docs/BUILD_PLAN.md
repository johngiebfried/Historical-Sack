# The Classic Sack on Map and Leaf: Build Plan

*4 November 2026. This plan turns the Map and Leaf demo into the classroom sack.*

**Decided so far:**
- The engine is Map and Leaf.
- The regions are Petrion, Blachernae, the Great Palace, Hagia Sophia and **the Golden Horn**. The Golden Horn absorbs the old Residential and Merchant regions.
- A better map, based on the one you use with students, replaces the placeholder later.
- Content comes from the `classic-sack/` drafts, which are awaiting your approval.

**What changed today:**
- The Golden Horn rename is done throughout: drafts, scene IDs, validator, demo data and map.
- Its code letter is **H**, because G is already the Great Palace.
- Its stops now sit along the Horn shore.
- Two of its scenes stand inland, near the Great Church: Choniates' house (H-Q2) and the Chalkoprateia (H-7). Their source notes say so.
- The demo is republished at the same link.

---

## 1. What the product is

One data file feeds three surfaces.

| Surface | Who uses it, and where | What it does |
|---|---|---|
| **Student module** | Each student, privately, on a phone or laptop | Map and Leaf: a route of three stops, the silver confession, a result code |
| **Instructor console** | The GM, on a laptop and the projector | Sack order and claiming on the big map; collecting codes; the narration; the reveal map; endgame numbers |
| **Print set** | Paper fallback | The same scenes as printed leaves, a claiming sheet and a tally sheet, generated from the data |

It connects to two existing tools:
- **The siege**, which supplies the sack order.
- **The Endgame Calculator**, which takes the class nefas total and the prizes.

**What it replaces:**
- The single-file Sack Module and Decoder. The old Decoder stays at its current address for old codes.
- The 3D engine's role in the sack. The 3D city remains the siege's.

---

## 2. A class session

1. **Before class:** the GM opens the console and loads the roster with current fama, either by importing the siege's result or by typing it. The console builds the sack order using the IM's tiers.
2. **Claiming, on the projector:**
   - The console calls names in sack order, the way the siege's roll-call rail does.
   - Each student names a region, and their banner goes onto the big map at that region's next open position.
   - Overflow students reuse position 6.
   - Refusers are marked.
   - Venetian plotters may take the Golden Horn's seventh path to St Simeon.
3. **Join codes:** claiming prints a short **join code** for each student, such as `05H2-K`. The parts are the character, the region and position, and a check letter. On a phone, the code drops the student straight into their place. They can't pick a slot they didn't claim, and setup takes seconds.
4. **Private play:** each student plays three stops, confesses their silver, and gets a **result code**.
5. **Collection:** the GM pastes or types the codes into the console. The check letter catches typing mistakes at once.
6. **The reveal:** the console takes the GM through the IM's narration:
   - The four qualities as bands.
   - The notable deeds, unnamed but tagged by faction.
   - Silver turned in against the Venice threshold.
   - Nefas, which is never shown.

   It then shows **the class's sack on the map**: every route drawn at once, and the places that burned, emptied or were stripped, all anonymous.
7. **Afterwards:** the console exports the endgame numbers and the prize list. Everything is saved in the browser and can be exported as a file, so the sack can span sessions.

---

## 3. Planned around the map: what the map makes possible

These are changes the map invites. Each is optional and flagged for you.

| Feature | What it does | Recommendation |
|---|---|---|
| **Claiming on the map** | Students see *places*, not numbers. "Position 1, Great Palace" becomes the empresses' chamber, on the map, with a banner already on it if taken | **Yes.** No rule change, just a better display |
| **Claim the place, not the region** (map variant) | A student picks any open place, instead of a region's next position | **Optional variant, off by default.** It changes the IM's rule, though it sharpens Clari's point that the great took the best first |
| **Routes** | Each student's three stops are a route from the breach, drawn as they play | **Yes,** already in the demo |
| **The class's sack, drawn** | The reveal overlays every route, with marks on each place for what was done there | **Yes.** This is the map engine's best moment and suits the narration step |
| **The city changed** | Quarters darken, smoke rises, and a refugee line forms toward the Golden Gate, all scaled by the class's choices | **Yes,** in the reveal. It's the 2D version of the earlier "burning city" idea |
| **Scene glosses on the map** | Tapping any place after the sack shows what the sources say happened there | **Yes,** for the debrief. The same notes, reached by place |

---

## 4. The map, built to be swapped

**The map is a layer the content never refers to directly.**

- **A map file, `map.json`, holds:**
  - The base image or drawing.
  - A **calibration**: a few control points (such as Hagia Sophia, Blachernae, the Golden Gate and the Galata tower) that turn world positions into map positions.
  - The region shapes, the stop for each scene, and where labels go.
- **The placeholder** is today's plan drawn from the siege's coastlines. It works now.
- **Your map arrives as a high-resolution base image, bundled so it works offline.** A small **pin tool** for the instructor lets you click the base image to place each of the 41 scenes and the five region outlines, and it writes `map.json`. After that, swapping maps never touches the content.
- **Two views from one file:**
  - **Phone:** zoomed to the region, with labels thinned.
  - **Projector:** the whole city, with every label.
- **Rights.** None of the seven images in Game Book 4.4 is a plan of Constantinople. They're regional maps, and at least one is marked © 2002 Facts On File. So I need the map you mean (Handout 3.5?) and its source. If it's drawn from a published map, the public app needs permission or a redrawn version.

---

## 5. Rules carried over, and what changes

**Unchanged from the Classic Sack contract:**
- Five regions of six positions, with position 6 replayable for overflow.
- The four-quality coding of the shared questions. Blachernae's shared questions are Q1 and Q3.
- Marks and fama shown to players; nefas hidden.
- The Venice threshold.
- Prizes as cards.
- The shared-capture rules for the patriarch and Choniates.
- The refusal option.

**New:**

| Change | Detail |
|---|---|
| **Result code v2** | `[CC][R][P][ABC]-[silver]-[check]`, for example `05H2CCA-375-Q`. The check letter is computed from the rest of the code, so a typo or a casual edit fails at entry. It isn't security, but it's enough for a classroom. Old codes have no check letter, so the console can recognise them and send them to the old Decoder |
| **Region letters** | P, B, G, **S** (Hagia Sophia), **H** (the Golden Horn). The St Simeon path is **H7** |
| **Join codes** | `[CC][R][P]-[check]`, from claiming |
| **Tags on choices** | Each choice in the data can carry tags (*named person*, *relic*, *harsh*, *merciful*, *high value*, *counterfactual*). The narration picks its notable deeds from the tags. The old Decoder used hard-coded lists that broke whenever scenes changed |
| **Student glosses** | A second, short note per scene (one to three plain sentences, paraphrased, with an attested/adapted/invented badge) shown to students after each choice. The instructor note stays in the console. The demo currently shows the instructor note, which is wrong for students |

---

## 6. Content pipeline

1. **Where you write:** you edit Markdown, the `classic-sack/*.md` files.
   - If you'd rather write in Twine, a Twee importer can feed the same pipeline. Send me a Twine file and I'll scope it.
2. **The build** turns the Markdown into the data file and runs the validator: structure, the coding pattern, reward ranges, no exclusive prize at position 6, banned words, no chronicle quotations, a source note on every scene.
3. **Approval gate:** each scene has an `approvedBy` field.
   - **Preview builds** show a "draft" banner and play everything.
   - **Release builds** refuse to build while any scene is unapproved.
4. **Balance report:** generated on every build. It covers silver per student, nefas, the Venice threshold at different turn-in rates, and the prize count.

---

## 7. Architecture: three options

| | A. Plain static pages | B. Own repo, Vite + React | C. Inside the siege repo |
|---|---|---|---|
| What | Grow the demo's plain JavaScript; Vite only bundles it | A new repo on the siege's stack (now johngiebfried/Historical-Sack) | New pages beside the siege |
| For | Smallest and fastest on phones; the demo is already most of the student module | Same stack and style as the siege; the console's many screens are easier in React; tests and deploy copy the siege's | One deploy; roster and styles shared by import |
| Against | The console gets complex in plain JavaScript; a different stack from the siege | A second repo to keep in step (roster, styles) | Couples a light phone tool to a heavy 3D repo's checks and deploys; the map engine needs nothing from three.js |

**My lean is B.** The student page stays lean: no three.js, a subset font, a small script. The console gets React's structure. A check confirms the roster still matches the siege's 52 characters, which it does today.

**Font:** subset MedievalSharp to the characters actually used. The full embedded font is about 200 KB, and a subset should be a fraction of that.

**Offline:** on GitHub Pages a small offline cache keeps the student page working once it has loaded. It's optional, but it suits classrooms with bad wifi.

---

## 8. Connections

| Connection | What's needed | Notes |
|---|---|---|
| Siege → sack order | An **"Export sack order"** button on the siege's Results screen (a file, or a short code) | A small change to the siege. **Needs your OK.** It also fixes the siege's own gap of having no export |
| Sack → endgame | An **endgame block**: class nefas, Venice paid or not, who holds Margaret, whether the patriarch was taken, major relics in custody, votes awarded | Pasted into the Endgame Calculator. That page also needs its CDN versions pinned |
| Old codes | The old Decoder stays live at its current address | The console recognises v1 codes and points to it |

---

## 9. Testing

These follow the lessons in the siege handoff: whole runs, not just units, and checks shown to fail on broken input.

- **Whole-sack simulation**, already running: class sizes 12–60, overflow, the seventh path, shared captures, and Venice reachable but not automatic.
- **Code round-trips:** every region, position and choice combination is encoded and decoded, including check letters. Mutation tests confirm that a wrong check letter, a missing letter or an impossible slot fails.
- **Validator mutation tests,** already done for the draft validator.
- **Browser playthroughs** at phone and desktop size for every region, run on every build. This is already in place for the demo.
- **A simulated class of 30, end to end:** claiming, thirty codes, the narration and the endgame block.
- **One real classroom trial** before release: actual phones, actual wifi, a projector.

---

## 10. Phases

Each phase ends with something you can open and a test it must pass.

**Where it stands:** phase 1 done and deployed. Phase 2 built: all 41 scenes pass the browser playthroughs (`npm run check:play`), and eight broken copies of the page are each caught. Still open for phase 2: the check on a real phone.

| Phase | Deliverable | Exit test |
|---|---|---|
| **0. Rulings** | Your decisions in §11 | none |
| **1. Core** | Data schema v1 (tags, student glosses, approval), build and validator, code v2 with check letters and join codes, the simulation | All tests pass, and every mutant fails |
| **2. Student module** | Map and Leaf production page: join code entry, route, leaf, cards, confession, result code, resume after refresh, draft banner, accessibility pass (keyboard, a text list of stops for screen readers, reduced motion) | Browser playthroughs for all 41 scenes; real-phone check |
| **3. Instructor console** | Roster and fama, sack order (import or entry), claiming on the projector map, join codes, code intake, the narration steps, the reveal map, endgame export, print set | Simulated class of 30 end to end |
| **4. Content approval** | You review region by region; I draft student glosses and add tags; approvals switch on | Release build passes |
| **5. Your map** | Base image in, scenes and regions pinned with the pin tool | Every stop pinned; labels legible at phone size |
| **6. Pilot** | Classroom trial, fixes, an IM appendix for GMs on the new sack | Pilot done; your sign-off |

**Phase 5 can run any time after phase 2,** whenever the map is ready. **The Historical Sack** comes after phase 6, reusing the core, the map and the leaf.

---

## 11. What I need from you

**These block phase 1:**
1. **Architecture:** A, B or C (my lean is B, a new repo).
2. **Nefas on the shared questions:** 0 except the two captures (current default), or something else.
3. **The six IM conflicts:** table or narrative for each.
4. **Join codes:** students locked to their claimed place (recommended), or free choice as in the demo.

**These block phases 3–5:**

5. **OK to add "Export sack order" to the siege.**
6. **The map:** which file, its source, and permission to bundle it.
7. **Student glosses:** shall I draft them for your review?
8. **The map variant** (claiming any open place): off, as I propose, or on as an option.

**Still open from the drafts:**
- The patriarch and Choniates rules.
- Nefas calibration.
- The five sources I lack: Gunther, the *Translatio Symonensis*, Novgorod, the March Pact and Mesarites.
