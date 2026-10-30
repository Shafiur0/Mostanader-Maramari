using UnityEngine;

/// <summary>One frame of intent, shared by the player and the AI.</summary>
public struct InputState
{
    public bool left, right, up, down;
    public bool lp, hp, kick, special, super;
    public bool lpPressed, hpPressed, kickPressed, specialPressed, superPressed;

    public static InputState None { get { return new InputState(); } }
}

public static class InputMap
{
    public static InputState Player()
    {
        var i = new InputState();
        i.left = Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow);
        i.right = Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow);
        i.down = Input.GetKey(KeyCode.S) || Input.GetKey(KeyCode.DownArrow);
        i.up = Input.GetKeyDown(KeyCode.W) || Input.GetKeyDown(KeyCode.UpArrow);

        i.lp = Input.GetKey(KeyCode.J);
        i.hp = Input.GetKey(KeyCode.K);
        i.kick = Input.GetKey(KeyCode.L);
        i.special = Input.GetKey(KeyCode.U);
        i.super = Input.GetKey(KeyCode.I);

        i.lpPressed = Input.GetKeyDown(KeyCode.J);
        i.hpPressed = Input.GetKeyDown(KeyCode.K);
        i.kickPressed = Input.GetKeyDown(KeyCode.L);
        i.specialPressed = Input.GetKeyDown(KeyCode.U);
        i.superPressed = Input.GetKeyDown(KeyCode.I);
        return i;
    }

    public static bool PausePressed()
    {
        return Input.GetKeyDown(KeyCode.Escape);
    }

    public static bool ConfirmPressed()
    {
        return Input.GetKeyDown(KeyCode.Space) || Input.GetKeyDown(KeyCode.Return) || Input.GetKeyDown(KeyCode.KeypadEnter);
    }

    public static bool AnyPressed()
    {
        return Input.anyKeyDown;
    }
}
