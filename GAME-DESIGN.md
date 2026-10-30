# মস্তানদের মারামারি — MOSTANADER MARAMARI
### "The Brawl of the Hoods" — A Bangladeshi Town Fighting Game

---

## 1. Concept

A 2D one-on-one fighting game set in **Nabinpur**, a small fictional town in Bangladesh.
Brick-walled bazar lanes, rickshaw bells, tea-stall smoke, launch ghats on the river, and a
Chairman who owns everybody.

You play **Mostafa**, a young man who came back from Dhaka and found his town for sale.

**Genre:** 2D fighter / story mode
**Tone:** gritty-street but warm — 90s Bangladeshi action-cinema energy
**Camera:** side view, single plane, auto-zoom on the fight

---

## 2. The Town — Nabinpur (নবীনপুর)

The environment is the second main character. Every stage is a real place-type from Bangladesh:

| # | Stage | Where | Mood | Palette |
|---|-------|-------|------|---------|
| 1 | **Cha er Dokan** (চায়ের দোকান) | Tea stall, dawn | quiet, kettle steam, bamboo bench | amber / deep green |
| 2 | **Kacha Bazar** (কাঁচা বাজার) | Vegetable market, midday | loud, tarpaulin roofs, flies | hot orange / mustard |
| 3 | **Itbhata** (ইটভাটা) | Brick kiln field | dust, chimneys, stacked bricks | rust red / dusty gold |
| 4 | **Rickshaw Stand** (রিকশা স্ট্যান্ড) | Rainy street, night | neon, puddles, reflections | teal / magenta |
| 5 | **Boli Khela Akhra** (বলি খেলা আখড়া) | Wrestling pit, festival | crowd, dust ring, drums | earth brown / crimson |
| 6 | **Chairman's Rooftop** (ছাদ) | Water tank, night skyline | isolation, city lights | indigo / cold blue |

Each stage = 4 parallax layers (sky gradient → far silhouette → mid buildings/props →
foreground props) + animated details (steam, rain, dust, crowd, birds, flickering bulbs).

---

## 3. Roster

### Playable / Story
- **MOSTAFA "Mosti"** — 26, returned from Dhaka. Blue panjabi, red gamcha. Balanced.
  *"Tor baper shompotti na, tor boner biyar taka."*

### Opponents (unlockable in Versus after Story clear)
| Fighter | Role | Style | Gimmick |
|---|---|---|---|
| **Kala Chan** | Chapter 1 — local goon | Brawler | fast jabs, low damage |
| **Bappi Bhai** | Chapter 2 — broker | Lathi (stick) | long reach, slow |
| **Jontu** | Chapter 3 — brick-field strongman | Grappler | huge damage, slow, armour on heavy |
| **Salma** | Chapter 4 — Chairman's bodyguard | Karate | counters, fast kicks |
| **Rustom** | Chapter 5 — boli khela wrestler | Wrestler | throws, super armour |
| **Chairman Aziz** | Chapter 6 — final boss | Dirty boxer + guards | 2 phases, calls backup |

---

## 4. Story — 6 Chapters

**Chapter 0 — Prologue (Cha er Dokan).** Mostafa comes home. His father's tea stall is a
burnt shell. Kala Chan is collecting "chanda" (protection money) from the neighbours.
Mostafa puts down his bag. *Tutorial fight.*

**Chapter 1 — Kacha Bazar.** Bappi Bhai is forcing shopkeepers to sign away their land
for the brick factory. Mostafa breaks the deal — literally.

**Chapter 2 — Itbhata.** Jontu, the strongman who works the kiln, is sent to bury him in
the clay. Mostafa learns the town's soil is being sold from under them.

**Chapter 3 — Rickshaw Stand (rain).** Salma, the Chairman's bodyguard, tests him. She
fights clean and tells him the truth: the Chairman answers to a Dhaka syndicate.

**Chapter 4 — Boli Khela Akhra.** At the festival, Rustom — the town's champion — is
paid to break Mostafa in front of everyone. The crowd turns.

