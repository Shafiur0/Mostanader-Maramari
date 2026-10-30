using System;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Every sound in the game is synthesised at runtime — no audio files.
/// </summary>
public class AudioSynth : MonoBehaviour
{
    public static AudioSynth I;

    const int SR = 44100;

    AudioSource _sfx;
    AudioSource _music;
    AudioClip _town, _fight, _boss;
    string _current;

    float _rngState = 12345f;

    float Noise()
    {
        _rngState = Mathf.Repeat(_rngState * 16807f, 2147483647f);
        return (_rngState / 2147483647f) * 2f - 1f;
    }

    void Awake()
    {
        I = this;
        _sfx = gameObject.AddComponent<AudioSource>();
        _sfx.playOnAwake = false;
        _sfx.volume = 0.8f;

        _music = gameObject.AddComponent<AudioSource>();
        _music.playOnAwake = false;
        _music.loop = true;
        _music.volume = 0.32f;

        Build();
    }

    /* ------------------------------------------------------------
       clip factory
       ------------------------------------------------------------ */
    static AudioClip Make(string name, float dur, Func<float, int, float> gen)
    {
        int n = Mathf.Max(1, Mathf.CeilToInt(dur * SR));
        var data = new float[n];
        for (int i = 0; i < n; i++) data[i] = Mathf.Clamp(gen(i / (float)SR, i), -1f, 1f);
        var clip = AudioClip.Create(name, n, 1, SR, false);
        clip.SetData(data, 0);
        return clip;
    }

    static float Env(float t, float attack, float decay)
    {
        if (t < 0f) return 0f;
        if (t < attack) return t / attack;
        float d = (t - attack) / decay;
        return d >= 1f ? 0f : (1f - d) * (1f - d);
    }

    AudioClip _whoosh, _hitLight, _hitHeavy, _block, _jump, _land, _ko, _bell, _voice, _click;

