using UnityEngine;

/// <summary>
/// Creates the whole game from an empty scene. Nothing needs to be
/// wired up in the editor — press Play and it runs.
/// </summary>
public static class Bootstrap
{
    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    static void Boot()
    {
        if (Object.FindObjectOfType<GameRoot>() != null) return;

        var go = new GameObject("MostanaderMaramari");
        Object.DontDestroyOnLoad(go);

        // AudioSynth must exist before GameRoot.Awake asks for it
        go.AddComponent<AudioSynth>();
        go.AddComponent<GameRoot>();
    }
}
