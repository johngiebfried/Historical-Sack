# Rulings

Decisions that shape the sack, with who made them and why. Search here before changing a rule. **Proposed** rulings are waiting for John.

---

## Settled

### Engine and repository (John, 4 November 2026)
- **Map and Leaf** is the engine.
- It lives in this repository, built on the siege's stack (Vite, React, Node check scripts, Pages deploy).
- The 3D city remains the siege's.

### Regions (John, 4 November 2026)

| Letter | Region | Note |
|---|---|---|
| P | Petrion | |
| B | Blachernae | |
| G | The Great Palace | |
| S | Hagia Sophia | |
| H | The Golden Horn | Absorbs the IM's Residential and Merchant regions, renamed for where nearly all their events happen |

- **Two Golden Horn scenes stand inland,** near the Great Church: Choniates' house (H-Q2) and the Chalkoprateia (H-7). Their source notes say so.
- **Code letters:** S and H are new. The old M and R appear only in old codes.

### Order of play
- Shared Q1, shared Q2, then the unique scene.
- **Blachernae** plays its unique scene second and its shared refugee scene third (John). Its shared questions are therefore Q1 and Q3.

### St Simeon (John)
- **A seventh path** in the Golden Horn, H7.
- It takes no place, and any number of students can choose it. Everyone who takes it shares the relics.
- This replaces the IM's "only in the sixth position in the Greek Residential Quarter", because the sixth position is the one two players can share.

### Shared captures (John: "everyone who takes part in that capture gets that bonus")
- **The patriarch (B-Q3 B) and Choniates (H-Q2 C)** reward everyone who chooses them.
- Shared captures give fama, marks and a class-wide rule, **not individual votes,** so votes don't multiply with class size.

### Nefas on shared questions (John: yes, 4 November 2026; values by Claude under the rule below)

Shared scenes carry nefas by what the act does, judged against the oath every crusader swore (Clari ch. 68):

| Act | Nefas | Example |
|---|---|---|
| Fighting armed men on 12 April | 0 | The postern charge, cutting down the emperor's guard |
| Plunder | 0 | The booty was expected and is tallied separately |
| Coercing non-combatants | +1 | Searching the courtiers, beating the Greeks in the stands |
| Sacrilege | +1 | Icons, church silver, the patriarch's cross |
| Joining the returning residents' killings (H-Q1 A) | +2 | |
| The two named captures | +2 | |
| Protecting Greeks, or keeping the terms given to them | −1 | |

The validator holds shared nefas to the range −1 to +2.

### Join codes lock students to their place (John: yes)
- Claiming hands each student a join code: `[CC][R][P]-[check]`, for example `05H2-K`.
- The student page opens at that place only. The free-choice setup of the demo is for preview only.

### Codes, version 2 (Claude, from the build plan)
- **Result code:** `[CC][R][P][ABC]-[silver]-[check]`, for example `05H2CCA-375-Q`. The check letter is Luhn mod N over an alphabet without I or O.
- **What it catches:** every single mistyped character, and at least 95% of swapped neighbours (tested).
- **Codes are read generously:** lower case, spaces, and O for 0 are all accepted.
- **Rejected codes:**
  - A code handing in more silver than its path collects.
  - An unknown character.
  - A position that doesn't exist.
- **Old codes** (no check letter; regions M and R) are recognised and sent to the old Decoder.

### Quality percentages (the IM, "Narrating the Sack")
- **Percentage:** count of each coded answer ÷ number of students, refusers included.
- **Bands:** five of 15% each, and **legendary** above 75%. Boundaries: [0,15), [15,30), [30,45), [45,60), [60,75], then above 75.
- **The old Decoder differed:** it divided by twice the number of sacking students. This follows the IM's text instead.

### Large classes (the IM, "Determining Sack Order")
- **Standard:** thirty places. Once all are taken, further students take position 6 of any region again.
- **Multiplied** (the IM's option for very large classes): every place can be taken once per thirty students, rounded up. Position 1 fills that many times before position 2.
- **Claims are per student,** so doubled-up characters in very large classes can each claim.

### The IM's internal conflicts (John: "trust your judgement"; ruled by Claude)

**Principle: the student is credited with what the outcome text tells them.** A student who reads "you gain 200 marks" should get 200. Where the outcome text itself is broken, the table wins.

| Scene | Table says | Outcome text says | Ruling |
|---|---|---|---|
| Blachernae Q2-B | 150 marks, −1 fama | 200 marks, −2 fama | **Text:** 200, −2 |
| Great Palace Q2-B | 200 marks, −2 fama | 150 marks, −1 fama | **Text:** 150, −1 |
| Great Palace Q2-C | 100 marks, −3 fama | no treasure, −3 fama | **Text:** 0, −3 |
| Merchant Q2-B | 100 marks, −3 fama | 200 marks, −3 fama | **Text:** 200, −3 |
| Residential Q1-D | 100 marks, −1 fama | a word-for-word copy of Q1-A's outcome | **Table:** 100, −1. The outcome needs writing; the copy is an error |
| Merchant 6, B and C | n/a | the answer key swaps the cabinet and the round box against the prompt | **The prompt's order:** the round box (the crown, 300 marks) is C. The live module already does this |

- **For the new sack these are moot,** because the new content replaces those scenes.
- **They matter for the live single-file Sack Module and the IM's paper forms** while classes still use them.
- **The live module's Petrion 1–3 test values** are a separate error. They should be replaced with the IM's values.

---

## Proposed: waiting for John

### Nefas and class size
- **What the IM does:** it subtracts the class's *total* nefas from the endgame score. Total nefas grows with the number of students, so the same behaviour costs a class of 60 five times what it costs a class of 12.
- **Today's numbers:**
  - With shared-scene nefas, a class of thirty choosing at random totals about +39.
  - The IM's own values gave about +9, and the endgame's other terms are single digits.
  - See docs/BALANCE.md.
- **Option 1 (Claude's recommendation): nefas per ten students.**
  - Endgame nefas = the class total × 10 ÷ class size, rounded, and never below 0.
  - A class choosing at random lands near +13 at any size.
  - A class choosing the gentlest act in every scene lands at 0, the floor; its raw sum is about −19 per ten students.
  - A class choosing the gravest act in every scene lands near +44.
  - Effect: changes one line of the IM's endgame table. The content stays as written.
- **Option 2: rescale the content.**
  - Halve the positive nefas in the unique scenes.
  - Keep shared nefas at ±1, and only for the gravest acts.
  - Effect: keeps the IM's rule but still punishes large classes.
- **Option 3: leave both as they are.** The endgame is then nearly always lost on nefas alone.
