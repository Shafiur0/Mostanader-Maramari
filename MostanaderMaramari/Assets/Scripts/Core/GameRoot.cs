using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

/// <summary>
/// The whole game shell: camera, screens, story flow and the per-frame loop.
/// </summary>
public class GameRoot : MonoBehaviour
{
    public static GameRoot I;

    Camera _cam;
    Canvas _hudCanvas, _uiCanvas;
    HUD _hud;
    Transform _world;

    MatchManager _match;
    AIBrain _brain;
    string _screen = "title";

    GameObject _scrTitle, _scrMenu, _scrStory, _scrVersus, _scrRoster, _scrResult, _scrPause, _scrControls;
    GameObject _scrDialogue;
    Text _dlgSpeaker, _dlgBody, _dlgHint;

    // dialogue state
    Line[] _dlgLines;
    int _dlgIndex;
    float _dlgChar;
    Action _dlgDone;

    // selection
    string _vsP1 = "mostafa", _vsP2 = "kalachan", _vsStage = "bazar";
    int _chapter = 0;
    bool _storyMode = true;
    float _endDelay = 0f;
    int _pendingEnd = -1;

    /* ============================================================
       boot
       ============================================================ */
    void Awake()
    {
        I = this;
        Roster.Init();
        SetupCamera();
        SetupEventSystem();

        _uiCanvas = UI.MakeCanvas("UI", 100);
        _hudCanvas = UI.MakeCanvas("HUDCanvas", 50);
        _hud = new HUD();
        _hud.Build(_hudCanvas.transform);
        _hud.SetVisible(false);

        BuildScreens();
        ShowScreen("title");

        if (AudioSynth.I != null) AudioSynth.I.Music("town");
    }

    void SetupCamera()
    {
        var go = new GameObject("Main Camera");
        go.tag = "MainCamera";
        _cam = go.AddComponent<Camera>();
        _cam.orthographic = true;
        _cam.orthographicSize = 2.4f;
        _cam.clearFlags = CameraClearFlags.SolidColor;
        _cam.backgroundColor = new Color(0.02f, 0.022f, 0.03f, 1f);
        _cam.nearClipPlane = 0.3f;
        _cam.farClipPlane = 100f;
        go.transform.position = new Vector3(Roster.WorldWidth * 0.5f, 1.44f, -10f);
        go.AddComponent<AudioListener>();
    }

    void SetupEventSystem()
    {
        if (FindObjectOfType<EventSystem>() != null) return;
        var es = new GameObject("EventSystem");
        es.AddComponent<EventSystem>();
        es.AddComponent<StandaloneInputModule>();
    }

