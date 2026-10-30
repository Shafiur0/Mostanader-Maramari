using UnityEngine;

/// <summary>Joint angles for one frame. 0 = hanging down, + = toward the facing direction.</summary>
public class Pose
{
    public float torso, head;
    public float shA = 0.26f, elA = 1.95f, shB = 0.14f, elB = 2.05f;   // A = back arm, B = front arm
    public float hipA = 0.16f, knA = 0.10f, hipB = -0.18f, knB = -0.14f;
    public float bodyY, rot, sway;
}

/// <summary>
/// Builds and animates a paper-doll fighter out of primitive sprites.
/// Everything is generated in code — no rigged art assets.
/// </summary>
public class FighterRig
{
    public GameObject Root;
    public GameObject Body;

    Transform _bodyRoot;
    SpriteRenderer _shadow, _gamcha;
    Segment _bLegU, _bLegL, _bArmU, _bArmL;
    Segment _fLegU, _fLegL, _fArmU, _fArmL;
    Segment _torso;
    SpriteRenderer _bFoot, _fFoot, _bHand, _fHand;
    Transform _headJoint;
    SpriteRenderer _head, _hair, _eye, _brow, _mouth, _shades, _mous;
    SpriteRenderer _lathi;

    float _H = 2f;               // fighter height in world units
    FighterDef _def;
    int _baseOrder = 30;
    float _hairR;

    struct Segment
    {
        public Transform joint;
        public SpriteRenderer quad;
        public float len, width;
    }

    public static FighterRig Build(FighterDef def, Transform parent, int baseOrder)
    {
        var rig = new FighterRig();
        rig._def = def;
        rig._baseOrder = baseOrder;
        rig.Construct(parent);
        return rig;
    }

    void Construct(Transform parent)
    {
        _H = 2f * _def.buildH;
        float B = _def.buildW;

        Root = new GameObject("Fighter_" + _def.id);
        Root.transform.SetParent(parent, false);

        _shadow = ProcTex.Disc(Root.transform, "shadow", new Vector2(0f, 0.02f), 0.9f * B,
                               new Color(0f, 0f, 0f, 0.32f), _baseOrder - 4);

        Body = new GameObject("body");
        Body.transform.SetParent(Root.transform, false);
        _bodyRoot = Body.transform;

        int o = _baseOrder;

        // gamcha / scarf behind everything
        _gamcha = ProcTex.Quad(_bodyRoot, "gamcha", Vector2.zero, new Vector2(0.10f, 0.5f),
                               _def.accent, o);

        float armU = 0.138f * _H, armF = 0.130f * _H;
        float legU = 0.215f * _H, legF = 0.215f * _H;
        float armW = 0.066f * _H * B;
        float legW = 0.084f * _H * B;

        _bLegU = MakeSeg("bLegU", legU, legW, ProcTex.Shade(_def.bottomDark, -0.10f), o + 1);
        _bLegL = MakeSeg("bLegL", legF, legW * 0.92f, ProcTex.Shade(_def.bottomDark, -0.18f), o + 1);
        _bFoot = ProcTex.Quad(_bodyRoot, "bFoot", Vector2.zero, new Vector2(0.17f, 0.08f), _def.shoe, o + 1);

        _bArmU = MakeSeg("bArmU", armU, armW * 0.94f, ProcTex.Shade(_def.topDark, -0.12f), o + 2);
        _bArmL = MakeSeg("bArmL", armF, armW * 0.86f, ProcTex.Shade(_def.skinShade, -0.10f), o + 2);
        _bHand = ProcTex.Disc(_bodyRoot, "bHand", Vector2.zero, 0.13f, _def.skinShade, o + 2);

        _fLegU = MakeSeg("fLegU", legU, legW, _def.bottom, o + 3);
        _fLegL = MakeSeg("fLegL", legF, legW * 0.92f, _def.bottomDark, o + 3);
        _fFoot = ProcTex.Quad(_bodyRoot, "fFoot", Vector2.zero, new Vector2(0.18f, 0.085f), _def.shoe, o + 3);

        _torso = MakeSeg("torso", 0.30f * _H, 0.19f * _H * B, _def.top, o + 4);

        BuildHead(o + 6);

        _fArmU = MakeSeg("fArmU", armU, armW, _def.top, o + 7);
        _fArmL = MakeSeg("fArmL", armF, armW * 0.9f, _def.skin, o + 7);
        _fHand = ProcTex.Disc(_bodyRoot, "fHand", Vector2.zero, 0.14f, _def.skin, o + 7);

        if (_def.hasLathi)
        {
            _lathi = ProcTex.Quad(_bodyRoot, "lathi", Vector2.zero, new Vector2(1.3f, 0.06f),
                                  ProcTex.Hex("#6b4a24"), o + 8);
        }
    }

