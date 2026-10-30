using System;
using System.Collections.Generic;
using UnityEngine;

/// <summary>Small pooled particle system for hits, dust and debris.</summary>
public class FX
{
    class Item
    {
        public GameObject go;
        public SpriteRenderer sr;
        public Vector2 vel;
        public float t, dur, size, grav;
        public Color col;
        public bool active;
    }

    readonly List<Item> _pool = new List<Item>();
    Transform _root;
    int _order = 60;

    public FX(Transform parent, int order)
    {
        _root = new GameObject("FX").transform;
        _root.SetParent(parent, false);
        _order = order;
        for (int i = 0; i < 110; i++) _pool.Add(NewItem());
    }

    Item NewItem()
    {
        var it = new Item();
        it.go = new GameObject("fx");
        it.go.transform.SetParent(_root, false);
        it.sr = it.go.AddComponent<SpriteRenderer>();
        it.sr.sprite = ProcTex.White;
        it.sr.sortingOrder = _order;
        it.go.SetActive(false);
        return it;
    }

    Item Take()
    {
        for (int i = 0; i < _pool.Count; i++) if (!_pool[i].active) return _pool[i];
        var n = NewItem();
        _pool.Add(n);
        return n;
    }

    public void Spawn(Vector2 pos, Vector2 vel, float size, Color col, float dur, float grav)
    {
        var it = Take();
        it.active = true;
        it.go.SetActive(true);
        it.go.transform.localPosition = new Vector3(pos.x, pos.y, 0f);
        it.go.transform.localScale = new Vector3(size, size, 1f);
        it.sr.color = col;
        it.vel = vel;
        it.t = 0f;
        it.dur = dur;
        it.size = size;
        it.grav = grav;
    }

    public void Spark(Vector2 pos, float power, int dir)
    {
        int n = 8 + Mathf.FloorToInt(power * 6f);
        for (int i = 0; i < n; i++)
        {
            float a = UnityEngine.Random.Range(-1.4f, 1.4f) + (dir > 0 ? 0f : Mathf.PI);
            float sp = UnityEngine.Random.Range(1.8f, 6.2f) * power;
            Color c = i % 3 == 0 ? Color.white : (i % 3 == 1 ? ProcTex.Hex("#ffd166") : ProcTex.Hex("#ff7b3d"));
            Spawn(pos, new Vector2(Mathf.Cos(a) * sp, Mathf.Sin(a) * sp - 0.9f),
                  UnityEngine.Random.Range(0.05f, 0.13f), c, UnityEngine.Random.Range(0.18f, 0.42f), 14f);
        }
        // impact flash
        Spawn(pos, Vector2.zero, 0.5f + power * 0.35f, new Color(1f, 1f, 1f, 0.55f), 0.09f, 0f);
    }

    public void Dust(Vector2 pos, int n, float spread)
    {
        for (int i = 0; i < n; i++)
        {
            Spawn(pos + new Vector2(UnityEngine.Random.Range(-0.14f, 0.14f), 0f),
                  new Vector2(UnityEngine.Random.Range(-0.9f, 0.9f) * spread, UnityEngine.Random.Range(0.3f, 0.9f)),
                  UnityEngine.Random.Range(0.10f, 0.26f), new Color(0.85f, 0.78f, 0.66f, 0.28f),
                  UnityEngine.Random.Range(0.4f, 0.9f), -0.6f);
        }
    }

    public void Debris(Vector2 pos, int n)
    {
        for (int i = 0; i < n; i++)
        {
            Color c = i % 3 == 0 ? ProcTex.Hex("#8f3b24") : (i % 3 == 1 ? ProcTex.Hex("#b85436") : ProcTex.Hex("#6b4a30"));
            Spawn(pos, new Vector2(UnityEngine.Random.Range(-2.6f, 2.6f), UnityEngine.Random.Range(1.6f, 4.6f)),
                  UnityEngine.Random.Range(0.04f, 0.10f), c, UnityEngine.Random.Range(0.5f, 1.1f), 15f);
        }
    }