    /* ============================================================
       screens
       ============================================================ */
    void BuildScreens()
    {
        var root = _uiCanvas.transform;

        // ---------- title ----------
        _scrTitle = UI.Screen(root, "Title", new Color(0.02f, 0.025f, 0.035f, 0.92f));
        UI.Label(_scrTitle.transform, "NABINPUR, BANGLADESH", 18, UI.Gold, TextAnchor.MiddleCenter, 0f, 120f, 1280f, 32f);
        var logo = UI.Label(_scrTitle.transform, "MOSTANADER", 96, UI.Paper, TextAnchor.MiddleCenter, 0f, 160f, 1280f, 110f);
        logo.fontStyle = FontStyle.Bold;
        var logo2 = UI.Label(_scrTitle.transform, "M A R A M A R I", 52, UI.GoldLight, TextAnchor.MiddleCenter, 0f, 262f, 1280f, 70f);
        logo2.fontStyle = FontStyle.Bold;
        UI.Label(_scrTitle.transform, "A small town. A burnt tea stall.\nOne man who came back.",
                 18, UI.Muted, TextAnchor.MiddleCenter, 0f, 350f, 1280f, 60f);
        UI.Btn(_scrTitle.transform, "PRESS START", 520f, 440f, 240f, 58f, () => ShowScreen("menu"), true);
        UI.Label(_scrTitle.transform, "Nabinpur, Bangladesh   ·   6 chapters   ·   7 fighters",
                 13, new Color(0.45f, 0.43f, 0.4f, 1f), TextAnchor.MiddleCenter, 0f, 530f, 1280f, 24f);

        // ---------- menu ----------
        _scrMenu = UI.Screen(root, "Menu", new Color(0.02f, 0.025f, 0.035f, 0.86f));
        var panel = UI.Box(_scrMenu.transform, "panel", new Color(0.055f, 0.06f, 0.075f, 0.96f), 330f, 110f, 620f, 470f);
        UI.Label(panel.transform, "MAIN MENU", 13, UI.Gold, TextAnchor.UpperLeft, 40f, 30f, 300f, 24f);
        UI.Label(panel.transform, "Mostanader Maramari", 34, UI.Paper, TextAnchor.UpperLeft, 40f, 56f, 540f, 46f);
        UI.Btn(panel.transform, "STORY MODE", 40f, 130f, 540f, 56f, OpenStory, false);
        UI.Btn(panel.transform, "VERSUS", 40f, 198f, 540f, 56f, OpenVersus, false);
        UI.Btn(panel.transform, "FIGHTERS", 40f, 266f, 540f, 56f, OpenRoster, false);
        UI.Btn(panel.transform, "CONTROLS", 40f, 334f, 540f, 56f, () => ShowScreen("controls"), false);

        // ---------- story select ----------
        _scrStory = UI.Screen(root, "Story", new Color(0.02f, 0.025f, 0.035f, 0.88f));
        UI.Label(_scrStory.transform, "STORY MODE", 13, UI.Gold, TextAnchor.UpperLeft, 80f, 40f, 300f, 24f);
        UI.Label(_scrStory.transform, "Nabinpur — Chapter Select", 34, UI.Paper, TextAnchor.UpperLeft, 80f, 64f, 700f, 44f);
        var back = UI.Btn(_scrStory.transform, "BACK", 80f, 620f, 140f, 48f, () => ShowScreen("menu"), false);

        // ---------- versus ----------
        _scrVersus = UI.Screen(root, "Versus", new Color(0.02f, 0.025f, 0.035f, 0.88f));
        UI.Label(_scrVersus.transform, "VERSUS", 13, UI.Gold, TextAnchor.UpperLeft, 80f, 40f, 300f, 24f);
        UI.Label(_scrVersus.transform, "Choose your fighter", 34, UI.Paper, TextAnchor.UpperLeft, 80f, 64f, 700f, 44f);

        // ---------- roster ----------
        _scrRoster = UI.Screen(root, "Roster", new Color(0.02f, 0.025f, 0.035f, 0.9f));
        UI.Label(_scrRoster.transform, "FIGHTERS OF NABINPUR", 13, UI.Gold, TextAnchor.UpperLeft, 80f, 40f, 400f, 24f);
        UI.Btn(_scrRoster.transform, "BACK", 80f, 620f, 140f, 48f, () => ShowScreen("menu"), false);

        // ---------- controls ----------
        _scrControls = UI.Screen(root, "Controls", new Color(0.02f, 0.025f, 0.035f, 0.92f));
        UI.Label(_scrControls.transform, "CONTROLS", 13, UI.Gold, TextAnchor.UpperLeft, 80f, 50f, 300f, 24f);
        UI.Label(_scrControls.transform,
            "A / D          walk\n" +
            "W               jump\n" +
            "S               crouch\n" +
            "S + away     crouch block\n" +
            "away            stand block\n" +
            "J               jab\n" +
            "K               heavy punch\n" +
            "L               kick\n" +
            "S + L          low kick\n" +
            "U               special  (50 meter)\n" +
            "I               super  (100 meter)\n" +
            "ESC            pause",
            20, UI.Paper, TextAnchor.UpperLeft, 80f, 96f, 700f, 440f);
        UI.Label(_scrControls.transform,
            "High attacks whiff on crouch-block.\nLow attacks break stand-block.\nJump attacks beat crouch-block.",
            16, UI.Muted, TextAnchor.UpperLeft, 80f, 520f, 700f, 80f);
        UI.Btn(_scrControls.transform, "BACK", 80f, 620f, 140f, 48f, () => ShowScreen("menu"), false);

        // ---------- dialogue ----------
        _scrDialogue = UI.Screen(root, "Dialogue", new Color(0f, 0f, 0f, 0.35f));
        var dlgBox = UI.Box(_scrDialogue.transform, "box", new Color(0.03f, 0.035f, 0.045f, 0.96f), 140f, 470f, 1000f, 190f);
        _dlgSpeaker = UI.Label(dlgBox.transform, "", 20, UI.GoldLight, TextAnchor.UpperLeft, 30f, 14f, 600f, 30f);
        _dlgBody = UI.Label(dlgBox.transform, "", 21, UI.Paper, TextAnchor.UpperLeft, 30f, 48f, 940f, 120f);
        _dlgHint = UI.Label(dlgBox.transform, "click / SPACE to continue", 12, UI.Muted, TextAnchor.LowerRight, 30f, 156f, 940f, 22f);

        // ---------- result ----------
        _scrResult = UI.Screen(root, "Result", new Color(0.02f, 0.025f, 0.035f, 0.9f));
        var rp = UI.Box(_scrResult.transform, "panel", new Color(0.055f, 0.06f, 0.075f, 0.96f), 390f, 190f, 500f, 340f);
        _resKicker = UI.Label(rp.transform, "RESULT", 13, UI.Gold, TextAnchor.UpperLeft, 34f, 26f, 400f, 24f);
        _resTitle = UI.Label(rp.transform, "", 32, UI.Paper, TextAnchor.UpperLeft, 34f, 52f, 430f, 50f);
        _resSub = UI.Label(rp.transform, "", 16, UI.Muted, TextAnchor.UpperLeft, 34f, 108f, 430f, 90f);
        _resButtons = new GameObject("buttons").transform;
        _resButtons.SetParent(rp.transform, false);
        UI.Place(_resButtons.gameObject, 34f, 210f, 430f, 120f);

        // ---------- pause ----------
        _scrPause = UI.Screen(root, "Pause", new Color(0.02f, 0.025f, 0.035f, 0.86f));
        var pp = UI.Box(_scrPause.transform, "panel", new Color(0.055f, 0.06f, 0.075f, 0.96f), 470f, 230f, 340f, 250f);
        UI.Label(pp.transform, "PAUSED", 13, UI.Gold, TextAnchor.UpperLeft, 34f, 26f, 300f, 24f);
        UI.Label(pp.transform, "Hold on", 30, UI.Paper, TextAnchor.UpperLeft, 34f, 52f, 300f, 44f);
        UI.Btn(pp.transform, "RESUME", 34f, 110f, 272f, 50f, TogglePause, false);
        UI.Btn(pp.transform, "QUIT TO MENU", 34f, 170f, 272f, 50f, QuitToMenu, false);
    }

