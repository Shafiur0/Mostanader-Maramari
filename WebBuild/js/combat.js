/* ============================================================
   MOSTANADER MARAMARI — combat.js
   Fighter state machine, hit resolution, rounds, camera, effects.
   ============================================================ */
(function (global) {
  'use strict';
  var MM = global.MM || (global.MM = {});
  var D = MM.Data;
  var A = MM.Audio;

  var GRAV = 2650;
  var ARENA_L = 150;
  var ARENA_R = D.WORLD_W - 150;
  var PUSHBOX = 92;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  /* ============================================================
     EFFECTS
     ============================================================ */
  function Effects() { this.list = []; }
  Effects.prototype.spark = function (x, y, power, dir) {
    var n = 8 + Math.floor(power * 6);
    for (var i = 0; i < n; i++) {
      var a = rnd(-1.4, 1.4) + (dir > 0 ? 0 : Math.PI);
      this.list.push({
        t: 0, dur: rnd(0.18, 0.42), type: 'spark',
        x: x, y: y, vx: Math.cos(a) * rnd(180, 620) * power, vy: Math.sin(a) * rnd(180, 620) * power - 90,
        r: rnd(1.6, 4.2), col: i % 3 === 0 ? '#fff' : (i % 3 === 1 ? '#ffd166' : '#ff7b3d')
      });
    }
    this.list.push({ t: 0, dur: 0.16, type: 'flash', x: x, y: y, r: 26 + power * 22 });
    this.list.push({ t: 0, dur: 0.30, type: 'ring', x: x, y: y, r: 10, grow: 120 * power });
  };
  Effects.prototype.dust = function (x, y, n, spread) {
    n = n || 6; spread = spread || 1;
    for (var i = 0; i < n; i++) {
      this.list.push({
        t: 0, dur: rnd(0.4, 0.9), type: 'dust',
        x: x + rnd(-14, 14), y: y,
        vx: rnd(-90, 90) * spread, vy: rnd(-70, -20),
        r: rnd(6, 16), a: rnd(0.10, 0.26)
      });
    }
  };
  Effects.prototype.debris = function (x, y, n) {
    n = n || 8;
    for (var i = 0; i < n; i++) {
      this.list.push({
        t: 0, dur: rnd(0.5, 1.1), type: 'debris',
        x: x, y: y, vx: rnd(-260, 260), vy: rnd(-460, -160),
        r: rnd(2, 5), rot: rnd(0, 6.28), vr: rnd(-12, 12),
        col: ['#8f3b24', '#b85436', '#6b4a30'][i % 3]
      });
    }
  };
  Effects.prototype.text = function (x, y, txt, col, size) {
    this.list.push({ t: 0, dur: 0.75, type: 'text', x: x, y: y, txt: txt, col: col || '#fff', size: size || 26 });
  };
  Effects.prototype.after = function (f) {
    this.list.push({ t: 0, dur: 0.22, type: 'after', f: f, x: f.x, y: f.y, airY: f.airY, facing: f.facing });
  };
  Effects.prototype.update = function (dt) {
    for (var i = this.list.length - 1; i >= 0; i--) {
      var e = this.list[i];
      e.t += dt;
      if (e.t >= e.dur) { this.list.splice(i, 1); continue; }
      if (e.type === 'spark') {
        e.x += e.vx * dt; e.y += e.vy * dt; e.vy += 1400 * dt; e.vx *= 0.94;
      } else if (e.type === 'dust') {
        e.x += e.vx * dt; e.y += e.vy * dt; e.vy += 60 * dt; e.vx *= 0.96; e.r += 14 * dt;
      } else if (e.type === 'debris') {
        e.x += e.vx * dt; e.y += e.vy * dt; e.vy += 1500 * dt; e.rot += e.vr * dt;
      } else if (e.type === 'text') {
        e.y -= 46 * dt;
      }
    }
  };
  Effects.prototype.draw = function (ctx, groundY, cam, zoom, W) {
    var sx = function (x) { return W / 2 + (x - cam.x) * zoom; };
    var sy = function (y, airY) { return groundY + (y + airY) * zoom; };
    for (var i = 0; i < this.list.length; i++) {
      var e = this.list[i], k = e.t / e.dur;
      ctx.save();
      if (e.type === 'spark') {
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = e.col;
        ctx.beginPath();
        ctx.arc(sx(e.x), sy(0, -e.y), e.r * (1 - k * 0.4), 0, 6.284);
        ctx.fill();
      } else if (e.type === 'flash') {
        ctx.globalAlpha = (1 - k) * 0.9;
        var g = ctx.createRadialGradient(sx(e.x), sy(0, -e.y), 1, sx(e.x), sy(0, -e.y), e.r * (1 + k));
        g.addColorStop(0, 'rgba(255,255,255,0.95)');
        g.addColorStop(0.5, 'rgba(255,220,150,0.35)');
        g.addColorStop(1, 'rgba(255,180,90,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(sx(e.x), sy(0, -e.y), e.r * (1 + k), 0, 6.284); ctx.fill();
      } else if (e.type === 'ring') {
        ctx.globalAlpha = (1 - k) * 0.7;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3 * (1 - k);
        ctx.beginPath();
        ctx.arc(sx(e.x), sy(0, -e.y), e.r + e.grow * k, 0, 6.284);
        ctx.stroke();
      } else if (e.type === 'dust') {
        ctx.globalAlpha = e.a * (1 - k);
        ctx.fillStyle = '#d8c8a8';
        ctx.beginPath();
        ctx.arc(sx(e.x), sy(0, -e.y), e.r * (1 + k * 1.4), 0, 6.284);
        ctx.fill();
      } else if (e.type === 'debris') {
        ctx.globalAlpha = 1 - k * 0.6;
        ctx.fillStyle = e.col;
        ctx.translate(sx(e.x), sy(0, -e.y));
        ctx.rotate(e.rot);
        ctx.fillRect(-e.r, -e.r * 0.6, e.r * 2, e.r * 1.2);
      } else if (e.type === 'text') {
        ctx.globalAlpha = 1 - Math.pow(k, 2);
        ctx.font = '700 ' + e.size + 'px Rajdhani, "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(0,0,0,0.65)';
        ctx.strokeText(e.txt, sx(e.x), sy(0, -e.y));
        ctx.fillStyle = e.col;
        ctx.fillText(e.txt, sx(e.x), sy(0, -e.y));
      }
      ctx.restore();
    }
  };

  /* ============================================================
     FIGHTER
     ============================================================ */
  function Fighter(id, side) {
    var def = D.FIGHTERS[id];
    this.def = def;
    this.id = id;
    this.side = side;               // 0 = player, 1 = opponent
    this.name = def.name;
    this.colors = def.colors;
    this.build = def.build;
    this.stats = def.stats;
    this.weapon = id === 'bappi' ? 'lathi' : null;
    this.hairStyle = id === 'salma' ? 'pony' : (id === 'jontu' ? 'bald' : 'short');
    this.moustache = (id === 'rustom' || id === 'jontu' || id === 'chairman');
    this.shades = id === 'chairman';

    this.maxHp = def.stats.hp;
    this.hp = this.maxHp;
    this.meter = 0;
    this.x = 0;
    this.y = 0;
    this.airY = 0;
    this.vx = 0;
    this.vy = 0;
    this.facing = side === 0 ? 1 : -1;
    this.state = 'idle';
    this.stateT = 0;
    this.anim = 'idle';
    this.move = null;
    this.moveDur = 0;
    this.moveHit = false;
    this.hitFlash = 0;
    this.blocking = false;
    this.crouchBlock = false;
    this.grounded = true;
    this.comboHits = 0;
    this.comboTimer = 0;
    this.invuln = 0;
    this.superHits = 0;
    this.superDone = 0;
    this.dashDir = 1;
    this.lastTap = { left: -1, right: -1 };
    this.armour = false;
    this.hurtCount = 0;
    this.aiFlash = 0;
  }

  Fighter.prototype.canAct = function () {
    if (this.state === 'ko' || this.state === 'win' || this.state === 'intro' || this.state === 'hit' || this.state === 'blockstun') return false;
    if (this.state === 'attack') {
      // cancel window: only if the move already connected
      if (this.moveHit && this.stateT > (this.move.startup + this.move.active) / 60) return true;
      return false;
    }
    if (this.state === 'super') return false;
    return true;
  };

  Fighter.prototype.startMove = function (mv) {
    this.state = 'attack';
    this.stateT = 0;
    this.move = mv;
    this.moveDur = (mv.startup + mv.active + mv.recovery) / 60;
    this.moveHit = false;
    this.anim = mv.anim || 'punchL';
    if (mv.key === 'lp' || mv.key === 'hp') A.whoosh(0.2);
    else if (mv.key === 'kick' || mv.key === 'low') A.whoosh(0.24);
    else if (mv.key === 'jumpAtk') A.whoosh(0.2);
    this.armour = !!mv.armour;
  };

  Fighter.prototype.hurt = function (dmg, stun, kb, dir, blocked) {
    if (this.state === 'ko') return;
    if (blocked) {
      this.hp = Math.max(0, this.hp - dmg);
      this.state = 'blockstun';
      this.stateT = 0;
      this.anim = this.crouchBlock ? 'block' : 'block';
      this.vx = dir * kb * 0.35;
      this.meter = Math.min(100, this.meter + 4);
    } else {
      this.hp = Math.max(0, this.hp - dmg);
      this.state = 'hit';
      this.stateT = 0;
      this.anim = 'hit';
      this.vx = dir * kb;
      this.hitFlash = 0.05;
      this.comboHits++;
      this.comboTimer = 1.2;
      this.meter = Math.min(100, this.meter + 5);
      if (this.hp <= 0) {
        this.state = 'ko';
        this.stateT = 0;
        this.anim = 'ko';
        this.vx = dir * kb * 1.4;
      }
    }
  };

  Fighter.prototype.update = function (dt, inp, opp) {
    this.stateT += dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.comboTimer > 0) { this.comboTimer -= dt; if (this.comboTimer <= 0) this.comboHits = 0; }
    if (this.invuln > 0) this.invuln -= dt;

    if (this.state === 'ko') {
      this.vx *= 0.90;
      this.x += this.vx * dt;
      this.vy -= GRAV * dt;
      this.airY += this.vy * dt;
      if (this.airY < 0) { this.airY = 0; this.vy = 0; }
      this.anim = 'ko';
      this.x = clamp(this.x, ARENA_L, ARENA_R);
      return;
    }

    // face the opponent when grounded and neutral
    if (this.grounded && (this.state === 'idle' || this.state === 'walk' || this.state === 'crouch' || this.state === 'block')) {
      this.facing = opp.x >= this.x ? 1 : -1;
    }

    var spd = this.stats.walk;
    var wantBlock = false;

    if (this.canAct() && inp) {
      // ---- movement ----
      if (this.grounded) {
        var backKey = this.facing > 0 ? inp.left : inp.right;
        var crouchBlocking = inp.down && backKey;

        if (crouchBlocking) {
          // crouch block: hold position, guard low
          if (this.state !== 'block') { this.state = 'block'; this.stateT = 0; }
          this.crouchBlock = true;
        } else if (backKey) {
          // guard-walk: retreat while keeping your guard up
          if (this.state !== 'block') { this.state = 'block'; this.stateT = 0; }
          this.crouchBlock = false;
          this.x -= this.facing * spd * 0.82 * dt;
          this.walkDir = -this.facing;
        } else if (inp.down) {
          if (this.state !== 'crouch') { this.state = 'crouch'; this.stateT = 0; }
          this.crouchBlock = false;
        } else {
          if (this.state === 'crouch' || this.state === 'block') { this.state = 'idle'; this.stateT = 0; }
          this.crouchBlock = false;
          var mv = 0;
          if (inp.left) mv -= 1;
          if (inp.right) mv += 1;
          if (mv !== 0) {
            this.x += mv * spd * dt;
            if (this.state !== 'walk') { this.state = 'walk'; this.stateT = 0; }
            this.walkDir = mv;
          } else if (this.state === 'walk') { this.state = 'idle'; this.stateT = 0; }
        }

        // jump (allowed out of a guard — you jump backwards)
        if (inp.up && this.state !== 'attack') {
          this.vy = this.stats.jump;
          this.airY = 0.01;
          this.grounded = false;
          this.state = 'jump';
          this.stateT = 0;
          this.anim = 'jump';
          A.jump();
        }
      }
    }

    // ---- attacks ----
    if (inp && this.canAct()) {
      var mvk = null;
      if (inp.superPressed && this.meter >= 100) mvk = 'super';
      else if (inp.specialPressed && this.meter >= 50) mvk = 'special';
      else if (!this.grounded && (inp.lpPressed || inp.hpPressed || inp.kickPressed)) mvk = 'jumpAtk';
      else if (this.grounded && inp.lpPressed) mvk = inp.down ? 'low' : 'lp';
      else if (this.grounded && inp.hpPressed) mvk = 'hp';
      else if (this.grounded && inp.kickPressed) mvk = inp.down ? 'low' : 'kick';

      if (mvk === 'super') {
        this.meter = 0;
        this.state = 'super';
        this.stateT = 0;
        this.anim = 'superRush';
        this.moveDur = 1.15;
        this.superHits = 0;
        this.superDone = 0;
        this.invuln = 0.35;
        this.move = this.def.super;
        A.voice(0.8);
      } else if (mvk === 'special') {
        this.meter -= 50;
        var sp = this.def.special;
        var mv = {};
        for (var k in sp) mv[k] = sp[k];
        mv.key = 'special';
        this.startMove(mv);
        A.voice(1.0);
      } else if (mvk) {
        var base = D.BASE_MOVES[mvk];
        var m2 = {};
        for (var kk in base) m2[kk] = base[kk];
        // weight scaling
        m2.dmg *= (this.stats.weight > 1.2 ? 1.18 : 1.0);
        this.startMove(m2);
      }
    }

    // ---- attack progression ----
    if (this.state === 'attack') {
      if (this.stateT >= this.moveDur) {
        this.state = this.grounded ? 'idle' : 'fall';
        this.stateT = 0;
        this.move = null;
        this.armour = false;
      }
    }

    if (this.state === 'hit') {
      if (this.stateT >= (this.move ? 0.2 : 0.24)) {
        this.state = this.grounded ? 'idle' : 'fall';
        this.stateT = 0;
      }
    }
    if (this.state === 'blockstun') {
      if (this.stateT >= 0.16) { this.state = this.grounded ? 'block' : 'fall'; this.stateT = 0; }
    }
    if (this.state === 'super') {
      if (this.stateT >= this.moveDur) {
        this.state = 'idle';
        this.stateT = 0;
        this.move = null;
      }
    }

    // ---- physics ----
    if (!this.grounded) {
      this.vy -= GRAV * dt;
      this.airY += this.vy * dt;
      if (this.airY <= 0) {
        this.airY = 0;
        this.vy = 0;
        this.grounded = true;
        this.state = 'idle';
        this.stateT = 0;
        this.anim = 'idle';
        A.land();
        if (this.onLand) this.onLand();
      } else {
        this.anim = this.state === 'attack' ? this.anim : (this.vy > 0 ? 'jump' : 'fall');
      }
    }

    // friction on knockback
    if (this.state === 'hit' || this.state === 'blockstun' || this.state === 'ko') {
      this.x += this.vx * dt;
      this.vx *= 0.88;
    } else {
      this.vx *= 0.80;
      this.x += this.vx * dt;
    }

    // anim selection for grounded neutral
    if (this.grounded && this.state === 'idle') this.anim = 'idle';
    if (this.state === 'walk') this.anim = 'walk';
    if (this.state === 'crouch') this.anim = 'crouch';
    if (this.state === 'block') this.anim = this.crouchBlock ? 'crouch' : 'block';
    if (this.state === 'jump') this.anim = 'jump';

    this.x = clamp(this.x, ARENA_L, ARENA_R);
  };

  /* ---- hitbox ---- */
  Fighter.prototype.hitbox = function () {
    if (this.state !== 'attack' || !this.move) return null;
    var t = this.stateT * 60;
    var m = this.move;
    if (t < m.startup || t > m.startup + m.active) return null;
    var reach = m.reach * (this.build.w * 0.35 + 0.72);
    var x1 = this.x + (this.facing > 0 ? 18 : -18 - reach);
    var band;
    if (m.h === 'high') band = [-200, -96];
    else if (m.h === 'low') band = [-74, 0];
    else band = [-150, -34];
    if (m.key === 'jumpAtk') band = [-190, -40];
    return {
      x1: x1, x2: x1 + reach,
      y1: this.airY + band[0], y2: this.airY + band[1],
      move: m, h: m.h
    };
  };

  Fighter.prototype.hurtbox = function () {
    var top = this.state === 'crouch' || (this.state === 'block' && this.crouchBlock) ? -104 : -196;
    if (this.state === 'ko') top = -60;
    return { x1: this.x - 34 * this.build.w, x2: this.x + 34 * this.build.w, y1: this.airY + top, y2: this.airY };
  };

  /* ============================================================
     MATCH
     ============================================================ */
  function Match(cfg) {
    this.cfg = cfg || {};
    this.stage = D.STAGES[this.cfg.stage || 'bazar'];
    this.p1 = new Fighter(this.cfg.p1 || 'mostafa', 0);
    this.p2 = new Fighter(this.cfg.p2 || 'kalachan', 1);
    this.p1.x = D.WORLD_W / 2 - 150;
    this.p2.x = D.WORLD_W / 2 + 150;
    this.p1.facing = 1; this.p2.facing = -1;
    this.round = 1;
    this.wins = [0, 0];
    this.timer = 60;
    this.state = 'intro';
    this.stateT = 0;
    this.hitstop = 0;
    this.shake = 0;
    this.slowmo = 1;
    this.effects = new Effects();
    this.cam = { x: D.WORLD_W / 2, zoom: 1.1, targetX: D.WORLD_W / 2, targetZoom: 1.1 };
    this.rounds = cfg.rounds || 3;
    this.banner = null;
    this.bannerT = 0;
    this.superFx = 0;
    this.onEnd = null;
    this.paused = false;
    this.dustT = 0;
    this.finished = false;
    this.difficulty = cfg.diff || null;
    this.hudFlash = [0, 0];
  }

  Match.prototype.setBanner = function (txt, sub, dur) {
    this.banner = txt;
    this.bannerSub = sub;
    this.bannerT = dur || 1.4;
  };

  Match.prototype.update = function (dt, in1, in2) {
    if (this.paused) return;

    if (this.hitstop > 0) {
      this.hitstop -= dt;
      this.effects.update(dt * 0.35);
      this.updateCam(dt);
      return;
    }

    this.stateT += dt;

    if (this.bannerT > 0) this.bannerT -= dt;

    if (this.state === 'intro') {
      this.p1.state = 'intro'; this.p2.state = 'intro';
      this.p1.anim = 'intro'; this.p2.anim = 'intro';
      if (this.stateT > 0.1) this.setBanner('ROUND ' + this.round, this.stage.name, 1.2);
      if (this.stateT > 1.9) {
        this.state = 'fight';
        this.stateT = 0;
        this.p1.state = 'idle'; this.p2.state = 'idle';
        this.setBanner('FIGHT!', '', 0.9);
        A.bell();
      }
      this.p1.update(dt, null, this.p2);
      this.p2.update(dt, null, this.p1);
      this.updateCam(dt);
      return;
    }

    if (this.state === 'fight') {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.timer = 0;
        this.endRound(this.p1.hp >= this.p2.hp ? 0 : 1, 'TIME');
        return;
      }
      this.p1.update(dt, in1, this.p2);
      this.p2.update(dt, in2, this.p1);
      this.resolveCollisions();
      this.resolveHits();
      this.handleSuper(dt);
    } else if (this.state === 'roundend') {
      this.p1.update(dt, null, this.p2);
      this.p2.update(dt, null, this.p1);
      if (this.stateT > 2.6) this.nextRound();
    } else if (this.state === 'matchend') {
      this.p1.update(dt, null, this.p2);
      this.p2.update(dt, null, this.p1);
      if (this.stateT > 0.6 && !this.finished) {
        this.finished = true;
        if (this.onEnd) this.onEnd(this.wins[0] > this.wins[1] ? 0 : 1);
      }
    }

    // ambient dust while walking
    this.dustT += dt;
    if (this.dustT > 0.16) {
      this.dustT = 0;
      [this.p1, this.p2].forEach(function (f) {
        if (f.state === 'walk') this.effects.dust(f.x - f.facing * 10, 0, 1, 0.4);
      }, this);
    }

    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 42);
    if (this.superFx > 0) this.superFx = Math.max(0, this.superFx - dt * 1.6);

    this.effects.update(dt);
    this.updateCam(dt);
  };

  Match.prototype.resolveCollisions = function () {
    var a = this.p1, b = this.p2;
    var d = b.x - a.x;
    var minD = PUSHBOX;
    if (Math.abs(d) < minD && a.state !== 'ko' && b.state !== 'ko') {
      var push = (minD - Math.abs(d)) / 2;
      var s = d >= 0 ? 1 : -1;
      a.x -= push * s;
      b.x += push * s;
      a.x = clamp(a.x, ARENA_L, ARENA_R);
      b.x = clamp(b.x, ARENA_L, ARENA_R);
    }
  };

  Match.prototype.resolveHits = function () {
    var self = this;
    function tryHit(atk, def) {
      var hb = atk.hitbox();
      if (!hb || atk.moveHit) return;
      var hu = def.hurtbox();
      if (def.invuln > 0 || def.state === 'ko') return;
      var ox = hb.x1 < hu.x2 && hb.x2 > hu.x1;
      var oy = hb.y1 < hu.y2 && hb.y2 > hu.y1;
      if (!ox || !oy) return;

      atk.moveHit = true;
      var m = hb.move;

      // block check
      var canBlock = (def.state === 'block' || def.state === 'blockstun');
      var blockOk = false;
      if (canBlock) {
        var isCrouch = def.crouchBlock;
        if (isCrouch) blockOk = (m.h !== 'high');
        else blockOk = (m.h !== 'low');
        if (m.key === 'jumpAtk') blockOk = !isCrouch;
        if (m.unblockable) blockOk = false;
      }
      // armour
      if (def.armour && !blockOk) {
        def.hp = Math.max(0, def.hp - m.dmg * 0.35);
        self.effects.spark(def.x + def.facing * -20, -110, 0.7, atk.facing);
        return;
      }

      var dir = atk.facing;
      var hx = (hb.x1 + hb.x2) / 2;
      var hy = (hb.y1 + hb.y2) / 2;

      if (blockOk) {
        def.hurt(m.dmg * (m.chip || 0.1), m.blockstun, m.kb, dir, true);
        self.hitstop = m.hitstop * 0.6 / 60;
        self.shake = Math.min(9, self.shake + 3);
        self.effects.spark(hx, -hy, 0.5, dir);
        A.block();
        atk.meter = Math.min(100, atk.meter + m.meter * 0.3);
        def.meter = Math.min(100, def.meter + 3);
        self.hudFlash[def.side] = 0.16;
      } else {
        var dmg = m.dmg * (atk.comboHits > 0 ? 0.86 : 1);
        def.hurt(dmg, m.hitstun, m.kb, dir, false);
        self.hitstop = m.hitstop / 60;
        self.shake = Math.min(22, self.shake + 5 + m.dmg * 0.5);
        self.effects.spark(hx, -hy, 1 + m.dmg * 0.06, dir);
        self.effects.dust(def.x, 0, 4, 1);
        A.hit(Math.min(1.4, 0.6 + m.dmg * 0.05), m.dmg > 9 ? 0.8 : 1);
        atk.meter = Math.min(100, atk.meter + m.meter);
        if (atk.comboHits > 1) {
          self.effects.text(def.x, -230, atk.comboHits + ' HIT', '#ffd166', 30);
        }
        if (def.hp <= 0) {
          self.endRound(atk.side, 'KO');
        }
      }
    }
    tryHit(this.p1, this.p2);
    tryHit(this.p2, this.p1);
  };

  Match.prototype.handleSuper = function (dt) {
    var self = this;
    [this.p1, this.p2].forEach(function (f) {
      if (f.state !== 'super') return;
      var opp = f === self.p1 ? self.p2 : self.p1;
      var t = f.stateT;
      var s = f.def.super;
      if (t < 0.05) {
        self.superFx = 1;
        self.setBanner(s.name, f.def.bn, 1.1);
        self.shake = 10;
        A.bell();
      }
      var windows = [];
      for (var i = 0; i < s.hits; i++) windows.push(0.16 + i * 0.14);
      for (var w = 0; w < windows.length; w++) {
        if (f.superDone <= w && t >= windows[w]) {
          f.superDone = w + 1;
          var dist = Math.abs(opp.x - f.x);
          if (dist < 190 && opp.state !== 'ko') {
            var dmg = s.dmg / s.hits;
            opp.hurt(dmg, 14, 60, f.facing, false);
            opp.invuln = 0;
            self.hitstop = 0.06;
            self.shake = Math.min(26, self.shake + 6);
            self.effects.spark(opp.x, -120, 1.5, f.facing);
            A.hit(1.2, 0.7);
            self.effects.text(opp.x, -240, (w + 1) + '/' + s.hits, '#ff6b6b', 24);
            if (opp.hp <= 0) self.endRound(f.side, 'KO');
          }
        }
      }
    });
  };

  Match.prototype.endRound = function (winnerSide, reason) {
    if (this.state === 'roundend' || this.state === 'matchend') return;
    this.wins[winnerSide]++;
    this.state = 'roundend';
    this.stateT = 0;
    var loser = winnerSide === 0 ? this.p2 : this.p1;
    var win = winnerSide === 0 ? this.p1 : this.p2;
    if (loser.state !== 'ko') {
      loser.state = 'ko';
      loser.anim = 'ko';
      loser.stateT = 0;
    }
    win.state = 'win';
    win.anim = 'win';
    win.stateT = 0;
    this.setBanner(reason === 'TIME' ? 'TIME UP' : 'K.O.', winnerSide === 0 ? 'YOU WIN THE ROUND' : 'YOU LOSE THE ROUND', 2.2);
    A.ko();
    this.shake = 26;
    this.slowmo = 0.35;
    this.effects.dust(loser.x, 0, 10, 2.2);
    this.effects.debris(loser.x, -40, 10);
    this.lastWinner = winnerSide;
    var need = Math.ceil(this.rounds / 2);
    if (this.wins[0] >= need || this.wins[1] >= need) {
      this.matchOver = true;
    }
  };

  Match.prototype.nextRound = function () {
    if (this.wins[0] >= Math.ceil(this.rounds / 2) || this.wins[1] >= Math.ceil(this.rounds / 2)) {
      this.state = 'matchend';
      this.stateT = 0;
      this.setBanner(this.wins[0] > this.wins[1] ? 'YOU WIN' : 'YOU LOSE', '', 3);
      return;
    }
    this.round++;
    this.timer = 60;
    this.state = 'intro';
    this.stateT = 0;
    this.p1.hp = this.p1.maxHp;
    this.p2.hp = this.p2.maxHp;
    this.p1.meter = Math.min(100, this.p1.meter);
    this.p1.x = D.WORLD_W / 2 - 150;
    this.p2.x = D.WORLD_W / 2 + 150;
    this.p1.state = 'idle'; this.p2.state = 'idle';
    this.p1.airY = 0; this.p2.airY = 0;
    this.p1.grounded = true; this.p2.grounded = true;
    this.p1.vx = this.p2.vx = 0;
    this.effects.list.length = 0;
  };

  Match.prototype.updateCam = function (dt) {
    var mid = (this.p1.x + this.p2.x) / 2;
    var dist = Math.abs(this.p1.x - this.p2.x);
    var V = clamp(dist + 470, 780, 1420);
    var zoom = (this.cfg.W || 1280) / V;
    if (this.state === 'roundend' || this.state === 'matchend') zoom *= 1.14;
    if (this.superFx > 0) zoom *= 1.06;

    this.cam.targetX = mid;
    this.cam.targetZoom = zoom;
    this.cam.x += (this.cam.targetX - this.cam.x) * Math.min(1, dt * 6);
    this.cam.zoom += (this.cam.targetZoom - this.cam.zoom) * Math.min(1, dt * 4.5);

    var halfView = (this.cfg.W || 1280) / this.cam.zoom / 2;
    this.cam.x = clamp(this.cam.x, halfView - 40, D.WORLD_W - halfView + 40);
  };

  MM.Fighter = Fighter;
  MM.Match = Match;
  MM.Effects = Effects;
  MM.COMBAT = { GRAV: GRAV, ARENA_L: ARENA_L, ARENA_R: ARENA_R, PUSHBOX: PUSHBOX };
})(window);
