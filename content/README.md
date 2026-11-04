# The Classic Sack: Content

> **These files are now the source of truth.** The build reads them (`npm run content`) and the checks judge them (`npm run check`). The format, including student glosses, approvals and tags, is in the repository README. Rulings made since this draft, including nefas on the shared questions, are in `docs/RULINGS.md`. Where this note and RULINGS disagree, RULINGS wins.

*4 November 2026. Written to your region-by-region instructions. **Nothing here is approved.** Every question carries `approvedBy: none` until you sign it off.*

## Files

| File | Region | Shape |
|---|---|---|
| `01-petrion.md` | Petrion: the breach | Shared Q1, shared Q2, unique Q3 (six positions) |
| `02-blachernae.md` | Blachernae | Shared Q1, **unique Q2** (six positions), **shared Q3** |
| `03-great-palace.md` | Great Palace | Shared Q1, shared Q2, unique Q3 |
| `04-hagia-sophia.md` | Hagia Sophia | Shared Q1, shared Q2, unique Q3 |
| `05-golden-horn.md` | The Golden Horn (the old Residential and Merchant regions) | Shared Q1, shared Q2, unique Q3, **plus a seventh path to St Simeon** |
| `BALANCE.md` | All regions | Generated from the region files: reward ranges, per-region averages, prizes, class-size simulations |

## Rules I wrote to

1. **Shared questions converge.**
   - Every choice reaches the same historical result: you get through, the camp falls, the palace yields, the refugees leave.
   - Choices change *how* it happens, and so how much fama, silver or infamy you take away.
   - The Greeks never win, and no player dies.
2. **The shared questions are mostly about fama,** as you asked. Marks there stay in the IM's range of 0–200.
3. **Unique questions run from best to worst by position.**
   - Position 1 holds the greatest prize, and position 6 the least.
   - **Position 6 can always be played twice** (the IM's overflow rule), so no position-6 scene carries an exclusive item.
4. **Looting things that weren't historically looted is allowed,** per your note. The source note always says what really happened.
5. **Voice.**
   - Second person, sober narrator, no jokes about cruelty, no "he" for the player.
   - Characters may hold contemptuous views. The narrator doesn't share them.
   - No chronicle quotations in player text. Everything is paraphrased.
6. **Care.**
   - Sexual violence and harm to children are never player options.
   - Where the sources record them (Choniates on women and nuns, the judge's daughter), they appear in narration and source notes only.
   - The judge's daughter is a rescue.
7. **Every question has a source note.** Each one says which parts are attested, which are adapted, and which are invented, and carries the bias warnings.
   - **P** marks anything resting on your paper or the brief because the source isn't in my file: Gunther, the *Translatio Symonensis*, Novgorod, the March Pact.
   - **M** marks my own memory, to be checked.

## The four qualities

The decoder keeps its arithmetic. Each shared question has one choice for each quality, coded as the IM codes them:

| Question | A | B | C | D |
|---|---|---|---|---|
| First shared question | Violence | Piety | Plunder | Sacrilege |
| Second shared question | Piety | Sacrilege | Violence | Plunder |

- **What each quality now means** follows the oath every crusader swore (Clari ch. 68), not the letter slot:
  - **Violence:** coercion or killing.
  - **Sacrilege:** churches, clergy, holy things.
  - **Plunder:** taking and keeping.
  - **Piety:** keeping the oath, protecting, restraint.
- **In the 12 April combat scenes,** Violence means fighting and killing armed men. That doesn't break the oath, so those choices can earn fama. Your open question about coding the breach is answered that way here. Overrule it if you like.
- **Blachernae's shared questions are Q1 and Q3,** with Q3 using the second-question pattern. The decoder must read choices 1 and 3 for B codes.

## Rewards

- **Scales follow the IM.**
  - Shared questions: 0–200 marks, −3 to +3 fama.
  - Unique questions: up to 750 marks, −3 to +4 fama, −3 to +4 nefas.
- **Nefas is 0 on shared questions** (the IM's design), with two exceptions where you asked for a named capture: the patriarch (Blachernae Q3) and Choniates (Golden Horn Q2). **Your ruling on nefas for shared questions is still open.** The default here follows the IM, not the live module.
- **Shared captures reward everyone who joins** (your rule for the patriarch). To keep votes from multiplying with class size, shared captures give fama, marks and a *class-wide game rule*, not individual votes. Individual votes come only from unique-question prizes.
- **Imperial election votes total 3,** the same as the IM: the Crown of Constantine (+1) and Empress Margaret (+2).

## Code format

The format stays `[CC][R][P][ABC]-silver`.

| Change | Code |
|---|---|
| Hagia Sophia region | **S** (replaces the Merchant Quarter's **M**) |
| Golden Horn region | **H** (replaces the Residential Quarter's **R**) |
| St Simeon path | **H7** (Golden Horn, position 7). Takes no slot from the thirty and can be played by any number of students |
| Blachernae | The position digit names the unique scene, which is Q2. The decoder must treat B codes differently |

Old codes need the old decoder.

## Open items for you

1. Nefas on shared questions: confirm 0, apart from the two captures.
2. The patriarch rule (`02-blachernae.md`, B-Q3) and the Choniates rule (`05-golden-horn.md`, H-Q2): wording and endgame tie-in.
3. Agnes (#10) and Domenico (#52) appear in scenes they historically lived through. Each scene has a short GM note for when that player holds the slot. Confirm the approach.
4. Hagia Sophia is my design throughout. The "contested evidence" idea is explained at the top of that file.
5. **Bulgarians.** I've tied the refugee question to the Greeks of Thrace and Kalojan in 1205, which is attested in Andrea's note in your sources file and matches the IM's endgame of "Greek rebels." If you meant other notes, tell me which.

## Balance at a glance

From `BALANCE.md`, generated by `tools/sackcheck.py` from these files. The script also validates structure, coding and ranges; I confirmed it catches errors by planting four in a copy.

- **Silver.** About 300 marks per student when choices are made at random.
  - Venice is repaid when the class turns in about **a third** of what it collects.
  - At a 25% turn-in it almost never is; at 40% it almost always is.
  - That meets the brief's test: reachable, but not automatic.
- **Nefas runs about twice the IM's own level.** It averages +0.7 per student, about +22 for a class of 30. The live module's unique questions alone average +0.31, so the IM's own design gives about +9 for 30. The live module as a whole, with nefas on its common questions, gives about +69.
  - My unique-question nefas values are heavier than the IM's. Treat them as *relative* (worse acts carry more) until you set the final calibration, as you planned.
- **Petrion pays the least silver and the most fama** (+2.2 on average), as you asked: it's about how famous you become.
- **The Great Palace leads in prizes, not in marks.**
  - It carries Margaret, the regalia, Manuel's brooch, the True Cross with the Crown of Thorns, and a thorn on its own. These are worth votes and favours, not silver.
  - Hagia Sophia has the highest single silver payout: breaking up the altar, 750 marks, a counterfactual act with +4 nefas.
  - If you want the Great Palace to lead in marks as well, it's a few edits.
- **Imperial election votes total 3,** as in the IM. The Crown of Constantine gives +1 and Margaret +2.
- **Committee-vote prizes sit in 6 positions** (nine choices): Petrion 1–3, the Great Palace Holy Chapel, the Hagia Sophia patriarch's house, and the keys of the Great Church. At most **7 votes** can be awarded in one class, against the IM's 5.
