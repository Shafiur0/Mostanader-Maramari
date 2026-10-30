using System;
using UnityEngine;
using UnityEngine.UI;

/// <summary>Tiny uGUI factory — the whole interface is built from code.</summary>
public static class UI
{
    public static Font Font { get { return ProcTex.UIFont; } }

    public static readonly Color Gold = ProcTex.Hex("#d4af37");
    public static readonly Color GoldLight = ProcTex.Hex("#f0d67a");
    public static readonly Color Paper = ProcTex.Hex("#efe8d8");
    public static readonly Color Muted = ProcTex.Hex("#8d8a80");
    public static readonly Color Red = ProcTex.Hex("#b3352c");
    public static readonly Color RedLight = ProcTex.Hex("#e5544a");
    public static readonly Color Ink = ProcTex.Hex("#0a0b0d");

    public static Canvas MakeCanvas(string name, int sortOrder)
    {
        var go = new GameObject(name);
        var canvas = go.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvas.sortingOrder = sortOrder;
        var scaler = go.AddComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1280, 720);
        scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
        scaler.matchWidthOrHeight = 0.5f;
        go.AddComponent<GraphicRaycaster>();
        return canvas;
    }

    public static RectTransform Stretch(GameObject go)
    {
        var rt = go.GetComponent<RectTransform>();
        if (rt == null) rt = go.AddComponent<RectTransform>();
        rt.anchorMin = Vector2.zero;
        rt.anchorMax = Vector2.one;
        rt.offsetMin = Vector2.zero;
        rt.offsetMax = Vector2.zero;
        return rt;
    }

    public static RectTransform Place(GameObject go, float x, float y, float w, float h)
    {
        var rt = go.GetComponent<RectTransform>();
        if (rt == null) rt = go.AddComponent<RectTransform>();
        rt.anchorMin = new Vector2(0f, 1f);
        rt.anchorMax = new Vector2(0f, 1f);
        rt.pivot = new Vector2(0f, 1f);
        rt.anchoredPosition = new Vector2(x, -y);
        rt.sizeDelta = new Vector2(w, h);
        return rt;
    }

    public static RectTransform Centre(GameObject go, float cx, float cy, float w, float h)
    {
        var rt = go.GetComponent<RectTransform>();
        if (rt == null) rt = go.AddComponent<RectTransform>();
        rt.anchorMin = new Vector2(0.5f, 0.5f);
        rt.anchorMax = new Vector2(0.5f, 0.5f);
        rt.pivot = new Vector2(0.5f, 0.5f);
        rt.anchoredPosition = new Vector2(cx, cy);
        rt.sizeDelta = new Vector2(w, h);
        return rt;
    }

    public static Image Box(Transform parent, string name, Color col, float x, float y, float w, float h)
    {
        var go = new GameObject(name);
        go.transform.SetParent(parent, false);
        var img = go.AddComponent<Image>();
        img.color = col;
        Place(go, x, y, w, h);
        return img;
    }

    public static Image Full(Transform parent, string name, Color col)
    {
        var go = new GameObject(name);
        go.transform.SetParent(parent, false);
        var img = go.AddComponent<Image>();
        img.color = col;
        Stretch(go);
        return img;
    }

    public static Text Label(Transform parent, string text, int size, Color col,
                             TextAnchor anchor, float x, float y, float w, float h)
    {
        var go = new GameObject("label");
        go.transform.SetParent(parent, false);
        var t = go.AddComponent<Text>();
        t.font = Font;
        t.text = text;
        t.fontSize = size;
        t.color = col;
        t.alignment = anchor;
        t.horizontalOverflow = HorizontalWrapMode.Wrap;
        t.verticalOverflow = VerticalWrapMode.Overflow;
        t.raycastTarget = false;
        Place(go, x, y, w, h);
        return t;
    }

    public static Button Btn(Transform parent, string label, float x, float y, float w, float h,
                             Action onClick, bool primary)
    {
        var go = new GameObject("btn_" + label);
        go.transform.SetParent(parent, false);
        var img = go.AddComponent<Image>();
        img.color = primary ? Red : new Color(0.10f, 0.11f, 0.13f, 0.92f);
        Place(go, x, y, w, h);

        var btn = go.AddComponent<Button>();
        var cb = btn.colors;
        cb.normalColor = Color.white;
        cb.highlightedColor = primary ? new Color(1.15f, 1.05f, 1f) : new Color(1.3f, 1.25f, 1.1f);
        cb.pressedColor = new Color(0.8f, 0.8f, 0.8f);
        cb.selectedColor = Color.white;
        cb.fadeDuration = 0.08f;
        btn.colors = cb;
        if (onClick != null) btn.onClick.AddListener(() => { if (AudioSynth.I != null) AudioSynth.I.Click(); onClick(); });

        var txt = Label(go.transform, label, primary ? 20 : 18,
                        primary ? Color.white : GoldLight, TextAnchor.MiddleCenter, 0f, 0f, w, h);
        Stretch(txt.gameObject);

        var outline = go.AddComponent<Outline>();
        outline.effectColor = primary ? new Color(1f, 0.8f, 0.7f, 0.35f) : new Color(0.83f, 0.69f, 0.22f, 0.35f);
        outline.effectDistance = new Vector2(1f, -1f);
        return btn;
    }

    public static GameObject Screen(Transform parent, string name, Color bg)
    {
        var go = new GameObject(name);
        go.transform.SetParent(parent, false);
        var img = go.AddComponent<Image>();
        img.color = bg;
        Stretch(go);
        go.SetActive(false);
        return go;
    }

    public static void SetText(Text t, string s)
    {
        if (t != null) t.text = s;
    }
}
