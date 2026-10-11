# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Sol Firme" (formerly "Guardián de la Estabilidad") is an educational serious game about BCRP (Banco Central de Reserva del Perú) monetary policy. The player presides over the BCRP and, turn by turn, keeps inflation in the 1–3% target band without switching the country off. All player-facing text is in **Spanish**, so keep new strings in Spanish, short and concrete, with the Peruvian tone the game already has.

The game is plain ES-module JavaScript with DOM, CSS, inline SVG and Web Audio (no framework, no game engine, no asset files), built with Vite.

## ⚠️ Rebuild in progress: read `docs/PLAN-REHACER.md` first

**The turn experience is being REBUILT FROM SCRATCH, not polished.** Three redesigns changed the rules but kept the same "control panel" screen: 288 words, 47 numbers and 22 buttons before the first decision, with the decision being "pick one of seven rate steps". The design source is the Claude Docs document "BCRP-Game — Game Design" and its "Auditoría (8 oct)" tab (https://claude.ai/code/artifact/d8014134-dac2-44ea-b612-8aa52b0a8e85).

Rules for anyone working on the rebuild:

1. **Follow `docs/PLAN-REHACER.md` phase by phase, in order.** Each phase ends with green tests, a clean build, the browser check in its section 5, and one commit on branch `rehacer-juego`. Never push or merge to `main`: Carlos decides that.
2. **Do not adapt `src/views/play.js`.** It and the old turn CSS are discarded. Write the new turn screen in new files (`src/views/turn/*`, `src/turn.css`). Do not copy their HTML or CSS. Read the old code only to see how it calls the engine.
3. **Do not fall in love with what exists.** A UI piece that the plan doesn't mention is not ported. When in doubt, leave it out and list it under open questions in your report.
4. **Keep the engine and the data** (`src/model/*`, `src/game/*`): add only what the plan says. Never change `PARAMS` in `economy.js`, chapter calibration or real data.
5. **Mobile first.** The phone in portrait is the main platform (390×844, must work at 360×740): thumb-reachable fixed "Anunciar" button, tap-to-select (no hover-only info), 44×44 px touch targets, no horizontal overflow, a normal month playable without scrolling. Desktop adds room, never more information. Write CSS mobile-first (desktop inside `@media (min-width: 900px)`).
6. The target turn is **one card, one choice, one month passing**: a big card center stage, 2–4 named responses with visible costs (cast faces), "Ajuste fino" hidden for exact controls, a timer around the card, one animated "el mes pasa" (no modals), and consequence/Congress cards in the same stage. Charts, the map and the human balance live only in the ending.

Backup point before the rebuild: commit `57bef8b` on `rediseno-serious-game`.

## Commands

- `npm run dev`: Vite dev server on port 3000
- `npm run build`: production build to `dist/`
- `npm test`: runs `node --test` over `test/`. To run a single test, use `node --test --test-name-pattern "<name>" test/`.

Every push to `main` deploys to GitHub Pages through `.github/workflows/deploy.yml`. `vite.config.js` must keep `base: './'`.

## Engine (kept by the rebuild)

The code is split into layers. Only `views/` and `audio/` touch the DOM or Web Audio. Everything below is pure and tested.

- **`src/model/economy.js`**: the monthly macro model. `step(prev, newRate, shock, params)` implements the transmission chain the game teaches: policy rate → market rate (partial pass-through, which creates the lag) → real-rate gap vs. neutral → output gap → core inflation. It adds expectations anchored by credibility and decaying supply shocks, and returns `drivers` (why inflation moved). `PARAMS` can be overridden per scenario.
- **`src/game/mandate.js`**: the scenario-driven turn engine for the tutorial, free mode, express, the weekly challenge and the rate chapters. `decide(rate, sell, tone, toolId, { convinced, timeout })` is the only way to play a turn and returns a record (state, move, notes, headline, people, regions, fx, tone, tool, board, envy, climax, consequences…). Seeded PRNGs (`rng`; `crng` for Congress; `fxRng`, drawn once per turn) keep runs reproducible and calibration stable.
  - **Turn unit.** Free mode, express, the challenge and the tutorial are **monthly** (`stepsPerTurn: 1`, `turnUnit: 'mes'`, `shockScale` 0.45, `horizon` 6). Story chapters stay **quarterly** because their real data is quarterly. Use `m.unit` / `m.unitWord(n)` in the UI.
  - **Events and surprises.** One card (`m.event`) per turn from `model/events.js` (scripted in chapters, random by tier in free mode, intensity ramping every `yearLength` turns). Surprises are drawn *after* the decision, so the projection never includes them.
  - **Projection with fog.** `m.projection(rate, sell, tone, toolId)` returns points with `lo`/`hi`; `m.fog(k)` widens as credibility falls.
  - **Advisors.** `m.advisors()` returns hawk and dove proposals (invariant: hawk ≥ dove); `staffRecommendation(state)` in `economy.js` is the staff rule.
  - **Actions** (`game/actions.js`): at most 2 actions per turn across four levers (rate, dollars, speech, tools); `planIsValid(plan)`. Real BCRP paths must fit (tested).
  - **FX.** Scenarios with `fx: { rate, reserves }` add the exchange rate and reserves. Depreciation % = card/surprise `fx` pressure − 1.2 × rate move − 1.0 × sales + noise; it feeds inflation through asymmetric `passThrough`, cuts demand (dollarization) and costs credibility above 4%. The free-mode floor (`fx.floor` 0.6) limits what can be sold. The chapters' `SCRIPT_FX` are back-solved to reproduce the real quarterly exchange rate; recompute them if you change `FX`.
  - **Communiqué** (`GUIDANCE`, the "speech"): `halcon` / `neutral` / `paloma`. It moves expectations at once, scaled by credibility, and commits the next turn: `breaksGuidance(move)` costs `GUIDANCE_RULES.broken` credibility plus an FX jump; keeping it pays `kept`. Off in the tutorial (`guidance: false`).
  - **Toolbox** (`game/toolbox.js`): reserve requirements in soles and dollars, repos, dedollarization and FX swaps, each with effect, cost, a cooldown shared by `group`, and a sourced `history` line. Chapters list their era's tools; free mode uses `unlockedTools(story.chapters)`. The encaje unlocks mid-mandate (`toolUnlock`). Separate from the scripted chapter `tools` (Reactiva), which `replayReal` uses.
  - **Congress.** `pressure` (starts at `CONGRESS.start` 50 and reverts toward it) is also the Congress mood (`congressMood`). Hikes and ignored "bajar" requests raise it; success itself adds envy up to `CONGRESS.envyCap` (60). Citations (`maybeCite`, `answerCitation(i)`: técnica / promesa / evasiva) and bills (`maybeBill`, `answerBill(i)`: oppose / negotiate / stay silent) are queued in `m.congress.pending` / `pendingBill`. A promise ("noSubir") constrains the next turn.
  - **Board vote** (free mode and express, `scenario.board`): `BOARD` follows art. 86 of the Constitution (7 members; 4 named by the Executive incl. the player, 3 elected by Congress; none represents particular interests). `boardVote(move)` needs 4 of 7 within `BOARD_RULES.tolerance`; without a majority the rate is held at `lost` credibility. Holding never needs a vote. Chapters don't vote.
  - **Silence.** `decide(..., { timeout: true })` (the timer ran out) is not the same as waiting: it costs `SILENCE.credibility`, adds `SILENCE.fx` dollar pressure, drops any communiqué and sets the headline "El BCR, mudo…".
  - **Climax** (chapters): `scenario.climax.turn` is the "momento decisivo"; the player is compared with `Mandate.replayRealStates(seed)` at that turn for ±`CLIMAX.reward/penalty` credibility. In reference mode it compares with itself, so copying the BCRP still scores exactly 100.
  - **Citizen trust** (`TRUST`, `m.trust`), **informality** (`INFORMAL`, starts at 70.2% from INEI 2025, free mode only) and **consequence cards** (`game/consequences.js`, 2–4 months back, one per turn at most, in `m.consequences`) are narrative plus score: they never change the macro model and never appear in reference mode.
  - **Ratification and score (free mode).** `reappoint: { minInBand: 8, minAvgGrowth: 1.8 }`: inflation in band at least 8 of 12 months AND average growth ≥ 1.8% ("sin apagar el país"). Score = 40 × months in band + 25 × average trust + 20 × final credibility + 15 × growth. With these rules, following the hawk wins 37%, the staff 45%, a judgment-based mix 51%, waiting 4% (300 seeds). Express and the challenge use 6 months and `minInBand: 4`.
  - **Chapters' score.** `evaluate()` scores against `Mandate.replayReal(seed)` (the real BCRP rate path under the same seed): copying the BCRP scores exactly 100.
- **`src/game/cast.js`**: the fixed cast (Doña Rosa, Kevin, Valeria, the fictional "Congresista Pérez", the social feed). `castMoods(m, rec)` and `castLines(m, rec)` give each one's mood, cause and phrase.
- **`src/game/endings.js`**: early endings (`ENDINGS`), archetypes by **style** (`styleLog` compares each move with the staff's: hawk if the average gap ≥ +0.15, dove if ≤ −0.15; Bombero if half the reserves were spent; Guardián or Aprendiz otherwise), `worstTurn`, and the share text.
- **`src/game/achievements.js`**: achievements with Peruvian humor ("Perú es clave", "Chamba es chamba"…), awarded by `views/achievementsView.js`.
- **`src/game/challenge.js`**: the weekly challenge (ISO week seed, same deck and tools for everyone).
- **`src/game/hyper.js`**: a separate monthly engine for the 1990 chapter, where the instrument is money emission to finance the Treasury.
- **`src/game/people.js`**: sector and regional moods (with `cause`) and the human balance. `sectorVoice` / `regionVoice` avoid repeating the last 40 phrases; when you add a cause, add several variants.
- **`src/game/cards.js`, `src/game/responses.js`**: NEW in the rebuild (plan, Phase 1): the card queue of a turn and the named responses with their previews.

## Data and content rules (always)

- `src/model/history.js`: the tutorial, the 5 chapters (1990 hyperinflation, 2008 crisis, 2017 coastal El Niño, 2020 pandemic, 2021–23 inflation) and the interludes, with real BCRPData series and sources. Facts in `context`, `reality` and the interludes are real and sourced; keep them that way.
- `src/model/congress.js`: REAL declarations and questions from Peruvian legislators, each with a `source`. They are shown **anonymously** (year and context only), always with the Congress icon and never with a character's face. A test fails if a legislator's name appears in any text. Never add a quote without a verifiable source. Bills and some questions are labeled recreations of real episodes (`kind: 'recreacion'` with `basis`).
- `src/model/regions.js` and `src/model/peruMap.js` (generated from Natural Earth, don't hand-edit): the regional map.
- Characters are fictional. Scenes (`views/scenes.js`) show objects and places, never real people, and never print figures that aren't in sourced text.

## Views

**Being replaced (see the plan; do not extend):** `src/views/play.js` (`playScenario`, `renderVerdict`: the "mesa de mando" with HUD, levers, tradeoff table, board seats, reaction feed and tabbed newspaper), `src/views/tutorialScript.js`, and the old turn sections of `src/styles.css`.

**Target after the rebuild:** `src/views/turn/` (`stage.js` with `playMandate`, `hud.js`, `card.js`, `responses.js`, `finetune.js`, `monthPasses.js`, `ending.js` with `renderEnding`, `tutorial.js`), `src/turn.css`, and `src/views/common.js` with the shared helpers (`avatar`, `shortLabel`, `animateNumber`, `createTimer`, `announceSuspense`, `showBreaking`, `BILL_ICON`). Fixed DOM ids for the coach and checks: `#hud`, `#stage`, `#timer`, `#card`, `#responses`, `#finetune-open`, `#finetune`, `#announce`.

**Kept:**
- `views/intro.js`: title screen and the "¿Qué es el BCR?" intro.
- `views/story.js`: chapter timeline and the illustrated chapter-intro slider (`SLIDE_SCENES`, `views/scenes.js`).
- `views/hyper.js`: 1990, until the optional Phase 6.
- `views/shareCard.js` / `share.js`: share cards.
- `views/achievementsView.js`.
- `views/modal.js`: single-modal helper; `modalOpen()` gates shortcuts.
- `views/coach.js`: queued coach marks.
- `views/glossary.js`, `icons.js` (`icon`, `bust`, `congressScene`, `KIND_ICON`), `art.js`.
- `views/fanChart.js` (`compareChart`), `peruMap.js`, `people.js`: ending only.

`src/main.js` routes from the title to the tutorial, story mode, free mode, express and the weekly challenge. `src/audio/music.js` provides procedural Andean music (`music.setMood(...)`, `sting()`, `click()`).

**Difficulty** (`storage.js` `DIFFICULTIES`): `facil` (judgment colors, 120 s), `normal` (neutral colors, 45 s), `dificil` (25 s). The timer (`createTimer`) is wall-clock and pauses while a modal is open; the tutorial passes `noTimer`.

## Tuning and tests

Model parameters and scenario shocks are calibrated together; the tests pin the design intent:

- `test/mandate.test.js`, `test/audit.test.js`: free-mode balance. No fixed strategy wins more than 50%; hawk below staff; archetypes follow style; silence costs more than waiting.
- `test/design.test.js`: actions, fog, consequences, cast, endings.
- `test/history.test.js`: every chapter is winnable by replaying the real BCRP path (≥80%), real moves fit the chapter's buttons, and copying the BCRP scores exactly 100. Must stay green **unchanged** through the rebuild.
- Others: `guidance`, `toolbox`, `congress`, `people`, `achievements`, `challenge`. The rebuild adds `cards` and `responses`.

When you retune anything, print trajectories under several strategies (real path, staff, hawk, dove, hold) before touching the tests, and never change `PARAMS` to make a UI choice balanced: adjust the response rules instead.
