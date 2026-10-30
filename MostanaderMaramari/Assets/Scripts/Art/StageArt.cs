using System;
using UnityEngine;

/// <summary>
/// Bakes each stage into four parallax layers (far / mid / ground / fore)
/// using the software rasteriser. Layers live as children of the camera,
/// so they always fill the screen; parallax is applied by shifting them.
/// </summary>
public class StageArt
{
    public const int TexW = 1920;
    public const int TexH = 480;
    public const float PPU = 100f;          // 19.2 x 4.8 world units
    public const float LayerWorldW = TexW / PPU;

    // raster y for the fighting floor and the horizon (0 = bottom of texture)
    public const int GroundPx = 96;
    public const int HorizonPx = 163;

    public GameObject Root;
    public StageDef Def;

    SpriteRenderer _far, _mid, _ground, _fore;
    float _kFar = 0.10f, _kMid = 0.42f, _kGround = 0.80f, _kFore = 1.15f;

    public static StageArt Build(Transform cameraTransform, StageDef def)
    {
        var sa = new StageArt();
        sa.Def = def;
        sa.Root = new GameObject("Stage_" + def.id);
        sa.Root.transform.SetParent(cameraTransform, false);
        // camera sits at z = -10; push the stage back to the world plane
        sa.Root.transform.localPosition = new Vector3(0f, 0f, 10f);

        sa._far = MakeLayer(sa.Root.transform, "far", 0);
        sa._mid = MakeLayer(sa.Root.transform, "mid", 10);
        sa._ground = MakeLayer(sa.Root.transform, "ground", 20);
        sa._fore = MakeLayer(sa.Root.transform, "fore", 55);

        sa._far.sprite = sa.BakeLayer(0);
        sa._mid.sprite = sa.BakeLayer(1);
        sa._ground.sprite = sa.BakeLayer(2);
        sa._fore.sprite = sa.BakeLayer(3);
        return sa;
    }

    static SpriteRenderer MakeLayer(Transform parent, string name, int order)
    {
        var go = new GameObject("layer_" + name);
        go.transform.SetParent(parent, false);
        var sr = go.AddComponent<SpriteRenderer>();
        sr.color = Color.white;
        sr.sortingOrder = order;
        return sr;
    }

    void Bake() { }

    public void ApplyParallax(float camX, float worldCenter)    {
        float d = camX - worldCenter;
        _far.transform.localPosition = new Vector3(-d * _kFar, 0f, 0f);
        _mid.transform.localPosition = new Vector3(-d * _kMid, 0f, 0f);
        _ground.transform.localPosition = new Vector3(-d * _kGround, 0f, 0f);
        _fore.transform.localPosition = new Vector3(-d * _kFore, 0f, 0f);
    }

    public void Destroy()
    {
        if (Root != null) UnityEngine.Object.Destroy(Root);
    }

    /* ============================================================
       baking
       ============================================================ */
    Sprite BakeLayer(int which)
    {
        var r = new Raster(TexW, TexH);
        var def = Def;
        switch (which)
        {
            case 0: r.Clear(new Color(0, 0, 0, 0)); DrawSky(r, def); DrawFar(r, def); break;
            case 1: r.Clear(new Color(0, 0, 0, 0)); DrawMid(r, def); break;
            case 2: r.Clear(new Color(0, 0, 0, 0)); DrawGround(r, def); break;
            case 3: r.Clear(new Color(0, 0, 0, 0)); DrawFore(r, def); break;
        }
        return r.ToSprite(PPU);
    }

    void DrawSky(Raster r, StageDef d)
    {
        // four-stop sky, warm at the horizon and dark overhead
        r.VGradStops(0, 0, TexW, TexH, new Color[] { d.sky3, d.sky2, d.sky1, d.sky0 });

        if (d.id == "rooftop")
        {
            var rnd = new System.Random(31);
            for (int i = 0; i < 110; i++)
            {
                float x = (float)rnd.NextDouble() * TexW;
                float y = HorizonPx * 0.45f + (float)rnd.NextDouble() * (TexH - HorizonPx * 0.45f);
                r.Disc(x, y, 1.1f, new Color(0.75f, 0.85f, 1f, 0.15f + (float)rnd.NextDouble() * 0.5f));
            }
            r.SoftGlow(TexW * 0.78f, TexH * 0.80f, 90f, new Color(0.85f, 0.92f, 1f, 0.55f), 10);
            r.Disc(TexW * 0.78f, TexH * 0.80f, 26f, new Color(0.93f, 0.96f, 1f, 0.95f));
        }
        else if (d.id != "rickshaw")
        {
            float sx = TexW * 0.66f;
            float sy = d.id == "akhra" ? TexH * 0.52f : TexH * 0.70f;
            r.SoftGlow(sx, sy, 120f, new Color(1f, 0.92f, 0.75f, 0.75f), 12);
            r.Disc(sx, sy, 18f, new Color(1f, 0.95f, 0.85f, 0.55f));
        }
    }

