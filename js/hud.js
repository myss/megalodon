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
      depth: $('depth'),
      map: $('minimap').getContext('2d'),
      bigmapCanvas: $('bigmap'),
      bigmap: $('bigmap').getContext('2d'),
    };
  },

  toggleBigMap() {
    this.el.bigmapCanvas.classList.toggle('hidden');
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
    const st = this.el.stealth;
    if (P.flying) {
      st.textContent = 'UÇUYORSUN';
      st.style.background = 'rgba(60,140,230,.85)';
      st.style.visibility = 'visible';
    } else {
      st.textContent = 'GİZLİ';
      st.style.background = '';
      st.style.visibility = P.stealthy ? 'visible' : 'hidden';
    }
    if (P.pos.y > WATER_Y) {
      this.el.depth.textContent = 'Yükseklik: ' + Math.round(P.pos.y * 2) + ' m';
    } else {
      const meters = Math.max(0, Math.round(-P.pos.y * DEPTH_TO_METERS / 10) * 10);
      this.el.depth.textContent = 'Derinlik: ' + meters.toLocaleString('tr-TR') + ' m';
    }

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

    // Küçük harita: megalodonun çevresi. Büyük harita: bütün dünya.
    this.drawMap(this.el.map, 190, Player.pos.x, Player.pos.z, 300, true);
    if (!this.el.bigmapCanvas.classList.contains('hidden')) {
      this.drawMap(this.el.bigmap, 560, 0, 0, WORLD_HALF, false);
    }
  },

  drawMap(g, S, cx, cz, range, round) {
    const C = S / 2, k = (C - 6) / range;
    // Haritada ileri (+Z) yukarı, sağ taraf -X
    const mx = (x) => C - (x - cx) * k, my = (z) => C - (z - cz) * k;
    g.clearRect(0, 0, S, S);
    g.save();
    g.beginPath();
    if (round) g.arc(C, C, C - 2, 0, Math.PI * 2);
    else g.rect(0, 0, S, S);
    g.clip();
    g.fillStyle = 'rgba(20,90,140,.55)';
    g.fillRect(0, 0, S, S);

    // Mariana Çukuru
    g.strokeStyle = 'rgba(70,10,110,.85)';
    g.lineCap = 'round';
    g.lineWidth = TRENCH.width * 1.1 * k;
    g.beginPath(); g.moveTo(mx(TRENCH.ax), my(TRENCH.az)); g.lineTo(mx(TRENCH.bx), my(TRENCH.bz)); g.stroke();
    if (!round) {
      g.fillStyle = '#e0b0ff';
      g.font = 'bold 15px Segoe UI, Arial';
      g.textAlign = 'left';
      g.fillText('MARİANA ÇUKURU', mx((TRENCH.ax + TRENCH.bx) / 2) + TRENCH.width * k, my((TRENCH.az + TRENCH.bz) / 2));
    }

    for (const isl of ISLANDS) {
      g.fillStyle = '#e8d49a';
      g.beginPath(); g.arc(mx(isl.x), my(isl.z), isl.r * k, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#4f9a3a';
      g.beginPath(); g.arc(mx(isl.x), my(isl.z), isl.r * k * 0.75, 0, Math.PI * 2); g.fill();
    }
    if (round) {
      for (const e of Enemies.list) {
        if (e.pos.distanceTo(Player.pos) > 150) continue;
        g.fillStyle = e.type.passive ? '#9fe0ff' : e.type.boss ? '#ff00ff' : e.type.neutral ? '#ffaa40' : e.type.drifter ? '#e08cff' : '#ff4040';
        g.beginPath(); g.arc(mx(e.pos.x), my(e.pos.z), e.type.boss ? 4.5 : 3, 0, Math.PI * 2); g.fill();
      }
      const blink = Math.floor(performance.now() / 400) % 2 === 0;
      for (const a of Land.list) {
        if (a.state === 'drink' && !blink) continue;
        g.fillStyle = '#ffe040';
        g.beginPath(); g.arc(mx(a.pos.x), my(a.pos.z), 3, 0, Math.PI * 2); g.fill();
      }
      // Çukur görünmüyorsa kenarda yönünü gösteren mor ok
      const tr = trenchDistance(cx, cz);
      if (tr.d > range * 0.9) {
        const tx = lerp(TRENCH.ax, TRENCH.bx, tr.u), tz = lerp(TRENCH.az, TRENCH.bz, tr.u);
        const ang = Math.atan2(my(tz) - C, mx(tx) - C);
        g.save();
        g.translate(C + Math.cos(ang) * (C - 12), C + Math.sin(ang) * (C - 12));
        g.rotate(ang);
        g.fillStyle = '#c070ff';
        g.beginPath(); g.moveTo(8, 0); g.lineTo(-6, -7); g.lineTo(-6, 7); g.closePath(); g.fill();
        g.restore();
      }
    }
    // Oyuncu oku
    const px = mx(Player.pos.x), py = my(Player.pos.z);
    g.translate(px, py);
    g.rotate(Math.atan2(-Math.cos(Player.yaw), -Math.sin(Player.yaw)));
    if (!round) g.scale(1.6, 1.6);
    g.fillStyle = '#fff';
    g.beginPath(); g.moveTo(7, 0); g.lineTo(-5, -5); g.lineTo(-2, 0); g.lineTo(-5, 5); g.closePath(); g.fill();
    g.restore();
  },
};
