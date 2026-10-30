using UnityEngine;

public class HitBox
{
    public float x1, x2, y1, y2;
    public MoveDef move;
}

/// <summary>One combatant. Owns its state machine, physics and rig.</summary>
public class Fighter
{
    public const float Gravity = 22f;
    public const float Pushbox = 0.74f;

    public FighterDef def;
    public FighterRig rig;
    public int side;

    public float x, airY, vx, vy;
    public float hp, maxHp, meter;
    public int facing = 1;

    public string state = "idle";
    public float stateT;
    public string anim = "idle";

    public MoveDef move;
    public float moveDur;
    public bool moveHit;
    public float hitFlash;
    bool _flashOn;

    public bool grounded = true;
    public bool crouchBlock;
    public int comboHits;
    public float comboTimer;
    public float invuln;
    public int superDone;
    public bool armour;
    public int wins;
    public float walkDir;

    public Fighter(FighterDef d, int sd, Transform parent, int baseOrder)
    {
        def = d;
        side = sd;
        maxHp = d.maxHp;
        hp = maxHp;
        facing = sd == 0 ? 1 : -1;
        rig = FighterRig.Build(d, parent, baseOrder);
        rig.CacheColors();
        RefreshRig();
    }

    /// <summary>Positions every limb without advancing time — used right after spawning.</summary>
    public void RefreshRig()
    {
        ApplyRig(0f);
    }

    public void Destroy()
    {
        if (rig != null && rig.Root != null) Object.Destroy(rig.Root);
    }

    public void ResetForRound(float px)
    {
        x = px;
        airY = 0f;
        vx = 0f;
        vy = 0f;
        hp = maxHp;
        state = "idle";
        stateT = 0f;
        anim = "idle";
        move = null;
        moveDur = 0f;
        moveHit = false;
        grounded = true;
        crouchBlock = false;
        comboHits = 0;
        comboTimer = 0f;
        invuln = 0f;
        armour = false;
        facing = side == 0 ? 1 : -1;
    }

    public bool CanAct()
    {
        if (state == "ko" || state == "win" || state == "intro" || state == "hit" || state == "blockstun") return false;
        if (state == "attack")
        {
            if (moveHit && stateT > (move.startup + move.active) / 60f) return true;
            return false;
        }
        if (state == "super") return false;
        return true;
    }

    public void StartMove(MoveDef m)
    {
        state = "attack";
        stateT = 0f;
        move = m;
        moveDur = (m.startup + m.active + m.recovery) / 60f;
        moveHit = false;
        anim = string.IsNullOrEmpty(m.anim) ? "punchL" : m.anim;
        armour = m.armour;
        if (AudioSynth.I != null)
        {
            if (m.key == "lp" || m.key == "hp" || m.key == "kick" || m.key == "low" || m.key == "jumpAtk")
                AudioSynth.I.Whoosh(0.22f);
            else
                AudioSynth.I.Voice(1f);
        }
    }

    public void Hurt(float dmg, int stun, float kb, int dir, bool blocked)
    {
        if (state == "ko") return;
        if (blocked)
        {
            hp = Mathf.Max(0f, hp - dmg);
            state = "blockstun";
            stateT = 0f;
            anim = "block";
            vx = dir * kb * 0.35f;
            meter = Mathf.Min(100f, meter + 4f);
        }
        else
        {
            hp = Mathf.Max(0f, hp - dmg);
            state = "hit";
            stateT = 0f;
            anim = "hit";
            vx = dir * kb;
            hitFlash = 0.09f;
            comboHits++;
            comboTimer = 1.2f;
            meter = Mathf.Min(100f, meter + 5f);
            if (hp <= 0f)
            {
                state = "ko";
                stateT = 0f;
                anim = "ko";
                vx = dir * kb * 1.4f;
            }
        }
    }

