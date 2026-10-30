using UnityEngine;

/// <summary>
/// Procedural graphics toolkit: every pixel in this game is generated at runtime.
/// No imported art assets, no external packages.
/// </summary>
public static class ProcTex
{
    static Sprite _white, _circle, _ring;
    static Font _font;

    /// <summary>1x1 world-unit white quad, pivot centre.</summary>
    public static Sprite White
    {
        get
        {
            if (_white == null)
            {
                var t = new Texture2D(4, 4, TextureFormat.RGBA32, false);
                var px = new Color32[16];
                for (int i = 0; i < 16; i++) px[i] = new Color32(255, 255, 255, 255);
                t.SetPixels32(px);
                t.filterMode = FilterMode.Bilinear;
                t.wrapMode = TextureWrapMode.Clamp;
                t.Apply();
                _white = Sprite.Create(t, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f), 4f, 0, SpriteMeshType.FullRect);
                _white.name = "px_white";
            }
            return _white;
        }
    }

    /// <summary>1 world-unit diameter anti-aliased disc, pivot centre.</summary>
    public static Sprite Circle
    {
        get
        {
            if (_circle == null) _circle = MakeDisc(128, false);
            return _circle;
        }
    }

    /// <summary>1 world-unit diameter ring (outline only).</summary>
    public static Sprite Ring
    {
        get
        {
            if (_ring == null) _ring = MakeDisc(128, true);
            return _ring;
        }
    }

    static Sprite MakeDisc(int size, bool ring)
    {
        var tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
        var px = new Color32[size * size];
        float c = (size - 1) * 0.5f;
        float r = size * 0.5f - 1f;
        for (int y = 0; y < size; y++)
        {
            for (int x = 0; x < size; x++)
            {
                float dx = x - c, dy = y - c;
                float d = Mathf.Sqrt(dx * dx + dy * dy);
                float a;
                if (ring)
                {
                    float inner = r - size * 0.14f;
                    a = Mathf.Clamp01(r - d + 0.5f) * Mathf.Clamp01(d - inner + 0.5f);
                }
                else
                {
                    a = Mathf.Clamp01(r - d + 0.5f);
                }
                px[y * size + x] = new Color32(255, 255, 255, (byte)(a * 255f));
            }
        }
        tex.SetPixels32(px);
        tex.filterMode = FilterMode.Bilinear;
        tex.wrapMode = TextureWrapMode.Clamp;
        tex.Apply();
        var s = Sprite.Create(tex, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f), size, 0, SpriteMeshType.FullRect);
        s.name = ring ? "px_ring" : "px_disc";
        return s;
    }

    /// <summary>Built-in UI font. Works on 2021 LTS and 2022+/Unity 6.</summary>
    public static Font UIFont
    {
        get
        {
            if (_font != null) return _font;
            try { _font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf"); } catch { }
            if (_font == null)
            {
                try { _font = Resources.GetBuiltinResource<Font>("Arial.ttf"); } catch { }
            }
            if (_font == null)
            {
                // last resort: any font installed on the machine
                try
                {
                    var names = Font.GetOSInstalledFontNames();
                    if (names != null && names.Length > 0)
                        _font = Font.CreateDynamicFontFromOSFont(names[0], 16);
                }
                catch { }
            }
            return _font;
        }
    }

    /* ------------------------------------------------------------
       object helpers
       ------------------------------------------------------------ */

    public static SpriteRenderer Quad(Transform parent, string name, Vector2 pos, Vector2 size, Color col, int order)
    {
        var go = new GameObject(name);
        go.transform.SetParent(parent, false);
        go.transform.localPosition = new Vector3(pos.x, pos.y, 0f);
        go.transform.localScale = new Vector3(size.x, size.y, 1f);
        var sr = go.AddComponent<SpriteRenderer>();
        sr.sprite = White;
        sr.color = col;
        sr.sortingOrder = order;
        return sr;
    }

    public static SpriteRenderer Disc(Transform parent, string name, Vector2 pos, float diameter, Color col, int order)
    {
        var go = new GameObject(name);
        go.transform.SetParent(parent, false);
        go.transform.localPosition = new Vector3(pos.x, pos.y, 0f);
        go.transform.localScale = new Vector3(diameter, diameter, 1f);
        var sr = go.AddComponent<SpriteRenderer>();
        sr.sprite = Circle;
        sr.color = col;
        sr.sortingOrder = order;
        return sr;
    }

    public static SpriteRenderer RingObj(Transform parent, string name, Vector2 pos, float diameter, Color col, int order)
    {
        var go = new GameObject(name);
        go.transform.SetParent(parent, false);
        go.transform.localPosition = new Vector3(pos.x, pos.y, 0f);
        go.transform.localScale = new Vector3(diameter, diameter, 1f);
        var sr = go.AddComponent<SpriteRenderer>();
        sr.sprite = Ring;
        sr.color = col;
        sr.sortingOrder = order;
        return sr;
    }

    /* ------------------------------------------------------------
       colour helpers
       ------------------------------------------------------------ */

    public static Color Hex(string hex)
    {
        Color c;
        if (ColorUtility.TryParseHtmlString(hex.StartsWith("#") ? hex : "#" + hex, out c)) return c;
        return Color.magenta;
    }

    public static Color Shade(Color c, float amt)
    {
        return new Color(
            Mathf.Clamp01(c.r + amt),
            Mathf.Clamp01(c.g + amt),
            Mathf.Clamp01(c.b + amt),
            c.a);
    }

    public static Color WithAlpha(Color c, float a)
    {
        return new Color(c.r, c.g, c.b, a);
    }
}