    Segment MakeSeg(string name, float len, float width, Color col, int order)
    {
        var joint = new GameObject(name).transform;
        joint.SetParent(_bodyRoot, false);
        var quad = ProcTex.Quad(joint, "quad", new Vector2(0f, -len * 0.5f), new Vector2(width, len), col, order);
        var s = new Segment();
        s.joint = joint;
        s.quad = quad;
        s.len = len;
        s.width = width;
        return s;
    }

    void BuildHead(int order)
    {
        var headGo = new GameObject("headJoint");
        headGo.transform.SetParent(_bodyRoot, false);
        _headJoint = headGo.transform;

        float headR = 0.077f * _H * _def.headScale;
        _hairR = headR;

        _head = ProcTex.Disc(_headJoint, "head", Vector2.zero, headR * 2f, _def.skin, order);
        _hair = ProcTex.Disc(_headJoint, "hair", new Vector2(0f, headR * 0.30f), headR * 1.95f, _def.hair, order + 1);
        if (_def.hairStyle == "bald") _hair.enabled = false;

        _brow = ProcTex.Quad(_headJoint, "brow", new Vector2(headR * 0.38f, headR * 0.18f),
                             new Vector2(headR * 0.52f, headR * 0.13f), ProcTex.Hex("#1a1410"), order + 2);
        _brow.transform.localRotation = Quaternion.Euler(0f, 0f, 8f);

        _eye = ProcTex.Disc(_headJoint, "eye", new Vector2(headR * 0.42f, headR * 0.02f),
                            headR * 0.24f, ProcTex.Hex("#1a1410"), order + 2);

        _mouth = ProcTex.Quad(_headJoint, "mouth", new Vector2(headR * 0.36f, -headR * 0.42f),
                              new Vector2(headR * 0.46f, headR * 0.10f), new Color(0.24f, 0.12f, 0.08f, 0.85f), order + 2);

        if (_def.moustache)
        {
            _mous = ProcTex.Quad(_headJoint, "moustache", new Vector2(headR * 0.34f, -headR * 0.24f),
                                 new Vector2(headR * 0.70f, headR * 0.16f), ProcTex.Hex("#141010"), order + 3);
            _mous.transform.localRotation = Quaternion.Euler(0f, 0f, -6f);
        }

        if (_def.shades)
        {
            _shades = ProcTex.Quad(_headJoint, "shades", new Vector2(headR * 0.36f, headR * 0.02f),
                                   new Vector2(headR * 0.86f, headR * 0.34f), ProcTex.Hex("#101014"), order + 4);
            _eye.enabled = false;
            _brow.enabled = false;
        }
    }

    /* ============================================================
       animation
       ============================================================ */
    public void SetBaseOrder(int order)
    {
        if (_rends == null) CacheColors();
        if (order == _baseOrder) return;
        int delta = order - _baseOrder;
        _baseOrder = order;
        for (int i = 0; i < _rends.Length; i++)
        {
            if (_rends[i] != null) _rends[i].sortingOrder += delta;
        }
    }

    static Vector2 Dir(float a)
    {
        return new Vector2(Mathf.Sin(a), -Mathf.Cos(a));
    }

    static Vector2 Up(float a)
    {
        return new Vector2(Mathf.Sin(a), Mathf.Cos(a));
    }

    void PlaceSeg(ref Segment s, Vector2 at, float absAngle)
    {
        s.joint.localPosition = new Vector3(at.x, at.y, 0f);
        s.joint.localRotation = Quaternion.Euler(0f, 0f, absAngle * Mathf.Rad2Deg);
    }