    public void Update(float dt)
    {
        for (int i = 0; i < _pool.Count; i++)
        {
            var it = _pool[i];
            if (!it.active) continue;
            it.t += dt;
            if (it.t >= it.dur)
            {
                it.active = false;
                it.go.SetActive(false);
                continue;
            }
            it.vel.y -= it.grav * dt;
            var p = it.go.transform.localPosition;
            p.x += it.vel.x * dt;
            p.y += it.vel.y * dt;
            it.go.transform.localPosition = p;

            float k = it.t / it.dur;
            var c = it.col;
            c.a = it.col.a * (1f - k);
            it.sr.color = c;
            float s = it.size * (1f - k * 0.35f);
            it.go.transform.localScale = new Vector3(s, s, 1f);
        }
    }

    public void Clear()
    {
        for (int i = 0; i < _pool.Count; i++)
        {
            _pool[i].active = false;
            _pool[i].go.SetActive(false);
        }
    }

    public void Destroy()
    {
        if (_root != null) UnityEngine.Object.Destroy(_root.gameObject);
    }
}

/// <summary>
/// Owns a single fight: two fighters, the stage, rounds, hit resolution and camera.
/// </summary>
public class MatchManager
{
    public const float ViewHeight = 4.8f;      // world units visible vertically
    public const float CameraY = 1.44f;

    public Fighter p1, p2;
    public StageDef stage;
    public StageArt stageArt;
    public FX fx;
    public Camera cam;
    Transform _world;

    public int round = 1;
    public int rounds = 3;
    public int[] wins = new int[2];
    public float timer = 60f;

    public string state = "intro";
    public float stateT;

    public float hitstop;
    public float shake;
    public float superFx;
    public float slowmo = 1f;

    public string banner;
    public string bannerSub;
    public float bannerT;

    public bool paused;
    public bool finished;
    public Action<int> onEnd;

    public string stageId, p1Id, p2Id;

    public MatchManager(Camera camera, Transform world, string stageId, string p1Id, string p2Id,
                        Difficulty diff, int rounds)
    {
        Roster.Init();
        this.cam = camera;
        _world = world;
        this.stageId = stageId;
        this.p1Id = p1Id;
        this.p2Id = p2Id;
        this.rounds = rounds;
        this.stage = Roster.GetStage(stageId);

        p1 = new Fighter(Roster.GetFighter(p1Id), 0, world, 30);
        p2 = new Fighter(Roster.GetFighter(p2Id), 1, world, 40);
        p1.x = Roster.WorldWidth * 0.5f - 1.5f;
        p2.x = Roster.WorldWidth * 0.5f + 1.5f;
        p1.facing = 1; p2.facing = -1;
        p1.RefreshRig();
        p2.RefreshRig();

        stageArt = StageArt.Build(camera.transform, stage);
        fx = new FX(world, 60);

        cam.orthographic = true;
        cam.orthographicSize = ViewHeight * 0.5f;
        cam.transform.position = new Vector3(Roster.WorldWidth * 0.5f, CameraY, -10f);

        SetBanner("ROUND 1", stage.name, 1.6f);
    }

    public void SetBanner(string main, string sub, float dur)
    {
        banner = main;
        bannerSub = sub;
        bannerT = dur;
    }

    public void Destroy()
    {
        if (p1 != null) p1.Destroy();
        if (p2 != null) p2.Destroy();
        if (stageArt != null) stageArt.Destroy();
        if (fx != null) fx.Destroy();
    }

    public void Update(float dt, InputState in1, InputState in2)
    {
        if (paused) return;

        if (hitstop > 0f)
        {
            hitstop -= dt;
            fx.Update(dt * 0.35f);
            UpdateCamera(dt);
            return;
        }

        stateT += dt;
        if (bannerT > 0f) bannerT -= dt;

        if (state == "intro")
        {
            p1.state = "intro"; p1.anim = "intro";
            p2.state = "intro"; p2.anim = "intro";
            p1.Update(dt, InputState.None, p2, false);
            p2.Update(dt, InputState.None, p1, false);
            if (stateT > 1.9f)
            {
                state = "fight";
                stateT = 0f;
                p1.state = "idle"; p2.state = "idle";
                SetBanner("FIGHT!", "", 0.9f);
                if (AudioSynth.I != null) AudioSynth.I.Bell();
            }
            UpdateCamera(dt);
            return;
        }

        if (state == "fight")
        {
            timer -= dt;
            if (timer <= 0f)
            {
                timer = 0f;
                EndRound(p1.hp >= p2.hp ? 0 : 1, "TIME UP");
                return;
            }
            p1.Update(dt, in1, p2, true);
            p2.Update(dt, in2, p1, true);
            ResolveCollisions();
            ResolveHits();
            HandleSuper();
        }
        else if (state == "roundend")
        {
            p1.Update(dt, InputState.None, p2, false);
            p2.Update(dt, InputState.None, p1, false);
            if (stateT > 2.6f) NextRound();
        }
        else if (state == "matchend")
        {
            p1.Update(dt, InputState.None, p2, false);
            p2.Update(dt, InputState.None, p1, false);
            if (stateT > 0.7f && !finished)
            {
                finished = true;
                if (onEnd != null) onEnd(wins[0] > wins[1] ? 0 : 1);
            }
        }

        if (shake > 0f) shake = Mathf.Max(0f, shake - dt * 42f);
        if (superFx > 0f) superFx = Mathf.Max(0f, superFx - dt * 1.6f);

        fx.Update(dt);
        UpdateCamera(dt);
    }

