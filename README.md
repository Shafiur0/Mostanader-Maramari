# মস্তানদের মারামারি — MOSTANADER MARAMARI

**A story-driven 2D fighting game set in Nabinpur, a small town in Bangladesh.**

Six chapters. Seven fighters. One man who came back to find his town for sale.

---

## ▶ Play right now (no install)

Open **`WebBuild/index.html`** in any browser — double-click it, that's all.
No server, no build step, no internet needed.

> If your browser blocks audio on `file://`, run `python -m http.server` inside
> `WebBuild/` and open `http://localhost:8000`.

---

## ▶ Open the Unity project

1. Install **Unity 2021.3 LTS or newer** (2022.3 / Unity 6 are fine).
2. Open **Unity Hub → Add → Add project from disk** and pick the folder:
   `D:\mostander maramari\MostanaderMaramari`
3. Open it, then open `Assets/Scenes/Main.unity` and press **Play**.

The whole game builds itself at runtime from `Bootstrap.cs` — there is nothing to
wire up in the inspector. If the scene ever goes missing, use the menu
**Mostanader Maramari → Create Fresh Main Scene**.

**No external packages, no imported art, no audio files.** Every sprite, every
background and every sound is generated in code when the game starts.

---

## Controls

| Action | Key |
|---|---|
| Walk | `A` / `D` |
| Jump | `W` |
| Crouch | `S` |
| Stand block | hold away from the opponent |
| Crouch block | `S` + away |
| Jab | `J` |
| Heavy punch | `K` |
| Kick | `L` |
| Low kick | `S` + `L` |
| Special (50 meter) | `U` |
| Super (100 meter) | `I` |
| Pause | `Esc` |

**Rules that matter:** high attacks whiff on crouch-block · low attacks break
stand-block · jump attacks beat crouch-block · you can cancel a move into another
one once it connects.

---

## The town

| Stage | Place | Mood |
|---|---|---|
| Cha er Dokan | tea stall at dawn | burnt tin roof, kettle on its chain |
| Kacha Bazar | vegetable market, midday | tarpaulin roofs, crates, a CNG |
| Itbhata | brick kiln | chimneys, brick stacks, kiln fire |
| Rickshaw Stand | rainy night | neon, wet asphalt, parked rickshaws |
| Boli Khela Akhra | wrestling pit, festival | crowd, bunting, drums, torches |
| Chairman's Rooftop | night, above the town | water tank, laundry line, city lights |

## The fighters

**Mostafa** (you) · Kala Chan · Bappi Bhai · Jontu · Salma · Rustom · Chairman Aziz

Each has its own reach, weight, walk speed, special move and super.

---

## Story

0. **The Burnt Stall** — the tea stall is ash; Kala Chan is collecting chanda.
1. **The Thumbprint** — Bappi Bhai is buying the bazar with thumbprints.
2. **The Kiln** — Jontu is sent to bury you in the clay.
3. **The Bodyguard** — Salma fights clean, and tells you who is really buying.
4. **The Akhra** — four thousand people watch Rustom try to break you.
5. **The Chairman** — the rooftop, the deed, and the last fight.

Progress is saved per chapter. Beat a chapter to unlock the next.

---

## Files

```
D:\mostander maramari\
├─ README.md                  ← this file
├─ GAME-DESIGN.md             ← full design document
├─ MostanaderMaramari\        ← Unity project (C#)
│  ├─ Assets\Scenes\Main.unity
│  ├─ Assets\Scripts\Core\     Bootstrap, GameRoot, AudioSynth, InputMap
│  ├─ Assets\Scripts\Fight\    Roster, Fighter, MatchManager, AIBrain
│  ├─ Assets\Scripts\Art\      ProcTex, StageArt, FighterRig, Poses
│  ├─ Assets\Scripts\UI\       UI, HUD
│  └─ Assets\Editor\           scene helpers
└─ WebBuild\                  ← browser build (HTML5 canvas)
   ├─ index.html
   ├─ css\style.css
   └─ js\audio.js art.js data.js combat.js ai.js story.js game.js
```

---

## How it is built

**Unity side**

- `ProcTex` — a tiny software rasteriser (`Rect`, `Disc`, `Line`, `Curve`,
  `VGradStops`, `SoftGlow`) plus sprite generation. Stage backdrops are baked
  into four parallax textures per stage at load time.
- `FighterRig` — a paper-doll skeleton of primitive sprites. Every animation is a
  set of joint angles (`Poses.cs`), so there is no sprite sheet and no Animator.
- `AudioSynth` — hits, whooshes, bells and a three-track folk loop, all synthesised
  sample-by-sample at start-up.
- `MatchManager` — rounds, hitboxes, blocking rules, hitstop, screen shake,
  super meter and camera.

**Web side** — the same design in plain JavaScript on a 2D canvas, with the
fighter rig drawn as vector limbs and the stages as layered canvas art.

---

*Made for Nabinpur. Cha khaben?*
