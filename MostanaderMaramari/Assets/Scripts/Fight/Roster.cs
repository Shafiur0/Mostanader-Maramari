using System.Collections.Generic;
using UnityEngine;

/* ============================================================
   ROSTER, STAGES, STORY — the whole content database.
   ============================================================ */

public class MoveDef
{
    public string key, label, anim;
    public int startup, active, recovery;
    public float dmg, reach, chip, kb, meter;
    public string height;          // "high" | "mid" | "low"
    public int hitstun, blockstun, hitstop;
    public bool armour;
    public bool unblockable;
}

public class FighterDef
{
    public string id, name, role, bio;
    public Color skin, skinShade, hair, top, topDark, bottom, bottomDark, accent, belt, shoe;
    public float buildW = 1f, buildH = 1f, headScale = 1f, shoulder = 1f;
    public float walk = 2.15f, jump = 7.2f, weight = 1f, maxHp = 100f;
    public string specialName, superName;
    public MoveDef special;
    public float superDmg;
    public int superHits;
    public string hairStyle = "short";
    public bool moustache, shades, hasLathi;
    public bool bareChest;
}

public class StageDef
{
    public string id, name, sub;
    public Color sky0, sky1, sky2, sky3, ground, groundDark, fog;
    public string weather, tint;
}

public class Line
{
    public string who, text;
    public Line(string w, string t) { who = w; text = t; }
}

public class Difficulty
{
    public float react, aggr, block, special, antiAir;
    public string label;
    public Difficulty(float r, float a, float b, float s, float aa, string l)
    {
        react = r; aggr = a; block = b; special = s; antiAir = aa; label = l;
    }
}

public class ChapterDef
{
    public int n;
    public string id, stage, opponent, title, music;
    public Difficulty diff;
    public Line[] intro, outro;
}

public static class Roster
{
    public const int WorldWidth = 17;      // world units (fighter is 2 tall)
    public const float ArenaLeft = 1.4f;
    public const float ArenaRight = 15.6f;
    public const float GroundY = 0f;

    public static readonly List<string> Order = new List<string> {
        "mostafa","kalachan","bappi","jontu","salma","rustom","chairman"
    };

    public static readonly Dictionary<string, FighterDef> Fighters = new Dictionary<string, FighterDef>();
    public static readonly Dictionary<string, StageDef> Stages = new Dictionary<string, StageDef>();
    public static readonly List<string> StageOrder = new List<string> {
        "teastall","bazar","itbhata","rickshaw","akhra","rooftop"
    };
    public static readonly List<ChapterDef> Chapters = new List<ChapterDef>();

    public static readonly Dictionary<string, MoveDef> BaseMoves = new Dictionary<string, MoveDef>();

    static bool _init;

    public static void Init()
    {
        if (_init) return;
        _init = true;
        BuildMoves();
        BuildFighters();
        BuildStages();
        BuildStory();
    }

    static MoveDef M(string key, string label, string anim, int su, int ac, int rc,
                     float dmg, float reach, string height, int hs, int bs, int stop,
                     float kb, float meter, float chip)
    {
        var m = new MoveDef();
        m.key = key; m.label = label; m.anim = anim;
        m.startup = su; m.active = ac; m.recovery = rc;
        m.dmg = dmg; m.reach = reach; m.height = height;
        m.hitstun = hs; m.blockstun = bs; m.hitstop = stop;
        m.kb = kb; m.meter = meter; m.chip = chip;
        return m;
    }

    static void BuildMoves()
    {
        BaseMoves["lp"] = M("lp", "Jab", "punchL", 4, 3, 7, 4f, 0.66f, "mid", 12, 8, 5, 0.7f, 6f, 0.10f);
        BaseMoves["hp"] = M("hp", "Heavy", "punchH", 9, 4, 17, 9f, 0.78f, "mid", 19, 11, 8, 1.9f, 11f, 0.14f);
        BaseMoves["kick"] = M("kick", "Kick", "kick", 7, 4, 14, 7f, 0.88f, "high", 16, 9, 7, 1.5f, 9f, 0.12f);
        BaseMoves["low"] = M("low", "Low", "kickLow", 5, 3, 11, 5f, 0.74f, "low", 14, 8, 5, 0.9f, 7f, 0.10f);
        BaseMoves["jumpAtk"] = M("jumpAtk", "Jump", "jumpAtk", 4, 8, 4, 8f, 0.74f, "high", 18, 10, 7, 1.3f, 9f, 0.14f);
    }

