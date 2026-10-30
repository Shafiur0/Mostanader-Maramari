/* ============================================================
   MOSTANADER MARAMARI — ai.js
   Opponent brain. Emits the same input object the player uses.
   ============================================================ */
(function (global) {
  'use strict';
  var MM = global.MM || (global.MM = {});

  function mk() {
    return {
      left: false, right: false, up: false, down: false,
      lp: false, hp: false, kick: false, special: false, super: false,
      lpPressed: false, hpPressed: false, kickPressed: false,
      specialPressed: false, superPressed: false
    };
  }

  function Brain(diff) {
    this.d = diff || { react: 18, aggr: 0.5, block: 0.3, special: 0.15, antiAir: 0.2 };
    this.t = 0;
    this.plan = 'neutral';
    this.planT = 0;
    this.cool = 0;
    this.hold = mk();
    this.out = mk();
    this.lastHp = 1;
    this.jumpCd = 0;
    this.whiffPunish = 0;
  }

  Brain.prototype.reset = function () {
    this.plan = 'neutral'; this.planT = 0; this.cool = 0; this.hold = mk();
  };

  Brain.prototype.update = function (dt, self, opp) {
    var o = this.out;
    // clear pressed flags every frame
    o.lpPressed = o.hpPressed = o.kickPressed = o.specialPressed = o.superPressed = false;
    o.left = o.right = o.up = o.down = false;

    if (self.state === 'ko' || self.state === 'win' || self.state === 'intro') {
      return o;
    }

    this.t += dt;
    this.planT -= dt;
    this.cool -= dt;
    this.jumpCd -= dt;

    var dist = Math.abs(opp.x - self.x);
    var toward = opp.x > self.x ? 1 : -1;
    var reaction = this.d.react / 60;

    // ---- reactive blocking ----
    var oppAttacking = opp.state === 'attack' && opp.move;
    var threat = false;
    if (oppAttacking) {
      var m = opp.move;
      var frame = opp.stateT * 60;
      var willReach = Math.abs(opp.x - self.x) < m.reach * 1.25 + 30;
      if (willReach && frame < m.startup + m.active + 3) threat = true;
    }
    if (opp.state === 'super') threat = true;

    if (threat && this.cool <= 0 && Math.random() < this.d.block) {
      this.plan = 'block';
      this.planT = 0.22 + Math.random() * 0.2;
      this.cool = 0.1;
    }

    // ---- anti air ----
    if (opp.airY > 40 && dist < 190 && Math.random() < this.d.antiAir * dt * 8 && this.cool <= 0) {
      this.plan = 'antiair';
      this.planT = 0.3;
      this.cool = 0.35;
    }

    // ---- decide a new plan when the old one expires ----
    if (this.planT <= 0 && this.cool <= 0) {
      var r = Math.random();
      if (dist > 330) {
        this.plan = r < 0.82 ? 'approach' : (r < 0.92 ? 'jumpin' : 'wait');
        this.planT = 0.25 + Math.random() * 0.35;
      } else if (dist > 165) {
        if (r < this.d.aggr * 0.55) this.plan = 'approach';
        else if (r < this.d.aggr * 0.55 + this.d.special * 0.7) this.plan = 'special';
        else if (r < this.d.aggr * 0.55 + this.d.special * 0.7 + 0.12) this.plan = 'jumpin';
        else if (r < this.d.aggr * 0.9 + 0.25) this.plan = 'poke';
        else this.plan = 'block';
        this.planT = 0.18 + Math.random() * 0.3;
      } else {
        if (self.meter >= 100 && r < 0.45) this.plan = 'super';
        else if (r < this.d.aggr * 0.5) this.plan = 'rush';
        else if (r < this.d.aggr * 0.5 + this.d.special * 0.5) this.plan = 'special';
        else if (r < 0.85) this.plan = 'attack';
        else this.plan = 'retreat';
        this.planT = 0.14 + Math.random() * 0.22;
      }
      this.cool = reaction * (0.6 + Math.random() * 0.8);
    }

    // ---- execute plan ----
    var p = this.plan;
    if (p === 'approach') {
      if (toward > 0) o.right = true; else o.left = true;
    } else if (p === 'retreat') {
      if (toward > 0) o.left = true; else o.right = true;
    } else if (p === 'block') {
      if (toward > 0) o.left = true; else o.right = true;
      if (Math.random() < 0.5) o.down = true;
    } else if (p === 'wait') {
      // stand still, maybe shuffle
    } else if (p === 'poke') {
      if (this.planT > 0.12) {
        if (toward > 0) o.right = true; else o.left = true;
      } else if (this.planT > 0) {
        o.lpPressed = true; o.lp = true;
      }
    } else if (p === 'attack') {
      var rr = Math.random();
      if (rr < 0.45) { o.lpPressed = true; o.lp = true; }
      else if (rr < 0.72) { o.hpPressed = true; o.hp = true; }
      else if (rr < 0.88) { o.kickPressed = true; o.kick = true; }
      else { o.down = true; o.kickPressed = true; o.kick = true; }
      this.planT = 0.02;
    } else if (p === 'rush') {
      if (dist > 80) { if (toward > 0) o.right = true; else o.left = true; }
      else { o.lpPressed = true; o.lp = true; }
    } else if (p === 'special') {
      if (self.meter >= 50 && dist < 210) {
        o.specialPressed = true; o.special = true;
        this.planT = 0.02;
      } else {
        if (toward > 0) o.right = true; else o.left = true;
      }
    } else if (p === 'super') {
      if (self.meter >= 100 && dist < 175) {
        o.superPressed = true; o.super = true;
        this.planT = 0.02;
      } else {
        if (toward > 0) o.right = true; else o.left = true;
      }
    } else if (p === 'jumpin') {
      if (self.grounded && this.jumpCd <= 0) {
        o.up = true;
        if (toward > 0) o.right = true; else o.left = true;
        this.jumpCd = 0.9;
      } else if (!self.grounded && dist < 170) {
        o.hpPressed = true; o.hp = true;
      } else if (!self.grounded) {
        if (toward > 0) o.right = true; else o.left = true;
      }
    } else if (p === 'antiair') {
      if (self.grounded) { o.hpPressed = true; o.hp = true; }
    }

    // keep out of the corner
    if (self.x < 220) o.right = true;
    if (self.x > MM.Data.WORLD_W - 220) o.left = true;

    return o;
  };

  MM.Brain = Brain;
})(window);