    Text _resKicker, _resTitle, _resSub;
    Transform _resButtons;

    void ShowScreen(string name)
    {
        _screen = name;
        _scrTitle.SetActive(name == "title");
        _scrMenu.SetActive(name == "menu");
        _scrStory.SetActive(name == "story");
        _scrVersus.SetActive(name == "versus");
        _scrRoster.SetActive(name == "roster");
        _scrControls.SetActive(name == "controls");
        _scrDialogue.SetActive(name == "dialogue");
        _scrResult.SetActive(name == "result");
        _scrPause.SetActive(name == "pause");

        bool fighting = name == "fight" || name == "pause";
        _hud.SetVisible(fighting);

        if (name == "story") BuildStoryButtons();
        if (name == "versus") BuildVersusButtons();
        if (name == "roster") BuildRoster();
    }

    void ClearChildren(Transform t)
    {
        for (int i = t.childCount - 1; i >= 0; i--)
        {
            var child = t.GetChild(i).gameObject;
            child.SetActive(false);
            Destroy(child);
        }
    }

    /* ============================================================
       story select
       ============================================================ */
    int MaxChapter()
    {
        int m = 0;
        for (int i = 0; i < Roster.Chapters.Count; i++)
            if (IsCleared(i)) m = i + 1;
        return Mathf.Min(m, Roster.Chapters.Count - 1);
    }

    bool IsCleared(int i) { return PlayerPrefs.GetInt("mm_cleared_" + i, 0) == 1; }