    static FighterDef F(string id, string name, string role, string bio,
                        string skin, string skinS, string hair, string top, string topD,
                        string bottom, string bottomD, string accent, string belt, string shoe)
    {
        var f = new FighterDef();
        f.id = id; f.name = name; f.role = role; f.bio = bio;
        f.skin = ProcTex.Hex(skin); f.skinShade = ProcTex.Hex(skinS);
        f.hair = ProcTex.Hex(hair);
        f.top = ProcTex.Hex(top); f.topDark = ProcTex.Hex(topD);
        f.bottom = ProcTex.Hex(bottom); f.bottomDark = ProcTex.Hex(bottomD);
        f.accent = ProcTex.Hex(accent); f.belt = ProcTex.Hex(belt); f.shoe = ProcTex.Hex(shoe);
        return f;
    }

    static MoveDef Special(string name, int su, int ac, int rc, float dmg, float reach,
                           string height, int hs, int bs, int stop, float kb, float chip, string anim)
    {
        var m = M("special", name, anim, su, ac, rc, dmg, reach, height, hs, bs, stop, kb, 0f, chip);
        return m;
    }

    static void BuildFighters()
    {
        var f = F("mostafa", "MOSTAFA", "Returned from Dhaka",
            "Came home for his sister's wedding. Found the town up for sale instead.",
            "#a9714b", "#8b5a3a", "#171310", "#2f5578", "#1f3b55",
            "#d8c7a4", "#b8a37c", "#c0392b", "#7a5230", "#3b2f26");
        f.maxHp = 100f; f.walk = 2.15f; f.jump = 7.2f;
        f.specialName = "GAMCHA GURAI"; f.superName = "NABINPUR BIDROHO";
        f.special = Special("GAMCHA GURAI", 12, 26, 20, 6.5f, 0.96f, "mid", 16, 12, 6, 1.2f, 0.16f, "spin");
        f.superDmg = 34f; f.superHits = 5;
        Fighters[f.id] = f;

        f = F("kalachan", "KALA CHAN", "Local goon",
            "Collects chanda from every shop on the lane. Never fights fair.",
            "#8d5a3b", "#70452c", "#0f0d0b", "#22222a", "#15151b",
            "#3d3d46", "#2c2c34", "#8e44ad", "#1a1a1a", "#2b2b2b");
        f.maxHp = 95f; f.walk = 2.4f; f.jump = 7.4f; f.weight = 0.9f;
        f.buildW = 0.94f; f.buildH = 0.97f;
        f.specialName = "CHORUI CHAPA"; f.superName = "GOLI RASH";
        f.special = Special("CHORUI CHAPA", 9, 18, 22, 5.5f, 1.04f, "mid", 15, 10, 6, 1.0f, 0.14f, "dashStab");
        f.superDmg = 28f; f.superHits = 4;
        Fighters[f.id] = f;

        f = F("bappi", "BAPPI BHAI", "Land broker",
            "Signs the shopkeepers' thumbprints. Keeps a lathi in the ledger bag.",
            "#b07a52", "#8f5f3d", "#1c1712", "#ece6d6", "#cfc7b4",
            "#9aa9b5", "#7b8a96", "#c9a227", "#6b5433", "#2a2018");
        f.maxHp = 105f; f.walk = 1.95f; f.jump = 6.9f; f.weight = 1.1f;
        f.buildW = 1.02f; f.buildH = 1.02f;
        f.hasLathi = true;
        f.specialName = "LATHI BARI"; f.superName = "DOLIL BONDHO";
        f.special = Special("LATHI BARI", 15, 12, 24, 8f, 1.32f, "high", 22, 14, 9, 2.2f, 0.18f, "swingStick");
        f.superDmg = 31f; f.superHits = 3;
        Fighters[f.id] = f;

        f = F("jontu", "JONTU", "Brick-field strongman",
            "Carries forty bricks a trip. Has never lost a fight in the clay pit.",
            "#7d4c2e", "#5f3820", "#100c09", "#7d4c2e", "#5f3820",
            "#c96f3a", "#a3542a", "#c0392b", "#4a2f1c", "#2e2119");
        f.maxHp = 118f; f.walk = 1.68f; f.jump = 6.2f; f.weight = 1.45f;
        f.buildW = 1.22f; f.buildH = 1.09f; f.shoulder = 1.22f; f.headScale = 1.05f;
        f.hairStyle = "bald"; f.moustache = true; f.bareChest = true;
        f.specialName = "IT KUTHAR"; f.superName = "BHATAR AGUN";
        f.special = Special("IT KUTHAR", 19, 10, 26, 13f, 0.92f, "high", 26, 16, 12, 2.6f, 0.22f, "slam");
        f.special.armour = true;
        f.superDmg = 38f; f.superHits = 3;
        Fighters[f.id] = f;

        f = F("salma", "SALMA", "Chairman's bodyguard",
            "Black belt, clean fighter. The only one in the gang who tells the truth.",
            "#b98457", "#98673f", "#120e0b", "#f2eee4", "#d8d2c4",
            "#f2eee4", "#d8d2c4", "#a83232", "#a83232", "#b98457");
        f.maxHp = 96f; f.walk = 2.5f; f.jump = 7.8f; f.weight = 0.85f;
        f.buildW = 0.88f; f.buildH = 0.96f; f.shoulder = 0.86f;
        f.hairStyle = "pony";
        f.specialName = "DUI LATHI KICK"; f.superName = "SHOTTO KARATE";
        f.special = Special("DUI LATHI KICK", 10, 22, 18, 6f, 0.98f, "high", 17, 11, 6, 1.1f, 0.14f, "doubleKick");
        f.superDmg = 30f; f.superHits = 4;
        Fighters[f.id] = f;

        f = F("rustom", "RUSTOM", "Boli khela champion",
            "Twelve years undefeated in the akhra. Bought for one night only.",
            "#8a5a34", "#6b4224", "#140f0b", "#8a5a34", "#6b4224",
            "#a83232", "#7d2222", "#d4af37", "#d4af37", "#3a2a1e");
        f.maxHp = 112f; f.walk = 1.85f; f.jump = 6.4f; f.weight = 1.35f;
        f.buildW = 1.24f; f.buildH = 1.02f; f.shoulder = 1.26f; f.headScale = 1.06f;
        f.moustache = true; f.bareChest = true;
        f.specialName = "BOLI DHAP"; f.superName = "AKHRAR BADSHAH";
        f.special = Special("BOLI DHAP", 14, 20, 24, 11f, 0.88f, "mid", 24, 15, 10, 3.0f, 0.20f, "tackle");
        f.special.armour = true;
        f.superDmg = 36f; f.superHits = 4;
        Fighters[f.id] = f;

        f = F("chairman", "CHAIRMAN AZIZ", "The town",
            "Owns the bazar, the kiln, the launch ghat, and half the police station.",
            "#a5764c", "#835a36", "#2a2a2a", "#ece7dc", "#cdc7ba",
            "#2b2b33", "#1d1d24", "#c9a227", "#1a1a1a", "#151515");
        f.maxHp = 125f; f.walk = 2.0f; f.jump = 7.0f; f.weight = 1.2f;
        f.buildW = 1.06f; f.buildH = 1.04f; f.shoulder = 1.08f;
        f.shades = true; f.moustache = true;
        f.specialName = "CHAIRMAN ORDER"; f.superName = "SHOB TOMAR";
        f.special = Special("CHAIRMAN ORDER", 16, 24, 22, 7.5f, 1.12f, "mid", 18, 12, 7, 1.4f, 0.16f, "order");
        f.superDmg = 40f; f.superHits = 5;
        Fighters[f.id] = f;
    }

