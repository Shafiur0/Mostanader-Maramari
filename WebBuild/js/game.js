/* ============================================================
   MOSTANADER MARAMARI — game.js
   Screens, input, fight loop, HUD.
   ============================================================ */
(function (global) {
  'use strict';
  var MM = global.MM, D = MM.Data, Art = MM.Art, A = MM.Audio, Save = MM.Save;
  var W = 1280, H = 720;

  var cvs = document.getElementById('game');
  var ctx = cvs.getContext('2d');

  var G = {
    screen: 'scr-title',
    match: null,
    brain: null,
    weather: null,
    mode: 'story',
    chapterIdx: 0,
    versus: { p1: 'mostafa', p2: 'kalachan', stage: 'bazar' },
    dlg: null,
    dlgDone: null,
    keys: {},
    press: {},
    time: 0,
    hpShown: [1, 1],
    bannerAnim: 0,
    shakeX: 0, shakeY: 0,
    hitFreeze: 0,
    flash: 0,
    stageIdx: 1,
    result: null,
    inFight: false
  };

  /* ============================================================
     SCREENS
     ============================================================ */
  var screens = ['scr-title', 'scr-menu', 'scr-story', 'scr-dialogue', 'scr-versus',
    'scr-roster', 'scr-options', 'scr-controls', 'scr-result', 'scr-pause'];

  function show(id) {
    screens.forEach(function (s) {
      var el = document.getElementById(s);
      if (el) el.classList.toggle('active', s === id);
    });
    G.screen = id || '';
    if (id === 'scr-versus') requestAnimationFrame(paintVersusPortraits);
    if (id === 'scr-roster') requestAnimationFrame(paintRosterPortraits);
  }
  function hideAll() { show(null); }

  /* ============================================================
     INPUT
     ============================================================ */
  global.addEventListener('keydown', function (e) {
    var k = e.key.toLowerCase();
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].indexOf(k) >= 0) e.preventDefault();
    if (!G.keys[k]) G.press[k] = true;
    G.keys[k] = true;

    if (k === 'escape') {
      if (G.inFight && !G.dlg) togglePause();
    }
    if (G.dlg && (k === ' ' || k === 'enter')) {
      advanceDialogue();
    } else if (G.screen === 'scr-title' && (k === ' ' || k === 'enter')) {
      gotoMenu();
    }
  });
  global.addEventListener('keyup', function (e) {
    G.keys[e.key.toLowerCase()] = false;
  });
  global.addEventListener('blur', function () { G.keys = {}; });

  /* ============================================================
     TITLE / MENU
     ============================================================ */
  function unlockAudio() { A.resume(); }

  document.getElementById('btn-start').addEventListener('click', gotoMenu);
  document.getElementById('scr-title').addEventListener('click', function () {
    if (G.screen === 'scr-title') gotoMenu();
  });

  function gotoMenu() {
    unlockAudio();
    A.playMusic('town');
    show('scr-menu');
    var n = Save.data.cleared.length;
    document.getElementById('progress-label').textContent = n + ' / 6 chapters cleared';
  }

  document.querySelectorAll('[data-act]').forEach(function (b) {
    b.addEventListener('click', function () {
      var act = b.getAttribute('data-act');
      A.click();
      if (act === 'menu') gotoMenu();
      if (act === 'story') openStory();
      if (act === 'versus') openVersus();
      if (act === 'roster') openRoster();
      if (act === 'options') { show('scr-options'); syncOptions(); }
    });
  });

  /* ============================================================
     STORY SELECT
     ============================================================ */
  function openStory() {
    var grid = document.getElementById('chapter-grid');
    grid.innerHTML = '';
    var maxOpen = Save.maxChapter();
    D.CHAPTERS.forEach(function (ch, i) {
      var locked = i > maxOpen;
      var done = Save.isCleared(i);
      var el = document.createElement('button');
      el.className = 'ch' + (locked ? ' locked' : '');
      var opp = D.FIGHTERS[ch.opponent];
      var dcls = ch.diff.label === 'BOSS' ? 'boss' : (ch.diff.label === 'HARD' ? 'hard' : '');
      el.innerHTML =
        '<div class="n">Chapter ' + (i + 1) + '</div>' +
        '<div class="t">' + ch.title + '</div>' +
        '<div class="bn">' + ch.bn + ' · ' + D.STAGES[ch.stage].name + '</div>' +
        '<div class="meta"><span class="vs">VS ' + opp.name + '</span>' +
        '<span class="diff ' + dcls + '">' + ch.diff.label + '</span></div>' +
        (done ? '<div class="done">✔</div>' : '');
      if (!locked) el.addEventListener('click', function () { A.click(); startChapter(i); });
      grid.appendChild(el);
    });
    show('scr-story');
  }

  /* ============================================================
     DIALOGUE
     ============================================================ */
  var SPEAKERS = {
    narr: { name: '', role: 'narration' },
    oldman: { name: 'OLD MAN', role: '' },
    oldwoman: { name: 'OLD WOMAN', role: '' },
    shopkeeper: { name: 'SHOPKEEPER', role: '' },
    announcer: { name: 'ANNOUNCER', role: '' }
  };

  function speaker(who) {
    if (SPEAKERS[who]) return SPEAKERS[who];
    var f = D.FIGHTERS[who];
    if (f) return { name: f.name, role: f.nick || '' };
    return { name: who.toUpperCase(), role: '' };
  }

  function playDialogue(lines, onDone) {
    G.dlg = new MM.Dialogue(lines, function () {
      G.dlg = null;
      show(null);
      if (onDone) onDone();
    });
    document.getElementById('scr-dialogue').classList.add('active');
    G.screen = 'scr-dialogue';
    updateDialogueUI();
  }

  function updateDialogueUI() {
    if (!G.dlg) return;
    var l = G.dlg.current();
    if (!l) return;
    var sp = speaker(l.who);
    var whoEl = document.getElementById('dlg-who');
    var roleEl = document.getElementById('dlg-role');
    var txt = document.getElementById('dlg-text');
    var next = document.getElementById('dlg-next');
    whoEl.textContent = sp.name || '· · ·';
    roleEl.textContent = sp.role || '';
    txt.textContent = G.dlg.visibleText();
    var complete = G.dlg.shown >= l.text.length;
    next.style.opacity = complete ? '1' : '0';
    if (l.who === 'narr') {
      txt.style.fontStyle = 'italic';
      txt.style.color = '#c8c2b2';
    } else {
      txt.style.fontStyle = 'normal';
      txt.style.color = '#e9e2d2';
    }
  }

  function advanceDialogue() {
    if (!G.dlg) return;
    A.click();
    G.dlg.advance();
    if (!G.dlg) return;
    updateDialogueUI();
  }

  document.getElementById('scr-dialogue').addEventListener('click', advanceDialogue);

  /* ============================================================
     FIGHT SETUP
     ============================================================ */
  function buildMatch(cfg) {
    cfg.W = W;
    var m = new MM.Match(cfg);
    m.paused = true;
    G.match = m;
    G.weather = new Art.Weather(D.STAGES[cfg.stage || 'bazar'].weather, W, H);
    G.hpShown = [1, 1];
    G.inFight = true;
    G.flash = 0;
    return m;
  }

  function startChapter(i) {
    G.mode = 'story';
    G.chapterIdx = i;
    var ch = D.CHAPTERS[i];
    var m = buildMatch({
      stage: ch.stage,
      p1: 'mostafa',
      p2: ch.opponent,
      diff: ch.diff,
      rounds: 3
    });
    G.brain = new MM.Brain(ch.diff);
    m.onEnd = onStoryEnd;
    hideAll();
    A.playMusic(ch.music);
    playDialogue(ch.intro, function () {
      m.paused = false;
      m.state = 'intro';
      m.stateT = 0;
    });
  }

  function startVersus() {
    G.mode = 'versus';
    var m = buildMatch({
      stage: G.versus.stage,
      p1: G.versus.p1,
      p2: G.versus.p2,
      diff: { react: 14, aggr: 0.72, block: 0.42, special: 0.34, antiAir: 0.35, label: 'VERSUS' },
      rounds: 3
    });
    G.brain = new MM.Brain({ react: 14, aggr: 0.72, block: 0.42, special: 0.34, antiAir: 0.35 });
    m.onEnd = onVersusEnd;
    m.paused = false;
    m.state = 'intro';
    m.stateT = 0;
    hideAll();
    A.playMusic(G.versus.p2 === 'chairman' ? 'boss' : 'fight');
  }

  /* ============================================================
     END OF MATCH
     ============================================================ */
  function onStoryEnd(winner) {
    var ch = D.CHAPTERS[G.chapterIdx];
    G.inFight = false;
    if (winner === 0) {
      Save.clearChapter(G.chapterIdx);
      A.playMusic('town');
      setTimeout(function () {
        playDialogue(ch.outro, function () {
          showResult({
            kicker: 'CHAPTER CLEAR',
            title: ch.title,
            sub: 'Chapter ' + (G.chapterIdx + 1) + ' complete. ' +
              (G.chapterIdx < D.CHAPTERS.length - 1 ? 'The town is a little less afraid.' : 'Nabinpur is free.'),
            actions: [
              { label: G.chapterIdx < D.CHAPTERS.length - 1 ? 'NEXT CHAPTER ▶' : 'BACK TO MENU', primary: true, act: function () { A.click(); if (G.chapterIdx < D.CHAPTERS.length - 1) startChapter(G.chapterIdx + 1); else gotoMenu(); } },
              { label: 'CHAPTER LIST', act: function () { A.click(); G.match = null; openStory(); } }
            ]
          });
        });
      }, 900);
    } else {
      setTimeout(function () {
        showResult({
          kicker: 'DEFEATED',
          title: 'DOWN IN THE DUST',
          sub: 'You lost to ' + D.FIGHTERS[ch.opponent].name + '. The town waits a little longer.',
          actions: [
            { label: 'TRY AGAIN', primary: true, act: function () { A.click(); startChapter(G.chapterIdx); } },
            { label: 'CHAPTER LIST', act: function () { A.click(); G.match = null; openStory(); } }
          ]
        });
      }, 900);
    }
  }

  function onVersusEnd(winner) {
    G.inFight = false;
    var win = winner === 0 ? D.FIGHTERS[G.versus.p1].name : D.FIGHTERS[G.versus.p2].name;
    setTimeout(function () {
      showResult({
        kicker: 'VERSUS',
        title: win + ' WINS',
        sub: winner === 0 ? 'Clean fight.' : 'The town laughs at you.',
        actions: [
          { label: 'REMATCH', primary: true, act: function () { A.click(); startVersus(); } },
          { label: 'CHANGE FIGHTERS', act: function () { A.click(); G.match = null; openVersus(); } },
          { label: 'MAIN MENU', act: function () { A.click(); G.match = null; gotoMenu(); } }
        ]
      });
    }, 900);
  }

  function showResult(cfg) {
    document.getElementById('res-kicker').textContent = cfg.kicker;
    document.getElementById('res-title').textContent = cfg.title;
    document.getElementById('res-sub').textContent = cfg.sub;
    var box = document.getElementById('res-actions');
    box.innerHTML = '';
    cfg.actions.forEach(function (a) {
      var b = document.createElement('button');
      b.className = 'btn ' + (a.primary ? 'primary' : 'ghost');
      b.textContent = a.label;
      b.addEventListener('click', a.act);
      box.appendChild(b);
    });
    show('scr-result');
  }

  /* ============================================================
     PAUSE
     ============================================================ */
  function togglePause() {
    if (!G.match) return;
    if (G.match.paused) {
      G.match.paused = false;
      show(null);
      A.duck(false);
    } else {
      G.match.paused = true;
      show('scr-pause');
      A.duck(true);
    }
  }
  document.getElementById('btn-resume').addEventListener('click', function () { A.click(); togglePause(); });
  document.getElementById('btn-quit').addEventListener('click', function () {
    A.click(); G.match = null; G.inFight = false; A.duck(false); gotoMenu();
  });

  /* ============================================================
     VERSUS SELECT
     ============================================================ */
  function openVersus() {
    var grid = document.getElementById('vs-grid');
    grid.innerHTML = '';
    var ids = D.ORDER;
    ids.forEach(function (id) {
      var f = D.FIGHTERS[id];
      var el = document.createElement('button');
      el.className = 'vf';
      el.dataset.id = id;
      var cv = document.createElement('canvas');
      el.appendChild(cv);
      var b = document.createElement('b');
      b.textContent = f.name;
      el.appendChild(b);
      var badge = document.createElement('span');
      badge.className = 'badge';
      el.appendChild(badge);
      el.addEventListener('click', function () {
        A.click();
        // first click sets P1, then P2, then cycles back
        if (G.versus.p1 === id) { G.versus.p1 = G.versus.p2; G.versus.p2 = id; }
        else { G.versus.p1 = id; }
        // simple: clicking a fighter sets P1; shift-click sets P2
        refreshVersus();
      });
      el.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        A.click();
        G.versus.p2 = id;
        refreshVersus();
      });
      grid.appendChild(el);
    });
    refreshVersus();
    show('scr-versus');
  }

  function refreshVersus() {
    document.getElementById('vs-p1').textContent = D.FIGHTERS[G.versus.p1].name;
    document.getElementById('vs-p2').textContent = D.FIGHTERS[G.versus.p2].name;
    document.getElementById('vs-stage-name').textContent = D.STAGES[G.versus.stage].name;
    document.querySelectorAll('.vf').forEach(function (el) {
      var id = el.dataset.id;
      var isP1 = id === G.versus.p1, isP2 = id === G.versus.p2;
      el.classList.toggle('sel', isP1 || isP2);
      el.classList.toggle('p1', isP1);
      el.classList.toggle('p2', isP2);
      var badge = el.querySelector('.badge');
      if (badge) badge.textContent = isP1 && isP2 ? 'P1 / P2' : (isP1 ? 'P1' : (isP2 ? 'P2' : ''));
    });
  }

  document.getElementById('btn-stage').addEventListener('click', function () {
    A.click();
    var i = D.STAGE_ORDER.indexOf(G.versus.stage);
    G.versus.stage = D.STAGE_ORDER[(i + 1) % D.STAGE_ORDER.length];
    refreshVersus();
  });
  document.getElementById('btn-fight').addEventListener('click', function () { A.click(); startVersus(); });

  function paintVersusPortraits() {
    document.querySelectorAll('.vf').forEach(function (el) {
      var cv = el.querySelector('canvas');
      if (!cv) return;
      paintPortrait(cv, el.dataset.id, 'idle');
    });
  }

  /* ============================================================
     ROSTER
     ============================================================ */
  function openRoster() {
    var grid = document.getElementById('roster-grid');
    grid.innerHTML = '';
    D.ORDER.forEach(function (id) {
      var f = D.FIGHTERS[id];
      var el = document.createElement('div');
      el.className = 'rc';
      var cv = document.createElement('canvas');
      el.appendChild(cv);
      el.insertAdjacentHTML('beforeend',
        '<b>' + f.name + '</b>' +
        '<div class="bn2">' + f.bn + '</div>' +
        '<div class="role">' + f.role + '</div>' +
        '<p>' + f.bio + '</p>' +
        '<div class="role">special: ' + f.special.name + '</div>');
      grid.appendChild(el);
    });
    show('scr-roster');
  }

  function paintRosterPortraits() {
    document.querySelectorAll('.rc canvas').forEach(function (cv, i) {
      paintPortrait(cv, D.ORDER[i], 'idle');
    });
  }

  function paintPortrait(cv, id, anim) {
    var w = cv.clientWidth || 200, h = cv.clientHeight || 120;
    var dpr = Math.min(2, global.devicePixelRatio || 1);
    cv.width = w * dpr;
    cv.height = h * dpr;
    var c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, h);

    var def = D.FIGHTERS[id];
    var stub = {
      def: def, colors: def.colors, build: def.build,
      x: 0, y: 0, airY: 0, facing: 1,
      stateT: 0.9, anim: anim || 'idle', moveDur: 0,
      hitFlash: 0, vx: 0, state: 'idle',
      hairStyle: id === 'salma' ? 'pony' : (id === 'jontu' ? 'bald' : 'short'),
      moustache: ['rustom', 'jontu', 'chairman'].indexOf(id) >= 0,
      shades: id === 'chairman',
      weapon: id === 'bappi' ? 'lathi' : null
    };
    var sc = (h * 0.86) / 200;
    c.save();
    c.translate(w / 2, h * 0.98);
    c.scale(sc, sc);
    Art.drawFighter(c, stub, { noShadow: true });
    c.restore();
  }

  /* ============================================================
     OPTIONS
     ============================================================ */
  function syncOptions() {
    document.getElementById('opt-vol').value = Math.round((A.master ? A.master.gain.value : 0.85) * 100);
    document.getElementById('opt-music').value = Math.round((A.musicBus ? A.musicBus.gain.value / 0.5 : 0.5) * 100);
  }
  document.getElementById('opt-vol').addEventListener('input', function (e) {
    if (A.master) A.master.gain.value = e.target.value / 100;
  });
  document.getElementById('opt-music').addEventListener('input', function (e) {
    if (A.musicBus) A.musicBus.gain.value = (e.target.value / 100) * 0.5;
  });
  document.getElementById('btn-controls').addEventListener('click', function () { A.click(); show('scr-controls'); });
  document.getElementById('btn-controls-back').addEventListener('click', function () { A.click(); show('scr-options'); });
  document.getElementById('btn-reset').addEventListener('click', function () {
    A.click();
    Save.reset();
    this.textContent = 'ERASED';
    var self = this;
    setTimeout(function () { self.textContent = 'ERASE'; }, 1400);
  });

  /* ============================================================
     MAIN LOOP
     ============================================================ */
  var lastT = 0, acc = 0;
  var STEP = 1 / 60;

  function loop(ts) {
    if (!lastT) lastT = ts;
    var dt = Math.min(0.05, (ts - lastT) / 1000);
    lastT = ts;
    G.time += dt;

    // dialogue typewriter
    if (G.dlg) {
      G.dlg.update(dt);
      updateDialogueUI();
    }

    acc += dt;
    var guard = 0;
    while (acc >= STEP && guard++ < 5) {
      step(STEP);
      acc -= STEP;
    }

    render();
    requestAnimationFrame(loop);
  }

  function step(dt) {
    if (G.weather) G.weather.update(dt);

    if (G.match && !G.match.paused) {
      var in1 = buildPlayerInput();
      var in2 = G.brain ? G.brain.update(dt, G.match.p2, G.match.p1) : blankInput();
      G.match.update(dt, in1, in2);
      G.brain && G.brain.update === undefined;
      // update hp smoothing
      var t1 = G.match.p1.hp / G.match.p1.maxHp;
      var t2 = G.match.p2.hp / G.match.p2.maxHp;
      G.hpShown[0] += (t1 - G.hpShown[0]) * Math.min(1, dt * 4);
      G.hpShown[1] += (t2 - G.hpShown[1]) * Math.min(1, dt * 4);

      // shake
      var sh = G.match.shake;
      G.shakeX = (Math.random() - 0.5) * sh;
      G.shakeY = (Math.random() - 0.5) * sh;
      if (G.flash > 0) G.flash -= dt * 3;
    }

    G.press = {};
  }

  function blankInput() {
    return {
      left: false, right: false, up: false, down: false,
      lp: false, hp: false, kick: false, special: false, super: false,
      lpPressed: false, hpPressed: false, kickPressed: false,
      specialPressed: false, superPressed: false
    };
  }

  function buildPlayerInput() {
    var k = G.keys, p = G.press;
    return {
      left: !!(k['a'] || k['arrowleft']),
      right: !!(k['d'] || k['arrowright']),
      up: !!(p['w'] || p['arrowup']),
      down: !!(k['s'] || k['arrowdown']),
      lp: !!k['j'], hp: !!k['k'], kick: !!k['l'], special: !!k['u'], super: !!k['i'],
      lpPressed: !!p['j'], hpPressed: !!p['k'], kickPressed: !!p['l'],
      specialPressed: !!p['u'], superPressed: !!p['i']
    };
  }

  /* ============================================================
     RENDER
     ============================================================ */
  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);

    if (G.match) {
      drawFight();
    } else {
      drawIdleBackdrop();
    }
  }

  function drawIdleBackdrop() {
    var stage = D.STAGES[G.screen === 'scr-story' ? 'teastall' : 'bazar'];
    var cam = { x: D.WORLD_W / 2, zoom: W / 1180 };
    ctx.fillStyle = '#06070a';
    ctx.fillRect(0, 0, W, H);
    Art.drawStage(ctx, stage, cam, W, H, G.time, null);
    ctx.fillStyle = 'rgba(5,6,9,0.55)';
    ctx.fillRect(0, 0, W, H);
  }

  function drawFight() {
    var m = G.match;
    var cam = m.cam;
    var groundY = H * 0.80;

    ctx.fillStyle = '#050608';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(G.shakeX, G.shakeY);

    // ---- stage ----
    Art.drawStage(ctx, m.stage, cam, W, H, G.time, G.weather);

    // ---- weather ----
    if (G.weather) G.weather.draw(ctx);

    // ---- fighters ----
    ctx.save();
    ctx.translate(W / 2 - cam.x * cam.zoom, groundY);
    ctx.scale(cam.zoom, cam.zoom);

    // speed lines behind during super
    if (m.superFx > 0) {
      ctx.save();
      ctx.globalAlpha = m.superFx * 0.5;
      ctx.strokeStyle = '#fff';
      for (var i = 0; i < 26; i++) {
        var yy = -300 + Math.random() * 300;
        ctx.lineWidth = 1 + Math.random() * 2;
        ctx.beginPath();
        ctx.moveTo(-900 + Math.random() * 300, yy);
        ctx.lineTo(900 + Math.random() * 300, yy);
        ctx.stroke();
      }
      ctx.restore();
    }

    // back fighter drawn first
    var order = m.p1.x <= m.p2.x ? [m.p1, m.p2] : [m.p2, m.p1];
    order.forEach(function (f) { Art.drawFighter(ctx, f); });

    ctx.restore();

    // ---- effects ----
    m.effects.draw(ctx, groundY, cam, cam.zoom, W);

    ctx.restore();

    // ---- super flash ----
    if (m.superFx > 0) {
      ctx.fillStyle = 'rgba(255,255,255,' + (m.superFx * 0.35) + ')';
      ctx.fillRect(0, 0, W, H);
    }

    if (!G.dlg) drawHUD(m);

    // ---- banner ----
    if (m.bannerT > 0 && m.banner && !G.dlg) {
      drawBanner(m.banner, m.bannerSub, m.bannerT);
    }
  }

  function drawBanner(txt, sub, t) {
    var k = Math.min(1, (2.4 - t) * 6);
    var fade = Math.min(1, t * 2.2);
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.textAlign = 'center';
    var y = H * 0.34;
    var scale = 1 + (1 - Math.min(1, k)) * 0.5;
    ctx.translate(W / 2, y);
    ctx.scale(scale, scale);
    ctx.font = '900 76px "Trebuchet MS", sans-serif';
    ctx.lineWidth = 10;
    ctx.strokeStyle = 'rgba(0,0,0,0.75)';
    ctx.strokeText(txt, 0, 0);
    var g = ctx.createLinearGradient(0, -60, 0, 20);
    g.addColorStop(0, '#fff6d8');
    g.addColorStop(1, '#e0a020');
    ctx.fillStyle = g;
    ctx.fillText(txt, 0, 0);
    if (sub) {
      ctx.font = '600 18px "Trebuchet MS", sans-serif';
      ctx.fillStyle = 'rgba(240,230,210,0.85)';
      ctx.fillText(sub, 0, 34);
    }
    ctx.restore();
  }

  /* ---------------- HUD ---------------- */
  function drawHUD(m) {
    var p1 = m.p1, p2 = m.p2;
    var barW = 470, barH = 24, y = 30;

    // ----- p1 bar (left) -----
    healthBar(48, y, barW, barH, p1.hp / p1.maxHp, G.hpShown[0], 1);
    healthBar(W - 48 - barW, y, barW, barH, p2.hp / p2.maxHp, G.hpShown[1], -1);

    // names
    ctx.font = '800 17px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f2ebda';
    ctx.fillText(p1.name, 52, y + barH + 24);
    ctx.textAlign = 'right';
    ctx.fillText(p2.name, W - 52, y + barH + 24);
    ctx.font = '500 11px "Trebuchet MS", sans-serif';
    ctx.fillStyle = 'rgba(200,190,170,0.55)';
    ctx.textAlign = 'left';
    ctx.fillText(p1.def.role.toUpperCase(), 52, y + barH + 40);
    ctx.textAlign = 'right';
    ctx.fillText(p2.def.role.toUpperCase(), W - 52, y + barH + 40);

    // ----- timer -----
    var cx = W / 2, cy = y + barH / 2 + 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 42, 0, 6.284);
    ctx.fillStyle = 'rgba(8,9,12,0.86)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = m.timer < 10 ? '#e5544a' : 'rgba(212,175,55,0.8)';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 36, -Math.PI / 2, -Math.PI / 2 + (m.timer / 60) * 6.284);
    ctx.strokeStyle = m.timer < 10 ? 'rgba(229,84,74,0.55)' : 'rgba(212,175,55,0.35)';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.font = '900 34px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = m.timer < 10 ? '#ff8f83' : '#f0e6c8';
    ctx.fillText(Math.ceil(m.timer), cx, cy + 12);

    // round pips
    var need = Math.ceil(m.rounds / 2);
    for (var i = 0; i < need; i++) {
      pip(cx - 62 - i * 20, cy + 4, m.wins[0] > i, -1);
      pip(cx + 62 + i * 20, cy + 4, m.wins[1] > i, 1);
    }

    // ----- super meters -----
    meterBar(48, H - 44, 320, 14, p1.meter / 100, 1);
    meterBar(W - 48 - 320, H - 44, 320, 14, p2.meter / 100, -1);
    ctx.font = '700 10px "Trebuchet MS", sans-serif';
    ctx.fillStyle = 'rgba(220,210,190,0.6)';
    ctx.textAlign = 'left';
    ctx.fillText('SUPER', 48, H - 50);
    ctx.textAlign = 'right';
    ctx.fillText('SUPER', W - 48, H - 50);

    // combo
    if (p1.comboHits > 1) comboTxt(p1.comboHits, 120, 210, '#ffd166');
    if (p2.comboHits > 1) comboTxt(p2.comboHits, W - 120, 210, '#ff8f83', true);

    // always-visible way out
    ctx.font = '700 11px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(225,215,195,0.42)';
    ctx.fillText('ESC  ·  PAUSE', W / 2, H - 10);
  }

  function pip(x, y, on, dir) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(0, -7); ctx.lineTo(7, 0); ctx.lineTo(0, 7); ctx.lineTo(-7, 0);
    ctx.closePath();
    ctx.fillStyle = on ? '#d4af37' : 'rgba(255,255,255,0.12)';
    ctx.fill();
    ctx.strokeStyle = on ? '#f0d67a' : 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  function healthBar(x, y, w, h, frac, ghost, dir) {
    // frame
    ctx.save();
    ctx.translate(x, y);
    // skew for style
    ctx.beginPath();
    var sk = 10;
    if (dir > 0) {
      ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w - sk, h); ctx.lineTo(0, h);
    } else {
      ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w, h); ctx.lineTo(sk, h);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(6,7,10,0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(212,175,55,0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.clip();
    // ghost (recent damage)
    var gw = w * ghost;
    ctx.fillStyle = 'rgba(255,120,110,0.45)';
    if (dir > 0) ctx.fillRect(0, 0, gw, h);
    else ctx.fillRect(w - gw, 0, gw, h);

    // main
    var fw = w * frac;
    var g = ctx.createLinearGradient(0, 0, 0, h);
    if (frac > 0.5) { g.addColorStop(0, '#ffe9a8'); g.addColorStop(1, '#d4a017'); }
    else if (frac > 0.22) { g.addColorStop(0, '#ffd27a'); g.addColorStop(1, '#e07a2f'); }
    else { g.addColorStop(0, '#ff8f7a'); g.addColorStop(1, '#b3352c'); }
    ctx.fillStyle = g;
    if (dir > 0) ctx.fillRect(0, 0, fw, h);
    else ctx.fillRect(w - fw, 0, fw, h);

    // gloss
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(0, 0, w, h * 0.4);
    ctx.restore();
    ctx.restore();
  }

  function meterBar(x, y, w, h, frac, dir) {
    ctx.save();
    ctx.fillStyle = 'rgba(6,7,10,0.8)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(120,200,220,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    var fw = w * frac;
    var g = ctx.createLinearGradient(x, y, x + w, y);
    if (frac >= 1) {
      g.addColorStop(0, '#7fe7ff');
      g.addColorStop(0.5, '#ffffff');
      g.addColorStop(1, '#7fe7ff');
    } else {
      g.addColorStop(0, '#1f6f8b');
      g.addColorStop(1, '#54c8e8');
    }
    ctx.fillStyle = g;
    if (dir > 0) ctx.fillRect(x, y, fw, h);
    else ctx.fillRect(x + w - fw, y, fw, h);
    if (frac >= 1) {
      ctx.globalAlpha = 0.35 + Math.sin(G.time * 8) * 0.2;
      ctx.fillStyle = '#fff';
      ctx.fillRect(x, y, w, h);
      ctx.globalAlpha = 1;
      ctx.font = '800 9px "Trebuchet MS", sans-serif';
      ctx.fillStyle = '#062028';
      ctx.textAlign = 'center';
      ctx.fillText('SUPER READY', x + w / 2, y + h - 3);
    }
    ctx.restore();
  }

  function comboTxt(n, x, y, col, right) {
    ctx.save();
    ctx.textAlign = right ? 'right' : 'left';
    ctx.font = '900 40px "Trebuchet MS", sans-serif';
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.strokeText(n, x, y);
    ctx.fillStyle = col;
    ctx.fillText(n, x, y);
    ctx.font = '800 13px "Trebuchet MS", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('HIT COMBO', x + (right ? -46 : 46), y - 4);
    ctx.restore();
  }

  /* ============================================================
     BOOT
     ============================================================ */
  Save.load();
  A.init();
  requestAnimationFrame(loop);

  // start music after first interaction
  var started = false;
  function kick() {
    if (started) return;
    started = true;
    A.resume();
    A.playMusic('town');
  }
  global.addEventListener('pointerdown', kick, { once: true });
  global.addEventListener('keydown', kick, { once: true });

  MM.Game = G;
})(window);
