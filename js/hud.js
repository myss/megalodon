// Ekrandaki göstergeler, mesajlar ve mini harita
const Hud = {
  el: {},
  floats: [],
  target: null,
  targetTimer: 0,

  init() {
    const $ = (id) => document.getElementById(id);
    this.el = {
      level: $('level'),
      xp: $('xpBar').firstElementChild,
      hp: $('hpBar').firstElementChild,
      food: $('foodBar').firstElementChild,
      stam: $('stamBar').firstElementChild,
      stealth: $('stealth'),
      messages: $('messages'),
      floats: $('floats'),
      target: $('target'),
      targetName: $('targetName'),
      targetBar: $('targetBar').firstElementChild,
      map: $('minimap').getContext('2d'),
    };
  },

  msg(text, big) {
    const d = document.createElement('div');
    d.className = 'msg' + (big ? ' big' : '');
    d.textContent = text;
    this.el.messages.appendChild(d);
    while (this.el.messages.children.length > 4) this.el.messages.firstChild.remove();
    setTimeout(() => { d.style.opacity = 0; }, big ? 2200 : 2600);
    setTimeout(() => d.remove(), big ? 2900 : 3300);
  },

  big(text) { this.msg(text, true); },

  float(text, worldPos, color) {
    const d = document.createElement('div');
    d.className = 'float';
    d.textContent = text;
    d.style.color = color;
    this.el.floats.appendChild(d);
    this.floats.push({ el: d, pos: worldPos.clone().add(new THREE.Vector3(rand(-1, 1), 2, rand(-1, 1))), life: 1.2 });
  },

  setTarget(t) {
    this.target = t;
    this.targetTimer = 4;
  },

  update(dt, camera) {
    const P = Player;
    this.el.level.textContent = 'Seviye ' + P.level;
    this.el.xp.style.width = (100 * P.xp / P.xpNeeded()) + '%';
    this.el.hp.style.width = (100 * P.hp / P.maxHp) + '%';
    this.el.food.style.width = P.hunger + '%';
    this.el.stam.style.width = P.stamina + '%';
    this.el.stealth.style.visibility = P.stealthy ? 'visible' : 'hidden';

    // Hedef canı
    this.targetTimer -= dt;
    if (this.target && !this.target.dead && this.targetTimer > 0) {
      this.el.target.style.visibility = 'visible';
      this.el.targetName.textContent = this.target.name;
      this.el.targetBar.style.width = (100 * Math.max(0, this.target.hp) / this.target.maxHp) + '%';
    } else {
      this.el.target.style.visibility = 'hidden';
    }

    // Uçan yazılar
    const w = window.innerWidth, h = window.innerHeight;
    const v = new THREE.Vector3();
    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i];
      f.life -= dt;
      f.pos.y += dt * 2.5;
      if (f.life <= 0) { f.el.remove(); this.floats.splice(i, 1); continue; }
      v.copy(f.pos).project(camera);
      if (v.z > 1) { f.el.style.display = 'none'; continue; }
      f.el.style.display = '';
      f.el.style.left = ((v.x + 1) / 2 * w) + 'px';
      f.el.style.top = ((1 - v.y) / 2 * h) + 'px';
      f.el.style.opacity = Math.min(1, f.life * 2);
    }

    this.drawMap();
  },

  drawMap() {
    const g = this.el.map;
    const S = 190, C = S / 2, k = (C - 6) / WORLD_HALF;
    // Haritada ileri (+Z) yukarı, sağ taraf -X
    const mx = (x) => C - x * k, my = (z) => C - z * k;
    g.clearRect(0, 0, S, S);
    g.save();
    g.beginPath(); g.arc(C, C, C - 2, 0, Math.PI * 2); g.clip();
    g.fillStyle = 'rgba(20,90,140,.55)';
    g.fillRect(0, 0, S, S);
    for (const isl of ISLANDS) {
      g.fillStyle = '#e8d49a';
      g.beginPath(); g.arc(mx(isl.x), my(isl.z), isl.r * k, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#4f9a3a';
      g.beginPath(); g.arc(mx(isl.x), my(isl.z), isl.r * k * 0.75, 0, Math.PI * 2); g.fill();
    }
    for (const e of Enemies.list) {
      if (e.pos.distanceTo(Player.pos) > 150) continue;
      g.fillStyle = e.type.passive ? '#9fe0ff' : e.type.boss ? '#ff00ff' : '#ff4040';
      g.beginPath(); g.arc(mx(e.pos.x), my(e.pos.z), e.type.boss ? 4.5 : 3, 0, Math.PI * 2); g.fill();
    }
    const blink = Math.floor(performance.now() / 400) % 2 === 0;
    for (const a of Land.list) {
      if (a.state === 'drink' && !blink) continue;
      g.fillStyle = '#ffe040';
      g.beginPath(); g.arc(mx(a.pos.x), my(a.pos.z), 3, 0, Math.PI * 2); g.fill();
    }
    // Oyuncu oku
    const px = mx(Player.pos.x), py = my(Player.pos.z);
    g.translate(px, py);
    g.rotate(Math.atan2(-Math.cos(Player.yaw), -Math.sin(Player.yaw)));
    g.fillStyle = '#fff';
    g.beginPath(); g.moveTo(7, 0); g.lineTo(-5, -5); g.lineTo(-2, 0); g.lineTo(-5, 5); g.closePath(); g.fill();
    g.restore();
  },
};