    static StageDef S(string id, string name, string sub,
                      string s0, string s1, string s2, string s3,
                      string ground, string groundDark, string fog, string weather, string tint)
    {
        var s = new StageDef();
        s.id = id; s.name = name; s.sub = sub;
        s.sky0 = ProcTex.Hex(s0); s.sky1 = ProcTex.Hex(s1);
        s.sky2 = ProcTex.Hex(s2); s.sky3 = ProcTex.Hex(s3);
        s.ground = ProcTex.Hex(ground); s.groundDark = ProcTex.Hex(groundDark);
        s.fog = ProcTex.Hex(fog);
        s.weather = weather; s.tint = tint;
        return s;
    }

    static void BuildStages()
    {
        Stages["teastall"] = S("teastall", "CHA ER DOKAN", "Tea stall / dawn",
            "#0e1724", "#1e3242", "#4e4a44", "#d9975a",
            "#5b4835", "#3a2c20", "#ffbe82", "steam", "warm");
        Stages["bazar"] = S("bazar", "KACHA BAZAR", "Vegetable market / midday",
            "#1c4560", "#3d7a92", "#8fb0a0", "#e8c98a",
            "#5e4e35", "#3d3323", "#f0dcaa", "flies", "hot");
        Stages["itbhata"] = S("itbhata", "ITBHATA", "Brick kiln / afternoon",
            "#4a2f22", "#7a4a2c", "#b9763c", "#dda85e",
            "#7a4a2c", "#54311c", "#dc9660", "dust", "rust");
        Stages["rickshaw"] = S("rickshaw", "RICKSHAW STAND", "Rain / night",
            "#0b1420", "#142334", "#1e3a4a", "#2a4a55",
            "#1a222c", "#10161d", "#50b4dc", "rain", "cold");
        Stages["akhra"] = S("akhra", "BOLI KHELA AKHRA", "Wrestling pit / festival",
            "#2a1830", "#4a2038", "#7a3038", "#c0623a",
            "#6b4a30", "#4a3120", "#e68c5a", "embers", "festival");
        Stages["rooftop"] = S("rooftop", "CHAIRMAN'S ROOFTOP", "Night / above the town",
            "#05080f", "#0c1220", "#151d2e", "#232c40",
            "#232530", "#16171f", "#5a8cc8", "citylights", "cold");
    }

