using UnityEngine;

/// <summary>
/// Opponent brain. Produces the same InputState a human would,
/// with a reaction delay so it never feels like it reads inputs.
/// </summary>
public class AIBrain
{
    public Difficulty diff;

    string plan = "neutral";
    float planT, cool, jumpCd;

    public AIBrain(Difficulty d)
    {
        diff = d ?? new Difficulty(18f, 0.5f, 0.3f, 0.15f, 0.2f, "NORMAL");
    }

    public void Reset()
    {
        plan = "neutral";
        planT = 0f;
        cool = 0f;
        jumpCd = 0f;
    }

    public InputState Update(float dt, Fighter self, Fighter opp)
    {
        var o = new InputState();
        if (self.state == "ko" || self.state == "win" || self.state == "intro") return o;

        planT -= dt;
        cool -= dt;
        jumpCd -= dt;

        float dist = Mathf.Abs(opp.x - self.x);
        int toward = opp.x > self.x ? 1 : -1;
        float reaction = diff.react / 60f;

        // ---- reactive blocking ----
        bool threat = false;
        if (opp.state == "attack" && opp.move != null)
        {
            float frame = opp.stateT * 60f;
            float willReach = Mathf.Abs(opp.x - self.x) < opp.move.reach * 1.25f + 0.3f;
            if (willReach && frame < opp.move.startup + opp.move.active + 3f) threat = true;
        }
        if (opp.state == "super") threat = true;

        if (threat && cool <= 0f && Random.value < diff.block)
        {
            plan = "block";
            planT = 0.22f + Random.value * 0.2f;
            cool = 0.1f;
        }

        // ---- anti air ----
        if (opp.airY > 0.4f && dist < 1.9f && Random.value < diff.antiAir * dt * 8f && cool <= 0f)
        {
            plan = "antiair";
            planT = 0.3f;
            cool = 0.35f;
        }

        // ---- choose a new plan ----
        if (planT <= 0f && cool <= 0f)
        {
            float r = Random.value;
            if (dist > 3.3f)
            {
                plan = r < 0.82f ? "approach" : (r < 0.92f ? "jumpin" : "wait");
                planT = 0.25f + Random.value * 0.35f;
            }
            else if (dist > 1.65f)
            {
                if (r < diff.aggr * 0.55f) plan = "approach";
                else if (r < diff.aggr * 0.55f + diff.special * 0.7f) plan = "special";
                else if (r < diff.aggr * 0.55f + diff.special * 0.7f + 0.12f) plan = "jumpin";
                else if (r < diff.aggr * 0.9f + 0.25f) plan = "poke";
                else plan = "block";
                planT = 0.18f + Random.value * 0.3f;
            }
            else
            {
                if (self.meter >= 100f && r < 0.45f) plan = "super";
                else if (r < diff.aggr * 0.5f) plan = "rush";
                else if (r < diff.aggr * 0.5f + diff.special * 0.5f) plan = "special";
                else if (r < 0.85f) plan = "attack";
                else plan = "retreat";
                planT = 0.14f + Random.value * 0.22f;
            }
            cool = reaction * (0.6f + Random.value * 0.8f);
        }

        // ---- execute ----
        switch (plan)
        {
            case "approach":
                if (toward > 0) o.right = true; else o.left = true;
                break;
            case "retreat":
                if (toward > 0) o.left = true; else o.right = true;
                break;
            case "block":
                if (toward > 0) o.left = true; else o.right = true;
                if (Random.value < 0.5f) o.down = true;
                break;
            case "wait":
                break;
            case "poke":
                if (planT > 0.12f) { if (toward > 0) o.right = true; else o.left = true; }
                else if (planT > 0f) { o.lpPressed = true; o.lp = true; }
                break;
            case "attack":
                {
                    float rr = Random.value;
                    if (rr < 0.45f) { o.lpPressed = true; o.lp = true; }
                    else if (rr < 0.72f) { o.hpPressed = true; o.hp = true; }
                    else if (rr < 0.88f) { o.kickPressed = true; o.kick = true; }
                    else { o.down = true; o.kickPressed = true; o.kick = true; }
                    planT = 0.02f;
                }
                break;
            case "rush":
                if (dist > 0.8f) { if (toward > 0) o.right = true; else o.left = true; }
                else { o.lpPressed = true; o.lp = true; }
                break;
            case "special":
                if (self.meter >= 50f && dist < 2.1f) { o.specialPressed = true; o.special = true; planT = 0.02f; }
                else { if (toward > 0) o.right = true; else o.left = true; }
                break;
            case "super":
                if (self.meter >= 100f && dist < 1.75f) { o.superPressed = true; o.super = true; planT = 0.02f; }
                else { if (toward > 0) o.right = true; else o.left = true; }
                break;
            case "jumpin":
                if (self.grounded && jumpCd <= 0f)
                {
                    o.up = true;
                    if (toward > 0) o.right = true; else o.left = true;
                    jumpCd = 0.9f;
                }
                else if (!self.grounded && dist < 1.7f) { o.hpPressed = true; o.hp = true; }
                else if (!self.grounded) { if (toward > 0) o.right = true; else o.left = true; }
                break;
            case "antiair":
                if (self.grounded) { o.hpPressed = true; o.hp = true; }
                break;
        }

        // stay out of the corners
        if (self.x < Roster.ArenaLeft + 0.8f) o.right = true;
        if (self.x > Roster.ArenaRight - 0.8f) o.left = true;

        return o;
    }
}