/// <summary>
/// Tiny software rasteriser used to bake the stage backdrops into textures.
/// Pixel space: (0,0) is bottom-left, matching Unity texture coordinates.
/// </summary>
public class Raster
{
    public readonly int W, H;
    readonly Color[] buf;

    public Raster(int w, int h)
    {
        W = w; H = h;
        buf = new Color[w * h];
        for (int i = 0; i < buf.Length; i++) buf[i] = new Color(0, 0, 0, 0);
    }

    public void Clear(Color c)
    {
        for (int i = 0; i < buf.Length; i++) buf[i] = c;
    }

    void Blend(int idx, Color c)
    {
        if (c.a <= 0f) return;
        if (c.a >= 0.999f) { buf[idx] = c; return; }
        Color d = buf[idx];
        float a = c.a;
        float outA = a + d.a * (1f - a);
        if (outA <= 0.0001f) { buf[idx] = new Color(0, 0, 0, 0); return; }
        buf[idx] = new Color(
            (c.r * a + d.r * d.a * (1f - a)) / outA,
            (c.g * a + d.g * d.a * (1f - a)) / outA,
            (c.b * a + d.b * d.a * (1f - a)) / outA,
            outA);
    }

    public void Rect(float x, float y, float w, float h, Color c)
    {
        int x0 = Mathf.FloorToInt(x), x1 = Mathf.CeilToInt(x + w);
        int y0 = Mathf.FloorToInt(y), y1 = Mathf.CeilToInt(y + h);
        x0 = Mathf.Max(0, x0); y0 = Mathf.Max(0, y0);
        x1 = Mathf.Min(W, x1); y1 = Mathf.Min(H, y1);
        for (int yy = y0; yy < y1; yy++)
        {
            int row = yy * W;
            for (int xx = x0; xx < x1; xx++) Blend(row + xx, c);
        }
    }

    public void Disc(float cx, float cy, float r, Color c)
    {
        int x0 = Mathf.Max(0, Mathf.FloorToInt(cx - r));
        int x1 = Mathf.Min(W, Mathf.CeilToInt(cx + r));
        int y0 = Mathf.Max(0, Mathf.FloorToInt(cy - r));
        int y1 = Mathf.Min(H, Mathf.CeilToInt(cy + r));
        float r2 = r * r;
        for (int y = y0; y < y1; y++)
        {
            float dy = y - cy;
            int row = y * W;
            for (int x = x0; x < x1; x++)
            {
                float dx = x - cx;
                float d2 = dx * dx + dy * dy;
                if (d2 > r2) continue;
                float edge = Mathf.Clamp01(r - Mathf.Sqrt(d2) + 0.5f);
                Blend(row + x, new Color(c.r, c.g, c.b, c.a * edge));
            }
        }
    }

