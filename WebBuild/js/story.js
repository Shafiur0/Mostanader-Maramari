/* ============================================================
   MOSTANADER MARAMARI — story.js
   Save data, progress, dialogue player.
   ============================================================ */
(function (global) {
  'use strict';
  var MM = global.MM || (global.MM = {});
  var KEY = 'mm_save_v1';

  var Save = {
    data: { cleared: [], unlocked: [], seen: [] },
    load: function () {
      try {
        var raw = global.localStorage.getItem(KEY);
        if (raw) {
          var o = JSON.parse(raw);
          this.data.cleared = o.cleared || [];
          this.data.unlocked = o.unlocked || [];
          this.data.seen = o.seen || [];
        }
      } catch (e) { /* private mode */ }
      return this.data;
    },
    persist: function () {
      try { global.localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { }
    },
    clearChapter: function (n) {
      if (this.data.cleared.indexOf(n) < 0) this.data.cleared.push(n);
      // unlock the next chapter + the beaten opponent
      var ch = MM.Data.CHAPTERS[n];
      if (ch && this.data.unlocked.indexOf(ch.opponent) < 0) this.data.unlocked.push(ch.opponent);
      this.persist();
    },
    isCleared: function (n) { return this.data.cleared.indexOf(n) >= 0; },
    maxChapter: function () {
      var m = 0;
      for (var i = 0; i < MM.Data.CHAPTERS.length; i++) {
        if (this.isCleared(i)) m = i + 1;
      }
      return Math.min(m, MM.Data.CHAPTERS.length - 1);
    },
    reset: function () {
      this.data = { cleared: [], unlocked: [], seen: [] };
      this.persist();
    },
    roster: function () {
      // Mostafa always; others unlock as you beat them
      var out = ['mostafa'];
      for (var i = 0; i < MM.Data.CHAPTERS.length; i++) {
        if (this.isCleared(i)) {
          var id = MM.Data.CHAPTERS[i].opponent;
          if (out.indexOf(id) < 0) out.push(id);
        }
      }
      return out;
    }
  };

  /* ---------------- dialogue ---------------- */
  function Dialogue(lines, onDone) {
    this.lines = lines || [];
    this.i = 0;
    this.onDone = onDone;
    this.charT = 0;
    this.shown = 0;
    this.finished = false;
  }
  Dialogue.prototype.current = function () {
    return this.lines[this.i] || null;
  };
  Dialogue.prototype.update = function (dt) {
    var l = this.current();
    if (!l) return;
    var speed = 62;
    this.charT += dt * speed;
    this.shown = Math.min(l.text.length, Math.floor(this.charT));
  };
  Dialogue.prototype.advance = function () {
    var l = this.current();
    if (!l) { this.finished = true; return; }
    if (this.shown < l.text.length) {
      this.shown = l.text.length;
      this.charT = l.text.length;
      return;
    }
    this.i++;
    this.charT = 0;
    this.shown = 0;
    if (this.i >= this.lines.length) {
      this.finished = true;
      if (this.onDone) this.onDone();
    }
  };
  Dialogue.prototype.visibleText = function () {
    var l = this.current();
    if (!l) return '';
    return l.text.substring(0, this.shown);
  };

  MM.Save = Save;
  MM.Dialogue = Dialogue;
})(window);
