using UnityEngine;

/// <summary>Pose library — every animation is a function of progress through the move.</summary>
public static class Poses
{
    static float Smooth(float t) { return t * t * (3f - 2f * t); }

    public static Pose Get(string anim, float p, float t)
    {
        switch (anim)
        {
            case "walk": return Walk(t);
            case "crouch": return Crouch(t);
            case "block": return Block();
            case "jump": return Jump();
            case "fall": return Fall();
            case "punchL": return PunchL(p);
            case "punchH": return PunchH(p);
            case "kick": return Kick(p);
            case "kickLow": return KickLow(p);
            case "jumpAtk": return JumpAtk();
            case "hit": return Hit(p);
            case "ko": return Ko(p);
            case "spin": return Spin(p);
            case "dashStab": return DashStab(p);
            case "swingStick": return SwingStick(p);
            case "slam": return Slam(p);
            case "tackle": return Tackle(p);
            case "doubleKick": return DoubleKick(p);
            case "order": return Order(p);
            case "superRush": return SuperRush(p);
            case "win": return Win(t);
            case "intro": return Intro(t);
            default: return Idle(t);
        }
    }

    static Pose Idle(float t)
    {
        float b = Mathf.Sin(t * 3.1f);
        var p = new Pose();
        p.torso = 0.04f + b * 0.012f;
        p.shA = 0.26f + b * 0.03f; p.elA = 1.95f - b * 0.04f;
        p.shB = 0.14f - b * 0.03f; p.elB = 2.05f + b * 0.04f;
        p.bodyY = b * 0.014f;
        return p;
    }

    static Pose Walk(float t)
    {
        float s = Mathf.Sin(t * 9f), c = Mathf.Cos(t * 9f);
        var p = new Pose();
        p.torso = 0.06f;
        p.shA = 0.22f - s * 0.24f; p.elA = 1.9f + s * 0.10f;
        p.shB = 0.16f + s * 0.24f; p.elB = 1.98f - s * 0.10f;
        p.hipA = 0.34f * s; p.knA = 0.10f + Mathf.Max(0f, -s) * 0.45f;
        p.hipB = -0.34f * s; p.knB = -0.10f - Mathf.Max(0f, s) * 0.45f;
        p.bodyY = Mathf.Abs(c) * -0.02f;
        return p;
    }

    static Pose Crouch(float t)
    {
        var p = new Pose();
        p.torso = 0.30f; p.head = -0.10f;
        p.shA = 0.52f; p.elA = 1.62f;
        p.shB = 0.42f; p.elB = 1.72f;
        p.hipA = 0.95f; p.knA = -1.55f;
        p.hipB = 0.55f; p.knB = -1.75f;
        p.bodyY = 0.34f + Mathf.Sin(t * 3.4f) * 0.008f;
        return p;
    }

    static Pose Block()
    {
        var p = new Pose();
        p.torso = -0.09f; p.head = -0.04f;
        p.shA = 0.78f; p.elA = 1.52f;
        p.shB = 0.62f; p.elB = 1.62f;
        p.hipA = 0.26f; p.hipB = -0.28f;
        p.bodyY = 0.03f;
        return p;
    }

    static Pose Jump()
    {
        var p = new Pose();
        p.torso = 0.10f;
        p.shA = 0.92f; p.elA = 1.55f;
        p.shB = 0.70f; p.elB = 1.70f;
        p.hipA = 0.85f; p.knA = -1.30f;
        p.hipB = 0.30f; p.knB = -1.60f;
        p.bodyY = -0.04f;
        return p;
    }

    static Pose Fall()
    {
        var p = new Pose();
        p.torso = -0.08f;
        p.shA = 1.40f; p.elA = 0.90f;
        p.shB = 1.20f; p.elB = 1.00f;
        p.hipA = 0.35f; p.knA = -0.50f;
        p.hipB = 0.05f; p.knB = -0.70f;
        return p;
    }

    static Pose PunchL(float p)
    {
        float ext = p < 0.30f ? Smooth(p / 0.30f) : (p < 0.62f ? 1f : 1f - Smooth((p - 0.62f) / 0.38f));
        var q = new Pose();
        q.torso = 0.05f + ext * 0.15f;
        q.shB = 0.20f + ext * 1.35f; q.elB = 2.00f - ext * 1.92f;
        q.shA = 0.30f; q.elA = 1.90f;
        q.hipA = 0.20f + ext * 0.10f;
        q.bodyY = ext * 0.02f;
        return q;
    }