    void ResolveCollisions()
    {
        float d = p2.x - p1.x;
        if (Mathf.Abs(d) < Fighter.Pushbox && p1.state != "ko" && p2.state != "ko")
        {
            float push = (Fighter.Pushbox - Mathf.Abs(d)) * 0.5f;
            float s = d >= 0f ? 1f : -1f;
            p1.x -= push * s;
            p2.x += push * s;
            p1.x = Mathf.Clamp(p1.x, Roster.ArenaLeft, Roster.ArenaRight);
            p2.x = Mathf.Clamp(p2.x, Roster.ArenaLeft, Roster.ArenaRight);
        }
    }

    void ResolveHits()
    {
        TryHit(p1, p2);
        TryHit(p2, p1);
    }

    void TryHit(Fighter atk, Fighter def)
    {
        var hb = atk.GetHitbox();
        if (hb == null || atk.moveHit) return;
        if (def.invuln > 0f || def.state == "ko") return;

        float hy1 = 0f, hy2 = def.HurtTop() + def.airY;
        if (def.airY > 0f) { hy1 = def.airY; hy2 = def.airY + def.HurtTop(); }

        bool ox = hb.x1 < def.x + 0.34f * def.def.buildW && hb.x2 > def.x - 0.34f * def.def.buildW;
        bool oy = hb.y1 < hy2 && hb.y2 > hy1;
        if (!ox || !oy) return;

        atk.moveHit = true;
        var m = hb.move;

        bool canBlock = def.state == "block" || def.state == "blockstun";
        bool blockOk = false;
        if (canBlock)
        {
            if (def.crouchBlock) blockOk = m.height != "high";
            else blockOk = m.height != "low";
            if (m.key == "jumpAtk") blockOk = !def.crouchBlock;
            if (m.unblockable) blockOk = false;
        }

        if (def.armour && !blockOk)
        {
            def.hp = Mathf.Max(0f, def.hp - m.dmg * 0.35f);
            fx.Spark(new Vector2(def.x, 1.1f), 0.7f, atk.facing);
            return;
        }

        int dir = atk.facing;
        float hx = (hb.x1 + hb.x2) * 0.5f;
        float hy = (hb.y1 + hb.y2) * 0.5f;
        var hitPos = new Vector2(hx, hy);

        if (blockOk)
        {
            def.Hurt(m.dmg * m.chip, m.blockstun, m.kb, dir, true);
            hitstop = m.hitstop * 0.6f / 60f;
            shake = Mathf.Min(9f, shake + 3f);
            fx.Spark(hitPos, 0.5f, dir);
            if (AudioSynth.I != null) AudioSynth.I.Block();
            atk.meter = Mathf.Min(100f, atk.meter + m.meter * 0.3f);
            def.meter = Mathf.Min(100f, def.meter + 3f);
        }
        else
        {
            float dmg = m.dmg * (atk.comboHits > 0 ? 0.86f : 1f);
            def.Hurt(dmg, m.hitstun, m.kb, dir, false);
            hitstop = m.hitstop / 60f;
            shake = Mathf.Min(22f, shake + 5f + m.dmg * 0.5f);
            fx.Spark(hitPos, 1f + m.dmg * 0.06f, dir);
            fx.Dust(new Vector2(def.x, 0f), 4, 1f);
            if (AudioSynth.I != null)
            {
                if (m.dmg > 9f) AudioSynth.I.HitHeavy();
                else AudioSynth.I.HitLight();
            }
            atk.meter = Mathf.Min(100f, atk.meter + m.meter);
            if (def.hp <= 0f) EndRound(atk.side, "K.O.");
        }
    }