    void DrawFar(Raster r, StageDef d)
    {
        var rnd = new System.Random(d.id.GetHashCode());
        switch (d.id)
        {
            case "teastall":
                // treeline + minaret + tin sheds
                for (int i = 0; i < 90; i++)
                {
                    float x = (float)rnd.NextDouble() * TexW;
                    float s = 22f + (float)rnd.NextDouble() * 26f;
                    r.Disc(x, HorizonPx - 4f, s, new Color(0.086f, 0.188f, 0.227f, 1f));
                }
                r.Rect(TexW * 0.60f, HorizonPx - 10f, 14f, 118f, new Color(0.07f, 0.157f, 0.196f, 1f));
                r.Disc(TexW * 0.60f + 7f, HorizonPx + 110f, 12f, new Color(0.07f, 0.157f, 0.196f, 1f));
                for (int j = 0; j < 18; j++)
                {
                    float x = j * (TexW / 17f) + (float)rnd.NextDouble() * 20f;
                    float h = 40f + (float)rnd.NextDouble() * 40f;
                    r.Rect(x, HorizonPx - 10f, 66f, h, new Color(0.113f, 0.227f, 0.266f, 1f));
                    r.Rect(x + 26f, HorizonPx + h - 22f, 9f, 10f, new Color(1f, 0.72f, 0.35f, 0.35f));
                }
                break;

            case "bazar":
                for (int i = 0; i < 26; i++)
                {
                    float x = i * (TexW / 25f) + (float)rnd.NextDouble() * 26f;
                    float h = 60f + (float)rnd.NextDouble() * 120f;
                    r.Rect(x, HorizonPx - 10f, 64f, h, new Color(0.145f, 0.243f, 0.278f, 1f));
                    for (int wy = 0; wy < 4; wy++)
                        for (int wx = 0; wx < 3; wx++)
                            if (rnd.NextDouble() > 0.45)
                                r.Rect(x + 10f + wx * 18f, HorizonPx + 10f + wy * 22f, 9f, 12f,
                                       new Color(1f, 0.95f, 0.8f, 0.13f));
                }
                break;

            case "itbhata":
                for (int i = 0; i < 6; i++)
                {
                    float x = TexW * 0.08f + i * TexW * 0.17f;
                    float h = 150f + (float)rnd.NextDouble() * 90f;
                    r.Rect(x, HorizonPx - 10f, 40f, h, new Color(0.29f, 0.16f, 0.11f, 1f));
                    r.Rect(x - 6f, HorizonPx + h - 10f, 52f, 12f, new Color(0.29f, 0.16f, 0.11f, 1f));
                    for (int s = 0; s < 4; s++)
                        r.Disc(x + 20f + (float)Math.Sin(s * 1.7f) * 16f, HorizonPx + h + 20f + s * 26f,
                               18f + s * 8f, new Color(0.22f, 0.14f, 0.10f, 0.22f));
                }
                for (int b = 0; b < 7; b++)
                    r.Rect(TexW * 0.04f + b * TexW * 0.14f, HorizonPx - 10f, 100f, 70f + (b % 3) * 20f,
                           new Color(0.36f, 0.21f, 0.14f, 1f));
                break;

            case "rickshaw":
                for (int i = 0; i < 30; i++)
                {
                    float x = i * (TexW / 29f) + (float)rnd.NextDouble() * 22f;
                    float h = 70f + (float)rnd.NextDouble() * 150f;
                    r.Rect(x, HorizonPx - 10f, 58f, h, new Color(0.086f, 0.133f, 0.176f, 1f));
                    for (int wy = 0; wy < 6; wy++)
                        for (int wx = 0; wx < 3; wx++)
                            if (rnd.NextDouble() > 0.5)
                            {
                                bool warm = rnd.NextDouble() > 0.45;
                                r.Rect(x + 8f + wx * 17f, HorizonPx + 8f + wy * 22f, 9f, 12f,
                                       warm ? new Color(1f, 0.82f, 0.47f, 0.7f) : new Color(0.47f, 0.78f, 1f, 0.45f));
                            }
                }
                break;

            case "akhra":
                r.Rect(0, HorizonPx - 26f, TexW, 40f, new Color(0.16f, 0.09f, 0.13f, 1f));
                for (int i = 0; i < 240; i++)
                {
                    float x = (float)rnd.NextDouble() * TexW;
                    float y = HorizonPx - 10f + (float)rnd.NextDouble() * 26f;
                    r.Disc(x, y, 4f + (float)rnd.NextDouble() * 3f, new Color(0.10f, 0.06f, 0.08f, 0.95f));
                }
                for (int t = 0; t < 10; t++)
                {
                    float x = 60f + t * (TexW / 9.6f);
                    r.Rect(x, HorizonPx - 6f, 6f, 120f, new Color(0.16f, 0.10f, 0.08f, 1f));
                    r.SoftGlow(x + 3f, HorizonPx + 118f, 42f, new Color(1f, 0.6f, 0.2f, 0.5f), 8);
                    r.Disc(x + 3f, HorizonPx + 118f, 7f, new Color(1f, 0.72f, 0.3f, 0.95f));
                }
                break;

            case "rooftop":
                for (int i = 0; i < 44; i++)
                {
                    float x = i * (TexW / 43f) + (float)rnd.NextDouble() * 18f;
                    float h = 30f + (float)rnd.NextDouble() * 140f;
                    r.Rect(x, HorizonPx - 30f, 40f, h, new Color(0.051f, 0.067f, 0.098f, 1f));
                    for (int wy = 0; wy < 8; wy++)
                        for (int wx = 0; wx < 2; wx++)
                            if (rnd.NextDouble() > 0.66)
                                r.Rect(x + 6f + wx * 16f, HorizonPx - 22f + wy * 18f, 7f, 9f,
                                       new Color(0.70f, 0.82f, 1f, 0.45f));
                }
                break;
        }
    }