    void BuildStoryButtons()
    {
        var host = _scrStory.transform.Find("chapters");
        if (host == null)
        {
            var go = new GameObject("chapters");
            go.transform.SetParent(_scrStory.transform, false);
            UI.Place(go, 80f, 130f, 1120f, 460f);
            host = go.transform;
        }
        ClearChildren(host);

        int maxOpen = MaxChapter();
        for (int i = 0; i < Roster.Chapters.Count; i++)
        {
            var ch = Roster.Chapters[i];
            int col = i % 2, row = i / 2;
            float x = col * 560f, y = row * 150f;
            bool locked = i > maxOpen;

            string title = "CHAPTER " + (i + 1) + "   ·   " + ch.diff.label + "\n" + ch.title +
                           "\n" + Roster.GetStage(ch.stage).name + "   —   vs " + Roster.GetFighter(ch.opponent).name;
            if (IsCleared(i)) title += "   ✔";
            if (locked) title = "LOCKED\nclear chapter " + i + " first";

            int idx = i;
            var b = UI.Btn(host, title, x, y, 540f, 130f, () => StartChapter(idx), false);
            var lbl = b.GetComponentInChildren<Text>();
            if (lbl != null)
            {
                lbl.alignment = TextAnchor.MiddleLeft;
                lbl.fontSize = 16;
                lbl.color = locked ? new Color(0.4f, 0.4f, 0.4f, 1f) : UI.Paper;
                var rt = lbl.rectTransform;
                rt.offsetMin = new Vector2(24f, 0f);
            }
            b.interactable = !locked;
            if (locked) b.image.color = new Color(0.07f, 0.07f, 0.08f, 0.85f);
        }
    }

    /* ============================================================
       versus select
       ============================================================ */
    void OpenVersus()
    {
        ShowScreen("versus");
    }

    void OpenStory()
    {
        ShowScreen("story");
    }

    void OpenRoster()
    {
        ShowScreen("roster");
    }

    void BuildVersusButtons()
    {
        var host = _scrVersus.transform.Find("fighters");
        if (host == null)
        {
            var go = new GameObject("fighters");
            go.transform.SetParent(_scrVersus.transform, false);
            UI.Place(go, 80f, 130f, 1120f, 260f);
            host = go.transform;
        }
        ClearChildren(host);

        for (int i = 0; i < Roster.Order.Count; i++)
        {
            var def = Roster.GetFighter(Roster.Order[i]);
            int col = i % 4, row = i / 4;
            float x = col * 280f, y = row * 124f;
            string id = def.id;
            string label = def.name + (id == _vsP1 ? "  [P1]" : (id == _vsP2 ? "  [P2]" : ""));
            var b = UI.Btn(host, label, x, y, 260f, 110f, () =>
            {
                if (_vsP1 == id) { _vsP1 = _vsP2; _vsP2 = id; }
                else _vsP1 = id;
                BuildVersusButtons();
            }, false);
            b.image.color = (id == _vsP1 || id == _vsP2)
                ? new Color(0.32f, 0.26f, 0.10f, 0.95f)
                : new Color(0.08f, 0.09f, 0.11f, 0.9f);
        }

        var infoHost = _scrVersus.transform.Find("info");
        if (infoHost == null)
        {
            var go = new GameObject("info");
            go.transform.SetParent(_scrVersus.transform, false);
            UI.Place(go, 80f, 420f, 1120f, 200f);
            infoHost = go.transform;
        }
        ClearChildren(infoHost);

        UI.Label(infoHost, "PLAYER:  " + Roster.GetFighter(_vsP1).name, 22, UI.Paper, TextAnchor.MiddleLeft, 0f, 10f, 400f, 40f);
        UI.Label(infoHost, "OPPONENT:  " + Roster.GetFighter(_vsP2).name, 22, UI.Paper, TextAnchor.MiddleRight, 720f, 10f, 400f, 40f);
        UI.Label(infoHost, Roster.GetStage(_vsStage).name, 18, UI.Gold, TextAnchor.MiddleCenter, 0f, 56f, 1120f, 30f);

        UI.Btn(infoHost, "CHANGE STAGE", 480f, 92f, 180f, 44f, () =>
        {
            int idx = Roster.StageOrder.IndexOf(_vsStage);
            _vsStage = Roster.StageOrder[(idx + 1) % Roster.StageOrder.Count];
            BuildVersusButtons();
        }, false);

        UI.Btn(infoHost, "FIGHT", 780f, 92f, 200f, 52f, StartVersus, true);
        UI.Btn(infoHost, "BACK", 80f, 92f, 140f, 44f, () => ShowScreen("menu"), false);
    }