    void Build()
    {
        _whoosh = Make("whoosh", 0.25f, (t, i) =>
        {
            float sweep = Mathf.Lerp(420f, 2400f, Mathf.Clamp01(t / 0.13f));
            return Mathf.Sin(2f * Mathf.PI * sweep * t) * 0.28f * Env(t, 0.012f, 0.16f)
                 + Noise() * 0.16f * Env(t, 0.01f, 0.14f);
        });

        _hitLight = Make("hitL", 0.25f, (t, i) =>
        {
            float body = Mathf.Sin(2f * Mathf.PI * (180f * Mathf.Exp(-t * 9f) + 46f) * t) * 0.55f * Env(t, 0.004f, 0.16f);
            return body + Noise() * 0.30f * Env(t, 0.003f, 0.09f);
        });

        _hitHeavy = Make("hitH", 0.35f, (t, i) =>
        {
            float body = Mathf.Sin(2f * Mathf.PI * (140f * Mathf.Exp(-t * 7f) + 34f) * t) * 0.75f * Env(t, 0.004f, 0.22f);
            return body + Noise() * 0.34f * Env(t, 0.003f, 0.12f);
        });

        _block = Make("block", 0.18f, (t, i) =>
        {
            float tick = Mathf.Sin(2f * Mathf.PI * Mathf.Lerp(1100f, 520f, Mathf.Clamp01(t / 0.06f)) * t) * 0.22f * Env(t, 0.002f, 0.07f);
            return tick + Noise() * 0.22f * Env(t, 0.002f, 0.06f);
        });

        _jump = Make("jump", 0.22f, (t, i) =>
            Mathf.Sin(2f * Mathf.PI * Mathf.Lerp(260f, 680f, Mathf.Clamp01(t / 0.12f)) * t) * 0.22f * Env(t, 0.01f, 0.14f));

        _land = Make("land", 0.2f, (t, i) => Noise() * 0.24f * Env(t, 0.003f, 0.10f) * (1f - Mathf.Clamp01(t / 0.1f) * 0.5f));

        _ko = Make("ko", 1.3f, (t, i) =>
        {
            float sweep = Mathf.Sin(2f * Mathf.PI * (120f * Mathf.Exp(-t * 1.6f) + 28f) * t) * 0.55f * Env(t, 0.01f, 1.0f);
            return sweep + Noise() * 0.28f * Env(t, 0.01f, 0.8f);
        });

        _bell = Make("bell", 0.8f, (t, i) =>
        {
            float a = Mathf.Sin(2f * Mathf.PI * 880f * t) * 0.16f;
            float b = Mathf.Sin(2f * Mathf.PI * 1320f * t) * 0.10f;
            float c = Mathf.Sin(2f * Mathf.PI * 1760f * t) * 0.06f;
            return (a + b + c) * Env(t, 0.004f, 0.6f);
        });

        _voice = Make("voice", 0.32f, (t, i) =>
        {
            float f = Mathf.Lerp(150f, 210f, Mathf.Clamp01(t / 0.08f)) * (1f - Mathf.Clamp01((t - 0.08f) / 0.14f) * 0.4f);
            return Mathf.Sign(Mathf.Sin(2f * Mathf.PI * f * t)) * 0.10f * Env(t, 0.01f, 0.26f);
        });

        _click = Make("click", 0.08f, (t, i) =>
            Mathf.Sin(2f * Mathf.PI * Mathf.Lerp(1320f, 880f, Mathf.Clamp01(t / 0.04f)) * t) * 0.10f * Env(t, 0.002f, 0.05f));

        _town = BuildMusic("town", 78f, new float[] { 130.81f, 196f },
            new int[] { 1, 0, 0, 2, 0, 0, 1, 0, 2, 0, 0, 1, 0, 2, 0, 0 },
            new int[] { 0, -1, 3, -1, 2, -1, 0, -1, 4, 3, 2, -1, 0, -1, -1, -1 }, 0);

        _fight = BuildMusic("fight", 96f, new float[] { 98f, 146.83f },
            new int[] { 1, 0, 3, 0, 2, 0, 1, 2, 1, 0, 3, 0, 2, 1, 0, 2 },
            new int[] { 0, -1, 2, 3, -1, 5, 4, -1, 3, 2, -1, 0, -1, 3, 5, 7 }, 1);

        _boss = BuildMusic("boss", 108f, new float[] { 87.31f, 130.81f },
            new int[] { 1, 2, 0, 1, 3, 0, 2, 1, 1, 2, 0, 3, 2, 0, 1, 2 },
            new int[] { 0, 1, 3, -1, 5, 3, 2, 0, -1, 7, 5, 3, -1, 2, 1, 0 }, 2);
    }

    static readonly int[] Scale = { 0, 1, 3, 5, 7, 8, 10, 12, 13, 15, 17, 19 };

    AudioClip BuildMusic(string name, float bpm, float[] drone, int[] pattern, int[] mel, int style)
    {
        float step = 60f / bpm / 4f;       // 16th note
        int bars = 4;
        float dur = step * 16f * bars;
        int n = Mathf.CeilToInt(dur * SR);
        var data = new float[n];

        // ---- drone ----
        for (int i = 0; i < n; i++)
        {
            float t = i / (float)SR;
            float fade = Mathf.Clamp01(t / 0.6f) * Mathf.Clamp01((dur - t) / 0.8f);
            float a = Mathf.Sin(2f * Mathf.PI * drone[0] * t) * 0.10f;
            float b = Mathf.Sin(2f * Mathf.PI * drone[1] * t) * 0.05f;
            data[i] += (a + b) * fade;
        }

        // ---- percussion + melody ----
        for (int bar = 0; bar < bars; bar++)
        {
            for (int st = 0; st < 16; st++)
            {
                float t0 = (bar * 16 + st) * step;
                int p = pattern[st];
                if (p == 1) AddKick(data, t0, 0.30f);
                else if (p == 2) AddTick(data, t0, 0.18f);
                else if (p == 3) AddKick(data, t0, 0.16f);

                if (style == 2 && st % 8 == 0) AddTick(data, t0, 0.22f);

                int mi = mel[st];
                if (mi >= 0 && bar % 2 == (st < 8 ? 0 : 1))
                {
                    float root = drone[0] * 4f;
                    int semi = Scale[Mathf.Min(mi, Scale.Length - 1)];
                    AddNote(data, t0, root * Mathf.Pow(2f, semi / 12f), step * 2.4f, 0.075f);
                }
            }
        }

        var clip = AudioClip.Create("music_" + name, n, 1, SR, false);
        clip.SetData(data, 0);
        return clip;
    }

