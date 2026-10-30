/* ============================================================
   MOSTANADER MARAMARI — art.js
   Procedural fighters (paper-doll rig) + six parallax stages.
   No image assets. Everything is drawn with canvas paths.
   ============================================================ */
(function (global) {
  'use strict';
  var MM = global.MM || (global.MM = {});
  var D = MM.Data;

  var Art = {};

  /* ---------- math helpers ---------- */
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeIn(t) { return t * t * t; }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function rand(seed) {
    var s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }
  Art.lerp = lerp; Art.clamp = clamp; Art.rand = rand; Art.easeOut = easeOut; Art.smooth = smooth;

  function shade(hex, amt) {
    var c = hex.replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    var r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
    r = clamp(Math.round(r + amt), 0, 255);
    g = clamp(Math.round(g + amt), 0, 255);
    b = clamp(Math.round(b + amt), 0, 255);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  Art.shade = shade;

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  Art.roundRect = roundRect;

  /* ============================================================
     POSE SYSTEM
     angle convention: 0 = pointing straight down, + = toward facing
     ============================================================ */
  var POSE_KEYS = ['torso', 'head', 'shA', 'shB', 'elA', 'elB', 'hipA', 'hipB', 'knA', 'knB', 'hipOff', 'bodyY'];

  function pose(o) {
    var p = {
      torso: 0, head: 0,
      shA: 0.22, shB: -0.30,   // back / front shoulder
      elA: -0.9, elB: 1.15,    // elbow bend (relative)
      hipA: 0.10, hipB: -0.12,
      knA: 0.06, knB: -0.10,
      hipOff: 0, bodyY: 0, lean: 0, squash: 1, rot: 0
    };
    if (o) for (var k in o) p[k] = o[k];
    return p;
  }

  var POSES = {
    idle: function (t) {
      var b = Math.sin(t * 3.1);
      return pose({
        torso: 0.04 + b * 0.012,
        shA: 0.26 + b * 0.03, elA: 1.95 - b * 0.04,
        shB: 0.14 - b * 0.03, elB: 2.05 + b * 0.04,
        hipA: 0.16, knA: 0.10,
        hipB: -0.18, knB: -0.14,
        bodyY: b * 1.4
      });
    },
    walk: function (t, dir) {
      var s = Math.sin(t * 9.0), c = Math.cos(t * 9.0);
      return pose({
        torso: 0.06,
        shA: 0.22 - s * 0.24, elA: 1.9 + s * 0.10,
        shB: 0.16 + s * 0.24, elB: 1.98 - s * 0.10,
        hipA: 0.34 * s, knA: 0.10 + Math.max(0, -s) * 0.45,
        hipB: -0.34 * s, knB: -0.10 - Math.max(0, s) * 0.45,
        bodyY: Math.abs(c) * -2.0
      });
    },
    crouch: function (t) {
      var b = Math.sin(t * 3.4) * 0.8;
      return pose({
        torso: 0.30, head: -0.10,
        shA: 0.52, elA: 1.62,
        shB: 0.42, elB: 1.72,
        hipA: 0.95, knA: -1.55,
        hipB: 0.55, knB: -1.75,
        bodyY: 34 + b
      });
    },
    block: function (t) {
      return pose({
        torso: -0.09, head: -0.04,
        shA: 0.78, elA: 1.52,
        shB: 0.62, elB: 1.62,
        hipA: 0.26, knA: 0.10,
        hipB: -0.28, knB: -0.12,
        bodyY: 3
      });
    },
    jump: function (t) {
      return pose({
        torso: 0.10,
        shA: 0.92, elA: 1.55,
        shB: 0.70, elB: 1.70,
        hipA: 0.85, knA: -1.30,
        hipB: 0.30, knB: -1.60,
        bodyY: -4
      });
    },
    fall: function (t) {
      return pose({
        torso: -0.08,
        shA: 1.40, elA: 0.90,
        shB: 1.20, elB: 1.00,
        hipA: 0.35, knA: -0.50,
        hipB: 0.05, knB: -0.70
      });
    },
    punchL: function (p) {
      var ext = p < 0.30 ? smooth(p / 0.30) : (p < 0.62 ? 1 : 1 - smooth((p - 0.62) / 0.38));
      return pose({
        torso: 0.05 + ext * 0.15,
        shB: 0.20 + ext * 1.35, elB: 2.00 - ext * 1.92,
        shA: 0.30, elA: 1.90,
        hipA: 0.20 + ext * 0.10, knA: 0.10,
        hipB: -0.24, knB: -0.12,
        bodyY: ext * 2
      });
    },
    punchH: function (p) {
      var ext = p < 0.42 ? smooth(p / 0.42) : (p < 0.62 ? 1 : 1 - smooth((p - 0.62) / 0.38));
      return pose({
        torso: -0.10 + ext * 0.30,
        head: -0.04 + ext * 0.08,
        shB: -0.20 + ext * 1.85, elB: 2.15 - ext * 2.05,
        shA: 0.55, elA: 1.75,
        hipA: 0.40 + ext * 0.15, knA: 0.08,
        hipB: -0.42, knB: -0.10,
        bodyY: ext * 3
      });
    },
    kick: function (p) {
      var ext = p < 0.34 ? smooth(p / 0.34) : (p < 0.60 ? 1 : 1 - smooth((p - 0.60) / 0.40));
      return pose({
        torso: -0.18 - ext * 0.18,
        head: 0.08,
        shA: 0.80, elA: 1.42,
        shB: -0.60, elB: 1.20,
        hipB: -0.10 + ext * 1.65, knB: 0.05,
        hipA: 0.10 - ext * 0.15, knA: 0.12,
        bodyY: -ext * 4
      });
    },
    kickLow: function (p) {
      var ext = p < 0.30 ? smooth(p / 0.30) : (p < 0.58 ? 1 : 1 - smooth((p - 0.58) / 0.42));
      return pose({
        torso: 0.20, head: -0.08,
        shA: 0.45, elA: 1.80,
        shB: 0.35, elB: 1.90,
        hipB: 0.30 + ext * 0.58, knB: -0.10 - ext * 0.05,
        hipA: 0.70, knA: -1.30,
        bodyY: 18
      });
    },
    jumpAtk: function (p) {
      return pose({
        torso: 0.16,
        shA: 1.50, elA: 0.70,
        shB: 1.15, elB: 0.35,
        hipA: 0.80, knA: -1.50,
        hipB: 0.25, knB: -1.70,
        bodyY: -2
      });
    },
    hit: function (p) {
      var k = Math.sin(clamp(p, 0, 1) * Math.PI);
      return pose({
        torso: -0.28 * k, head: -0.30 * k,
        shA: 0.35 + 0.90 * k, elA: 1.60 - 0.60 * k,
        shB: 0.10 + 1.10 * k, elB: 1.90 - 0.70 * k,
        hipA: 0.10 - 0.25 * k, knA: 0.15,
        hipB: -0.10 - 0.35 * k, knB: -0.15,
        bodyY: 3 * k
      });
    },
    ko: function (p) {
      var k = easeOut(clamp(p, 0, 1));
      return pose({
        torso: -1.30 * k, head: -0.40 * k,
        shA: 1.50 * k, elA: 0.80,
        shB: 1.30 * k, elB: 0.90,
        hipA: 1.10 * k, knA: -0.50 * k,
        hipB: 0.90 * k, knB: -0.40 * k,
        bodyY: 58 * k, rot: -1.45 * k
      });
    },
    spin: function (p, t) {
      return pose({
        torso: 0.08 + Math.sin(p * Math.PI * 6) * 0.08,
        shA: 1.45, elA: 0.12,
        shB: 1.45, elB: 0.12,
        hipA: 0.28, knA: 0.08,
        hipB: -0.28, knB: -0.10,
        bodyY: -3
      });
    },
    dashStab: function (p) {
      var ext = p < 0.25 ? smooth(p / 0.25) : (p < 0.6 ? 1 : 1 - smooth((p - 0.6) / 0.4));
      return pose({
        torso: 0.26 + ext * 0.10,
        shB: 0.20 + ext * 1.40, elB: 1.90 - ext * 1.85,
        shA: 0.80, elA: 1.40,
        hipA: 0.55, knA: -0.15,
        hipB: -0.55, knB: -0.25,
        bodyY: 12
      });
    },
    swingStick: function (p) {
      var swing = p < 0.55
        ? lerp(-1.60, 1.50, smooth(clamp(p / 0.55, 0, 1)))
        : lerp(1.50, 0.40, smooth(clamp((p - 0.55) / 0.45, 0, 1)));
      return pose({
        torso: -0.14 + swing * 0.10,
        shB: swing, elB: 0.12,
        shA: 0.55, elA: 1.70,
        hipA: 0.35, knA: 0.10,
        hipB: -0.38, knB: -0.14,
        bodyY: 2
      });
    },
    slam: function (p) {
      var up = p < 0.45 ? smooth(p / 0.45) : 0;
      var down = p > 0.55 ? smooth((p - 0.55) / 0.45) : 0;
      return pose({
        torso: -0.25 * up + 0.50 * down,
        shA: lerp(0.35, -2.60, up) + down * 4.30, elA: 0.35,
        shB: lerp(0.30, -2.40, up) + down * 4.10, elB: 0.40,
        hipA: 0.30 + down * 0.40, knA: 0.12 - down * 0.20,
        hipB: -0.34 - down * 0.30, knB: -0.12,
        bodyY: -up * 6 + down * 16
      });
    },
    tackle: function (p) {
      var ext = p < 0.35 ? smooth(p / 0.35) : 1;
      return pose({
        torso: 0.50 + ext * 0.20,
        head: -0.18,
        shA: 1.55, elA: 0.25,
        shB: 1.50, elB: 0.30,
        hipA: 0.70, knA: -0.40,
        hipB: -0.60, knB: -0.35,
        bodyY: 10
      });
    },
    doubleKick: function (p) {
      var ext = Math.abs(Math.sin(clamp(p, 0, 1) * Math.PI * 2));
      return pose({
        torso: -0.14 - ext * 0.16,
        shA: 0.90, elA: 1.35,
        shB: -0.50, elB: 1.10,
        hipB: -0.05 + ext * 1.60, knB: 0.05,
        hipA: 0.10, knA: 0.12,
        bodyY: -ext * 4
      });
    },
    order: function (p) {
      return pose({
        torso: -0.04,
        shB: 0.10 + Math.sin(p * 12) * 0.50, elB: 1.50,
        shA: 0.45, elA: 1.70,
        hipA: 0.22, knA: 0.10,
        hipB: -0.24, knB: -0.12
      });
    },
    superRush: function (p) {
      var ext = Math.sin(clamp(p, 0, 1) * Math.PI);
      return pose({
        torso: 0.06 + ext * 0.20,
        shB: 0.15 + ext * 1.40, elB: 2.00 - ext * 1.90,
        shA: 1.10 - ext * 0.70, elA: 1.40,
        hipA: 0.55, knA: -0.20,
        hipB: -0.55, knB: -0.20,
        bodyY: 6
      });
    },
    win: function (t) {
      var b = Math.sin(t * 2.4);
      return pose({
        torso: -0.06, head: -0.14,
        shA: 2.35 + b * 0.06, elA: 0.55,
        shB: 0.15, elB: 2.00,
        hipA: 0.22, knA: 0.10,
        hipB: -0.24, knB: -0.12,
        bodyY: b * 2
      });
    },
    intro: function (t) {
      var b = Math.sin(t * 1.6);
      return pose({
        torso: 0.02, head: -0.05,
        shA: 0.30, elA: 1.85,
        shB: 0.10, elB: 2.10,
        hipA: 0.18, knA: 0.10,
        hipB: -0.20, knB: -0.12,
        bodyY: b * 1.5
      });
    }
  };

  Art.getPose = function (f) {
    var t = f.stateT || 0;
    var p = 0;
    if (f.anim === 'ko') p = clamp(t / 0.55, 0, 1);
    else if (f.anim === 'hit') p = clamp(t / 0.24, 0, 1);
    else if (f.moveDur > 0) p = clamp(t / f.moveDur, 0, 1);
    var fn = POSES[f.anim] || POSES.idle;
    var out = fn(p, t);
    return out;
  };

  /* ============================================================
     FIGHTER RENDERER
     ============================================================ */
  Art.drawFighter = function (ctx, f, opt) {
    opt = opt || {};
    var C = f.colors;
    var B = f.build;
    var H = 200 * B.h;
    var facing = f.facing || 1;

    var p = opt.pose || Art.getPose(f);
    var gx = f.x, gy = f.y;

    ctx.save();
    ctx.translate(gx, gy);

    /* shadow */
    var airLift = clamp(-(f.airY || 0) / 220, 0, 1);
    if (!opt.noShadow) {
      ctx.save();
      ctx.globalAlpha = 0.30 * (1 - airLift * 0.6);
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(0, 2, 36 * B.w * (1 - airLift * 0.35), 9 * (1 - airLift * 0.4), 0, 0, 6.284);
      ctx.fill();
      ctx.restore();
    }

    ctx.translate(0, -(f.airY || 0));
    ctx.scale(facing, 1);

    // hit flash
    var flash = f.hitFlash > 0;
    if (flash) { ctx.save(); ctx.globalAlpha = 1; }

    var skin = C.skin, skinS = C.skinShade;
    var top = C.top, topD = C.topDark;
    var bot = C.bottom, botD = C.bottomDark;

    if (flash) { skin = '#fff'; skinS = '#ffdede'; top = '#fff'; topD = '#ffe0e0'; bot = '#fff'; botD = '#ffe0e0'; }

    var hipY = -0.44 * H + p.bodyY;
    var torsoH = 0.30 * H;
    var shY = hipY - torsoH;
    var hipHalf = 0.088 * H * B.w;
    var shHalf = 0.098 * H * B.w * B.shoulder;

    ctx.save();
    ctx.translate(0, hipY);
    ctx.rotate(p.rot || 0);

    var armU = 0.138 * H, armF = 0.130 * H, armW = 0.066 * H * B.w;
    var legU = 0.215 * H, legF = 0.215 * H, legW = 0.084 * H * B.w;

    /* ---- gamcha / scarf tail (behind) ---- */
    if (C.accent) {
      ctx.save();
      ctx.translate(0, shY - hipY + 6);
      var sway = Math.sin((f.stateT || 0) * 4 + (f.x * 0.01)) * 10 + clamp(-(f.vx || 0) * 0.12, -18, 18);
      ctx.beginPath();
      ctx.moveTo(-4, -2);
      ctx.quadraticCurveTo(-18, 20, -10 + sway, 54);
      ctx.quadraticCurveTo(2 + sway * 0.6, 66, 6 + sway * 0.4, 58);
      ctx.quadraticCurveTo(2, 26, 8, 0);
      ctx.closePath();
      ctx.fillStyle = C.accent;
      ctx.globalAlpha = 0.95;
      ctx.fill();
      ctx.restore();
    }

    /* ---- back leg ---- */
    limb(ctx, 0, 0, p.hipA, legU, p.knA, legF, legW, shade(botD, -14), shade(botD, -26));
    foot(ctx, p, 'A', legU, legF, C, H, facing);

    /* ---- front leg ---- */
    limb(ctx, 0, 0, p.hipB, legU, p.knB, legF, legW * 1.03, bot, botD);
    foot(ctx, p, 'B', legU, legF, C, H, facing);

    /* ---- lungi / skirt ---- */
    ctx.save();
    ctx.beginPath();
    var sk = 0.19 * H;
    ctx.moveTo(-hipHalf * 1.18, 0);
    ctx.quadraticCurveTo(-hipHalf * 1.5, sk * 0.55, -hipHalf * 1.42, sk);
    ctx.lineTo(hipHalf * 1.42, sk);
    ctx.quadraticCurveTo(hipHalf * 1.5, sk * 0.55, hipHalf * 1.18, 0);
    ctx.closePath();
    var grd = ctx.createLinearGradient(-hipHalf, 0, hipHalf, sk);
    grd.addColorStop(0, bot);
    grd.addColorStop(1, botD);
    ctx.fillStyle = grd;
    ctx.fill();
    // fold lines
    ctx.strokeStyle = 'rgba(0,0,0,0.14)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-hipHalf * 0.4, 2); ctx.lineTo(-hipHalf * 0.6, sk - 2);
    ctx.moveTo(hipHalf * 0.35, 2); ctx.lineTo(hipHalf * 0.55, sk - 2);
    ctx.stroke();
    ctx.restore();

    /* ---- back arm ---- */
    limb(ctx, -hipHalf * 0.5, shY - hipY + 0.035 * H, p.shA, armU, p.elA, armF, armW * 0.94, shade(topD, -18), shade(skinS, -16));
    hand(ctx, p, 'A', shY - hipY + 0.035 * H, armU, armF, skinS, H);

    /* ---- torso ---- */
    ctx.save();
    ctx.rotate(p.torso);
    var tw = torsoH;
    ctx.beginPath();
    ctx.moveTo(-hipHalf, 2);
    ctx.bezierCurveTo(-hipHalf * 1.25, -tw * 0.35, -shHalf, -tw * 0.75, -shHalf, -tw);
    ctx.lineTo(shHalf, -tw);
    ctx.bezierCurveTo(shHalf, -tw * 0.75, hipHalf * 1.25, -tw * 0.35, hipHalf, 2);
    ctx.closePath();
    var tg = ctx.createLinearGradient(-shHalf, -tw, shHalf, 0);
    tg.addColorStop(0, shade(top, 18));
    tg.addColorStop(0.55, top);
    tg.addColorStop(1, topD);
    ctx.fillStyle = tg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(12,8,6,0.5)';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // bare-chest characters
    if (C.top === C.skin) {
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = 'rgba(0,0,0,0.22)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -tw * 0.92); ctx.lineTo(0, -tw * 0.35);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, -tw * 0.35, shHalf * 0.55, tw * 0.10, 0, 0, 6.284);
      ctx.stroke();
      ctx.restore();
    } else {
      // collar + buttons
      ctx.strokeStyle = 'rgba(0,0,0,0.20)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(0, -tw * 0.98); ctx.lineTo(0, -tw * 0.30);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      for (var bi = 0; bi < 3; bi++) {
        ctx.beginPath();
        ctx.arc(0, -tw * 0.78 + bi * tw * 0.19, 1.7, 0, 6.284);
        ctx.fill();
      }
    }
    // belt / sash
    ctx.fillStyle = C.belt || '#3a2a1e';
    ctx.fillRect(-hipHalf * 1.1, -tw * 0.06, hipHalf * 2.2, 7);

    // accent sash for bare-chest fighters
    if (C.top === C.skin && C.accent) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-shHalf, -tw * 0.92);
      ctx.lineTo(shHalf * 0.2, -tw * 0.60);
      ctx.lineTo(shHalf * 0.2, -tw * 0.44);
      ctx.lineTo(-shHalf, -tw * 0.76);
      ctx.closePath();
      ctx.fillStyle = C.accent;
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    /* ---- head ---- */
    ctx.save();
    ctx.translate(0, shY - hipY);
    ctx.rotate(p.torso * 0.5 + (p.head || 0));
    var headR = 0.077 * H * B.head;
    ctx.translate(0, -headR * 0.55);
    // neck
    ctx.fillStyle = skinS;
    ctx.fillRect(-headR * 0.34, -headR * 0.2, headR * 0.68, headR * 0.9);
    // head
    ctx.beginPath();
    ctx.ellipse(0, -headR * 0.55, headR * 0.92, headR * 1.0, 0, 0, 6.284);
    ctx.fillStyle = skin;
    ctx.fill();
    ctx.strokeStyle = 'rgba(12,8,6,0.5)';
    ctx.lineWidth = 3;
    ctx.stroke();
    // ear
    ctx.beginPath();
    ctx.ellipse(-headR * 0.75, -headR * 0.45, headR * 0.16, headR * 0.24, 0, 0, 6.284);
    ctx.fillStyle = skinS;
    ctx.fill();
    // hair
    ctx.beginPath();
    ctx.ellipse(0, -headR * 0.72, headR * 0.96, headR * 0.92, 0, Math.PI * 1.02, Math.PI * 2.02);
    ctx.fillStyle = C.hair;
    ctx.fill();
    if (f.hairStyle === 'pony') {
      ctx.beginPath();
      ctx.ellipse(-headR * 0.9, -headR * 0.2, headR * 0.26, headR * 0.7, -0.4, 0, 6.284);
      ctx.fill();
    }
    if (f.hairStyle === 'bald') {
      ctx.beginPath();
      ctx.ellipse(0, -headR * 0.55, headR * 0.9, headR * 0.98, 0, 0, 6.284);
      ctx.fillStyle = skin;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, -headR * 1.02, headR * 0.8, headR * 0.34, 0, Math.PI, Math.PI * 2);
      ctx.fillStyle = shade(skin, -22);
      ctx.fill();
    }
    // brow + eye
    ctx.strokeStyle = '#1a1410';
    ctx.lineWidth = Math.max(1.6, headR * 0.12);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(headR * 0.18, -headR * 0.72);
    ctx.lineTo(headR * 0.62, -headR * 0.66);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(headR * 0.42, -headR * 0.48, headR * 0.11, 0, 6.284);
    ctx.fillStyle = '#1a1410';
    ctx.fill();
    // mouth
    ctx.beginPath();
    ctx.moveTo(headR * 0.18, -headR * 0.18);
    ctx.lineTo(headR * 0.56, -headR * 0.20);
    ctx.strokeStyle = 'rgba(60,30,20,0.75)';
    ctx.lineWidth = Math.max(1.2, headR * 0.08);
    ctx.stroke();
    // moustache
    if (f.moustache) {
      ctx.beginPath();
      ctx.moveTo(headR * 0.10, -headR * 0.30);
      ctx.quadraticCurveTo(headR * 0.45, -headR * 0.34, headR * 0.72, -headR * 0.22);
      ctx.strokeStyle = '#141010';
      ctx.lineWidth = Math.max(2, headR * 0.14);
      ctx.stroke();
    }
    // sunglasses (chairman)
    if (f.shades) {
      ctx.fillStyle = '#101014';
      roundRect(ctx, headR * 0.02, -headR * 0.62, headR * 0.86, headR * 0.30, 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(120,190,255,0.35)';
      roundRect(ctx, headR * 0.10, -headR * 0.58, headR * 0.26, headR * 0.18, 1);
      ctx.fill();
    }
    ctx.restore();

    /* ---- front arm ---- */
    var shFx = hipHalf * 0.55;
    var shFy = shY - hipY + 0.030 * H;
    var handPos = limb(ctx, shFx, shFy, p.shB, armU, p.elB, armF, armW, top, skin);
    hand(ctx, p, 'B', shFx, shFy, armU, armF, skin, H, true);

    /* weapon for Bappi */
    if (f.weapon === 'lathi') {
      ctx.save();
      ctx.translate(handPos.x, handPos.y);
      ctx.rotate(Math.PI / 2 - (p.shB + p.elB));
      ctx.fillStyle = '#6b4a24';
      roundRect(ctx, -3, -6, 128, 6, 3);
      ctx.fill();
      ctx.fillStyle = '#8a6330';
      roundRect(ctx, 100, -6, 28, 6, 3);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore(); // hip transform

    if (flash) ctx.restore();
    ctx.restore();

    /* ---- helper fns ---- */
    function limb(c, ox, oy, a1, l1, a2, l2, w, col1, col2) {
      var x1 = ox + Math.sin(a1) * l1, y1 = oy + Math.cos(a1) * l1;
      var a2t = a1 + a2;
      var x2 = x1 + Math.sin(a2t) * l2, y2 = y1 + Math.cos(a2t) * l2;
      c.lineCap = 'round';
      // dark contour so the limb reads against any background
      c.strokeStyle = 'rgba(12,8,6,0.55)';
      c.lineWidth = w + 4.5;
      c.beginPath(); c.moveTo(ox, oy); c.lineTo(x1, y1); c.stroke();
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();

      c.strokeStyle = col1;
      c.lineWidth = w;
      c.beginPath(); c.moveTo(ox, oy); c.lineTo(x1, y1); c.stroke();
      c.strokeStyle = col2;
      c.lineWidth = w * 0.9;
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
      // highlight edge
      c.strokeStyle = 'rgba(255,255,255,0.10)';
      c.lineWidth = w * 0.28;
      c.beginPath(); c.moveTo(ox - w * 0.18, oy); c.lineTo(x1 - w * 0.18, y1); c.stroke();
      return { x: x2, y: y2 };
    }
    function hand(c, pp, which, ox, oy, l1, l2, col, hh, front) {
      var a1 = which === 'A' ? pp.shA : pp.shB;
      var a2 = which === 'A' ? pp.elA : pp.elB;
      var x1 = ox + Math.sin(a1) * l1, y1 = oy + Math.cos(a1) * l1;
      var x2 = x1 + Math.sin(a1 + a2) * l2, y2 = y1 + Math.cos(a1 + a2) * l2;
      c.beginPath();
      c.arc(x2, y2, 0.032 * hh * (front ? 1.05 : 0.95), 0, 6.284);
      c.fillStyle = col;
      c.fill();
      c.strokeStyle = 'rgba(12,8,6,0.45)';
      c.lineWidth = 2.2;
      c.stroke();
    }
    function foot(c, pp, which, l1, l2, cc, hh) {
      var a1 = which === 'A' ? pp.hipA : pp.hipB;
      var a2 = which === 'A' ? pp.knA : pp.knB;
      var x1 = Math.sin(a1) * l1, y1 = Math.cos(a1) * l1;
      var x2 = x1 + Math.sin(a1 + a2) * l2, y2 = y1 + Math.cos(a1 + a2) * l2;
      c.save();
      c.translate(x2, y2);
      c.rotate(a1 + a2);
      c.beginPath();
      roundRect(c, -0.028 * hh, -0.020 * hh, 0.075 * hh, 0.042 * hh, 0.014 * hh);
      c.fillStyle = cc.shoe;
      c.fill();
      c.restore();
    }
  };

  /* ============================================================
     STAGE BACKGROUNDS (cached layers)
     ============================================================ */
  var stageCache = {};

  function makeLayer(w, h) {
    var cv = document.createElement('canvas');
    cv.width = Math.ceil(w); cv.height = Math.ceil(h);
    return cv;
  }

  function buildLayers(stage, W, H) {
    var key = stage.id + '_' + W + 'x' + H;
    if (stageCache[key]) return stageCache[key];

    var LW = Math.ceil(W * 1.55), LH = Math.ceil(H);
    var far = makeLayer(LW, LH), mid = makeLayer(LW, LH), near = makeLayer(LW, LH);
    var fx = far.getContext('2d'), mx = mid.getContext('2d'), nx = near.getContext('2d');
    var horizon = H * 0.66, ground = H * 0.80;

    var drawers = {
      teastall: drawTeastall,
      bazar: drawBazar,
      itbhata: drawItbhata,
      rickshaw: drawRickshaw,
      akhra: drawAkhra,
      rooftop: drawRooftop
    };
    var fn = drawers[stage.id] || drawBazar;
    fn({ far: fx, mid: mx, near: nx, W: LW, H: H, horizon: horizon, ground: ground, pal: stage });

    stageCache[key] = { far: far, mid: mid, near: near, LW: LW };
    return stageCache[key];
  }

  /* ---------- shared prop painters ---------- */
  function tinRoof(c, x, y, w, h, col) {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + w, y - h * 0.28);
    c.lineTo(x + w, y + 6);
    c.lineTo(x, y + 6);
    c.closePath();
    c.fill();
  }
  function corrugated(c, x, y, w, h, col) {
    c.fillStyle = col;
    c.fillRect(x, y, w, h);
    c.strokeStyle = 'rgba(0,0,0,0.16)';
    c.lineWidth = 1;
    for (var i = 0; i < w; i += 7) {
      c.beginPath(); c.moveTo(x + i, y); c.lineTo(x + i, y + h); c.stroke();
    }
  }
  function tree(c, x, y, s, col) {
    c.fillStyle = shade(col, -18);
    c.fillRect(x - 2.5 * s, y - 26 * s, 5 * s, 26 * s);
    c.fillStyle = col;
    for (var i = 0; i < 5; i++) {
      var a = i / 5 * 6.283;
      c.beginPath();
      c.ellipse(x + Math.cos(a) * 11 * s, y - 30 * s + Math.sin(a) * 9 * s, 13 * s, 11 * s, 0, 0, 6.284);
      c.fill();
    }
    c.beginPath();
    c.ellipse(x, y - 34 * s, 15 * s, 13 * s, 0, 0, 6.284);
    c.fill();
  }
  function bananaTree(c, x, y, s, col) {
    c.fillStyle = shade(col, -20);
    c.fillRect(x - 2 * s, y - 34 * s, 4 * s, 34 * s);
    c.fillStyle = col;
    for (var i = 0; i < 6; i++) {
      var a = -Math.PI / 2 + (i - 2.5) * 0.42;
      c.save();
      c.translate(x, y - 32 * s);
      c.rotate(a);
      c.beginPath();
      c.ellipse(0, -20 * s, 5 * s, 21 * s, 0, 0, 6.284);
      c.fill();
      c.restore();
    }
  }
  function powerLine(c, x1, y1, x2, y2, sag, col) {
    c.strokeStyle = col;
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(x1, y1);
    c.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + sag, x2, y2);
    c.stroke();
  }

  /* ---------- 1. TEA STALL ---------- */
  function drawTeastall(L) {
    var c = L.far, W = L.W, H = L.H, hz = L.horizon, R = rand(1337);

    /* --- distant treeline --- */
    c.fillStyle = '#16303a';
    for (var i = 0; i < 70; i++) {
      var x = i * (W / 66) + R() * 18;
      var s = 1.0 + R() * 1.2;
      c.beginPath();
      c.ellipse(x, hz + 6, 30 * s, 24 * s, 0, Math.PI, 0);
      c.fill();
    }
    /* --- minaret + tin sheds on the skyline --- */
    c.fillStyle = '#122832';
    c.fillRect(W * 0.62, hz - 118, 16, 130);
    c.beginPath();
    c.ellipse(W * 0.62 + 8, hz - 122, 13, 16, 0, Math.PI, 0);
    c.fill();
    c.fillRect(W * 0.62 + 3, hz - 148, 10, 22);

    for (var j = 0; j < 16; j++) {
      var sx = 20 + j * 96 + R() * 26;
      var sw = 68 + R() * 54, sh = 42 + R() * 44;
      c.fillStyle = shade('#1d3a44', R() * 12 - 6);
      c.fillRect(sx, hz - sh, sw, sh + 10);
      c.fillStyle = '#14262e';
      c.beginPath();
      c.moveTo(sx - 9, hz - sh); c.lineTo(sx + sw + 9, hz - sh);
      c.lineTo(sx + sw, hz - sh - 15); c.lineTo(sx, hz - sh - 15);
      c.closePath(); c.fill();
      // one lit window per shed
      if (R() > 0.45) {
        c.fillStyle = 'rgba(255,190,90,0.45)';
        c.fillRect(sx + sw * 0.45, hz - sh + 14, 10, 12);
      }
    }

    /* ---------------- MID LAYER ---------------- */
    c = L.mid;

    /* brick wall behind the lane */
    var wallTop = hz - 168;
    c.fillStyle = '#4a332a';
    c.fillRect(0, wallTop, W, 180);
    // brick courses
    for (var ry = wallTop; ry < hz + 14; ry += 12) {
      c.strokeStyle = 'rgba(0,0,0,0.16)';
      c.lineWidth = 1;
      c.beginPath(); c.moveTo(0, ry); c.lineTo(W, ry); c.stroke();
      var off = (((ry / 12) | 0) % 2) ? 17 : 0;
      for (var rx = off; rx < W; rx += 34) {
        c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx, ry + 12); c.stroke();
      }
    }
    // brick colour variance
    for (var bv = 0; bv < 260; bv++) {
      c.fillStyle = R() > 0.5 ? 'rgba(255,180,140,0.05)' : 'rgba(0,0,0,0.10)';
      c.fillRect(R() * W, wallTop + R() * 178, 30, 10);
    }
    // warm rim light on top of the wall
    var rim = c.createLinearGradient(0, wallTop, 0, wallTop + 26);
    rim.addColorStop(0, 'rgba(255,190,120,0.30)');
    rim.addColorStop(1, 'rgba(255,190,120,0)');
    c.fillStyle = rim;
    c.fillRect(0, wallTop, W, 26);
    // painted wall advert
    c.fillStyle = 'rgba(210,180,120,0.13)';
    c.fillRect(W * 0.025, hz - 124, 128, 76);
    c.fillStyle = 'rgba(240,225,190,0.32)';
    c.font = 'bold 20px sans-serif';
    c.fillText('চা', W * 0.025 + 14, hz - 96);
    c.font = 'bold 11px sans-serif';
    c.fillText('CHA · 5 TAKA', W * 0.025 + 14, hz - 72);

    /* the burnt tea stall */
    var bx = W * 0.235, by = hz + 12;
    // scorch halo on the wall
    var sc = c.createRadialGradient(bx + 105, by - 70, 20, bx + 105, by - 70, 190);
    sc.addColorStop(0, 'rgba(10,6,4,0.72)');
    sc.addColorStop(1, 'rgba(10,6,4,0)');
    c.fillStyle = sc;
    c.fillRect(bx - 90, by - 210, 400, 240);
    // charred frame
    c.fillStyle = '#1a120c';
    c.fillRect(bx, by - 124, 214, 124);
    c.fillStyle = '#0f0a07';
    c.fillRect(bx + 8, by - 116, 198, 116);
    // fallen tin roof
    c.save();
    c.translate(bx + 6, by - 122);
    c.rotate(-0.10);
    c.fillStyle = '#2b2119';
    c.fillRect(-14, -12, 246, 16);
    c.strokeStyle = 'rgba(0,0,0,0.35)';
    c.lineWidth = 1;
    for (var t = 0; t < 246; t += 8) {
      c.beginPath(); c.moveTo(-14 + t, -12); c.lineTo(-14 + t, 4); c.stroke();
    }
    c.restore();
    // charred posts
    c.fillStyle = '#140e09';
    c.fillRect(bx - 2, by - 126, 11, 126);
    c.fillRect(bx + 203, by - 126, 11, 126);
    c.fillRect(bx + 100, by - 126, 9, 126);
    // hanging kettle on its chain
    c.strokeStyle = '#0d0906'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(bx + 104, by - 126); c.lineTo(bx + 104, by - 92); c.stroke();
    c.fillStyle = '#3f2d1e';
    c.beginPath(); c.ellipse(bx + 104, by - 84, 15, 13, 0, 0, 6.284); c.fill();
    c.beginPath(); c.moveTo(bx + 119, by - 88); c.lineTo(bx + 134, by - 98); c.stroke();
    // surviving bench
    c.fillStyle = '#4d3826';
    c.fillRect(bx + 26, by - 34, 132, 9);
    c.fillRect(bx + 34, by - 34, 7, 34);
    c.fillRect(bx + 142, by - 34, 7, 34);

    /* neighbouring shops with warm light */
    for (var k = 0; k < 5; k++) {
      var sx2 = W * 0.50 + k * 148;
      c.fillStyle = k % 2 ? '#3b3a2c' : '#333a2e';
      c.fillRect(sx2, hz - 104, 118, 116);
      // tin roof
      c.fillStyle = k % 2 ? '#6b5a3a' : '#5c5040';
      c.beginPath();
      c.moveTo(sx2 - 12, hz - 104);
      c.lineTo(sx2 + 130, hz - 128);
      c.lineTo(sx2 + 130, hz - 118);
      c.lineTo(sx2 - 12, hz - 94);
      c.closePath(); c.fill();
      // warm interior
      c.fillStyle = 'rgba(255,200,120,0.22)';
      c.fillRect(sx2 + 16, hz - 78, 40, 40);
      c.fillStyle = 'rgba(255,220,150,0.55)';
      c.beginPath(); c.arc(sx2 + 90, hz - 74, 4, 0, 6.284); c.fill();
      // shelf goods
      c.fillStyle = 'rgba(0,0,0,0.35)';
      for (var g = 0; g < 3; g++) c.fillRect(sx2 + 66, hz - 66 + g * 14, 44, 4);
    }

    /* bamboo cluster on the right */
    for (var b2 = 0; b2 < 6; b2++) {
      var bxx = W * 0.905 + b2 * 15;
      c.strokeStyle = b2 % 2 ? '#3f5230' : '#33452a';
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(bxx, hz + 14);
      c.quadraticCurveTo(bxx + 14, hz - 120, bxx + 30, hz - 214);
      c.stroke();
    }

    /* overhead power lines */
    c.strokeStyle = 'rgba(14,10,7,0.55)';
    c.lineWidth = 1.8;
    c.beginPath(); c.moveTo(0, hz - 206); c.quadraticCurveTo(W / 2, hz - 150, W, hz - 186); c.stroke();
    c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(0, hz - 190); c.quadraticCurveTo(W / 2, hz - 134, W, hz - 170); c.stroke();

    /* ---------------- NEAR LAYER ---------------- */
    c = L.near;
    // low parapet at the very front corners
    c.fillStyle = 'rgba(12,9,7,0.94)';
    c.fillRect(-20, L.ground - 46, 210, 70);
    c.fillRect(W - 190, L.ground - 40, 220, 70);
    c.fillStyle = 'rgba(26,20,15,0.95)';
    for (var pz = 0; pz < 4; pz++) {
      c.beginPath();
      c.ellipse(30 + pz * 40, L.ground - 50, 15, 13, 0, 0, 6.284);
      c.fill();
    }
    // hanging leaves top corners
    c.fillStyle = 'rgba(9,7,5,0.92)';
    c.beginPath(); c.ellipse(-40, -20, 190, 96, 0.28, 0, 6.284); c.fill();
    c.beginPath(); c.ellipse(W + 40, -30, 200, 104, -0.28, 0, 6.284); c.fill();
  }

  /* ---------- 2. BAZAR ---------- */
  function drawBazar(L) {
    var c = L.far, W = L.W, H = L.H, hz = L.horizon, R = rand(4242);
    c.fillStyle = L.pal.far;
    // far buildings 2-4 stories
    for (var i = 0; i < 22; i++) {
      var x = i * 95 + R() * 40;
      var bh = 70 + R() * 130;
      c.fillStyle = shade(L.pal.far, (R() * 16) | 0);
      c.fillRect(x, hz - bh, 78, bh + 12);
      c.fillStyle = 'rgba(255,240,200,0.10)';
      for (var wy = 0; wy < 4; wy++) {
        for (var wx = 0; wx < 3; wx++) {
          c.fillRect(x + 12 + wx * 22, hz - bh + 12 + wy * 26, 12, 16);
        }
      }
    }
    c = L.mid;
    // tarpaulin market roofs
    var cols = ['#c0392b', '#2e86c1', '#d4ac0d', '#27ae60', '#7d3c98', '#e67e22'];
    for (var t = 0; t < 16; t++) {
      var tx = t * 130 - 40;
      var tw = 150;
      var base = cols[t % cols.length];
      // shadow the tarp throws on the stalls behind
      c.fillStyle = 'rgba(0,0,0,0.22)';
      c.beginPath();
      c.moveTo(tx + 4, hz - 52);
      c.lineTo(tx + tw, hz - 70);
      c.lineTo(tx + tw, hz - 44);
      c.lineTo(tx + 4, hz - 26);
      c.closePath(); c.fill();
      // cloth
      c.fillStyle = base;
      c.globalAlpha = 0.92;
      c.beginPath();
      c.moveTo(tx, hz - 78);
      c.lineTo(tx + tw, hz - 96);
      c.lineTo(tx + tw, hz - 70);
      c.lineTo(tx, hz - 52);
      c.closePath();
      c.fill();
      // stripe
      c.globalAlpha = 0.5;
      c.fillStyle = '#f4ecd8';
      c.beginPath();
      c.moveTo(tx + tw * 0.42, hz - 86);
      c.lineTo(tx + tw * 0.56, hz - 88);
      c.lineTo(tx + tw * 0.56, hz - 62);
      c.lineTo(tx + tw * 0.42, hz - 60);
      c.closePath(); c.fill();
      c.globalAlpha = 1;
      // poles
      c.fillStyle = '#5a4630';
      c.fillRect(tx + 6, hz - 60, 6, 70);
      c.fillRect(tx + tw - 10, hz - 78, 6, 88);
    }
    // stacked produce crates
    for (var k = 0; k < 26; k++) {
      var cx = k * 78 + R() * 30;
      var cy = hz - 20 + R() * 8;
      c.fillStyle = '#8a6a3a';
      roundRect(c, cx, cy, 44, 26, 3); c.fill();
      c.fillStyle = ['#d94f2b', '#3f9e4d', '#e0b830', '#9b59b6'][k % 4];
      for (var p = 0; p < 6; p++) {
        c.beginPath();
        c.arc(cx + 8 + (p % 3) * 14, cy + 8 + ((p / 3) | 0) * 10, 4.4, 0, 6.284);
        c.fill();
      }
    }
    // hanging bulbs string
    c.strokeStyle = 'rgba(30,25,18,0.7)'; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(0, hz - 120);
    c.quadraticCurveTo(W / 2, hz - 96, W, hz - 124); c.stroke();
    for (var b = 0; b < 26; b++) {
      var bx = b * (W / 25);
      c.fillStyle = 'rgba(255,230,150,0.85)';
      c.beginPath(); c.arc(bx, hz - 116 + Math.sin(b / 26 * 3.14) * 10, 3.4, 0, 6.284); c.fill();
      c.fillStyle = 'rgba(255,220,120,0.16)';
      c.beginPath(); c.arc(bx, hz - 116 + Math.sin(b / 26 * 3.14) * 10, 12, 0, 6.284); c.fill();
    }
    // CNG auto-rickshaw
    var rx = W * 0.655, ry = hz + 8;
    c.fillStyle = 'rgba(0,0,0,0.22)';
    c.beginPath(); c.ellipse(rx + 38, ry + 4, 52, 9, 0, 0, 6.284); c.fill();
    c.fillStyle = '#20301f';
    c.beginPath();
    c.moveTo(rx, ry);
    c.lineTo(rx + 4, ry - 46);
    c.quadraticCurveTo(rx + 26, ry - 78, rx + 62, ry - 76);
    c.lineTo(rx + 74, ry - 44);
    c.lineTo(rx + 74, ry);
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(150,200,220,0.26)';
    c.beginPath();
    c.moveTo(rx + 10, ry - 44);
    c.quadraticCurveTo(rx + 28, ry - 70, rx + 58, ry - 68);
    c.lineTo(rx + 64, ry - 46);
    c.closePath(); c.fill();
    c.fillStyle = '#141c14';
    c.beginPath(); c.arc(rx + 16, ry, 12, 0, 6.284); c.fill();
    c.beginPath(); c.arc(rx + 58, ry, 12, 0, 6.284); c.fill();

    c = L.near;
    // foreground carts / sacks
    c.fillStyle = 'rgba(18,20,14,0.92)';
    roundRect(c, -20, L.ground - 60, 180, 70, 6); c.fill();
    roundRect(c, W - 170, L.ground - 54, 190, 66, 6); c.fill();
    c.fillStyle = 'rgba(30,34,24,0.9)';
    for (var s = 0; s < 4; s++) {
      c.beginPath();
      c.ellipse(60 + s * 26, L.ground - 66, 18, 16, 0, 0, 6.284);
      c.fill();
    }
  }

  /* ---------- 3. ITBHATA ---------- */
  function drawItbhata(L) {
    var c = L.far, W = L.W, H = L.H, hz = L.horizon, R = rand(9091);
    // distant kiln chimneys
    c.fillStyle = L.pal.far;
    for (var i = 0; i < 5; i++) {
      var x = W * 0.12 + i * W * 0.19 + R() * 40;
      var hh = 200 + R() * 120;
      c.fillRect(x, hz - hh, 46, hh);
      c.fillRect(x - 6, hz - hh - 12, 58, 14);
      // smoke
      c.fillStyle = 'rgba(60,40,30,0.28)';
      for (var s = 0; s < 5; s++) {
        c.beginPath();
        c.arc(x + 23 + Math.sin(s) * 18, hz - hh - 30 - s * 34, 22 + s * 9, 0, 6.284);
        c.fill();
      }
      c.fillStyle = L.pal.far;
    }
    // stacked brick walls
    c.fillStyle = shade(L.pal.far, 8);
    for (var b = 0; b < 6; b++) {
      c.fillRect(W * 0.05 + b * W * 0.17, hz - 90 - (b % 3) * 24, 120, 110 + (b % 3) * 24);
    }

    c = L.mid;
    // big brick stacks (foreground mid)
    function brickStack(sx, sy, rows, cols) {
      for (var r = 0; r < rows; r++) {
        for (var k = 0; k < cols; k++) {
          var off = (r % 2) * 11;
          c.fillStyle = ['#a4462b', '#b85436', '#8f3b24', '#c25e3c'][(r * cols + k) % 4];
          c.fillRect(sx + k * 22 + off, sy - r * 13, 20, 11);
        }
      }
    }
    brickStack(W * 0.08, hz + 8, 6, 7);
    brickStack(W * 0.34, hz + 8, 9, 5);
    brickStack(W * 0.72, hz + 8, 7, 8);
    brickStack(W * 0.58, hz + 8, 4, 4);
    // the kiln body (right)
    c.fillStyle = '#8f3b24';
    c.beginPath();
    c.moveTo(W * 0.80, hz + 12);
    c.lineTo(W * 0.84, hz - 120);
    c.lineTo(W * 0.96, hz - 120);
    c.lineTo(W * 0.99, hz + 12);
    c.closePath(); c.fill();
    c.fillStyle = '#5e2417';
    c.beginPath();
    c.ellipse(W * 0.90, hz - 60, 34, 26, 0, 0, 6.284); c.fill();
    c.fillStyle = 'rgba(255,140,40,0.55)';
    c.beginPath();
    c.ellipse(W * 0.90, hz - 56, 22, 16, 0, 0, 6.284); c.fill();
    // wheelbarrow
    c.fillStyle = '#3a2a1e';
    c.beginPath(); c.arc(W * 0.46, hz + 6, 13, 0, 6.284); c.fill();
    c.fillStyle = '#4a5a3a';
    roundRect(c, W * 0.44, hz - 18, 52, 22, 3); c.fill();

    c = L.near;
    c.fillStyle = 'rgba(30,16,10,0.94)';
    // foreground brick pile
    for (var r2 = 0; r2 < 5; r2++) {
      for (var k2 = 0; k2 < 6; k2++) {
        c.fillStyle = 'rgba(40,22,14,0.95)';
        c.fillRect(-30 + k2 * 24 + (r2 % 2) * 12, L.ground - 8 - r2 * 13, 22, 11);
      }
    }
    for (var r3 = 0; r3 < 5; r3++) {
      for (var k3 = 0; k3 < 6; k3++) {
        c.fillStyle = 'rgba(40,22,14,0.95)';
        c.fillRect(W - 130 + k3 * 24 + (r3 % 2) * 12, L.ground - 8 - r3 * 13, 22, 11);
      }
    }
  }

  /* ---------- 4. RICKSHAW STAND (rain, night) ---------- */
  function drawRickshaw(L) {
    var c = L.far, W = L.W, H = L.H, hz = L.horizon, R = rand(5150);
    // night buildings with lit windows
    for (var i = 0; i < 26; i++) {
      var x = i * 82 + R() * 30;
      var bh = 90 + R() * 190;
      c.fillStyle = shade(L.pal.far, (R() * 10) | 0);
      c.fillRect(x, hz - bh, 70, bh + 12);
      for (var wy = 0; wy < 7; wy++) {
        for (var wx = 0; wx < 3; wx++) {
          if (R() > 0.55) {
            c.fillStyle = R() > 0.5 ? 'rgba(255,210,120,0.75)' : 'rgba(120,200,255,0.55)';
            c.fillRect(x + 10 + wx * 20, hz - bh + 14 + wy * 26, 11, 15);
          }
        }
      }
    }
    c = L.mid;
    // medicine shop neon
    c.fillStyle = '#141c26';
    c.fillRect(W * 0.05, hz - 130, 210, 142);
    c.fillStyle = 'rgba(255,80,170,0.85)';
    roundRect(c, W * 0.05 + 16, hz - 118, 178, 30, 4); c.fill();
    c.fillStyle = '#2a0f1c';
    c.fillRect(W * 0.05 + 22, hz - 80, 166, 74);
    c.fillStyle = 'rgba(255,120,190,0.20)';
    c.fillRect(W * 0.05 + 22, hz - 80, 166, 74);

    // rickshaws parked
    function rickshaw(x, y, sc, col) {
      c.save(); c.translate(x, y); c.scale(sc, sc);
      c.fillStyle = col;
      // hood
      c.beginPath();
      c.moveTo(-52, -10);
      c.quadraticCurveTo(-46, -96, 0, -100);
      c.quadraticCurveTo(46, -96, 52, -10);
      c.lineTo(40, -6);
      c.quadraticCurveTo(36, -78, 0, -82);
      c.quadraticCurveTo(-36, -78, -40, -6);
      c.closePath(); c.fill();
      // seat
      c.fillStyle = shade(col, -20);
      roundRect(c, -30, -46, 62, 34, 4); c.fill();
      // wheels
      c.strokeStyle = '#0c1116'; c.lineWidth = 4;
      c.beginPath(); c.arc(-38, -16, 17, 0, 6.284); c.stroke();
      c.beginPath(); c.arc(40, -16, 17, 0, 6.284); c.stroke();
      c.strokeStyle = 'rgba(200,220,240,0.35)'; c.lineWidth = 1;
      for (var s = 0; s < 8; s++) {
        c.beginPath(); c.moveTo(-38, -16);
        c.lineTo(-38 + Math.cos(s / 8 * 6.283) * 16, -16 + Math.sin(s / 8 * 6.283) * 16);
        c.stroke();
        c.beginPath(); c.moveTo(40, -16);
        c.lineTo(40 + Math.cos(s / 8 * 6.283) * 16, -16 + Math.sin(s / 8 * 6.283) * 16);
        c.stroke();
      }
      // handlebar
      c.strokeStyle = '#8a94a0'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(46, -50); c.lineTo(58, -74); c.stroke();
      c.restore();
    }
    rickshaw(W * 0.24, hz + 10, 1.0, '#7a1f3a');
    rickshaw(W * 0.52, hz + 12, 0.92, '#1f4a5a');
    rickshaw(W * 0.86, hz + 10, 1.05, '#3a2a5a');

    // puddle reflections base
    c.fillStyle = 'rgba(60,140,190,0.10)';
    c.fillRect(0, hz + 10, W, 200);

    c = L.near;
    // foreground wet posts + a leaning umbrella
    c.fillStyle = 'rgba(8,12,16,0.92)';
    c.fillRect(0, L.ground - 200, 8, 210);
    c.fillRect(W - 200, L.ground - 200, 8, 210);
    c.fillStyle = 'rgba(10,14,20,0.85)';
    c.beginPath();
    c.moveTo(-40, L.ground - 120);
    c.quadraticCurveTo(60, L.ground - 210, 150, L.ground - 130);
    c.lineTo(150, L.ground - 110);
    c.quadraticCurveTo(60, L.ground - 186, -40, L.ground - 100);
    c.closePath(); c.fill();
  }

  /* ---------- 5. BOLI KHELA AKHRA ---------- */
  function drawAkhra(L) {
    var c = L.far, W = L.W, H = L.H, hz = L.horizon, R = rand(7777);
    // festival lights / crowd silhouettes far
    c.fillStyle = L.pal.far;
    c.fillRect(0, hz - 40, W, 60);
    for (var i = 0; i < 200; i++) {
      var x = R() * W;
      var y = hz - 20 - R() * 30;
      c.fillStyle = 'rgba(20,12,16,0.9)';
      c.beginPath();
      c.arc(x, y, 5 + R() * 4, 0, 6.284);
      c.fill();
      c.fillRect(x - 6, y, 12, 34);
    }
    // torches
    for (var t = 0; t < 9; t++) {
      var tx = 80 + t * (W / 9);
      c.fillStyle = '#2a1a14';
      c.fillRect(tx, hz - 150, 7, 150);
      c.fillStyle = 'rgba(255,150,50,0.9)';
      c.beginPath(); c.ellipse(tx + 3, hz - 156, 9, 16, 0, 0, 6.284); c.fill();
      c.fillStyle = 'rgba(255,180,90,0.18)';
      c.beginPath(); c.arc(tx + 3, hz - 156, 46, 0, 6.284); c.fill();
    }
    c = L.mid;
    // crowd ring — head + shoulders, rim-lit by the torches
    for (var row = 0; row < 3; row++) {
      for (var k = 0; k < 74; k++) {
        var cx = k * (W / 72) + (row % 2) * 11 + Math.sin(k * 3.7 + row) * 3;
        var cy = hz - 4 - row * 25;
        var rr = 8 + ((k * 7 + row * 3) % 3);
        c.fillStyle = ['rgba(26,18,22,0.96)', 'rgba(34,24,26,0.96)', 'rgba(22,16,20,0.96)'][row];
        c.beginPath(); c.arc(cx, cy, rr, 0, 6.284); c.fill();
        c.beginPath();
        c.moveTo(cx - rr - 2, cy + 26);
        c.lineTo(cx - rr + 1, cy + rr * 0.5);
        c.quadraticCurveTo(cx, cy + rr * 1.05, cx + rr - 1, cy + rr * 0.5);
        c.lineTo(cx + rr + 2, cy + 26);
        c.closePath(); c.fill();
        c.strokeStyle = 'rgba(255,170,90,0.26)';
        c.lineWidth = 1.4;
        c.beginPath();
        c.arc(cx, cy, rr + 0.6, -2.5, -0.7);
        c.stroke();
      }
    }
    // bunting
    for (var f = 0; f < 3; f++) {
      var y0 = hz - 170 - f * 24;
      c.strokeStyle = 'rgba(230,200,140,0.25)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(0, y0); c.quadraticCurveTo(W / 2, y0 + 46, W, y0); c.stroke();
      for (var fl = 0; fl < 40; fl++) {
        var fx = fl * (W / 39);
        var fy = y0 + Math.sin(fl / 39 * 3.1416) * 46;
        c.fillStyle = ['#c0392b', '#e0a030', '#2e86c1'][(fl + f) % 3];
        c.globalAlpha = 0.7;
        c.beginPath();
        c.moveTo(fx - 6, fy); c.lineTo(fx + 6, fy); c.lineTo(fx, fy + 14);
        c.closePath(); c.fill();
        c.globalAlpha = 1;
      }
    }
    // drummers
    for (var d = 0; d < 3; d++) {
      var dx = W * (0.2 + d * 0.3), dy = hz + 4;
      c.fillStyle = '#1a1218';
      c.beginPath(); c.arc(dx, dy - 74, 12, 0, 6.284); c.fill();
      c.fillRect(dx - 14, dy - 62, 28, 62);
      c.fillStyle = '#8a2a24';
      c.beginPath(); c.ellipse(dx + 24, dy - 34, 20, 14, 0, 0, 6.284); c.fill();
      c.fillStyle = '#d8c8a8';
      c.beginPath(); c.ellipse(dx + 24, dy - 34, 13, 8, 0, 0, 6.284); c.fill();
    }
    c = L.near;
    // dirt ring lip
    c.strokeStyle = 'rgba(40,24,16,0.9)'; c.lineWidth = 10;
    c.beginPath();
    c.ellipse(W / 2, L.ground + 30, W * 0.62, 46, 0, 0, 6.284);
    c.stroke();
  }

  /* ---------- 6. CHAIRMAN'S ROOFTOP ---------- */
  function drawRooftop(L) {
    var c = L.far, W = L.W, H = L.H, hz = L.horizon, R = rand(3131);
    // deep city skyline
    for (var i = 0; i < 40; i++) {
      var x = i * 56 + R() * 24;
      var bh = 40 + R() * 170;
      c.fillStyle = shade(L.pal.far, (R() * 8) | 0);
      c.fillRect(x, hz + 20 - bh, 48, bh + 40);
      for (var wy = 0; wy < 9; wy++) {
        for (var wx = 0; wx < 2; wx++) {
          if (R() > 0.72) {
            c.fillStyle = 'rgba(180,210,255,0.55)';
            c.fillRect(x + 8 + wx * 18, hz + 20 - bh + 10 + wy * 20, 8, 11);
          }
        }
      }
    }
    // stars
    for (var s = 0; s < 90; s++) {
      var sx = R() * W, sy = R() * hz * 0.55;
      c.fillStyle = 'rgba(200,220,255,' + (0.15 + R() * 0.5) + ')';
      c.fillRect(sx, sy, 1.6, 1.6);
    }
    c = L.mid;
    // parapet wall
    c.fillStyle = '#2a2d38';
    c.fillRect(0, hz - 6, W, 40);
    c.fillStyle = '#333743';
    c.fillRect(0, hz - 14, W, 10);
    // water tank
    c.fillStyle = '#1f232c';
    c.fillRect(W * 0.14, hz - 150, 150, 140);
    c.fillStyle = '#282d38';
    c.beginPath(); c.ellipse(W * 0.14 + 75, hz - 150, 75, 18, 0, 0, 6.284); c.fill();
    c.strokeStyle = '#3a404e'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(W * 0.14 + 20, hz - 140); c.lineTo(W * 0.14 + 20, hz - 12); c.stroke();
    c.beginPath(); c.moveTo(W * 0.14 + 130, hz - 140); c.lineTo(W * 0.14 + 130, hz - 12); c.stroke();
    // antenna + red light
    c.strokeStyle = '#39404e'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(W * 0.72, hz - 10); c.lineTo(W * 0.72, hz - 190); c.stroke();
    c.beginPath(); c.moveTo(W * 0.72 - 24, hz - 150); c.lineTo(W * 0.72 + 24, hz - 150); c.stroke();
    c.fillStyle = 'rgba(255,60,60,0.9)';
    c.beginPath(); c.arc(W * 0.72, hz - 194, 4, 0, 6.284); c.fill();
    // laundry line
    c.strokeStyle = 'rgba(180,190,210,0.28)'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(W * 0.30, hz - 100); c.quadraticCurveTo(W * 0.45, hz - 84, W * 0.60, hz - 104); c.stroke();
    ['#c0392b', '#e8e2d2', '#2e86c1'].forEach(function (col, i) {
      c.fillStyle = col;
      c.globalAlpha = 0.5;
      roundRect(c, W * 0.34 + i * 60, hz - 98, 34, 42, 3);
      c.fill();
      c.globalAlpha = 1;
    });
    c = L.near;
    c.fillStyle = 'rgba(10,12,17,0.95)';
    c.fillRect(0, L.ground - 4, W, 10);
    // AC units
    roundRect(c, 20, L.ground - 90, 110, 86, 5); c.fill();
    roundRect(c, W - 140, L.ground - 96, 120, 92, 5); c.fill();
  }

  /* ---------- stage draw ---------- */
  Art.drawStage = function (ctx, stage, cam, W, H, time, weatherState) {
    var L = buildLayers(stage, W, H);
    var hz = H * 0.66, ground = H * 0.80;

    // sky
    var g = ctx.createLinearGradient(0, 0, 0, ground);
    g.addColorStop(0, stage.sky[0]);
    g.addColorStop(0.45, stage.sky[1]);
    g.addColorStop(0.78, stage.sky[2]);
    g.addColorStop(1, stage.sky[3]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, ground + 2);

    // sun / moon
    if (stage.id === 'rooftop') {
      ctx.fillStyle = 'rgba(220,235,255,0.92)';
      ctx.beginPath(); ctx.arc(W * 0.78, H * 0.14, 34, 0, 6.284); ctx.fill();
      ctx.fillStyle = 'rgba(160,190,255,0.10)';
      ctx.beginPath(); ctx.arc(W * 0.78, H * 0.14, 96, 0, 6.284); ctx.fill();
    } else if (stage.id !== 'rickshaw') {
      var sunY = stage.id === 'akhra' ? H * 0.46 : H * 0.30;
      var sg = ctx.createRadialGradient(W * 0.68, sunY, 6, W * 0.68, sunY, 150);
      sg.addColorStop(0, 'rgba(255,235,190,0.85)');
      sg.addColorStop(0.25, 'rgba(255,200,130,0.28)');
      sg.addColorStop(1, 'rgba(255,180,110,0)');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(W * 0.68, sunY, 150, 0, 6.284); ctx.fill();
    }

    var off = function (p) { return -(cam.x - D.WORLD_W / 2) * p * cam.zoom; };

    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.drawImage(L.far, off(0.10) - (L.LW - W) / 2, 0);
    ctx.restore();

    // receding lane between the horizon and the fighting ground
    var lane = ctx.createLinearGradient(0, hz - 4, 0, ground);
    lane.addColorStop(0, shade(stage.ground, -52));
    lane.addColorStop(0.45, shade(stage.ground, -26));
    lane.addColorStop(1, stage.ground);
    ctx.fillStyle = lane;
    ctx.fillRect(0, hz - 4, W, ground - hz + 4);
    ctx.strokeStyle = 'rgba(0,0,0,0.09)';
    ctx.lineWidth = 1;
    for (var pj = 0; pj < 14; pj++) {
      var pt = pj / 14;
      var py = hz + (ground - hz) * (pt * pt);
      ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke();
    }

    ctx.drawImage(L.mid, off(0.42) - (L.LW - W) / 2, 0);

    // ground plane
    var gg = ctx.createLinearGradient(0, ground, 0, H);
    gg.addColorStop(0, stage.ground);
    gg.addColorStop(0.55, stage.groundDark);
    gg.addColorStop(1, shade(stage.groundDark, -30));
    ctx.fillStyle = gg;
    ctx.fillRect(0, ground, W, H - ground);
    // ground texture lines
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    for (var i = 1; i < 7; i++) {
      var y = ground + (H - ground) * (i / 7);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    // scattered grit, cracks and debris on the lane
    var Rg = rand(stage.id.length * 977 + 31);
    for (var gi = 0; gi < 90; gi++) {
      var gx = Rg() * W;
      var gy = ground + Rg() * (H - ground);
      var depth = (gy - ground) / (H - ground);
      ctx.fillStyle = depth > 0.45 ? 'rgba(0,0,0,0.16)' : 'rgba(255,235,200,0.07)';
      ctx.fillRect(gx, gy, 2 + Rg() * 26 * (0.35 + depth), 1.4 + depth * 2.4);
    }
    for (var ci = 0; ci < 9; ci++) {
      var cx0 = Rg() * W, cy0 = ground + Rg() * (H - ground) * 0.8;
      ctx.strokeStyle = 'rgba(0,0,0,0.14)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx0, cy0);
      ctx.lineTo(cx0 + 18 + Rg() * 40, cy0 + Rg() * 8 - 4);
      ctx.stroke();
    }
    // horizon line
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(0, ground - 2, W, 3);

    // arena light pool — separates the fighters from the backdrop
    var lg = ctx.createRadialGradient(W / 2, ground + 30, 20, W / 2, ground + 30, W * 0.62);
    lg.addColorStop(0, 'rgba(255,226,170,0.13)');
    lg.addColorStop(0.55, 'rgba(255,210,150,0.05)');
    lg.addColorStop(1, 'rgba(255,210,150,0)');
    ctx.fillStyle = lg;
    ctx.fillRect(0, 0, W, H);

    ctx.drawImage(L.near, off(1.05) - (L.LW - W) / 2, 0);

    // fog / atmosphere
    ctx.fillStyle = stage.fog;
    ctx.fillRect(0, 0, W, H);

    // vignette
    var vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, H * 1.0);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.40)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    // tint
    if (stage.tint === 'warm') { ctx.fillStyle = 'rgba(255,170,80,0.06)'; ctx.fillRect(0, 0, W, H); }
    if (stage.tint === 'cold') { ctx.fillStyle = 'rgba(70,140,220,0.08)'; ctx.fillRect(0, 0, W, H); }
    if (stage.tint === 'rust') { ctx.fillStyle = 'rgba(220,110,40,0.07)'; ctx.fillRect(0, 0, W, H); }
    if (stage.tint === 'festival') { ctx.fillStyle = 'rgba(255,120,60,0.06)'; ctx.fillRect(0, 0, W, H); }

    return { horizon: hz, ground: ground };
  };

  /* ============================================================
     WEATHER
     ============================================================ */
  Art.Weather = function (kind, W, H) {
    this.kind = kind; this.W = W; this.H = H; this.p = [];
    var n = kind === 'rain' ? 220 : kind === 'dust' ? 60 : kind === 'embers' ? 70 : kind === 'flies' ? 26 : kind === 'citylights' ? 0 : 16;
    for (var i = 0; i < n; i++) this.p.push(this.spawn(true));
    this.t = 0;
  };
  Art.Weather.prototype.spawn = function (init) {
    var W = this.W, H = this.H;
    switch (this.kind) {
      case 'rain': return { x: Math.random() * W * 1.2, y: init ? Math.random() * H : -20, v: 900 + Math.random() * 500, l: 14 + Math.random() * 20, a: 0.15 + Math.random() * 0.3 };
      case 'dust': return { x: Math.random() * W, y: init ? Math.random() * H : H + 10, v: -20 - Math.random() * 40, s: 1 + Math.random() * 3, a: 0.1 + Math.random() * 0.25, ph: Math.random() * 6.28 };
      case 'embers': return { x: Math.random() * W, y: init ? Math.random() * H : H + 10, v: -40 - Math.random() * 70, s: 1 + Math.random() * 2, a: 0.2 + Math.random() * 0.5, ph: Math.random() * 6.28 };
      case 'flies': return { x: Math.random() * W, y: H * 0.4 + Math.random() * H * 0.45, ph: Math.random() * 6.28, sp: 0.5 + Math.random(), s: 1 + Math.random() };
      case 'steam': return { x: W * 0.24 + Math.random() * W * 0.20, y: H * 0.55 + Math.random() * H * 0.18, v: -14 - Math.random() * 16, s: 4 + Math.random() * 7, a: 0.05 + Math.random() * 0.07, ph: Math.random() * 6.28 };
      default: return { x: Math.random() * W, y: Math.random() * H };
    }
  };
  Art.Weather.prototype.update = function (dt) {
    this.t += dt;
    var H = this.H;
    for (var i = 0; i < this.p.length; i++) {
      var q = this.p[i];
      switch (this.kind) {
        case 'rain':
          q.y += q.v * dt; q.x -= q.v * 0.22 * dt;
          if (q.y > H) { this.p[i] = this.spawn(false); }
          break;
        case 'dust':
          q.y += q.v * dt * 0.3; q.x += Math.sin(this.t + q.ph) * 12 * dt;
          if (q.y < -10) this.p[i] = this.spawn(false);
          break;
        case 'embers':
          q.y += q.v * dt; q.x += Math.sin(this.t * 2 + q.ph) * 22 * dt;
          if (q.y < -10) this.p[i] = this.spawn(false);
          break;
        case 'flies':
          q.x += Math.sin(this.t * q.sp + q.ph) * 22 * dt;
          q.y += Math.cos(this.t * q.sp * 1.3 + q.ph) * 16 * dt;
          break;
        case 'steam':
          q.y += q.v * dt; q.s += 3.2 * dt;
          if (q.y < H * 0.28) this.p[i] = this.spawn(false);
          break;
      }
    }
  };
  Art.Weather.prototype.draw = function (ctx) {
    var k = this.kind;
    ctx.save();
    if (k === 'rain') {
      ctx.strokeStyle = 'rgba(180,220,255,0.5)';
      ctx.lineWidth = 1.1;
      for (var i = 0; i < this.p.length; i++) {
        var q = this.p[i];
        ctx.globalAlpha = q.a;
        ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - q.l * 0.22, q.y + q.l); ctx.stroke();
      }
    } else if (k === 'dust' || k === 'embers') {
      for (var j = 0; j < this.p.length; j++) {
        var d = this.p[j];
        ctx.globalAlpha = d.a;
        ctx.fillStyle = k === 'embers' ? '#ffa040' : '#e8c080';
        ctx.beginPath(); ctx.arc(d.x, d.y, d.s, 0, 6.284); ctx.fill();
      }
    } else if (k === 'flies') {
      for (var f = 0; f < this.p.length; f++) {
        var y = this.p[f];
        ctx.globalAlpha = 0.4 + Math.sin(this.t * 3 + y.ph) * 0.3;
        ctx.fillStyle = '#fff6c0';
        ctx.beginPath(); ctx.arc(y.x, y.y, y.s, 0, 6.284); ctx.fill();
      }
    } else if (k === 'steam') {
      for (var s = 0; s < this.p.length; s++) {
        var st = this.p[s];
        var gr = ctx.createRadialGradient(st.x, st.y, 0, st.x, st.y, st.s * 2.4);
        gr.addColorStop(0, 'rgba(255,250,240,' + st.a * 1.6 + ')');
        gr.addColorStop(1, 'rgba(255,250,240,0)');
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.arc(st.x, st.y, st.s * 2.4, 0, 6.284); ctx.fill();
      }
    }
    ctx.restore();
  };

  MM.Art = Art;
})(window);
