using UnityEngine;
using UnityEngine.UI;

/// <summary>Fight HUD: health, super meter, timer, round pips, banner, combos.</summary>
public class HUD
{
    const float BarW = 470f, BarH = 24f, BarY = 30f, Margin = 48f;
    const float MeterW = 320f, MeterH = 14f;

    GameObject _root;
    Image _p1Fill, _p1Ghost, _p2Fill, _p2Ghost;
    Image _p1Meter, _p2Meter;
    Text _p1Name, _p2Name, _timer, _banner, _bannerSub, _combo1, _combo2, _ready1, _ready2;
    Image[] _pips1 = new Image[2];
    Image[] _pips2 = new Image[2];
    float _shown1 = 1f, _shown2 = 1f;

    public void Build(Transform canvas)
    {
        _root = new GameObject("HUD");
        _root.transform.SetParent(canvas, false);
        UI.Stretch(_root);

        // ---- bars ----
        UI.Box(_root.transform, "p1bg", new Color(0.03f, 0.035f, 0.05f, 0.9f), Margin, BarY, BarW, BarH);
        _p1Ghost = UI.Box(_root.transform, "p1ghost", new Color(1f, 0.42f, 0.36f, 0.5f), Margin, BarY, BarW, BarH);
        _p1Fill = UI.Box(_root.transform, "p1fill", UI.Gold, Margin, BarY, BarW, BarH);

        UI.Box(_root.transform, "p2bg", new Color(0.03f, 0.035f, 0.05f, 0.9f), 1280f - Margin - BarW, BarY, BarW, BarH);
        _p2Ghost = UI.Box(_root.transform, "p2ghost", new Color(1f, 0.42f, 0.36f, 0.5f), 1280f - Margin - BarW, BarY, BarW, BarH);
        _p2Fill = UI.Box(_root.transform, "p2fill", UI.Gold, 1280f - Margin - BarW, BarY, BarW, BarH);

        // ---- names ----
        _p1Name = UI.Label(_root.transform, "MOSTAFA", 20, UI.Paper, TextAnchor.UpperLeft, Margin + 4f, BarY + BarH + 6f, 320f, 30f);
        _p2Name = UI.Label(_root.transform, "KALA CHAN", 20, UI.Paper, TextAnchor.UpperRight, 1280f - Margin - 324f, BarY + BarH + 6f, 320f, 30f);

        // ---- timer ----
        _timer = UI.Label(_root.transform, "60", 40, UI.Paper, TextAnchor.MiddleCenter, 1280f * 0.5f - 60f, BarY - 6f, 120f, 56f);

        // ---- round pips ----
        for (int i = 0; i < 2; i++)
        {
            _pips1[i] = UI.Box(_root.transform, "pip1_" + i, new Color(1f, 1f, 1f, 0.15f), 1280f * 0.5f - 92f - i * 20f, BarY + 10f, 12f, 12f);
            _pips2[i] = UI.Box(_root.transform, "pip2_" + i, new Color(1f, 1f, 1f, 0.15f), 1280f * 0.5f + 80f + i * 20f, BarY + 10f, 12f, 12f);
        }

        // ---- super meters ----
        UI.Box(_root.transform, "m1bg", new Color(0.03f, 0.035f, 0.05f, 0.85f), Margin, 720f - 46f, MeterW, MeterH);
        _p1Meter = UI.Box(_root.transform, "m1", ProcTex.Hex("#3aa7c9"), Margin, 720f - 46f, 0f, MeterH);
        UI.Box(_root.transform, "m2bg", new Color(0.03f, 0.035f, 0.05f, 0.85f), 1280f - Margin - MeterW, 720f - 46f, MeterW, MeterH);
        _p2Meter = UI.Box(_root.transform, "m2", ProcTex.Hex("#3aa7c9"), 1280f - Margin - MeterW, 720f - 46f, 0f, MeterH);
        _ready1 = UI.Label(_root.transform, "SUPER READY", 12, ProcTex.Hex("#bfe9ff"), TextAnchor.MiddleLeft, Margin + MeterW + 10f, 720f - 50f, 160f, 20f);
        _ready2 = UI.Label(_root.transform, "SUPER READY", 12, ProcTex.Hex("#bfe9ff"), TextAnchor.MiddleRight, 1280f - Margin - MeterW - 170f, 720f - 50f, 160f, 20f);

        // ---- banner ----
        _banner = UI.Label(_root.transform, "", 76, Color.white, TextAnchor.MiddleCenter, 0f, 200f, 1280f, 110f);
        var ol = _banner.gameObject.AddComponent<Outline>();
        ol.effectColor = new Color(0f, 0f, 0f, 0.8f);
        ol.effectDistance = new Vector2(3f, -3f);
        _bannerSub = UI.Label(_root.transform, "", 20, new Color(0.95f, 0.92f, 0.85f, 0.9f), TextAnchor.MiddleCenter, 0f, 296f, 1280f, 30f);

        // ---- combos ----
        _combo1 = UI.Label(_root.transform, "", 38, ProcTex.Hex("#ffd166"), TextAnchor.MiddleLeft, 120f, 200f, 220f, 60f);
        _combo2 = UI.Label(_root.transform, "", 38, ProcTex.Hex("#ff8f83"), TextAnchor.MiddleRight, 940f, 200f, 220f, 60f);
    }

