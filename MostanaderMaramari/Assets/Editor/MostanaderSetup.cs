#if UNITY_EDITOR
using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

/// <summary>
/// Editor conveniences. The game builds itself at runtime, so all this does
/// is make sure a scene exists and is registered in the build settings.
/// </summary>
public static class MostanaderSetup
{
    const string ScenePath = "Assets/Scenes/Main.unity";

    [MenuItem("Mostanader Maramari/Open Main Scene", false, 1)]
    public static void OpenMainScene()
    {
        if (!File.Exists(ScenePath)) CreateScene();
        EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo();
        EditorSceneManager.OpenScene(ScenePath);
        Debug.Log("[Mostanader Maramari] Main scene open. Press Play.");
    }

    [MenuItem("Mostanader Maramari/Register Scene In Build Settings", false, 2)]
    public static void RegisterScene()
    {
        if (!File.Exists(ScenePath)) CreateScene();
        var list = new List<EditorBuildSettingsScene>(EditorBuildSettings.scenes);
        bool found = false;
        for (int i = 0; i < list.Count; i++)
            if (list[i].path == ScenePath) { list[i] = new EditorBuildSettingsScene(ScenePath, true); found = true; }
        if (!found) list.Insert(0, new EditorBuildSettingsScene(ScenePath, true));
        EditorBuildSettings.scenes = list.ToArray();
        Debug.Log("[Mostanader Maramari] Scene registered in Build Settings.");
    }

    [MenuItem("Mostanader Maramari/Create Fresh Main Scene", false, 3)]
    public static void CreateScene()
    {
        if (!Directory.Exists("Assets/Scenes")) Directory.CreateDirectory("Assets/Scenes");
        var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
        EditorSceneManager.SaveScene(scene, ScenePath);
        AssetDatabase.Refresh();
        RegisterScene();
    }
}
#endif