    void HandleSuper()
    {
        DoSuper(p1, p2);
        DoSuper(p2, p1);
    }

    void DoSuper(Fighter f, Fighter opp)
    {
        if (f.state != "super") return;
        float t = f.stateT;
        if (t < 0.05f)
        {
            superFx = 1f;
            SetBanner(f.def.superName, "", 1.1f);
            shake = 10f;
            if (AudioSynth.I != null) AudioSynth.I.Bell();
        }
        for (int i = 0; i < f.def.superHits; i++)
        {
            float window = 0.16f + i * 0.14f;
            if (f.superDone <= i && t >= window)
            {
                f.superDone = i + 1;
                if (Mathf.Abs(opp.x - f.x) < 1.9f && opp.state != "ko")
                {
                    float dmg = f.def.superDmg / f.def.superHits;
                    opp.Hurt(dmg, 14, 0.6f, f.facing, false);
                    opp.invuln = 0f;
                    hitstop = 0.06f;
                    shake = Mathf.Min(26f, shake + 6f);
                    fx.Spark(new Vector2(opp.x, 1.2f), 1.5f, f.facing);
                    if (AudioSynth.I != null) AudioSynth.I.HitHeavy();
                    if (opp.hp <= 0f) EndRound(f.side, "K.O.");
                }
            }
        }
    }

    public void EndRound(int winnerSide, string reason)
    {
        if (state == "roundend" || state == "matchend") return;
        wins[winnerSide]++;
        state = "roundend";
        stateT = 0f;

        var loser = winnerSide == 0 ? p2 : p1;
        var win = winnerSide == 0 ? p1 : p2;

        if (loser.state != "ko")
        {
            loser.state = "ko";
            loser.anim = "ko";
            loser.stateT = 0f;
        }
        win.state = "win";
        win.anim = "win";
        win.stateT = 0f;

        SetBanner(reason, winnerSide == 0 ? "YOU WIN THE ROUND" : "YOU LOSE THE ROUND", 2.2f);
        if (AudioSynth.I != null) AudioSynth.I.Ko();
        shake = 26f;
        slowmo = 0.35f;
        fx.Dust(new Vector2(loser.x, 0f), 10, 2.2f);
        fx.Debris(new Vector2(loser.x, 0.4f), 10);
    }

    void NextRound()
    {
        int need = Mathf.CeilToInt(rounds * 0.5f);
        if (wins[0] >= need || wins[1] >= need)
        {
            state = "matchend";
            stateT = 0f;
            SetBanner(wins[0] > wins[1] ? "YOU WIN" : "YOU LOSE", "", 3f);
            return;
        }
        round++;
        timer = 60f;
        state = "intro";
        stateT = 0f;
        p1.ResetForRound(Roster.WorldWidth * 0.5f - 1.5f);
        p2.ResetForRound(Roster.WorldWidth * 0.5f + 1.5f);
        fx.Clear();
        SetBanner("ROUND " + round, stage.name, 1.6f);
    }

    void UpdateCamera(float dt)
    {
        float mid = (p1.x + p2.x) * 0.5f;
        float halfW = ViewHeight * 0.5f * cam.aspect;
        float minX = halfW - 0.3f;
        float maxX = Roster.WorldWidth - halfW + 0.3f;
        float tx = Mathf.Clamp(mid, minX, maxX);

        float sx = 0f, sy = 0f;
        if (shake > 0f)
        {
            sx = UnityEngine.Random.Range(-shake, shake) * 0.012f;
            sy = UnityEngine.Random.Range(-shake, shake) * 0.012f;
        }

        var cp = cam.transform.position;
        cp.x = Mathf.Lerp(cp.x, tx, Mathf.Min(1f, dt * 6f)) + sx;
        cp.y = CameraY + sy;
        cam.transform.position = cp;

        if (stageArt != null) stageArt.ApplyParallax(cp.x, Roster.WorldWidth * 0.5f);

        // draw order by depth
        bool p1Back = p1.x <= p2.x;
        p1.rig.SetBaseOrder(p1Back ? 30 : 40);
        p2.rig.SetBaseOrder(p1Back ? 40 : 30);
    }
}