    void DrawMid(Raster r, StageDef d)
    {
        var rnd = new System.Random(d.id.GetHashCode() + 77);
        switch (d.id)
        {
            case "teastall": TeaStall(r, rnd); break;
            case "bazar": Bazar(r, rnd); break;
            case "itbhata": Itbhata(r, rnd); break;
            case "rickshaw": Rickshaw(r, rnd); break;
            case "akhra": Akhra(r, rnd); break;
            case "rooftop": Rooftop(r, rnd); break;
        }
    }

    /* ---------- 1. tea stall ---------- */
    void TeaStall(Raster r, System.Random rnd)
    {
        Color wall = new Color(0.29f, 0.20f, 0.165f, 1f);
        int wallTop = HorizonPx + 30;
        r.Rect(0, HorizonPx - 40, TexW, wallTop - HorizonPx + 40, wall);
        // brick courses
        Color joint = new Color(0, 0, 0, 0.16f);
        for (int y = HorizonPx - 40; y < wallTop; y += 9)
        {
            r.Rect(0, y, TexW, 1.2f, joint);
            int off = ((y / 9) % 2 == 0) ? 0 : 13;
            for (int x = off; x < TexW; x += 26) r.Rect(x, y, 1.2f, 9f, joint);
        }
        for (int i = 0; i < 220; i++)
        {
            float x = (float)rnd.NextDouble() * TexW;
            float y = HorizonPx - 40 + (float)rnd.NextDouble() * (wallTop - HorizonPx + 40);
            r.Rect(x, y, 24f, 8f, rnd.NextDouble() > 0.5f ? new Color(1f, 0.72f, 0.55f, 0.045f) : new Color(0, 0, 0, 0.09f));
        }
        // warm rim on the wall top
        r.VGrad(0, wallTop - 18, TexW, 18, new Color(1f, 0.75f, 0.47f, 0f), new Color(1f, 0.75f, 0.47f, 0.22f));

        // painted advert
        r.Rect(TexW * 0.02f, HorizonPx + 4, 110f, 60f, new Color(0.82f, 0.70f, 0.47f, 0.13f));
        r.Rect(TexW * 0.02f + 14f, HorizonPx + 28f, 26f, 22f, new Color(0.94f, 0.88f, 0.74f, 0.30f));
        r.Rect(TexW * 0.02f + 14f, HorizonPx + 12f, 70f, 8f, new Color(0.94f, 0.88f, 0.74f, 0.22f));

        // burnt stall
        float bx = TexW * 0.235f;
        r.SoftGlow(bx + 105f, HorizonPx + 60f, 170f, new Color(0.05f, 0.03f, 0.02f, 0.85f), 10);
        r.Rect(bx, HorizonPx - 40f, 200f, 128f, new Color(0.10f, 0.07f, 0.05f, 1f));
        r.Rect(bx + 8f, HorizonPx - 32f, 184f, 120f, new Color(0.06f, 0.04f, 0.03f, 1f));
        r.Rect(bx - 14f, HorizonPx + 84f, 230f, 13f, new Color(0.17f, 0.13f, 0.10f, 1f));
        r.Rect(bx - 2f, HorizonPx - 40f, 10f, 128f, new Color(0.08f, 0.055f, 0.04f, 1f));
        r.Rect(bx + 190f, HorizonPx - 40f, 10f, 128f, new Color(0.08f, 0.055f, 0.04f, 1f));
        r.Rect(bx + 94f, HorizonPx - 40f, 8f, 128f, new Color(0.08f, 0.055f, 0.04f, 1f));
        // kettle
        r.Line(bx + 98f, HorizonPx + 84f, bx + 98f, HorizonPx + 54f, 1.6f, new Color(0.05f, 0.04f, 0.03f, 1f));
        r.Disc(bx + 98f, HorizonPx + 46f, 12f, new Color(0.25f, 0.18f, 0.12f, 1f));
        r.Line(bx + 108f, HorizonPx + 50f, bx + 124f, HorizonPx + 58f, 2.4f, new Color(0.25f, 0.18f, 0.12f, 1f));
        // bench
        r.Rect(bx + 26f, HorizonPx - 10f, 120f, 7f, new Color(0.30f, 0.22f, 0.15f, 1f));
        r.Rect(bx + 34f, HorizonPx - 40f, 6f, 30f, new Color(0.30f, 0.22f, 0.15f, 1f));
        r.Rect(bx + 132f, HorizonPx - 40f, 6f, 30f, new Color(0.30f, 0.22f, 0.15f, 1f));

        // neighbour shops
        for (int k = 0; k < 7; k++)
        {
            float x = TexW * 0.48f + k * 150f;
            r.Rect(x, HorizonPx - 40f, 120f, 132f, k % 2 == 0 ? new Color(0.23f, 0.23f, 0.17f, 1f) : new Color(0.20f, 0.23f, 0.18f, 1f));
            r.Rect(x + 14f, HorizonPx + 10f, 42f, 40f, new Color(1f, 0.78f, 0.47f, 0.20f));
            r.Disc(x + 92f, HorizonPx + 44f, 4f, new Color(1f, 0.86f, 0.59f, 0.55f));
            r.Rect(x - 12f, HorizonPx + 88f, 144f, 12f, k % 2 == 0 ? new Color(0.42f, 0.35f, 0.23f, 1f) : new Color(0.36f, 0.31f, 0.25f, 1f));
        }
        // bamboo
        for (int b = 0; b < 7; b++)
        {
            float x = TexW * 0.93f + b * 9f;
            r.Curve(x, HorizonPx - 40f, x + 12f, HorizonPx + 90f, x + 24f, HorizonPx + 170f, 4.5f,
                    b % 2 == 0 ? new Color(0.25f, 0.32f, 0.19f, 1f) : new Color(0.20f, 0.27f, 0.16f, 1f));
        }
        // power lines
        r.Curve(0, HorizonPx + 150f, TexW * 0.5f, HorizonPx + 110f, TexW, HorizonPx + 138f, 1.8f, new Color(0.05f, 0.04f, 0.03f, 0.6f));
    }