    static Pose PunchH(float p)
    {
        float ext = p < 0.42f ? Smooth(p / 0.42f) : (p < 0.62f ? 1f : 1f - Smooth((p - 0.62f) / 0.38f));
        var q = new Pose();
        q.torso = -0.10f + ext * 0.30f;
        q.head = -0.04f + ext * 0.08f;
        q.shB = -0.20f + ext * 1.85f; q.elB = 2.15f - ext * 2.05f;
        q.shA = 0.55f; q.elA = 1.75f;
        q.hipA = 0.40f + ext * 0.15f; q.hipB = -0.42f;
        q.bodyY = ext * 0.03f;
        return q;
    }

    static Pose Kick(float p)
    {
        float ext = p < 0.34f ? Smooth(p / 0.34f) : (p < 0.60f ? 1f : 1f - Smooth((p - 0.60f) / 0.40f));
        var q = new Pose();
        q.torso = -0.18f - ext * 0.18f;
        q.head = 0.08f;
        q.shA = 0.80f; q.elA = 1.42f;
        q.shB = -0.60f; q.elB = 1.20f;
        q.hipB = -0.10f + ext * 1.65f; q.knB = 0.05f;
        q.hipA = 0.10f - ext * 0.15f;
        q.bodyY = -ext * 0.04f;
        return q;
    }

    static Pose KickLow(float p)
    {
        float ext = p < 0.30f ? Smooth(p / 0.30f) : (p < 0.58f ? 1f : 1f - Smooth((p - 0.58f) / 0.42f));
        var q = new Pose();
        q.torso = 0.20f; q.head = -0.08f;
        q.shA = 0.45f; q.elA = 1.80f;
        q.shB = 0.35f; q.elB = 1.90f;
        q.hipB = 0.30f + ext * 0.58f; q.knB = -0.10f - ext * 0.05f;
        q.hipA = 0.70f; q.knA = -1.30f;
        q.bodyY = 0.18f;
        return q;
    }

    static Pose JumpAtk()
    {
        var q = new Pose();
        q.torso = 0.16f;
        q.shA = 1.50f; q.elA = 0.70f;
        q.shB = 1.15f; q.elB = 0.35f;
        q.hipA = 0.80f; q.knA = -1.50f;
        q.hipB = 0.25f; q.knB = -1.70f;
        return q;
    }

    static Pose Hit(float p)
    {
        float k = Mathf.Sin(Mathf.Clamp01(p) * Mathf.PI);
        var q = new Pose();
        q.torso = -0.28f * k; q.head = -0.30f * k;
        q.shA = 0.35f + 0.90f * k; q.elA = 1.60f - 0.60f * k;
        q.shB = 0.10f + 1.10f * k; q.elB = 1.90f - 0.70f * k;
        q.hipA = 0.10f - 0.25f * k;
        q.hipB = -0.10f - 0.35f * k;
        q.bodyY = 0.03f * k;
        return q;
    }

    static Pose Ko(float p)
    {
        float k = Mathf.Clamp01(p);
        k = 1f - (1f - k) * (1f - k) * (1f - k);
        var q = new Pose();
        q.torso = -1.30f * k; q.head = -0.40f * k;
        q.shA = 1.50f * k; q.elA = 0.80f;
        q.shB = 1.30f * k; q.elB = 0.90f;
        q.hipA = 1.10f * k; q.knA = -0.50f * k;
        q.hipB = 0.90f * k; q.knB = -0.40f * k;
        q.bodyY = 0.58f * k;
        return q;
    }

    static Pose Spin(float p)
    {
        var q = new Pose();
        q.torso = 0.08f + Mathf.Sin(p * Mathf.PI * 6f) * 0.08f;
        q.shA = 1.45f; q.elA = 0.12f;
        q.shB = 1.45f; q.elB = 0.12f;
        q.hipA = 0.28f; q.hipB = -0.28f;
        q.bodyY = -0.03f;
        return q;
    }

    static Pose DashStab(float p)
    {
        float ext = p < 0.25f ? Smooth(p / 0.25f) : (p < 0.6f ? 1f : 1f - Smooth((p - 0.6f) / 0.4f));
        var q = new Pose();
        q.torso = 0.26f + ext * 0.10f;
        q.shB = 0.20f + ext * 1.40f; q.elB = 1.90f - ext * 1.85f;
        q.shA = 0.80f; q.elA = 1.40f;
        q.hipA = 0.55f; q.knA = -0.15f;
        q.hipB = -0.55f; q.knB = -0.25f;
        q.bodyY = 0.12f;
        return q;
    }