    public void SetVisible(bool v)
    {
        if (_root != null) _root.SetActive(v);
    }

    public void Bind(MatchManager m)
    {
        _shown1 = 1f; _shown2 = 1f;
        if (m == null) return;
        _p1Name.text = m.p1.def.name;
        _p2Name.text = m.p2.def.name;
    }

    public void Update(MatchManager m, float dt)
    {
        if (m == null || _root == null) return;

        float f1 = m.p1.hp / m.p1.maxHp;
        float f2 = m.p2.hp / m.p2.maxHp;
        _shown1 = Mathf.Lerp(_shown1, f1, Mathf.Min(1f, dt * 4f));
        _shown2 = Mathf.Lerp(_shown2, f2, Mathf.Min(1f, dt * 4f));

        SetWidth(_p1Fill, BarW * f1, Margin);
        SetWidth(_p1Ghost, BarW * _shown1, Margin);
        SetWidth(_p2Fill, BarW * f2, 1280f - Margin - BarW * f2);
        SetWidth(_p2Ghost, BarW * _shown2, 1280f - Margin - BarW * _shown2);

        Color c1 = f1 > 0.5f ? UI.Gold : (f1 > 0.22f ? ProcTex.Hex("#e07a2f") : UI.RedLight);
        Color c2 = f2 > 0.5f ? UI.Gold : (f2 > 0.22f ? ProcTex.Hex("#e07a2f") : UI.RedLight);
        _p1Fill.color = c1;
        _p2Fill.color = c2;

        _timer.text = Mathf.CeilToInt(m.timer).ToString();
        _timer.color = m.timer < 10f ? UI.RedLight : UI.Paper;

        SetWidth(_p1Meter, MeterW * (m.p1.meter / 100f), Margin);
        SetWidth(_p2Meter, MeterW * (m.p2.meter / 100f), 1280f - Margin - MeterW * (m.p2.meter / 100f));
        _p1Meter.color = m.p1.meter >= 100f ? Color.white : ProcTex.Hex("#3aa7c9");
        _p2Meter.color = m.p2.meter >= 100f ? Color.white : ProcTex.Hex("#3aa7c9");
        _ready1.enabled = m.p1.meter >= 100f;
        _ready2.enabled = m.p2.meter >= 100f;

        for (int i = 0; i < 2; i++)
        {
            _pips1[i].color = m.wins[0] > i ? UI.Gold : new Color(1f, 1f, 1f, 0.15f);
            _pips2[i].color = m.wins[1] > i ? UI.Gold : new Color(1f, 1f, 1f, 0.15f);
        }

        if (m.bannerT > 0f && !string.IsNullOrEmpty(m.banner))
        {
            _banner.enabled = true;
            _bannerSub.enabled = true;
            _banner.text = m.banner;
            _bannerSub.text = m.bannerSub;
            float fade = Mathf.Clamp01(m.bannerT * 2f);
            _banner.color = new Color(1f, 1f, 1f, fade);
            _bannerSub.color = new Color(0.95f, 0.92f, 0.85f, fade * 0.9f);
            float pop = 1f + Mathf.Max(0f, (m.bannerT - 2.0f)) * 0.35f;
            _banner.fontSize = Mathf.RoundToInt(76 * Mathf.Min(1.25f, pop));
        }
        else
        {
            _banner.enabled = false;
            _bannerSub.enabled = false;
        }

        _combo1.text = m.p1.comboHits > 1 ? m.p1.comboHits + " HIT" : "";
        _combo2.text = m.p2.comboHits > 1 ? m.p2.comboHits + " HIT" : "";
    }

    static void SetWidth(Image img, float w, float x)
    {
        if (img == null) return;
        var rt = img.rectTransform;
        rt.sizeDelta = new Vector2(Mathf.Max(0f, w), rt.sizeDelta.y);
        var p = rt.anchoredPosition;
        rt.anchoredPosition = new Vector2(x, p.y);
    }
}