    public void Apply(Pose p, float facing, float airY, float vx, float time)
    {
        Body.transform.localPosition = new Vector3(0f, airY, 0f);
        Root.transform.localScale = new Vector3(facing >= 0f ? 1f : -1f, 1f, 1f);

        // hip sits above the origin by the leg length; bodyY lowers it (crouch)
        float hipY = 0.44f * _H - p.bodyY;
        Vector2 hip = new Vector2(0f, hipY);

        float torsoH = 0.30f * _H;
        Vector2 torsoDir = Up(p.torso);
        Vector2 shoulder = hip + torsoDir * torsoH;

        // ---- legs ----
        PlaceSeg(ref _bLegU, hip, p.hipA);
        Vector2 kneeB = hip + Dir(p.hipA) * _bLegU.len;
        PlaceSeg(ref _bLegL, kneeB, p.hipA + p.knA);
        Vector2 footB = kneeB + Dir(p.hipA + p.knA) * _bLegL.len;
        _bFoot.transform.localPosition = new Vector3(footB.x + 0.05f, footB.y - 0.02f, 0f);
        _bFoot.transform.localRotation = Quaternion.Euler(0f, 0f, -(p.hipA + p.knA) * Mathf.Rad2Deg * 0.35f);

        PlaceSeg(ref _fLegU, hip, p.hipB);
        Vector2 kneeF = hip + Dir(p.hipB) * _fLegU.len;
        PlaceSeg(ref _fLegL, kneeF, p.hipB + p.knB);
        Vector2 footF = kneeF + Dir(p.hipB + p.knB) * _fLegL.len;
        _fFoot.transform.localPosition = new Vector3(footF.x + 0.05f, footF.y - 0.02f, 0f);
        _fFoot.transform.localRotation = Quaternion.Euler(0f, 0f, -(p.hipB + p.knB) * Mathf.Rad2Deg * 0.35f);

        // ---- back arm ----
        Vector2 shApos = shoulder + torsoDir * -0.02f;
        PlaceSeg(ref _bArmU, shApos, p.shA);
        Vector2 elbowA = shApos + Dir(p.shA) * _bArmU.len;
        PlaceSeg(ref _bArmL, elbowA, p.shA + p.elA);
        Vector2 handA = elbowA + Dir(p.shA + p.elA) * _bArmL.len;
        _bHand.transform.localPosition = new Vector3(handA.x, handA.y, 0f);

        // ---- torso ----
        _torso.joint.localPosition = new Vector3(hip.x, hip.y, 0f);
        _torso.joint.localRotation = Quaternion.Euler(0f, 0f, -p.torso * Mathf.Rad2Deg);
        _torso.quad.transform.localPosition = new Vector3(0f, torsoH * 0.5f, 0f);
        _torso.quad.transform.localScale = new Vector3(_torso.width, torsoH, 1f);

        // ---- gamcha ----
        float sway = Mathf.Sin(time * 4f + vx * 0.6f) * 0.12f + Mathf.Clamp(-vx * 0.10f, -0.35f, 0.35f);
        _gamcha.transform.localPosition = new Vector3(shoulder.x - 0.02f, shoulder.y - 0.02f, 0f);
        _gamcha.transform.localRotation = Quaternion.Euler(0f, 0f, (p.torso * 0.6f + sway) * Mathf.Rad2Deg);
        _gamcha.transform.localScale = new Vector3(0.10f, 0.42f + Mathf.Abs(sway) * 0.2f, 1f);

        // ---- head ----
        float headR = _hairR;
        Vector2 headPos = shoulder + torsoDir * (headR * 0.82f);
        _headJoint.localPosition = new Vector3(headPos.x, headPos.y, 0f);
        _headJoint.localRotation = Quaternion.Euler(0f, 0f, -(p.torso * 0.45f + p.head) * Mathf.Rad2Deg);

        // ---- front arm ----
        Vector2 shBpos = shoulder + torsoDir * -0.03f;
        PlaceSeg(ref _fArmU, shBpos, p.shB);
        Vector2 elbowB = shBpos + Dir(p.shB) * _fArmU.len;
        PlaceSeg(ref _fArmL, elbowB, p.shB + p.elB);
        Vector2 handB = elbowB + Dir(p.shB + p.elB) * _fArmL.len;
        _fHand.transform.localPosition = new Vector3(handB.x, handB.y, 0f);

        if (_lathi != null)
        {
            float a = p.shB + p.elB;
            _lathi.transform.localPosition = new Vector3(handB.x + Mathf.Sin(a) * 0.55f, handB.y - Mathf.Cos(a) * 0.55f, 0f);
            _lathi.transform.localRotation = Quaternion.Euler(0f, 0f, a * Mathf.Rad2Deg - 90f);
        }
    }

    public void SetShadow(float airY)
    {
        float t = Mathf.Clamp01(airY / 2.2f);
        _shadow.transform.localPosition = new Vector3(0f, 0.02f, 0f);
        _shadow.transform.localScale = new Vector3(0.9f * (1f - t * 0.35f), 0.22f * (1f - t * 0.35f), 1f);
        _shadow.color = new Color(0f, 0f, 0f, 0.32f * (1f - t * 0.55f));
    }

    SpriteRenderer[] _rends;
    Color[] _orig;

    public void CacheColors()
    {
        _rends = Root.GetComponentsInChildren<SpriteRenderer>();
        _orig = new Color[_rends.Length];
        for (int i = 0; i < _rends.Length; i++) _orig[i] = _rends[i].color;
    }

    public void SetFlash(bool on)
    {
        if (_rends == null) CacheColors();
        for (int i = 0; i < _rends.Length; i++)
        {
            if (_rends[i] == null || _rends[i] == _shadow) continue;
            _rends[i].color = on ? new Color(1f, 0.96f, 0.94f, 1f) : _orig[i];
        }
    }
}