    /* ============================================================
       roster
       ============================================================ */
    void BuildRoster()
    {
        var host = _scrRoster.transform.Find("list");
        if (host == null)
        {
            var go = new GameObject("list");
            go.transform.SetParent(_scrRoster.transform, false);
            UI.Place(go, 80f, 110f, 1120f, 480f);
            host = go.transform;
        }
        ClearChildren(host);

        for (int i = 0; i < Roster.Order.Count; i++)
        {
            var d = Roster.GetFighter(Roster.Order[i]);
            float y = i * 66f;
            UI.Box(host, "row" + i, new Color(0.07f, 0.075f, 0.09f, 0.9f), 0f, y, 1120f, 60f);
            UI.Label(host, d.name, 18, UI.Paper, TextAnchor.MiddleLeft, 18f, y + 6f, 220f, 26f);
            UI.Label(host, d.role, 12, UI.Gold, TextAnchor.MiddleLeft, 18f, y + 32f, 220f, 20f);
            UI.Label(host, d.bio, 14, UI.Muted, TextAnchor.MiddleLeft, 250f, y + 8f, 700f, 44f);
            UI.Label(host, "SPECIAL: " + d.specialName, 12, UI.GoldLight, TextAnchor.MiddleRight, 880f, y + 18f, 220f, 24f);
        }
    }

    /* ============================================================
       fight lifecycle
       ============================================================ */
    void DestroyMatch()
    {
        if (_match != null)
        {
            _match.Destroy();
            _match = null;
        }
        if (_world != null)
        {
            Destroy(_world.gameObject);
            _world = null;
        }
    }

    void StartChapter(int i)
    {
        _storyMode = true;
        _chapter = i;
        var ch = Roster.Chapters[i];
        BeginFight(ch.stage, "mostafa", ch.opponent, ch.diff, ch.music, true);
        StartDialogue(ch.intro, () =>
        {
            if (_match != null)
            {
                _match.paused = false;
                _match.state = "intro";
                _match.stateT = 0f;
            }
            ShowScreen("fight");
        });
    }

    void StartVersus()
    {
        _storyMode = false;
        var diff = new Difficulty(14f, 0.72f, 0.42f, 0.34f, 0.35f, "VERSUS");
        BeginFight(_vsStage, _vsP1, _vsP2, diff, _vsP2 == "chairman" ? "boss" : "fight", false);
        ShowScreen("fight");
    }

    void BeginFight(string stage, string p1, string p2, Difficulty diff, string music, bool startPaused)
    {
        DestroyMatch();
        _world = new GameObject("World").transform;

        _match = new MatchManager(_cam, _world, stage, p1, p2, diff, 3);
        _match.paused = startPaused;
        _match.onEnd = OnMatchEnd;
        _brain = new AIBrain(diff);
        _hud.Bind(_match);
        _endDelay = 0f;
        _pendingEnd = -1;

        if (AudioSynth.I != null) AudioSynth.I.Music(music);
    }

    void OnMatchEnd(int winner)
    {
        _pendingEnd = winner;
        _endDelay = 1.1f;
    }

    void ResolveMatchEnd()
    {
        int winner = _pendingEnd;
        _pendingEnd = -1;
        _hud.SetVisible(false);

        if (_storyMode)
        {
            var ch = Roster.Chapters[_chapter];
            if (winner == 0)
            {
                PlayerPrefs.SetInt("mm_cleared_" + _chapter, 1);
                PlayerPrefs.Save();
                if (AudioSynth.I != null) AudioSynth.I.Music("town");
                StartDialogue(ch.outro, () =>
                {
                    ShowResult("CHAPTER CLEAR", ch.title,
                        "Chapter " + (_chapter + 1) + " complete." +
                        (_chapter < Roster.Chapters.Count - 1 ? " The town is a little less afraid." : " Nabinpur is free."),
                        new string[] { _chapter < Roster.Chapters.Count - 1 ? "NEXT CHAPTER" : "MAIN MENU", "CHAPTER LIST" },
                        new Action[] {
                            () => { if (_chapter < Roster.Chapters.Count - 1) StartChapter(_chapter + 1); else QuitToMenu(); },
                            () => { DestroyMatch(); ShowScreen("story"); }
                        });
                });
            }
            else
            {
                ShowResult("DEFEATED", "DOWN IN THE DUST",
                    "You lost to " + Roster.GetFighter(ch.opponent).name + ". The town waits a little longer.",
                    new string[] { "TRY AGAIN", "CHAPTER LIST" },
                    new Action[] {
                        () => StartChapter(_chapter),
                        () => { DestroyMatch(); ShowScreen("story"); }
                    });
            }
        }
        else
        {
            string win = winner == 0 ? Roster.GetFighter(_vsP1).name : Roster.GetFighter(_vsP2).name;
            ShowResult("VERSUS", win + " WINS",
                winner == 0 ? "Clean fight." : "The town laughs at you.",
                new string[] { "REMATCH", "CHANGE FIGHTERS", "MAIN MENU" },
                new Action[] { StartVersus, () => { DestroyMatch(); ShowScreen("versus"); }, QuitToMenu });
        }
    }