    /* ---------- 2. bazar ---------- */
    void Bazar(Raster r, System.Random rnd)
    {
        Color[] cols = {
            new Color(0.75f,0.22f,0.17f), new Color(0.18f,0.53f,0.76f),
            new Color(0.83f,0.67f,0.05f), new Color(0.15f,0.68f,0.38f),
            new Color(0.49f,0.24f,0.60f), new Color(0.90f,0.49f,0.13f)
        };
        for (int t = 0; t < 18; t++)
        {
            float x = t * 118f - 30f;
            float w = 132f;
            Color c = cols[t % cols.Length];
            // shadow
            r.Rect(x + 4f, HorizonPx + 18f, w, 26f, new Color(0, 0, 0, 0.22f));
            // cloth
            r.Rect(x, HorizonPx + 42f, w, 26f, c);
            r.Rect(x + w * 0.42f, HorizonPx + 42f, w * 0.14f, 26f, new Color(0.96f, 0.93f, 0.85f, 0.45f));
            // poles
            r.Rect(x + 6f, HorizonPx - 40f, 5f, 84f, new Color(0.35f, 0.28f, 0.19f, 1f));
            r.Rect(x + w - 10f, HorizonPx - 40f, 5f, 84f, new Color(0.35f, 0.28f, 0.19f, 1f));
        }
        // crates of produce
        for (int k = 0; k < 34; k++)
        {
            float x = k * 62f + (float)rnd.NextDouble() * 20f;
            float y = HorizonPx - 30f;
            r.Rect(x, y, 40f, 24f, new Color(0.54f, 0.42f, 0.23f, 1f));
            Color fruit = new Color[] {
                new Color(0.85f,0.31f,0.17f), new Color(0.25f,0.62f,0.30f),
                new Color(0.88f,0.72f,0.19f), new Color(0.61f,0.35f,0.71f)
            }[k % 4];
            for (int p = 0; p < 6; p++)
                r.Disc(x + 7f + (p % 3) * 13f, y + 8f + (p / 3) * 9f, 4f, fruit);
        }
        // bulb string
        for (int b = 0; b < 30; b++)
        {
            float x = b * (TexW / 29f);
            float y = HorizonPx + 66f + (float)Math.Sin(b / 29f * 3.1416f) * -14f;
            r.SoftGlow(x, y, 16f, new Color(1f, 0.9f, 0.6f, 0.28f), 5);
            r.Disc(x, y, 3.2f, new Color(1f, 0.93f, 0.68f, 0.9f));
        }
        // CNG auto-rickshaw
        float rx = TexW * 0.655f, ry = HorizonPx - 34f;
        Color body = new Color(0.13f, 0.19f, 0.12f, 1f);
        r.Rect(rx, ry, 78f, 56f, body);
        r.Rect(rx + 6f, ry + 50f, 66f, 26f, body);
        r.Rect(rx + 12f, ry + 54f, 48f, 18f, new Color(0.59f, 0.78f, 0.86f, 0.28f));
        r.Disc(rx + 16f, ry, 12f, new Color(0.08f, 0.11f, 0.08f, 1f));
        r.Disc(rx + 60f, ry, 12f, new Color(0.08f, 0.11f, 0.08f, 1f));
    }

