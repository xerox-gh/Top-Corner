# Top Corner

A self-contained, offline, Canvas 2D soccer game inspired by the feel of PES / eFootball. Fictional clubs and generated players, procedural visuals and Web Audio effects. No account, assets, CDN, build step or runtime dependencies.

## Play

Download **index.html** and open it in a modern desktop or mobile browser. Choose **Play → Kick off**. Landscape is recommended on phones. For consistent browser save storage, serve the folder locally or with a static host:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000. The same `index.html` works on GitHub Pages; hosting is not required to play.

## Included in this build

- **11v11 exhibition:** two halves; 2/3/5/10 real minutes per half; four difficulties; switching, sprint stamina, ground/through/lob passes, charged and finesse shots, tackles and slides.
- **Match systems:** ball height, drag, bounce and spin; posts/crossbar; interceptions; keeper catches/parries; throw-ins, corners, goal kicks, free kicks and penalties; optional offside; yellow/red cards and five substitutions. Rules are simplified arcade rules.
- **Presentation:** broadcast, high-angle and rotated behind-goal cameras; player indicators and radar; procedural animated players and hair; day/night and rain/snow; goal effects and a short goal replay; match statistics. Crowd detail follows the graphics preset.
- **World database:** all 38 countries and 76 division names from the supplied brief, exactly as specified. 1,256 fictional clubs. Seeded, lazily generated 20-player squads, nationalities, ages, ratings and potential.
- **Manager career:** three save slots; home/away league fixtures; the club's two-division pyramid; simulated other fixtures in those divisions; tables and season history; three-up/three-down promotion/relegation; lineup swaps, sign/sell transfers, basic budgets, training, aging and decline. Play or simulate matches. Progress autosaves after matches and management actions.
- **Tournament builder:** select eight teams for a knockout cup or a single-round league. Play any fixture as the home team or simulate rounds. Tied played knockout matches get two extra-time halves and a choice-based penalty shootout. Resume the last tournament from browser storage.
- **Editor:** rename existing clubs and leagues, change kit colors and reputation, edit player names/positions/ratings/skin/hair, and export/import world edits. An existing club slot can be turned into your own club.
- **Inputs:** keyboard, standard gamepad mapping, and touch joystick/buttons. A training match runs without a clock.
- **Single-file runtime:** fixed 60 Hz simulation, capped frame catch-up, guarded/versioned local storage, career/world JSON export and import, and commented no-op SDK hooks.

## Controls

| Action | Keyboard | Standard gamepad |
| --- | --- | --- |
| Move / aim | WASD or arrows | Left stick |
| Pass / tackle | J | A |
| Through pass / second defender press | K | Y |
| Lob / goalkeeper charge | I | X |
| Charge shot / slide | Hold and release L | Hold and release B |
| Finesse | Q while shooting | Keyboard modifier |
| Sprint | Shift | RB |
| Switch player | Space | LB |
| Pause | Escape | Start |
| Cycle camera | C | Settings |

Aim passes with movement; when shooting, aim across goal with up/down in the default camera. Camera rotation also rotates movement. On restarts, aim and use pass, lob or shoot; a restart automatically proceeds after 14 seconds. Pause to substitute or change tactics.

## Saves and editing

Saves are local to the browser and origin. Export a career before clearing browser data or moving between `file://`, localhost and a hosted site. Starting/importing into an occupied slot asks before replacing it. The editor affects new matches and newly created careers; saved career rosters remain independent. World reset preserves careers. Storage failures show an export reminder rather than silently claiming success.

## Scope

This is the playable first release, following the brief's stated priority of core matches, the world database, manager career, tournaments and editing. It does **not** yet implement player/hybrid career, local multiplayer/co-op, national-team or continental competitions, integrated domestic cups, lower-tier generation, advanced transfer negotiations/contracts/loans, scouting regions, a youth academy, injuries, board sackings, press conferences, deep finances, kit-pattern/badge designers, gamepad remapping, or separate skill challenges. Only the active career's two divisions are simulated, not the entire world. Penalty shootouts use corner choices rather than the live match physics. Free-kick walls, throw animations, stadium-size variants and full referee law coverage remain future improvements. No mobile hardware or sustained 60 FPS guarantee is claimed.

## Validation

`tests/smoke.cjs` uses Playwright to check browser startup, keyboard kickoff, 1,800 physics/AI ticks, goals, restarts, offside, halftime, substitutions, career season completion, promotion/relegation, save validation, transfers, knockout/league tournaments, world edits, direct `file://` launch and mobile layout. Playwright is only a development test dependency.

```sh
npm install --no-save playwright
npx playwright install chromium
node tests/smoke.cjs
```

Set `CHROMIUM_PATH` to use an existing Chromium executable. Keyboard and touch layouts were checked in Chromium; physical gamepad and mobile-device behavior still need hands-on testing.
