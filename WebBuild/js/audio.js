/* ============================================================
   MOSTANADER MARAMARI — audio.js
   All sound is synthesized at runtime with the Web Audio API.
   No audio files, no dependencies.
   ============================================================ */
(function (global) {
  'use strict';

  var MM = global.MM || (global.MM = {});

  var A = {
    ctx: null,
    master: null,
    sfxBus: null,
    musicBus: null,
    noiseBuf: null,
    ready: false,
    muted: false,
    _musicTimer: null,
    _step: 0,
    _nextTime: 0,
    _track: null,
    _bpm: 92
  };

  // Bhairavi-flavoured scale (semitones from root)
  var SCALE = [0, 1, 3, 5, 7, 8, 10, 12, 13, 15, 17, 19];

  A.init = function () {
    if (A.ready) return;
    var Ctx = global.AudioContext || global.webkitAudioContext;
    if (!Ctx) return;
    A.ctx = new Ctx();
    A.master = A.ctx.createGain();
    A.master.gain.value = 0.85;
    A.master.connect(A.ctx.destination);

    A.sfxBus = A.ctx.createGain();
    A.sfxBus.gain.value = 0.75;
    A.sfxBus.connect(A.master);

    A.musicBus = A.ctx.createGain();
    A.musicBus.gain.value = 0.0;
    A.musicBus.connect(A.master);

    // shared noise buffer (2s of white noise)
    var len = Math.floor(A.ctx.sampleRate * 2);
    A.noiseBuf = A.ctx.createBuffer(1, len, A.ctx.sampleRate);
    var d = A.noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    A.ready = true;
  };

  A.resume = function () {
    if (!A.ready) A.init();
    if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume();
  };

  A.setMuted = function (m) {
    A.muted = m;
    if (A.master) A.master.gain.setTargetAtTime(m ? 0 : 0.85, A.ctx.currentTime, 0.05);
  };

  function now() { return A.ctx.currentTime; }

  function noiseSrc() {
    var s = A.ctx.createBufferSource();
    s.buffer = A.noiseBuf;
    s.loop = true;
    return s;
  }

  function env(gain, t0, peak, attack, decay) {
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
  }

  /* ---------------- SFX ---------------- */

  A.whoosh = function (vol) {
    if (!A.ready || A.muted) return;
    vol = vol == null ? 0.28 : vol;
    var t = now();
    var src = noiseSrc();
    var bp = A.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.1;
    bp.frequency.setValueAtTime(420, t);
    bp.frequency.exponentialRampToValueAtTime(2400, t + 0.13);
    var g = A.ctx.createGain();
    env(g, t, vol, 0.012, 0.13);
    src.connect(bp); bp.connect(g); g.connect(A.sfxBus);
    src.start(t); src.stop(t + 0.2);
  };

  A.hit = function (power, pitch) {
    if (!A.ready || A.muted) return;
    power = power == null ? 1 : power;
    pitch = pitch || 1;
    var t = now();

    // body thump
    var osc = A.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180 * pitch, t);
    osc.frequency.exponentialRampToValueAtTime(46 * pitch, t + 0.11);
    var g1 = A.ctx.createGain();
    env(g1, t, 0.5 * power, 0.004, 0.16);
    osc.connect(g1); g1.connect(A.sfxBus);
    osc.start(t); osc.stop(t + 0.22);

    // slap layer
    var src = noiseSrc();
    var lp = A.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(3200 * pitch, t);
    lp.frequency.exponentialRampToValueAtTime(700, t + 0.1);
    var g2 = A.ctx.createGain();
    env(g2, t, 0.34 * power, 0.003, 0.1);
    src.connect(lp); lp.connect(g2); g2.connect(A.sfxBus);
    src.start(t); src.stop(t + 0.16);
  };

  A.block = function () {
    if (!A.ready || A.muted) return;
    var t = now();
    var src = noiseSrc();
    var hp = A.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1800;
    var g = A.ctx.createGain();
    env(g, t, 0.3, 0.002, 0.09);
    src.connect(hp); hp.connect(g); g.connect(A.sfxBus);
    src.start(t); src.stop(t + 0.12);

    var osc = A.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1100, t);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.06);
    var g2 = A.ctx.createGain();
    env(g2, t, 0.12, 0.002, 0.07);
    osc.connect(g2); g2.connect(A.sfxBus);
    osc.start(t); osc.stop(t + 0.1);
  };

  A.jump = function () {
    if (!A.ready || A.muted) return;
    var t = now();
    var osc = A.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(680, t + 0.12);
    var g = A.ctx.createGain();
    env(g, t, 0.16, 0.01, 0.13);
    osc.connect(g); g.connect(A.sfxBus);
    osc.start(t); osc.stop(t + 0.18);
  };

  A.land = function () {
    if (!A.ready || A.muted) return;
    var t = now();
    var src = noiseSrc();
    var lp = A.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 500;
    var g = A.ctx.createGain();
    env(g, t, 0.2, 0.003, 0.09);
    src.connect(lp); lp.connect(g); g.connect(A.sfxBus);
    src.start(t); src.stop(t + 0.12);
  };

  A.ko = function () {
    if (!A.ready || A.muted) return;
    var t = now();
    var osc = A.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(28, t + 0.9);
    var lp = A.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1200, t);
    lp.frequency.exponentialRampToValueAtTime(160, t + 0.8);
    var g = A.ctx.createGain();
    env(g, t, 0.6, 0.01, 1.0);
    osc.connect(lp); lp.connect(g); g.connect(A.sfxBus);
    osc.start(t); osc.stop(t + 1.15);

    var src = noiseSrc();
    var bp = A.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(900, t);
    bp.frequency.exponentialRampToValueAtTime(120, t + 0.7);
    var g2 = A.ctx.createGain();
    env(g2, t, 0.35, 0.01, 0.8);
    src.connect(bp); bp.connect(g2); g2.connect(A.sfxBus);
    src.start(t); src.stop(t + 0.9);
  };

  A.click = function () {
    if (!A.ready || A.muted) return;
    var t = now();
    var osc = A.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1320, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.04);
    var g = A.ctx.createGain();
    env(g, t, 0.09, 0.002, 0.05);
    osc.connect(g); g.connect(A.sfxBus);
    osc.start(t); osc.stop(t + 0.08);
  };

  A.bell = function () {
    if (!A.ready || A.muted) return;
    var t = now();
    [880, 1320, 1760].forEach(function (f, i) {
      var o = A.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      var g = A.ctx.createGain();
      env(g, t, 0.12 / (i + 1), 0.004, 0.55);
      o.connect(g); g.connect(A.sfxBus);
      o.start(t); o.stop(t + 0.7);
    });
  };

  A.voice = function (pitch) {
    if (!A.ready || A.muted) return;
    var t = now();
    var o = A.ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(150 * (pitch || 1), t);
    o.frequency.linearRampToValueAtTime(210 * (pitch || 1), t + 0.08);
    o.frequency.exponentialRampToValueAtTime(110 * (pitch || 1), t + 0.22);
    var bp = A.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 700;
    bp.Q.value = 3;
    var g = A.ctx.createGain();
    env(g, t, 0.14, 0.01, 0.24);
    o.connect(bp); bp.connect(g); g.connect(A.sfxBus);
    o.start(t); o.stop(t + 0.3);
  };

  /* ---------------- MUSIC ---------------- */

  var TRACKS = {
    town: {
      bpm: 78,
      drone: [130.81, 196.00],   // C3, G3
      pattern: [1, 0, 0, 2, 0, 0, 1, 0, 2, 0, 0, 1, 0, 2, 0, 0],
      mel: [0, -1, 3, -1, 2, -1, 0, -1, 4, 3, 2, -1, 0, -1, -1, -1],
      drums: 0
    },
    fight: {
      bpm: 96,
      drone: [98.00, 146.83],    // G2, D3
      pattern: [1, 0, 3, 0, 2, 0, 1, 2, 1, 0, 3, 0, 2, 1, 0, 2],
      mel: [0, -1, 2, 3, -1, 5, 4, -1, 3, 2, -1, 0, -1, 3, 5, 7],
      drums: 1
    },
    boss: {
      bpm: 108,
      drone: [87.31, 130.81],    // F2, C3
      pattern: [1, 2, 0, 1, 3, 0, 2, 1, 1, 2, 0, 3, 2, 0, 1, 2],
      mel: [0, 1, 3, -1, 5, 3, 2, 0, -1, 7, 5, 3, -1, 2, 1, 0],
      drums: 2
    }
  };

  var droneNodes = [];

  function startDrone(freqs) {
    stopDrone();
    var t = now();
    freqs.forEach(function (f, i) {
      var o = A.ctx.createOscillator();
      o.type = i === 0 ? 'sawtooth' : 'sine';
      o.frequency.value = f;
      var lp = A.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = i === 0 ? 320 : 900;
      var g = A.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(i === 0 ? 0.10 : 0.06, t + 1.2);
      o.connect(lp); lp.connect(g); g.connect(A.musicBus);
      o.start(t);
      droneNodes.push({ o: o, g: g });
    });
  }

  function stopDrone() {
    var t = now();
    droneNodes.forEach(function (n) {
      try {
        n.g.gain.cancelScheduledValues(t);
        n.g.gain.setValueAtTime(n.g.gain.value, t);
        n.g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
        n.o.stop(t + 0.45);
      } catch (e) { /* noop */ }
    });
    droneNodes = [];
  }

  function playMel(freq, time, dur, vol) {
    var o = A.ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = freq;
    var lp = A.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2400;
    var g = A.ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(vol, time + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    // gentle vibrato
    var lfo = A.ctx.createOscillator();
    lfo.frequency.value = 5.2;
    var lg = A.ctx.createGain();
    lg.gain.value = freq * 0.006;
    lfo.connect(lg); lg.connect(o.frequency);
    lfo.start(time); lfo.stop(time + dur + 0.1);

    o.connect(lp); lp.connect(g); g.connect(A.musicBus);
    o.start(time); o.stop(time + dur + 0.1);
  }

  function playDrum(kind, time, vol) {
    if (kind === 0) return;
    if (kind === 1) { // dhol low
      var o = A.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(150, time);
      o.frequency.exponentialRampToValueAtTime(62, time + 0.14);
      var g = A.ctx.createGain();
      g.gain.setValueAtTime(vol, time);
      g.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
      o.connect(g); g.connect(A.musicBus);
      o.start(time); o.stop(time + 0.2);
    } else { // dhol high / tick
      var s = noiseSrc();
      var bp = A.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 2200;
      var g2 = A.ctx.createGain();
      g2.gain.setValueAtTime(vol * 0.6, time);
      g2.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);
      s.connect(bp); bp.connect(g2); g2.connect(A.musicBus);
      s.start(time); s.stop(time + 0.08);
    }
  }

  function scheduler() {
    if (!A._track) return;
    var spb = 60 / A._bpm / 4; // 16th note
    while (A._nextTime < now() + 0.25) {
      var st = A._step % 16;
      var tr = A._track;

      var p = tr.pattern[st];
      if (p === 1) playDrum(1, A._nextTime, 0.30);
      else if (p === 2) playDrum(2, A._nextTime, 0.22);
      else if (p === 3) playDrum(1, A._nextTime, 0.18);

      if (tr.drums === 2 && st % 8 === 0) playDrum(2, A._nextTime, 0.3);

      var mi = tr.mel[st];
      if (mi >= 0) {
        var root = tr.drone[0] * 4;
        var semi = SCALE[Math.min(mi, SCALE.length - 1)];
        playMel(root * Math.pow(2, semi / 12), A._nextTime, spb * 2.4, 0.075);
      }

      A._step++;
      A._nextTime += spb;
    }
  }

  A.playMusic = function (name) {
    if (!A.ready) return;
    if (A._track && A._musicName === name) return;
    A.stopMusic(true);
    var tr = TRACKS[name] || TRACKS.fight;
    A._track = tr;
    A._musicName = name;
    A._bpm = tr.bpm;
    A._step = 0;
    A._nextTime = now() + 0.1;
    startDrone(tr.drone);
    A.musicBus.gain.cancelScheduledValues(now());
    A.musicBus.gain.setValueAtTime(0.0001, now());
    A.musicBus.gain.linearRampToValueAtTime(A.muted ? 0 : 0.5, now() + 1.4);
    if (A._musicTimer) clearInterval(A._musicTimer);
    A._musicTimer = setInterval(scheduler, 60);
  };

  A.stopMusic = function (instant) {
    if (!A.ready) return;
    A._track = null;
    A._musicName = null;
    if (A._musicTimer) { clearInterval(A._musicTimer); A._musicTimer = null; }
    if (instant) {
      stopDrone();
    } else {
      A.musicBus.gain.setTargetAtTime(0.0001, now(), 0.15);
      setTimeout(stopDrone, 300);
    }
  };

  A.duck = function (on) {
    if (!A.ready) return;
    A.musicBus.gain.setTargetAtTime(on ? 0.12 : 0.5, now(), 0.2);
  };

  MM.Audio = A;
})(window);