    /* ---------- 3. brick field ---------- */
    void Itbhata(Raster r, System.Random rnd)
    {
        // kiln body
        float kx = TexW * 0.80f;
        r.Rect(kx, HorizonPx - 40f, 240f, 150f, new Color(0.56f, 0.23f, 0.14f, 1f));
        r.Disc(kx + 120f, HorizonPx + 70f, 34f, new Color(0.37f, 0.14f, 0.09f, 1f));
        r.SoftGlow(kx + 120f, HorizonPx + 70f, 26f, new Color(1f, 0.55f, 0.16f, 0.75f), 7);
        r.Disc(kx + 120f, HorizonPx + 70f, 16f, new Color(1f, 0.66f, 0.24f, 0.9f));

        // brick stacks
        BrickStack(r, TexW * 0.06f, HorizonPx - 36f, 7, 6);
        BrickStack(r, TexW * 0.30f, HorizonPx - 36f, 10, 5);
        BrickStack(r, TexW * 0.50f, HorizonPx - 36f, 5, 4);
        BrickStack(r, TexW * 0.66f, HorizonPx - 36f, 8, 7);

        // wheelbarrow
        float wx = TexW * 0.44f;
        r.Disc(wx, HorizonPx - 32f, 12f, new Color(0.23f, 0.16f, 0.12f, 1f));
        r.Rect(wx - 6f, HorizonPx - 22f, 48f, 20f, new Color(0.29f, 0.35f, 0.23f, 1f));
    }

    void BrickStack(Raster r, float x, float y, int rows, int cols)
    {
        Color[] cs = {
            new Color(0.64f,0.27f,0.17f), new Color(0.72f,0.33f,0.21f),
            new Color(0.56f,0.23f,0.14f), new Color(0.76f,0.37f,0.24f)
        };
        for (int row = 0; row < rows; row++)
            for (int k = 0; k < cols; k++)
            {
                float off = (row % 2) * 10f;
                r.Rect(x + k * 20f + off, y + row * 12f, 18f, 10f, cs[(row * cols + k) % 4]);
            }
    }