    static void BuildStory()
    {
        Add(0, "ch0", "teastall", "kalachan", "THE BURNT STALL", "town",
            new Difficulty(26f, 0.35f, 0.15f, 0.05f, 0.05f, "TRAINING"),
            new Line[] {
                new Line("narr","NABINPUR. Six years since Mostafa left for Dhaka. The bus drops him at the bazar turn at dawn."),
                new Line("mostafa","Baba? ...Baba, ami eshe gechi."),
                new Line("narr","The tea stall is a black skeleton. Bamboo posts, charred. The kettle is still hanging from its chain, warped by heat."),
                new Line("kalachan","Oi, ke? Ei jaigay darais keno? Jomi bikri hocche."),
                new Line("mostafa","Ei dokan amar babar. Char bochor dhore ei dokan."),
                new Line("kalachan","Ekhon Chairman er. Chanda na dile, agun. Bujhli?"),
                new Line("mostafa","...Ami ekta kotha bujhlam na. Chanda ta koto?"),
                new Line("kalachan","Ha? Tui moskori korchhish?"),
                new Line("mostafa","Na. Hisheb korchi - koto ghushi lagbe.")
            },
            new Line[] {
                new Line("narr","Kala Chan sits down in the dust and stays there. The neighbours come out one by one, holding their breath."),
                new Line("oldman","Baba... tui Mostafa? Oi chhoto chele ta? Tor baba tore khuje khuje more gese."),
                new Line("mostafa","Jani. Tai ami phire eshechi."),
                new Line("narr","He picks up the warped kettle and hangs it back on its chain. Then he looks down the lane, toward the bazar.")
            });

        Add(1, "ch1", "bazar", "bappi", "THE THUMBPRINT", "fight",
            new Difficulty(20f, 0.5f, 0.28f, 0.14f, 0.15f, "EASY"),
            new Line[] {
                new Line("narr","KACHA BAZAR. Eleven in the morning. The vegetable carts are still full - nobody has sold anything in three days."),
                new Line("bappi","Ei, kolom ta ekhane. Angul ta ekhane. Bas, dorkar nai pora."),
                new Line("oldwoman","Bhai, ei dokan diye amar tin baccha..."),
                new Line("bappi","Baccha baccha korben na. Chairman er shathe tala khelben na."),
                new Line("mostafa","Ei kolom ta rakhen."),
                new Line("bappi","Tui abar ke? Notun chehra... Dhaka theke eshechhish? Dhaka'r pola ekhane beshi din thake na."),
                new Line("mostafa","Ami thakbo. Ei bazar amar choto belar bazar."),
                new Line("bappi","Tahole lathi chene nao.")
            },
            new Line[] {
                new Line("narr","The lathi cracks in half across his knee. Bappi Bhai crawls backwards through the okra."),
                new Line("bappi","Tor... tor kotha Chairman shunbe. Itbhata te tor jonno jayga ache!"),
                new Line("mostafa","Itbhata? Brick field e ke kaj kore?"),
                new Line("shopkeeper","Jontu. Oi pahar moto chele ta. Chairman take pesha diye rakhe."),
                new Line("mostafa","Tahole itbhata tei jai.")
            });

        Add(2, "ch2", "itbhata", "jontu", "THE KILN", "fight",
            new Difficulty(17f, 0.62f, 0.38f, 0.24f, 0.25f, "NORMAL"),
            new Line[] {
                new Line("narr","ITBHATA. Chimneys breathing smoke into an orange sky. Forty thousand bricks, stacked in perfect walls."),
                new Line("jontu","Tui oi chele. Bazar e Bappi'r haddi bhangchhish."),
                new Line("mostafa","Jontu bhai, tumi ei mati theke bancho. Ora ei mati bikri korche."),
                new Line("jontu","Amar tin shoto taka roj lage. Kotha shune pet bhore na."),
                new Line("mostafa","Tahole amake thamate hobe."),
                new Line("jontu","Ekhane shobai matir niche dhuke. Tui o dhukbi.")
            },
            new Line[] {
                new Line("narr","Jontu falls against the brick wall and the wall gives up first. Two thousand bricks come down in a red avalanche."),
                new Line("jontu","Uff... tui... tui pasha na. Chairman er shathe pasha na."),
                new Line("mostafa","Chairman kothay thake?"),
                new Line("jontu","Shob jayga te. Kintu bhai... tar ekjon mohila bodyguard ache. Salma. Shei tomar shathe nirmom hobe na."),
                new Line("narr","That night the rain comes. Mostafa waits at the rickshaw stand, where the Chairman's car always stops.")
            });

        Add(3, "ch3", "rickshaw", "salma", "THE BODYGUARD", "fight",
            new Difficulty(14f, 0.7f, 0.46f, 0.34f, 0.35f, "HARD"),
            new Line[] {
                new Line("narr","RICKSHAW STAND. Rain since evening. The neon of a medicine shop bleeds pink into every puddle."),
                new Line("salma","Tumi Mostafa. Bazar, itbhata - dui jayga te hangama."),
                new Line("mostafa","Tumi Chairman er jonno kaj koro?"),
                new Line("salma","Ami take rakhi. Bhalobashi na. Kintu amar bhai er operation er taka tar kache."),
                new Line("mostafa","Tai jonno ei town ta bikri hobe?"),
                new Line("salma","Na. Tai jonno ami tomake ei rat e thamabo - jate tumi kal shokale na jao."),
                new Line("mostafa","Kothay jete hobe?"),
                new Line("salma","Rooftop. Kintu amar por.")
            },
            new Line[] {
                new Line("narr","She lands on her feet, wipes the rain from her eyes, and does not get up again. Then she laughs - once, short."),
                new Line("salma","Baro bochor e keu amake phellanite pare nai."),
                new Line("mostafa","Ami tomake phellai ni. Tumi amake chere diyecho."),
                new Line("salma","Shono. Chairman ekjon na. Tar upore Dhaka'r ekta syndicate ache. Ora ei jomi te factory banabe - bazar, akhra, shob jabe."),
                new Line("salma","Ami tomar shathe jete parbo na. Kintu ei kotha ta tomar kaj e lagbe."),
                new Line("narr","She hands him a folded paper: a land deed, signed by the Chairman, dated next Friday.")
            });

        Add(4, "ch4", "akhra", "rustom", "THE AKHRA", "boss",
            new Difficulty(12f, 0.78f, 0.52f, 0.42f, 0.45f, "HARD"),
            new Line[] {
                new Line("narr","BOLI KHELA AKHRA. Festival night. Drums. Four thousand people in a ring of dust and diesel light."),
                new Line("announcer","Aajker shesh lorai! Akhhar champion - RUSTOM!"),
                new Line("narr","The crowd roars. Then the Chairman's man walks to the microphone and says a name nobody expected."),
                new Line("announcer","...ebong Dhaka theke phire asha - MOSTAFA!"),
                new Line("rustom","Tui ke jani na. Kintu amar ek rat er porshram tui. Lathi chara, hathe hathe."),
                new Line("mostafa","Rustom bhai, ora tomake kinche."),
                new Line("rustom","Ami jani. Kintu akhra te daraile, tomar shathe lorai korte hobe. Ei niyom."),
                new Line("mostafa","Tahole niyom rakhi.")
            },
            new Line[] {
                new Line("narr","The dust settles. Four thousand people are silent. Then one boy in the front row starts clapping, and it spreads like fire in dry grass."),
                new Line("rustom","...Besh lorai koros. Ja."),
                new Line("rustom","Chairman aj rate rooftop e. Tar launch ghat e nouka ready. Tui giye tala de."),
                new Line("narr","Mostafa walks out of the akhra with the whole town behind him, up the stairs of the only six-storey building in Nabinpur.")
            });

        Add(5, "ch5", "rooftop", "chairman", "THE CHAIRMAN", "boss",
            new Difficulty(9f, 0.86f, 0.64f, 0.55f, 0.55f, "BOSS"),
            new Line[] {
                new Line("narr","ROOFTOP. Water tank, diesel generator, and the whole town laid out below like a circuit board with half its lights broken."),
                new Line("chairman","Mostafa. Bazar, kiln, akhra - tin jayga te hangama. Tor babar dokan ta ami porai nai. Kintu mone rakhis."),
                new Line("mostafa","Tumi ei town ta bikri korcho."),
                new Line("chairman","Ami bikri korchi na. Ami unnoyon korchi. Factory ashbe, rasta hobe, chakri hobe."),
                new Line("mostafa","Ar jei dusho dokandar ei bazar e bachche, tara?"),
                new Line("chairman","Tara itihash. Tui o itihash hobi."),
                new Line("chairman","Shesh sujog dicchi - amar shathe kaj kor. Na hole... ei chhad theke niche."),
                new Line("mostafa","Ami ei town er chele. Ami niche jabo na."),
                new Line("chairman","Tahole tui o ekjon mostan. Ar mostander shathe maramari chara kichu nai.")
            },
            new Line[] {
                new Line("narr","The Chairman's sunglasses are somewhere in the water tank. He sits against the parapet, breathing like a broken pump."),
                new Line("chairman","Tui... tui janish na ke amake taka dey..."),
                new Line("mostafa","Jani. Salma boleche. Ar shob kagoj oi chhad e ache."),
                new Line("narr","Below, the town is waking up. Rickshaw bells. Azaan from the mosque. Somebody is boiling water."),
                new Line("narr","Three months later the bazar opens again. The tea stall has a new tin roof and the same old kettle."),
                new Line("mostafa","Cha khaben?"),
                new Line("narr","- MOSTANADER MARAMARI -")
            });
    }

    static void Add(int n, string id, string stage, string opp, string title, string music,
                    Difficulty diff, Line[] intro, Line[] outro)
    {
        var c = new ChapterDef();
        c.n = n; c.id = id; c.stage = stage; c.opponent = opp;
        c.title = title; c.music = music; c.diff = diff;
        c.intro = intro; c.outro = outro;
        Chapters.Add(c);
    }

    public static FighterDef GetFighter(string id)
    {
        Init();
        FighterDef f;
        return Fighters.TryGetValue(id, out f) ? f : Fighters["mostafa"];
    }

    public static StageDef GetStage(string id)
    {
        Init();
        StageDef s;
        return Stages.TryGetValue(id, out s) ? s : Stages["bazar"];
    }

    public static MoveDef Move(string key)
    {
        Init();
        return BaseMoves[key];
    }
}