**Chapter 5 — Chairman's Rooftop.** The Chairman offers him a job, then a beating.
Mostafa refuses both. Final fight. The town watches from below.

**Ending:** The bazar reopens. The tea stall is rebuilt. Mostafa lights the stove.
Last line: *"চা খাবেন?"* ("Tea?")

---

## 5. Combat System

**Health** 100 per round · **Rounds** best of 3 · **Timer** 60s · **Meter** 0–100

### Controls
| Action | Key |
|---|---|
| Move | `A` / `D` |
| Jump | `W` |
| Crouch / Block | `S` (hold `S` while not attacking = block) |
| Light punch | `J` |
| Heavy punch | `K` |
| Kick | `L` |
| Special (50 meter) | `U` |
| Super (100 meter) | `I` |
| Dash | double-tap `A`/`D` |
| Pause | `Esc` |

### Frame data model
Every move = `startup → active → recovery` at 60 fps, with:
damage, hitstun, blockstun, hitstop (freeze frames), reach, hit height (high/mid/low),
knockback, meter gain, chip damage on block.

### Rules
- **Blocking** reduces damage to 15% chip, but a **low** attack beats standing block and a
  **jump-in** beats crouch block.
- **Hitstop** freezes both fighters 4–9 frames on impact → makes hits feel heavy.
- **Combos** chain light → heavy → kick within cancel windows; counter shows on screen.
- **Meter** gained by landing hits and by taking damage.
- **Super** = 3-hit cinematic rush, screen desaturates, camera pushes in.
- **KO** = slow motion + zoom + dust burst.

---

## 6. AI

Distance-band state machine (far / mid / close) with per-chapter difficulty:

`reactionDelay`, `aggression`, `blockChance`, `specialChance`, `antiAirChance`

The AI never reads inputs — it reacts to state with a delay, so it feels human.
Difficulty ramps: Ch1 = training dummy, Ch6 = boss (blocks 65%, punishes whiffs).

---

## 7. Art Direction

Everything is **procedurally drawn** — no external art assets.

- Fighters are **paper-doll rigs**: torso, head, 2-segment arms, 2-segment legs, gamcha
  scarf that sways with velocity. Poses are driven by joint angles per animation state.
- Clothing colors per character (panjabi, lungi, gamcha, vest, sando-genji).
- Silhouette-first backgrounds, warm dust haze, film grain, vignette.
- Impact: white flash frames, radial spark burst, dust puffs, screen shake.

---

## 8. Audio

Fully synthesized (Web Audio / procedural C# clips) — no audio files:

- punch whoosh (filtered noise sweep), heavy hit (low thump + noise), block (metallic tick)
- KO boom, jump, land, menu click, crowd swell
- Music: a folk-flavoured loop in **Bhairavi** mode (bansuri-ish lead + dhol pattern)

---

## 9. Tech

### A. Unity project — `MostanaderMaramari/`
- Unity **2021.3 LTS or newer** (2022.3 / Unity 6 all fine)
- Built-in render pipeline, 2D, **no external packages** (no TMP, no new Input System)
- Whole game is generated at runtime by `GameBootstrap` → open the project, press **Play**
- `Assets/Scenes/Main.unity` is intentionally minimal; everything spawns from code

### B. Web build — `WebBuild/`
- Same game, same stages, same story, playable in any browser
- No build step, no server, no dependencies — just open `index.html`

---

## 10. Folder layout

```
D:\mostander maramari\
├─ GAME-DESIGN.md          ← this file
├─ README.md               ← how to run both builds
├─ MostanaderMaramari\     ← Unity project
│  ├─ Assets\Scripts\{Core,Fight,Story,UI,Art}
│  ├─ Assets\Scenes\Main.unity
│  ├─ ProjectSettings\
│  └─ Packages\manifest.json
└─ WebBuild\               ← playable browser build
   ├─ index.html
   ├─ css\style.css
   └─ js\{audio,art,data,combat,ai,story,game}.js
```