    public void Update(float dt, InputState inp, Fighter opp, bool hasInput)
    {
        stateT += dt;
        if (hitFlash > 0f) hitFlash -= dt;
        if (comboTimer > 0f) { comboTimer -= dt; if (comboTimer <= 0f) comboHits = 0; }
        if (invuln > 0f) invuln -= dt;

        if (state == "ko")
        {
            vx *= 0.90f;
            x += vx * dt;
            vy -= Gravity * dt;
            airY += vy * dt;
            if (airY < 0f) { airY = 0f; vy = 0f; }
            x = Mathf.Clamp(x, Roster.ArenaLeft, Roster.ArenaRight);
            ApplyRig(dt);
            return;
        }

        if (grounded && (state == "idle" || state == "walk" || state == "crouch" || state == "block"))
            facing = opp.x >= x ? 1 : -1;

        float spd = def.walk;

        if (hasInput && CanAct())
        {
            if (grounded)
            {
                bool backKey = facing > 0 ? inp.left : inp.right;

                if (inp.down && backKey)
                {
                    // crouch block: hold position, guard low
                    if (state != "block") { state = "block"; stateT = 0f; }
                    crouchBlock = true;
                }
                else if (backKey)
                {
                    // guard-walk: retreat while keeping the guard up
                    if (state != "block") { state = "block"; stateT = 0f; }
                    crouchBlock = false;
                    x -= facing * spd * 0.82f * dt;
                    walkDir = -facing;
                }
                else if (inp.down)
                {
                    if (state != "crouch") { state = "crouch"; stateT = 0f; }
                    crouchBlock = false;
                }
                else
                {
                    if (state == "crouch" || state == "block") { state = "idle"; stateT = 0f; }
                    crouchBlock = false;
                    float mv = 0f;
                    if (inp.left) mv -= 1f;
                    if (inp.right) mv += 1f;
                    if (mv != 0f)
                    {
                        x += mv * spd * dt;
                        walkDir = mv;
                        if (state != "walk") { state = "walk"; stateT = 0f; }
                    }
                    else if (state == "walk") { state = "idle"; stateT = 0f; }
                }

                if (inp.up && state != "attack")
                {
                    vy = def.jump;
                    airY = 0.01f;
                    grounded = false;
                    state = "jump";
                    stateT = 0f;
                    anim = "jump";
                    if (AudioSynth.I != null) AudioSynth.I.Jump();
                }
            }
        }

        // ---- attacks ----
        if (hasInput && CanAct())
        {
            string mk = null;
            if (inp.superPressed && meter >= 100f) mk = "super";
            else if (inp.specialPressed && meter >= 50f) mk = "special";
            else if (!grounded && (inp.lpPressed || inp.hpPressed || inp.kickPressed)) mk = "jumpAtk";
            else if (grounded && inp.lpPressed) mk = inp.down ? "low" : "lp";
            else if (grounded && inp.hpPressed) mk = "hp";
            else if (grounded && inp.kickPressed) mk = inp.down ? "low" : "kick";

            if (mk == "super")
            {
                meter = 0f;
                state = "super";
                stateT = 0f;
                anim = "superRush";
                moveDur = 1.15f;
                superDone = 0;
                invuln = 0.35f;
                move = def.special;
                if (AudioSynth.I != null) AudioSynth.I.Voice(0.8f);
            }
            else if (mk == "special")
            {
                meter -= 50f;
                StartMove(def.special);
            }
            else if (mk != null)
            {
                var b = Roster.Move(mk);
                var m = new MoveDef();
                m.key = b.key; m.label = b.label; m.anim = b.anim;
                m.startup = b.startup; m.active = b.active; m.recovery = b.recovery;
                m.dmg = b.dmg * (def.weight > 1.2f ? 1.18f : 1f);
                m.reach = b.reach; m.height = b.height;
                m.hitstun = b.hitstun; m.blockstun = b.blockstun; m.hitstop = b.hitstop;
                m.kb = b.kb; m.meter = b.meter; m.chip = b.chip;
                StartMove(m);
            }
        }

        // ---- state progression ----
        if (state == "attack" && stateT >= moveDur)
        {
            state = grounded ? "idle" : "fall";
            stateT = 0f;
            move = null;
            armour = false;
        }
        if (state == "hit" && stateT >= 0.24f) { state = grounded ? "idle" : "fall"; stateT = 0f; }
        if (state == "blockstun" && stateT >= 0.16f) { state = grounded ? "block" : "fall"; stateT = 0f; }
        if (state == "super" && stateT >= moveDur) { state = "idle"; stateT = 0f; move = null; }

        // ---- physics ----
        if (!grounded)
        {
            vy -= Gravity * dt;
            airY += vy * dt;
            if (airY <= 0f)
            {
                airY = 0f;
                vy = 0f;
                grounded = true;
                state = "idle";
                stateT = 0f;
                anim = "idle";
                if (AudioSynth.I != null) AudioSynth.I.Land();
            }
            else if (state != "attack" && state != "super")
            {
                anim = vy > 0f ? "jump" : "fall";
            }
        }

        if (state == "hit" || state == "blockstun" || state == "ko")
        {
            x += vx * dt;
            vx *= 0.88f;
        }
        else
        {
            vx *= 0.80f;
            x += vx * dt;
        }

        if (grounded && state == "idle") anim = "idle";
        if (state == "walk") anim = "walk";
        if (state == "crouch") anim = "crouch";
        if (state == "block") anim = crouchBlock ? "crouch" : "block";
        if (state == "jump") anim = "jump";

        x = Mathf.Clamp(x, Roster.ArenaLeft, Roster.ArenaRight);
        ApplyRig(dt);
    }

    void ApplyRig(float dt)
    {
        float prog;
        if (anim == "ko") prog = Mathf.Clamp01(stateT / 0.55f);
        else if (anim == "hit") prog = Mathf.Clamp01(stateT / 0.24f);
        else prog = moveDur > 0f ? Mathf.Clamp01(stateT / moveDur) : 0f;

        var pose = Poses.Get(anim, prog, stateT);
        rig.Apply(pose, facing, airY, vx, stateT);
        rig.Root.transform.localPosition = new Vector3(x, 0f, 0f);
        rig.SetShadow(airY);

        bool f = hitFlash > 0f;
        if (f != _flashOn) { rig.SetFlash(f); _flashOn = f; }
    }

    public HitBox GetHitbox()
    {
        if (state != "attack" || move == null) return null;
        float t = stateT * 60f;
        if (t < move.startup || t > move.startup + move.active) return null;

        float reach = move.reach * (def.buildW * 0.35f + 0.72f);
        float x1 = x + (facing > 0 ? 0.18f : -0.18f - reach);
        float y1, y2;
        if (move.key == "jumpAtk") { y1 = 0.40f; y2 = 1.90f; }
        else if (move.height == "high") { y1 = 0.96f; y2 = 2.00f; }
        else if (move.height == "low") { y1 = 0f; y2 = 0.74f; }
        else { y1 = 0.34f; y2 = 1.50f; }

        var hb = new HitBox();
        hb.x1 = x1; hb.x2 = x1 + reach;
        hb.y1 = airY + y1; hb.y2 = airY + y2;
        hb.move = move;
        return hb;
    }

    public float HurtTop()
    {
        if (state == "ko") return 0.60f;
        if (state == "crouch" || (state == "block" && crouchBlock)) return 1.04f;
        return 1.96f * def.buildH;
    }
}
