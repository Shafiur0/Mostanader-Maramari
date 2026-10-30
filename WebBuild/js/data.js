/* ============================================================
   MOSTANADER MARAMARI — data.js
   Roster, frame data, stages, story chapters.
   ============================================================ */
(function (global) {
  'use strict';
  var MM = global.MM || (global.MM = {});

  /* ------------------------------------------------------------
     BASE MOVESET  (frames @60fps)
     reach is in world px measured from fighter centre
     ------------------------------------------------------------ */
  var BASE_MOVES = {
    lp: { key: 'lp', label: 'Jab', startup: 4, active: 3, recovery: 7, dmg: 4.0, reach: 66, h: 'mid', hitstun: 12, blockstun: 8, hitstop: 5, kb: 70, meter: 6, chip: 0.10, sfx: 0.8, anim: 'punchL' },
    hp: { key: 'hp', label: 'Heavy', startup: 9, active: 4, recovery: 17, dmg: 9.0, reach: 78, h: 'mid', hitstun: 19, blockstun: 11, hitstop: 8, kb: 190, meter: 11, chip: 0.14, sfx: 1.25, anim: 'punchH' },
    kick: { key: 'kick', label: 'Kick', startup: 7, active: 4, recovery: 14, dmg: 7.0, reach: 88, h: 'high', hitstun: 16, blockstun: 9, hitstop: 7, kb: 150, meter: 9, chip: 0.12, sfx: 1.05, anim: 'kick' },
    low: { key: 'low', label: 'Low', startup: 5, active: 3, recovery: 11, dmg: 5.0, reach: 74, h: 'low', hitstun: 14, blockstun: 8, hitstop: 5, kb: 90, meter: 7, chip: 0.10, sfx: 0.85, anim: 'kickLow' },
    jumpAtk: { key: 'jumpAtk', label: 'Jump', startup: 4, active: 8, recovery: 4, dmg: 8.0, reach: 74, h: 'high', hitstun: 18, blockstun: 10, hitstop: 7, kb: 130, meter: 9, chip: 0.14, sfx: 1.1, anim: 'jumpAtk' }
  };

  /* ------------------------------------------------------------
     FIGHTERS
     ------------------------------------------------------------ */
  var FIGHTERS = {

    mostafa: {
      id: 'mostafa', name: 'MOSTAFA', bn: 'মোস্তফা', nick: '"Mosti"',
      role: 'Returned from Dhaka',
      bio: 'Came home for his sister\'s wedding. Found the town up for sale instead.',
      build: { w: 1.0, h: 1.0, head: 1.0, shoulder: 1.0 },
      colors: { skin: '#a9714b', skinShade: '#8b5a3a', hair: '#171310', top: '#2f5578', topDark: '#1f3b55', bottom: '#d8c7a4', bottomDark: '#b8a37c', accent: '#c0392b', belt: '#7a5230', shoe: '#3b2f26' },
      stats: { hp: 100, walk: 215, jump: 720, weight: 1.0 },
      special: {
        name: 'GAMCHA GURAI', bn: 'গামছা ঘুরাই', cost: 50, kind: 'rush',
        startup: 12, active: 26, recovery: 20, dmg: 6.5, reach: 96, h: 'mid',
        hits: 3, hitstun: 16, blockstun: 12, hitstop: 6, kb: 120, chip: 0.16,
        anim: 'spin', sfx: 1.3
      },
      super: { name: 'NABINPUR BIDROHO', bn: 'নবীনপুর বিদ্রোহ', dmg: 34, hits: 5, anim: 'superRush' },
      taunt: 'Tor baper shompotti na — tor boner biyar taka.'
    },

    kalachan: {
      id: 'kalachan', name: 'KALA CHAN', bn: 'কালা চান', nick: '"the collector"',
      role: 'Local goon',
      bio: 'Collects chanda from every shop on the lane. Never fights fair.',
      build: { w: 0.94, h: 0.97, head: 0.95, shoulder: 0.95 },
      colors: { skin: '#8d5a3b', skinShade: '#70452c', hair: '#0f0d0b', top: '#22222a', topDark: '#15151b', bottom: '#3d3d46', bottomDark: '#2c2c34', accent: '#8e44ad', belt: '#1a1a1a', shoe: '#2b2b2b' },
      stats: { hp: 95, walk: 240, jump: 740, weight: 0.9 },
      special: {
        name: 'CHORUI CHAPA', bn: 'ছুরি চাপা', cost: 50, kind: 'dash',
        startup: 9, active: 18, recovery: 22, dmg: 5.5, reach: 104, h: 'mid',
        hits: 2, hitstun: 15, blockstun: 10, hitstop: 6, kb: 100, chip: 0.14,
        anim: 'dashStab', sfx: 1.15
      },
      super: { name: 'GOLI RASH', bn: 'গলি র‍্যাশ', dmg: 28, hits: 4, anim: 'superRush' },
      taunt: 'Taka na dile dokan bondho.'
    },

    bappi: {
      id: 'bappi', name: 'BAPPI BHAI', bn: 'বাপ্পি ভাই', nick: '"the broker"',
      role: 'Land broker',
      bio: 'Signs the shopkeepers\' thumbprints. Keeps a lathi in the ledger bag.',
      build: { w: 1.02, h: 1.02, head: 1.0, shoulder: 1.0 },
      colors: { skin: '#b07a52', skinShade: '#8f5f3d', hair: '#1c1712', top: '#ece6d6', topDark: '#cfc7b4', bottom: '#9aa9b5', bottomDark: '#7b8a96', accent: '#c9a227', belt: '#6b5433', shoe: '#2a2018' },
      stats: { hp: 105, walk: 195, jump: 690, weight: 1.1 },
      special: {
        name: 'LATHI BARI', bn: 'লাঠি বাড়ি', cost: 50, kind: 'swing',
        startup: 15, active: 12, recovery: 24, dmg: 8.0, reach: 132, h: 'high',
        hits: 1, hitstun: 22, blockstun: 14, hitstop: 9, kb: 220, chip: 0.18,
        anim: 'swingStick', sfx: 1.4
      },
      super: { name: 'DOLIL BONDHO', bn: 'দলিল বন্ধ', dmg: 31, hits: 3, anim: 'superRush' },
      taunt: 'Ekta angul chap dilei jomi amar.'
    },

    jontu: {
      id: 'jontu', name: 'JONTU', bn: 'জন্তু', nick: '"the kiln"',
      role: 'Brick-field strongman',
      bio: 'Carries forty bricks a trip. Has never lost a fight in the clay pit.',
      build: { w: 1.22, h: 1.09, head: 1.05, shoulder: 1.22 },
      colors: { skin: '#7d4c2e', skinShade: '#5f3820', hair: '#100c09', top: '#7d4c2e', topDark: '#5f3820', bottom: '#c96f3a', bottomDark: '#a3542a', accent: '#c0392b', belt: '#4a2f1c', shoe: '#2e2119' },
      stats: { hp: 118, walk: 168, jump: 620, weight: 1.45 },
      special: {
        name: 'IT KUTHAR', bn: 'ইট কুঠার', cost: 50, kind: 'slam',
        startup: 19, active: 10, recovery: 26, dmg: 13.0, reach: 92, h: 'high',
        hits: 1, hitstun: 26, blockstun: 16, hitstop: 12, kb: 260, chip: 0.22,
        anim: 'slam', sfx: 1.6, armour: true
      },
      super: { name: 'BHATAR AGUN', bn: 'ভাটার আগুন', dmg: 38, hits: 3, anim: 'superRush' },
      taunt: 'Matir niche tor jayga.'
    },

    salma: {
      id: 'salma', name: 'SALMA', bn: 'সালমা', nick: '"the bodyguard"',
      role: 'Chairman\'s bodyguard',
      bio: 'Black belt, clean fighter. The only one in the gang who tells the truth.',
      build: { w: 0.88, h: 0.96, head: 0.96, shoulder: 0.86 },
      colors: { skin: '#b98457', skinShade: '#98673f', hair: '#120e0b', top: '#f2eee4', topDark: '#d8d2c4', bottom: '#f2eee4', bottomDark: '#d8d2c4', accent: '#a83232', belt: '#a83232', shoe: '#b98457' },
      stats: { hp: 96, walk: 250, jump: 780, weight: 0.85 },
      special: {
        name: 'DUI LATHI KICK', bn: 'দুই লাথি', cost: 50, kind: 'combo',
        startup: 10, active: 22, recovery: 18, dmg: 6.0, reach: 98, h: 'high',
        hits: 2, hitstun: 17, blockstun: 11, hitstop: 6, kb: 110, chip: 0.14,
        anim: 'doubleKick', sfx: 1.2
      },
      super: { name: 'SHOTTO KARATE', bn: 'সত্য কারাতে', dmg: 30, hits: 4, anim: 'superRush' },
      taunt: 'Lorai korle niyom thakte hoy.'
    },

    rustom: {
      id: 'rustom', name: 'RUSTOM', bn: 'রুস্তম', nick: '"boli khela champion"',
      role: 'Wrestler',
      bio: 'Twelve years undefeated in the akhra. Bought for one night only.',
      build: { w: 1.24, h: 1.02, head: 1.06, shoulder: 1.26 },
      colors: { skin: '#8a5a34', skinShade: '#6b4224', hair: '#140f0b', top: '#8a5a34', topDark: '#6b4224', bottom: '#a83232', bottomDark: '#7d2222', accent: '#d4af37', belt: '#d4af37', shoe: '#3a2a1e' },
      stats: { hp: 112, walk: 185, jump: 640, weight: 1.35 },
      special: {
        name: 'BOLI DHAP', bn: 'বলি ধাপ', cost: 50, kind: 'tackle',
        startup: 14, active: 20, recovery: 24, dmg: 11.0, reach: 88, h: 'mid',
        hits: 1, hitstun: 24, blockstun: 15, hitstop: 10, kb: 300, chip: 0.20,
        anim: 'tackle', sfx: 1.5, armour: true
      },
      super: { name: 'AKHRAR BADSHAH', bn: 'আখড়ার বাদশাহ', dmg: 36, hits: 4, anim: 'superRush' },
      taunt: 'Akhray dui jon dhuke, ek jon uthe.'
    },

    chairman: {
      id: 'chairman', name: 'CHAIRMAN AZIZ', bn: 'চেয়ারম্যান আজিজ', nick: '"the town"',
      role: 'Final boss',
      bio: 'Owns the bazar, the kiln, the launch ghat, and half the police station.',
      build: { w: 1.06, h: 1.04, head: 1.0, shoulder: 1.08 },
      colors: { skin: '#a5764c', skinShade: '#835a36', hair: '#2a2a2a', top: '#ece7dc', topDark: '#cdc7ba', bottom: '#2b2b33', bottomDark: '#1d1d24', accent: '#c9a227', belt: '#1a1a1a', shoe: '#151515' },
      stats: { hp: 125, walk: 200, jump: 700, weight: 1.2 },
      special: {
        name: 'CHAIRMAN ORDER', bn: 'চেয়ারম্যান অর্ডার', cost: 50, kind: 'summon',
        startup: 16, active: 24, recovery: 22, dmg: 7.5, reach: 112, h: 'mid',
        hits: 3, hitstun: 18, blockstun: 12, hitstop: 7, kb: 140, chip: 0.16,
        anim: 'order', sfx: 1.35
      },
      super: { name: 'SHOB TOMAR', bn: 'সব তোমার', dmg: 40, hits: 5, anim: 'superRush' },
      taunt: 'Ei town ta amar. Tui ke?'
    }
  };

  var ORDER = ['mostafa', 'kalachan', 'bappi', 'jontu', 'salma', 'rustom', 'chairman'];

  /* ------------------------------------------------------------
     STAGES
     ------------------------------------------------------------ */
  var STAGES = {
    teastall: {
      id: 'teastall', name: 'CHA ER DOKAN', bn: 'চায়ের দোকান', sub: 'Tea stall · dawn',
      sky: ['#0e1724', '#1e3242', '#4e4a44', '#d9975a'],
      ground: '#5b4835', groundDark: '#3a2c20',
      far: '#25333c', mid: '#3a4a44', near: '#20302c',
      accent: '#e8a33d', fog: 'rgba(255,190,130,0.06)',
      weather: 'steam', tint: 'warm'
    },
    bazar: {
      id: 'bazar', name: 'KACHA BAZAR', bn: 'কাঁচা বাজার', sub: 'Vegetable market · midday',
      sky: ['#1c4560', '#3d7a92', '#8fb0a0', '#e8c98a'],
      ground: '#5e4e35', groundDark: '#3d3323',
      far: '#4a6b6b', mid: '#6d6a4e', near: '#3d4a34',
      accent: '#e2703a', fog: 'rgba(240,220,170,0.13)',
      weather: 'flies', tint: 'hot'
    },
    itbhata: {
      id: 'itbhata', name: 'ITBHATA', bn: 'ইটভাটা', sub: 'Brick kiln · afternoon',
      sky: ['#4a2f22', '#7a4a2c', '#b9763c', '#dda85e'],
      ground: '#7a4a2c', groundDark: '#54311c',
      far: '#5c3524', mid: '#7d4a2e', near: '#3f2418',
      accent: '#e07a2f', fog: 'rgba(220,150,80,0.16)',
      weather: 'dust', tint: 'rust'
    },
    rickshaw: {
      id: 'rickshaw', name: 'RICKSHAW STAND', bn: 'রিকশা স্ট্যান্ড', sub: 'Rain · night',
      sky: ['#0b1420', '#142334', '#1e3a4a', '#2a4a55'],
      ground: '#1a222c', groundDark: '#10161d',
      far: '#16222e', mid: '#1d2e3a', near: '#0e1820',
      accent: '#ff5ea8', fog: 'rgba(80,180,220,0.10)',
      weather: 'rain', tint: 'cold'
    },
    akhra: {
      id: 'akhra', name: 'BOLI KHELA AKHRA', bn: 'বলি খেলা আখড়া', sub: 'Wrestling pit · festival evening',
      sky: ['#2a1830', '#4a2038', '#7a3038', '#c0623a'],
      ground: '#6b4a30', groundDark: '#4a3120',
      far: '#3a2430', mid: '#5a3a34', near: '#2a1a1c',
      accent: '#e0a030', fog: 'rgba(230,140,90,0.12)',
      weather: 'embers', tint: 'festival'
    },
    rooftop: {
      id: 'rooftop', name: 'CHAIRMAN\'S ROOFTOP', bn: 'চেয়ারম্যানের ছাদ', sub: 'Night · above the town',
      sky: ['#05080f', '#0c1220', '#151d2e', '#232c40'],
      ground: '#232530', groundDark: '#16171f',
      far: '#0d1119', mid: '#151a24', near: '#0a0d13',
      accent: '#5fb0e0', fog: 'rgba(90,140,200,0.08)',
      weather: 'citylights', tint: 'cold'
    }
  };

  var STAGE_ORDER = ['teastall', 'bazar', 'itbhata', 'rickshaw', 'akhra', 'rooftop'];

  /* ------------------------------------------------------------
     STORY — 6 chapters + prologue + ending
     ------------------------------------------------------------ */
  var CHAPTERS = [
    {
      n: 0, id: 'ch0', stage: 'teastall', opponent: 'kalachan',
      title: 'THE BURNT STALL', bn: 'পোড়া দোকান',
      music: 'town',
      diff: { react: 26, aggr: 0.35, block: 0.15, special: 0.05, antiAir: 0.05, label: 'TRAINING' },
      intro: [
        { who: 'narr', text: 'NABINPUR. Six years since Mostafa left for Dhaka. The bus drops him at the bazar turn at dawn.' },
        { who: 'mostafa', text: 'Baba? ...Baba, ami eshe gechi.' },
        { who: 'narr', text: 'The tea stall is a black skeleton. Bamboo posts, charred. The kettle is still hanging from its chain, warped by heat.' },
        { who: 'kalachan', text: 'Oi, ke? Ei jaigay darais keno? Jomi bikri hocche.' },
        { who: 'mostafa', text: 'Ei dokan amar babar. Char bochor dhore ei dokan.' },
        { who: 'kalachan', text: 'Ekhon Chairman er. Chanda na dile, agun. Bujhli?' },
        { who: 'mostafa', text: '...Ami ekta kotha bujhlam na. Chanda ta koto?' },
        { who: 'kalachan', text: 'Ha? Tui moskori korchhish?' },
        { who: 'mostafa', text: 'Na. Hisheb korchi — koto ghushi lagbe.' }
      ],
      outro: [
        { who: 'narr', text: 'Kala Chan sits down in the dust and stays there. The neighbours come out one by one, holding their breath.' },
        { who: 'oldman', text: 'Baba... tui Mostafa? Oi chhoto chele ta? Tor baba tore khuje khuje more gese.' },
        { who: 'mostafa', text: 'Jani. Tai ami phire eshechi.' },
        { who: 'narr', text: 'He picks up the warped kettle and hangs it back on its chain. Then he looks down the lane, toward the bazar.' }
      ]
    },
    {
      n: 1, id: 'ch1', stage: 'bazar', opponent: 'bappi',
      title: 'THE THUMBPRINT', bn: 'আঙুলের ছাপ',
      music: 'fight',
      diff: { react: 20, aggr: 0.5, block: 0.28, special: 0.14, antiAir: 0.15, label: 'EASY' },
      intro: [
        { who: 'narr', text: 'KACHA BAZAR. Eleven in the morning. The vegetable carts are still full — nobody has sold anything in three days.' },
        { who: 'bappi', text: 'Ei, kolom ta ekhane. Angul ta ekhane. Bas, dorkar nai pora.' },
        { who: 'oldwoman', text: 'Bhai, ei dokan diye amar tin baccha...' },
        { who: 'bappi', text: 'Baccha baccha korben na. Chairman er shathe tala khelben na.' },
        { who: 'mostafa', text: 'Ei kolom ta rakhen.' },
        { who: 'bappi', text: 'Tui abar ke? Notun chehra... Dhaka theke eshechhish? Dhaka\'r pola ekhane beshi din thake na.' },
        { who: 'mostafa', text: 'Ami thakbo. Ei bazar amar choto belar bazar.' },
        { who: 'bappi', text: 'Tahole lathi chene nao.' }
      ],
      outro: [
        { who: 'narr', text: 'The lathi cracks in half across his knee. Bappi Bhai crawls backwards through the okra.' },
        { who: 'bappi', text: 'Tor... tor kotha Chairman shunbe. Itbhata te tor jonno jayga ache!' },
        { who: 'mostafa', text: 'Itbhata? Brick field e ke kaj kore?' },
        { who: 'shopkeeper', text: 'Jontu. Oi pahar moto chele ta. Chairman take pesha diye rakhe.' },
        { who: 'mostafa', text: 'Tahole itbhata tei jai.' }
      ]
    },
    {
      n: 2, id: 'ch2', stage: 'itbhata', opponent: 'jontu',
      title: 'THE KILN', bn: 'ভাটা',
      music: 'fight',
      diff: { react: 17, aggr: 0.62, block: 0.38, special: 0.24, antiAir: 0.25, label: 'NORMAL' },
      intro: [
        { who: 'narr', text: 'ITBHATA. Chimneys breathing smoke into an orange sky. Forty thousand bricks, stacked in perfect walls.' },
        { who: 'jontu', text: 'Tui oi chele. Bazar e Bappi\'r haddi bhangchhish.' },
        { who: 'mostafa', text: 'Jontu bhai, tumi ei mati theke bancho. Ora ei mati bikri korche.' },
        { who: 'jontu', text: 'Amar tin shoto taka roj lage. Kotha shune pet bhore na.' },
        { who: 'mostafa', text: 'Tahole amake thamate hobe.' },
        { who: 'jontu', text: 'Ekhane shobai matir niche dhuke. Tui o dhukbi.' }
      ],
      outro: [
        { who: 'narr', text: 'Jontu falls against the brick wall and the wall gives up first. Two thousand bricks come down in a red avalanche.' },
        { who: 'jontu', text: 'Uff... tui... tui pasha na. Chairman er shathe pasha na.' },
        { who: 'mostafa', text: 'Chairman kothay thake?' },
        { who: 'jontu', text: 'Shob jayga te. Kintu bhai... tar ekjon mohila bodyguard ache. Salma. Shei tomar shathe nirmom hobe na.' },
        { who: 'narr', text: 'That night the rain comes. Mostafa waits at the rickshaw stand, where the Chairman\'s car always stops.' }
      ]
    },
    {
      n: 3, id: 'ch3', stage: 'rickshaw', opponent: 'salma',
      title: 'THE BODYGUARD', bn: 'বডিগার্ড',
      music: 'fight',
      diff: { react: 14, aggr: 0.7, block: 0.46, special: 0.34, antiAir: 0.35, label: 'HARD' },
      intro: [
        { who: 'narr', text: 'RICKSHAW STAND. Rain since evening. The neon of a medicine shop bleeds pink into every puddle.' },
        { who: 'salma', text: 'Tumi Mostafa. Bazar, itbhata — dui jayga te hangama.' },
        { who: 'mostafa', text: 'Tumi Chairman er jonno kaj koro?' },
        { who: 'salma', text: 'Ami take rakhi. Bhalobashi na. Kintu amar bhai er operation er taka tar kache.' },
        { who: 'mostafa', text: 'Tai jonno ei town ta bikri hobe?' },
        { who: 'salma', text: 'Na. Tai jonno ami tomake ei rat e thamabo — jate tumi Kal shokale na jao.' },
        { who: 'mostafa', text: 'Kothay jete hobe?' },
        { who: 'salma', text: 'Rooftop. Kintu amar por.' }
      ],
      outro: [
        { who: 'narr', text: 'She lands on her feet, wipes the rain from her eyes, and does not get up again. Then she laughs — once, short.' },
        { who: 'salma', text: 'Baro bochor e keu amake phellanite pare nai.' },
        { who: 'mostafa', text: 'Ami tomake phellai ni. Tumi amake chere diyecho.' },
        { who: 'salma', text: 'Shono. Chairman ekjon na. Tar upore Dhaka\'r ekta syndicate ache. Ora ei jomi te factory banabe — bazar, akhra, shob jabe.' },
        { who: 'salma', text: 'Ami tomar shathe jete parbo na. Kintu ei kotha ta tomar kaj e lagbe.' },
        { who: 'narr', text: 'She hands him a folded paper: a land deed, signed by the Chairman, dated next Friday.' }
      ]
    },
    {
      n: 4, id: 'ch4', stage: 'akhra', opponent: 'rustom',
      title: 'THE AKHRA', bn: 'আখড়া',
      music: 'boss',
      diff: { react: 12, aggr: 0.78, block: 0.52, special: 0.42, antiAir: 0.45, label: 'HARD' },
      intro: [
        { who: 'narr', text: 'BOLI KHELA AKHRA. Festival night. Drums. Four thousand people in a ring of dust and diesel light.' },
        { who: 'announcer', text: 'Aajker shesh lorai! Akhhar champion — RUSTOM!' },
        { who: 'narr', text: 'The crowd roars. Then the Chairman\'s man walks to the microphone and says a name nobody expected.' },
        { who: 'announcer', text: '...ebong Dhaka theke phire asha — MOSTAFA!' },
        { who: 'rustom', text: 'Tui ke jani na. Kintu amar ek rat er porshram tui. Lathi chara, hathe hathe.' },
        { who: 'mostafa', text: 'Rustom bhai, ora tomake kinche.' },
        { who: 'rustom', text: 'Ami jani. Kintu akhra te daraile, tomar shathe lorai korte hobe. Ei niyom.' },
        { who: 'mostafa', text: 'Tahole niyom rakhi.' }
      ],
      outro: [
        { who: 'narr', text: 'The dust settles. Four thousand people are silent. Then one boy in the front row starts clapping, and it spreads like fire in dry grass.' },
        { who: 'rustom', text: '...Besh lorai koros. Ja.' },
        { who: 'rustom', text: 'Chairman aj rate rooftop e. Tar launch ghat e nouka ready. Tui giye tala de.' },
        { who: 'narr', text: 'Mostafa walks out of the akhra with the whole town behind him, up the stairs of the only six-storey building in Nabinpur.' }
      ]
    },
    {
      n: 5, id: 'ch5', stage: 'rooftop', opponent: 'chairman',
      title: 'THE CHAIRMAN', bn: 'চেয়ারম্যান',
      music: 'boss',
      diff: { react: 9, aggr: 0.86, block: 0.64, special: 0.55, antiAir: 0.55, label: 'BOSS' },
      intro: [
        { who: 'narr', text: 'ROOFTOP. Water tank, diesel generator, and the whole town laid out below like a circuit board with half its lights broken.' },
        { who: 'chairman', text: 'Mostafa. Bazar, kiln, akhra — tin jayga te hangama. Tor babar dokan ta ami porai nai. Kintu mone rakhis.' },
        { who: 'mostafa', text: 'Tumi ei town ta bikri korcho.' },
        { who: 'chairman', text: 'Ami bikri korchi na. Ami unnoyon korchi. Factory ashbe, rasta hobe, chakri hobe.' },
        { who: 'mostafa', text: 'Ar jei dusho dokandar ei bazar e bachche, tara?' },
        { who: 'chairman', text: 'Tara itihash. Tui o itihash hobi.' },
        { who: 'chairman', text: 'Shesh sujog dicchi — amar shathe kaj kor. Na hole... ei chhad theke niche.' },
        { who: 'mostafa', text: 'Ami ei town er chele. Ami niche jabo na.' },
        { who: 'chairman', text: 'Tahole tui o ekjon mostan. Ar mostander shathe maramari chara kichu nai.' }
      ],
      outro: [
        { who: 'narr', text: 'The Chairman\'s sunglasses are somewhere in the water tank. He sits against the parapet, breathing like a broken pump.' },
        { who: 'chairman', text: 'Tui... tui janish na ke amake taka dey...' },
        { who: 'mostafa', text: 'Jani. Salma boleche. Ar shob kagoj oi chhad e ache.' },
        { who: 'narr', text: 'Below, the town is waking up. Rickshaw bells. Azaan from the mosque. Somebody is boiling water.' },
        { who: 'narr', text: 'Three months later the bazar opens again. The tea stall has a new tin roof and the same old kettle.' },
        { who: 'mostafa', text: 'Cha khaben?' },
        { who: 'narr', text: '— MOSTANADER MARAMARI —' }
      ]
    }
  ];

  /* Versus-mode roster unlocking: all fighters available after story clear */
  var ALL_IDS = ORDER.slice();

  MM.Data = {
    BASE_MOVES: BASE_MOVES,
    FIGHTERS: FIGHTERS,
    ORDER: ORDER,
    ALL_IDS: ALL_IDS,
    STAGES: STAGES,
    STAGE_ORDER: STAGE_ORDER,
    CHAPTERS: CHAPTERS,
    WORLD_W: 1700,
    GROUND_Y: 0,
    FIGHTER_SCALE: 1.0
  };
})(window);