    /* ---------- 4. rickshaw stand ---------- */
    void Rickshaw(Raster r, System.Random rnd)
    {
        // medicine shop neon
        r.Rect(TexW * 0.04f, HorizonPx - 40f, 210f, 150f, new Color(0.08f, 0.11f, 0.15f, 1f));
        r.SoftGlow(TexW * 0.04f + 100f, HorizonPx + 82f, 70f, new Color(1f, 0.31f, 0.67f, 0.35f), 8);
        r.Rect(TexW * 0.04f + 16f, HorizonPx + 66f, 178f, 26f, new Color(1f, 0.31f, 0.67f, 0.85f));
        r.Rect(TexW * 0.04f + 22f, HorizonPx - 30f, 166f, 82f, new Color(0.16f, 0.06f, 0.11f, 1f));

        // parked rickshaws
        RickshawProp(r, TexW * 0.24f, HorizonPx - 40f, 1.0f, new Color(0.48f, 0.12f, 0.23f, 1f));
        RickshawProp(r, TexW * 0.52f, HorizonPx - 40f, 0.92f, new Color(0.12f, 0.29f, 0.35f, 1f));
        RickshawProp(r, TexW * 0.86f, HorizonPx - 40f, 1.05f, new Color(0.23f, 0.16f, 0.35f, 1f));

        // wet sheen
        r.Rect(0, 0, TexW, HorizonPx - 40f, new Color(0.24f, 0.55f, 0.75f, 0.10f));
    }

    void RickshawProp(Raster r, float x, float y, float sc, Color col)
    {
        Color dark = new Color(col.r * 0.7f, col.g * 0.7f, col.b * 0.7f, 1f);
        // hood
        for (int i = 0; i < 9; i++)
        {
            float t = i / 8f;
            float h = Mathf.Sin(t * Mathf.PI) * 92f * sc;
            r.Rect(x + t * 104f * sc, y + 8f * sc, 13f * sc, h, i < 2 || i > 6 ? dark : col);
        }
        r.Rect(x + 16f * sc, y + 6f * sc, 74f * sc, 40f * sc, dark);
        r.Disc(x + 22f * sc, y + 6f * sc, 17f * sc, new Color(0.05f, 0.07f, 0.09f, 1f));
        r.Disc(x + 88f * sc, y + 6f * sc, 17f * sc, new Color(0.05f, 0.07f, 0.09f, 1f));
    }

    /* ---------- 5. boli khela akhra ---------- */
    void Akhra(Raster r, System.Random rnd)
    {
        // crowd: three rows of head + shoulders
        for (int row = 0; row < 3; row++)
        {
            Color c = new Color(0.10f + row * 0.02f, 0.07f + row * 0.015f, 0.09f + row * 0.015f, 0.96f);
            for (int k = 0; k < 76; k++)
            {
                float x = k * (TexW / 74f) + (row % 2) * 10f + (float)Math.Sin(k * 3.7f + row) * 3f;
                float y = HorizonPx - 6f + row * 24f;
                float rr = 7f + ((k * 7 + row * 3) % 3);
                r.Disc(x, y, rr, c);
                r.Rect(x - rr - 2f, y - 26f, (rr + 2f) * 2f, 24f, c);
                // warm rim
                r.Disc(x + rr * 0.35f, y + rr * 0.55f, rr * 0.5f, new Color(1f, 0.66f, 0.35f, 0.10f));
            }
        }
        // bunting
        for (int f = 0; f < 3; f++)
        {
            float y0 = HorizonPx + 110f + f * 20f;
            for (int fl = 0; fl < 44; fl++)
            {
                float x = fl * (TexW / 43f);
                float y = y0 - Mathf.Sin(fl / 43f * Mathf.PI) * 34f;
                Color c = f == 0 ? new Color(0.75f, 0.22f, 0.17f)
                        : f == 1 ? new Color(0.88f, 0.63f, 0.19f)
                                 : new Color(0.18f, 0.53f, 0.76f);
                r.Disc(x, y, 5.5f, new Color(c.r, c.g, c.b, 0.72f));
            }
        }
        // drummers
        for (int d = 0; d < 3; d++)
        {
            float x = TexW * (0.2f + d * 0.3f), y = HorizonPx - 36f;
            r.Disc(x, y + 62f, 11f, new Color(0.10f, 0.07f, 0.09f, 1f));
            r.Rect(x - 13f, y, 26f, 58f, new Color(0.10f, 0.07f, 0.09f, 1f));
            r.Disc(x + 24f, y + 30f, 15f, new Color(0.54f, 0.16f, 0.14f, 1f));
            r.Disc(x + 24f, y + 30f, 9f, new Color(0.85f, 0.78f, 0.66f, 1f));
        }
    }