    void ShowResult(string kicker, string title, string sub, string[] labels, Action[] actions)
    {
        _resKicker.text = kicker;
        _resTitle.text = title;
        _resSub.text = sub;
        ClearChildren(_resButtons);
        for (int i = 0; i < labels.Length; i++)
        {
            var act = actions[i];
            UI.Btn(_resButtons, labels[i], 0f, i * 46f, 430f, 40f, act, i == 0);
        }
        ShowScreen("result");
    }

    void QuitToMenu()
    {
        DestroyMatch();
        if (AudioSynth.I != null) AudioSynth.I.Music("town");
        ShowScreen("menu");
    }

    void TogglePause()
    {
        if (_match == null) return;
        if (_match.paused) { _match.paused = false; ShowScreen("fight"); }
        else { _match.paused = true; ShowScreen("pause"); }
    }

    /* ============================================================
       dialogue
       ============================================================ */
    void StartDialogue(Line[] lines, Action onDone)
    {
        _dlgLines = lines;
        _dlgIndex = 0;
        _dlgChar = 0f;
        _dlgDone = onDone;
        ShowScreen("dialogue");
        RefreshDialogue();
    }

    string SpeakerName(string who)
    {
        if (who == "narr") return "· · ·";
        if (who == "oldman") return "OLD MAN";
        if (who == "oldwoman") return "OLD WOMAN";
        if (who == "shopkeeper") return "SHOPKEEPER";
        if (who == "announcer") return "ANNOUNCER";
        return Roster.GetFighter(who).name;
    }

    void RefreshDialogue()
    {
        if (_dlgLines == null || _dlgIndex >= _dlgLines.Length) return;
        var l = _dlgLines[_dlgIndex];
        _dlgSpeaker.text = SpeakerName(l.who);
        int shown = Mathf.Clamp(Mathf.FloorToInt(_dlgChar), 0, l.text.Length);
        _dlgBody.text = l.text.Substring(0, shown);
        _dlgBody.fontStyle = l.who == "narr" ? FontStyle.Italic : FontStyle.Normal;
        _dlgBody.color = l.who == "narr" ? new Color(0.78f, 0.76f, 0.70f) : UI.Paper;
        _dlgHint.enabled = shown >= l.text.Length;
    }

    void AdvanceDialogue()
    {
        if (_dlgLines == null) return;
        var l = _dlgLines[_dlgIndex];
        if (_dlgChar < l.text.Length) { _dlgChar = l.text.Length; RefreshDialogue(); return; }
        _dlgIndex++;
        _dlgChar = 0f;
        if (_dlgIndex >= _dlgLines.Length)
        {
            var done = _dlgDone;
            _dlgLines = null;
            _dlgDone = null;
            if (done != null) done();
            return;
        }
        RefreshDialogue();
    }

    /* ============================================================
       loop
       ============================================================ */
    void Update()
    {
        float dt = Mathf.Min(0.05f, Time.deltaTime);

        if (_screen == "title" && InputMap.AnyPressed()) { ShowScreen("menu"); return; }

        if (_screen == "dialogue")
        {
            _dlgChar += dt * 62f;
            RefreshDialogue();
            if (InputMap.ConfirmPressed() || Input.GetMouseButtonDown(0)) AdvanceDialogue();
            return;
        }

        if (_screen == "fight")
        {
            if (InputMap.PausePressed()) { TogglePause(); return; }

            if (_match != null && _match.paused)
            {
                _match.Update(dt, InputState.None, InputState.None);
            }
            else if (_match != null)
            {
                var in1 = InputMap.Player();
                var in2 = _brain != null ? _brain.Update(dt, _match.p2, _match.p1) : InputState.None;
                _match.Update(dt, in1, in2);
            }
            _hud.Update(_match, dt);

            if (_pendingEnd >= 0)
            {
                _endDelay -= dt;
                if (_endDelay <= 0f) ResolveMatchEnd();
            }
            return;
        }

        if (_screen == "pause" && InputMap.PausePressed()) { TogglePause(); return; }

        // idle background for menus
        if (_match != null && _screen != "fight") _match.Update(dt, InputState.None, InputState.None);
    }
}