    public void VGrad(float x, float y, float w, float h, Color top, Color bottom)
    {
        int x0 = Mathf.Max(0, Mathf.FloorToInt(x));
        int x1 = Mathf.Min(W, Mathf.CeilToInt(x + w));
        int y0 = Mathf.Max(0, Mathf.FloorToInt(y));
        int y1 = Mathf.Min(H, Mathf.CeilToInt(y + h));
        for (int yy = y0; yy < y1; yy++)
        {
            float t = h <= 0f ? 0f : Mathf.Clamp01((yy - y) / h);
            Color c = Color.Lerp(bottom, top, t);
            int row = yy * W;
            for (int xx = x0; xx < x1; xx++) Blend(row + xx, c);
        }
    }

    /// <summary>Multi-stop vertical gradient. stops[0] is at the bottom, last at the top.</summary>
    public void VGradStops(float x, float y, float w, float h, Color[] stops)
    {
        int x0 = Mathf.Max(0, Mathf.FloorToInt(x));
        int x1 = Mathf.Min(W, Mathf.CeilToInt(x + w));
        int y0 = Mathf.Max(0, Mathf.FloorToInt(y));
        int y1 = Mathf.Min(H, Mathf.CeilToInt(y + h));
        int n = stops.Length;
        if (n == 0) return;
        for (int yy = y0; yy < y1; yy++)
        {
            float t = h <= 0f ? 0f : Mathf.Clamp01((yy - y) / h);
            float ft = t * (n - 1);
            int i0 = Mathf.Clamp(Mathf.FloorToInt(ft), 0, n - 1);
            int i1 = Mathf.Clamp(i0 + 1, 0, n - 1);
            Color c = Color.Lerp(stops[i0], stops[i1], ft - i0);
            int row = yy * W;
            for (int xx = x0; xx < x1; xx++) Blend(row + xx, c);
        }
    }

    public void Line(float x0, float y0, float x1, float y1, float thick, Color c)
    {
        float dx = x1 - x0, dy = y1 - y0;
        float len = Mathf.Sqrt(dx * dx + dy * dy);
        int steps = Mathf.Max(2, Mathf.CeilToInt(len * 1.5f));
        for (int i = 0; i <= steps; i++)
        {
            float t = i / (float)steps;
            Disc(Mathf.Lerp(x0, x1, t), Mathf.Lerp(y0, y1, t), thick * 0.5f, c);
        }
    }

    /// <summary>Curved line using a quadratic bezier.</summary>
    public void Curve(float x0, float y0, float cx, float cy, float x1, float y1, float thick, Color c)
    {
        int steps = 24;
        float px = x0, py = y0;
        for (int i = 1; i <= steps; i++)
        {
            float t = i / (float)steps;
            float u = 1f - t;
            float nx = u * u * x0 + 2f * u * t * cx + t * t * x1;
            float ny = u * u * y0 + 2f * u * t * cy + t * t * y1;
            Line(px, py, nx, ny, thick, c);
            px = nx; py = ny;
        }
    }

    public void SoftGlow(float cx, float cy, float r, Color c, int rings)
    {
        for (int i = rings; i > 0; i--)
        {
            float t = i / (float)rings;
            float rr = r * t;
            float a = c.a * (1f - t) * 0.55f;
            Disc(cx, cy, rr, new Color(c.r, c.g, c.b, a));
        }
    }

    public Texture2D ToTexture()
    {
        var tex = new Texture2D(W, H, TextureFormat.RGBA32, false);
        tex.SetPixels(buf);
        tex.filterMode = FilterMode.Bilinear;
        tex.wrapMode = TextureWrapMode.Clamp;
        tex.Apply();
        return tex;
    }

    public Sprite ToSprite(float ppu)
    {
        var tex = ToTexture();
        return Sprite.Create(tex, new Rect(0, 0, W, H), new Vector2(0.5f, 0.5f), ppu, 0, SpriteMeshType.FullRect);
    }
}