    /* ---------- 6. rooftop ---------- */
    void Rooftop(Raster r, System.Random rnd)
    {
        // parapet
        r.Rect(0, HorizonPx - 40f, TexW, 46f, new Color(0.16f, 0.17f, 0.22f, 1f));
        r.Rect(0, HorizonPx - 4f, TexW, 8f, new Color(0.20f, 0.22f, 0.27f, 1f));
        // water tank
        float tx = TexW * 0.14f;
        r.Rect(tx, HorizonPx + 10f, 140f, 130f, new Color(0.12f, 0.14f, 0.17f, 1f));
        r.Disc(tx + 70f, HorizonPx + 140f, 70f, new Color(0.14f, 0.16f, 0.20f, 1f));
        r.Rect(tx + 18f, HorizonPx - 30f, 5f, 44f, new Color(0.23f, 0.25f, 0.31f, 1f));
        r.Rect(tx + 118f, HorizonPx - 30f, 5f, 44f, new Color(0.23f, 0.25f, 0.31f, 1f));
        // antenna
        float ax = TexW * 0.72f;
        r.Rect(ax, HorizonPx, 4f, 170f, new Color(0.22f, 0.25f, 0.31f, 1f));
        r.Rect(ax - 22f, HorizonPx + 130f, 48f, 4f, new Color(0.22f, 0.25f, 0.31f, 1f));
        r.SoftGlow(ax + 2f, HorizonPx + 174f, 14f, new Color(1f, 0.25f, 0.25f, 0.6f), 6);
        // laundry
        r.Curve(TexW * 0.30f, HorizonPx + 96f, TexW * 0.45f, HorizonPx + 78f, TexW * 0.60f, HorizonPx + 94f, 1.2f, new Color(0.7f, 0.74f, 0.82f, 0.28f));
        Color[] cloth = { new Color(0.75f,0.22f,0.17f,0.5f), new Color(0.91f,0.89f,0.82f,0.5f), new Color(0.18f,0.53f,0.76f,0.5f) };
        for (int i = 0; i < 3; i++)
            r.Rect(TexW * 0.34f + i * 54f, HorizonPx + 54f, 30f, 38f, cloth[i]);
    }

    /* ---------- ground + fore ---------- */
    void DrawGround(Raster r, StageDef d)
    {
        // receding lane
        r.VGrad(0, GroundPx, TexW, HorizonPx - GroundPx, ProcTex.Shade(d.ground, -0.18f), d.ground);
        // near floor
        r.VGrad(0, 0, TexW, GroundPx, ProcTex.Shade(d.groundDark, -0.12f), d.ground);

        var rnd = new System.Random(d.id.GetHashCode() + 5);
        for (int i = 0; i < 130; i++)
        {
            float x = (float)rnd.NextDouble() * TexW;
            float y = (float)rnd.NextDouble() * GroundPx;
            r.Rect(x, y, 2f + (float)rnd.NextDouble() * 20f, 1.4f,
                   rnd.NextDouble() > 0.5 ? new Color(0, 0, 0, 0.16f) : new Color(1f, 0.92f, 0.8f, 0.06f));
        }
        // arena light pool
        r.SoftGlow(TexW * 0.5f, GroundPx * 0.5f, 520f, new Color(1f, 0.88f, 0.66f, 0.16f), 12);
        // horizon shadow line
        r.Rect(0, GroundPx - 2f, TexW, 3f, new Color(0, 0, 0, 0.25f));
    }

    void DrawFore(Raster r, StageDef d)
    {
        Color dark = new Color(0.05f, 0.04f, 0.035f, 0.95f);
        // corner masses so the frame feels enclosed
        r.Disc(-40f, 40f, 150f, dark);
        r.Disc(TexW + 40f, 30f, 160f, dark);
        r.Rect(0, 0, TexW, 12f, new Color(0, 0, 0, 0.35f));
    }
}