    static Pose SwingStick(float p)
    {
        float swing = p < 0.55f
            ? Mathf.Lerp(-1.60f, 1.50f, Smooth(Mathf.Clamp01(p / 0.55f)))
            : Mathf.Lerp(1.50f, 0.40f, Smooth(Mathf.Clamp01((p - 0.55f) / 0.45f)));
        var q = new Pose();
        q.torso = -0.14f + swing * 0.10f;
        q.shB = swing; q.elB = 0.12f;
        q.shA = 0.55f; q.elA = 1.70f;
        q.hipA = 0.35f; q.hipB = -0.38f;
        q.bodyY = 0.02f;
        return q;
    }

    static Pose Slam(float p)
    {
        float up = p < 0.45f ? Smooth(p / 0.45f) : 0f;
        float down = p > 0.55f ? Smooth((p - 0.55f) / 0.45f) : 0f;
        var q = new Pose();
        q.torso = -0.25f * up + 0.50f * down;
        q.shA = Mathf.Lerp(0.35f, -2.60f, up) + down * 4.30f; q.elA = 0.35f;
        q.shB = Mathf.Lerp(0.30f, -2.40f, up) + down * 4.10f; q.elB = 0.40f;
        q.hipA = 0.30f + down * 0.40f;
        q.hipB = -0.34f - down * 0.30f;
        q.bodyY = -up * 0.06f + down * 0.16f;
        return q;
    }

    static Pose Tackle(float p)
    {
        float ext = p < 0.35f ? Smooth(p / 0.35f) : 1f;
        var q = new Pose();
        q.torso = 0.50f + ext * 0.20f; q.head = -0.18f;
        q.shA = 1.55f; q.elA = 0.25f;
        q.shB = 1.50f; q.elB = 0.30f;
        q.hipA = 0.70f; q.knA = -0.40f;
        q.hipB = -0.60f; q.knB = -0.35f;
        q.bodyY = 0.10f;
        return q;
    }

    static Pose DoubleKick(float p)
    {
        float ext = Mathf.Abs(Mathf.Sin(Mathf.Clamp01(p) * Mathf.PI * 2f));
        var q = new Pose();
        q.torso = -0.14f - ext * 0.16f;
        q.shA = 0.90f; q.elA = 1.35f;
        q.shB = -0.50f; q.elB = 1.10f;
        q.hipB = -0.05f + ext * 1.60f; q.knB = 0.05f;
        q.bodyY = -ext * 0.04f;
        return q;
    }

    static Pose Order(float p)
    {
        var q = new Pose();
        q.torso = -0.04f;
        q.shB = 0.10f + Mathf.Sin(p * 12f) * 0.50f; q.elB = 1.50f;
        q.shA = 0.45f; q.elA = 1.70f;
        return q;
    }

    static Pose SuperRush(float p)
    {
        float ext = Mathf.Sin(Mathf.Clamp01(p) * Mathf.PI);
        var q = new Pose();
        q.torso = 0.06f + ext * 0.20f;
        q.shB = 0.15f + ext * 1.40f; q.elB = 2.00f - ext * 1.90f;
        q.shA = 1.10f - ext * 0.70f; q.elA = 1.40f;
        q.hipA = 0.55f; q.knA = -0.20f;
        q.hipB = -0.55f; q.knB = -0.20f;
        q.bodyY = 0.06f;
        return q;
    }

    static Pose Win(float t)
    {
        float b = Mathf.Sin(t * 2.4f);
        var q = new Pose();
        q.torso = -0.06f; q.head = -0.14f;
        q.shA = 2.35f + b * 0.06f; q.elA = 0.55f;
        q.shB = 0.15f; q.elB = 2.00f;
        q.hipA = 0.22f; q.hipB = -0.24f;
        q.bodyY = b * 0.02f;
        return q;
    }

    static Pose Intro(float t)
    {
        float b = Mathf.Sin(t * 1.6f);
        var q = new Pose();
        q.torso = 0.02f; q.head = -0.05f;
        q.shA = 0.30f; q.elA = 1.85f;
        q.shB = 0.10f; q.elB = 2.10f;
        q.bodyY = b * 0.015f;
        return q;
    }
}