    void AddKick(float[] data, float t0, float amp)
    {
        int start = Mathf.FloorToInt(t0 * SR);
        int len = Mathf.FloorToInt(0.2f * SR);
        for (int i = 0; i < len; i++)
        {
            int idx = start + i;
            if (idx < 0 || idx >= data.Length) break;
            float t = i / (float)SR;
            float f = 150f * Mathf.Exp(-t * 18f) + 60f;
            data[idx] += Mathf.Sin(2f * Mathf.PI * f * t) * amp * Mathf.Exp(-t * 16f);
        }
    }

    void AddTick(float[] data, float t0, float amp)
    {
        int start = Mathf.FloorToInt(t0 * SR);
        int len = Mathf.FloorToInt(0.09f * SR);
        for (int i = 0; i < len; i++)
        {
            int idx = start + i;
            if (idx < 0 || idx >= data.Length) break;
            float t = i / (float)SR;
            float noise = Mathf.Sin(2f * Mathf.PI * 2600f * t);
            data[idx] += noise * amp * Mathf.Exp(-t * 55f);
        }
    }

    void AddNote(float[] data, float t0, float freq, float dur, float amp)
    {
        int start = Mathf.FloorToInt(t0 * SR);
        int len = Mathf.FloorToInt(dur * SR);
        for (int i = 0; i < len; i++)
        {
            int idx = start + i;
            if (idx < 0 || idx >= data.Length) break;
            float t = i / (float)SR;
            float vib = Mathf.Sin(2f * Mathf.PI * 5.2f * t) * 0.004f * freq;
            float env = Mathf.Min(1f, t / 0.05f) * Mathf.Exp(-t * 2.4f);
            data[idx] += (Mathf.Sin(2f * Mathf.PI * (freq + vib) * t) * 0.7f
                        + Mathf.Sin(2f * Mathf.PI * (freq + vib) * 2f * t) * 0.15f) * amp * env;
        }
    }

    /* ------------------------------------------------------------
       playback
       ------------------------------------------------------------ */
    void Play(AudioClip c, float vol)
    {
        if (c == null || _sfx == null) return;
        _sfx.PlayOneShot(c, vol);
    }

    public void Whoosh(float v) { Play(_whoosh, v); }
    public void HitLight() { Play(_hitLight, 0.9f); }
    public void HitHeavy() { Play(_hitHeavy, 1f); }
    public void Block() { Play(_block, 0.8f); }
    public void Jump() { Play(_jump, 0.6f); }
    public void Land() { Play(_land, 0.5f); }
    public void Ko() { Play(_ko, 1f); }
    public void Bell() { Play(_bell, 0.9f); }
    public void Voice(float pitch) { Play(_voice, 0.7f); }
    public void Click() { Play(_click, 0.7f); }

    public void Music(string name)
    {
        if (_current == name || _music == null) return;
        _current = name;
        AudioClip c = name == "town" ? _town : (name == "boss" ? _boss : _fight);
        if (c == null) return;
        _music.clip = c;
        _music.Play();
    }

    public void StopMusic()
    {
        _current = null;
        if (_music != null) _music.Stop();
    }

    public void SetMusicVolume(float v)
    {
        if (_music != null) _music.volume = Mathf.Clamp01(v) * 0.5f;
    }

    public void SetMasterVolume(float v)
    {
        AudioListener.volume = Mathf.Clamp01(v);
    }
}
