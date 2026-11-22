// Okyanusun gizemleri. Her gizem dünyada baştan beri durur; dolaşırken bulunabilir.
// Her gizemin bir de zor bir yere saklanmış tek bir haritası var: harita gizemin yerini işaretler.

// ---- Modeller ----

function stoneMat(color) { return mat(color || 0xb8b4a0); }

function buildSunkenCity() {
  const g = new THREE.Group();
  const add = (m, x, y, z) => { m.position.set(x, y, z); g.add(m); return m; };
  add(box(44, 1.2, 44, 0x8a8676), 0, 0.2, 0);
  const colGeo = new THREE.CylinderGeometry(1.2, 1.4, 1, 10);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const h = i % 3 === 0 ? rand(3, 6) : rand(9, 14);
    const col = add(new THREE.Mesh(colGeo, stoneMat()), Math.cos(a) * 17, h / 2, Math.sin(a) * 17);
    col.scale.y = h;
    if (i % 5 === 2) { col.rotation.z = Math.PI / 2; col.position.y = 1.4; col.position.x += 4; }
  }
  add(box(16, 9, 12, 0xa8a490), 0, 4.8, 0);
  const roof = add(new THREE.Mesh(new THREE.ConeGeometry(11, 5, 4), stoneMat(0x9a9682)), 0, 11.8, 0);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1, 1, 0.8);
  add(box(4, 6, 0.6, 0x1a1a22), 0, 3.3, 6.1);
  for (const x of [-12, 12]) {
    add(box(2, 10, 2, 0xa8a490), x, 5, 20);
    add(box(2, 10, 2, 0xa8a490), x + (x < 0 ? 6 : -6), 5, 20);
    add(box(9, 1.6, 2.4, 0x9a9682), x + (x < 0 ? 3 : -3), 10.6, 20);
  }
  for (let i = 0; i < 10; i++) add(box(rand(1, 3), 0.6, rand(1, 3), 0x5e7a3a), rand(-20, 20), 1, rand(-20, 20));
  const crystal = add(new THREE.Mesh(new THREE.OctahedronGeometry(2.2, 0), glowMat(0x60f0ff, 1.5)), 0, 16, 0);
  return { group: g, spin: crystal };
}

function buildGraveyard() {
  const g = new THREE.Group();
  const bone = new THREE.MeshLambertMaterial({ color: 0xe8e0c8, emissive: 0x403828 });
  const ribGeo = new THREE.TorusGeometry(4.5, 0.35, 6, 14, Math.PI);
  const toothGeo = new THREE.ConeGeometry(0.4, 1.6, 4);
  for (const [x, z, yaw, s] of [[0, 0, 0.3, 1.3], [26, 14, 2.2, 1.0], [-22, 18, 4.0, 0.9]]) {
    const sk = new THREE.Group();
    for (let i = 0; i < 16; i++) {
      const v = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 6), bone);
      v.position.set(0, 1.2, -14 + i * 1.8);
      sk.add(v);
      if (i > 2 && i < 12) {
        const rib = new THREE.Mesh(ribGeo, bone);
        rib.position.set(0, 1.2, -14 + i * 1.8);
        rib.scale.setScalar(1 - Math.abs(i - 7) * 0.08);
        sk.add(rib);
      }
    }
    const jaw = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.6, 6, 16, Math.PI), bone);
    jaw.position.set(0, 1.5, 16);
    jaw.rotation.x = Math.PI / 2 + 0.3;
    sk.add(jaw);
    for (let i = 0; i < 9; i++) {
      const a = (i / 8) * Math.PI;
      const t = new THREE.Mesh(toothGeo, bone);
      t.position.set(Math.cos(a) * 3.4, 2.4, 16 + Math.sin(a) * 1.2);
      sk.add(t);
    }
    sk.position.set(x, 0, z);
    sk.rotation.y = yaw;
    sk.scale.setScalar(s);
    g.add(sk);
  }
  return { group: g, glow: bone };
}

function buildUfo() {
  const g = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), mat(0x9aa4ae));
  hull.scale.set(9, 1.6, 9);
  g.add(hull);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(8.6, 0.5, 8, 32), mat(0x5a646e));
  rim.rotation.x = Math.PI / 2;
  g.add(rim);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(4, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: 0x80e0ff, emissive: 0x206080, transparent: true, opacity: 0.6 }));
  dome.position.y = 1.1;
  g.add(dome);
  const lights = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), glowMat([0xff4040, 0x40ff60, 0x4080ff][i % 3], 2));
    l.position.set(Math.cos(a) * 8.6, -0.2, Math.sin(a) * 8.6);
    lights.push(l);
    g.add(l);
  }
  g.rotation.set(0.35, 0, 0.2);
  return { group: g, lights };
}

function buildVolcano() {
  const g = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(5, 32, 20, 14, 1, true), new THREE.MeshLambertMaterial({ color: 0x3a2f2a, flatShading: true, side: THREE.DoubleSide }));
  cone.position.y = 10;
  g.add(cone);
  const lava = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 4.8, 0.6, 14), glowMat(0xff6a10, 2));
  lava.position.y = 18.5;
  g.add(lava);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + rand(-0.2, 0.2);
    const r = box(rand(3, 6), rand(2, 4), rand(3, 6), 0x2a2220);
    r.position.set(Math.cos(a) * 30, 1, Math.sin(a) * 30);
    g.add(r);
  }
  return { group: g, crater: new THREE.Vector3(0, 19, 0) };
}

function buildSkyIsland() {
  const g = new THREE.Group();
  const rock = new THREE.Mesh(new THREE.ConeGeometry(22, 30, 9), new THREE.MeshLambertMaterial({ color: 0x6e5e4e, flatShading: true }));
  rock.rotation.x = Math.PI;
  rock.position.y = -15;
  g.add(rock);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 2, 18), mat(0x4f9a3a));
  g.add(top);
  for (let i = 0; i < 7; i++) {
    const a = rand(0, 6.28), d = rand(9, 18);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 4, 6), mat(0x6b4a2b));
    trunk.position.set(Math.cos(a) * d, 3, Math.sin(a) * d);
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4, 1), mat(0x4c9a3d));
    leaf.position.set(Math.cos(a) * d, 6.2, Math.sin(a) * d);
    g.add(trunk, leaf);
  }
  const pedestal = box(5, 3, 5, 0xd8d0b8);
  pedestal.position.y = 2.5;
  g.add(pedestal);
  const statue = buildShark({ top: 0xd4a62a, belly: 0xffe9a0 });
  statue.group.scale.setScalar(0.9);
  // Burnu yukarıda dik durur, dikey eksen etrafında döner
  statue.group.rotation.order = 'YXZ';
  statue.group.rotation.x = -Math.PI / 2 + 0.15;
  statue.group.position.y = 8;
  statue.group.traverse((o) => { if (o.isMesh) o.material = glowMat(o.material.color.getHex(), 0.35); });
  g.add(statue.group);
  for (let i = 0; i < 6; i++) {
    const c = ellipsoid(rand(4, 7), rand(1.5, 2.5), rand(4, 7), 0xffffff, 10);
    const a = (i / 6) * Math.PI * 2;
    c.position.set(Math.cos(a) * 26, rand(-12, -4), Math.sin(a) * 26);
    g.add(c);
  }
  return { group: g, spin: statue.group };
}

function buildMapScroll() {
  const g = new THREE.Group();
  const paper = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 3.2, 12), glowMat(0xf2dfb0, 0.7));
  paper.rotation.z = Math.PI / 2;
  g.add(paper);
  for (const x of [-1.8, 1.8]) {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.5, 8), mat(0x5a3a1e));
    rod.rotation.z = Math.PI / 2;
    rod.position.x = x;
    g.add(rod);
  }
  const ribbon = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.12, 6, 14), glowMat(0xd02020, 0.6));
  ribbon.rotation.y = Math.PI / 2;
  g.add(ribbon);
  g.scale.setScalar(1.6);
  return g;
}

// ---- Gizemler ----

// at: gizemin yeri; mapAt: haritanın saklandığı yer (null ise harita bir yerden düşer)
const MYSTERIES = [
  {
    id: 'sehir', name: 'Batık Şehir', radius: 50, xp: 500,
    riddle: 'Batıda, adalardan uzakta, eskilerin şehri suyun dibinde uyuyor.',
    solved: 'Denizin dibinde unutulmuş bir şehir!',
    at: () => { const x = -1000, z = 450; return new THREE.Vector3(x, terrainHeight(x, z), z); },
    mapAt: () => { const p = trenchCenter(0.65); return p.setY(terrainHeight(p.x, p.z) + 3); },
    build: buildSunkenCity,
  },
  {
    id: 'mezarlik', name: 'Megalodon Mezarlığı', radius: 45, xp: 500,
    riddle: 'Karanlığın en dibinde, senden öncekilerin kemikleri yatıyor.',
    solved: 'Eski megalodonların kemikleri... Sen sonuncususun.',
    at: () => { const p = trenchCenter(0.3); return p.setY(terrainHeight(p.x, p.z)); },
    mapAt: () => { const x = -950, z = -50; return new THREE.Vector3(x, terrainHeight(x, z) + 2.5, z); },
    build: buildGraveyard,
  },
  {
    id: 'uzayli', name: 'Uzaylı Gemisi', radius: 40, xp: 500,
    riddle: 'En büyük adanın tepesine gökyüzünden bir şey düştü.',
    solved: 'Gökten düşen bir uzay gemisi! İçinde kimse yok...',
    at: () => { const x = -600, z = -500; return new THREE.Vector3(x, terrainHeight(x, z) + 1, z); },
    mapAt: () => new THREE.Vector3(300, 150, 750),
    build: buildUfo,
  },
  {
    id: 'yanardag', name: 'Su Altı Yanardağı', radius: 50, xp: 500,
    riddle: 'Doğunun derinlerinde deniz kaynıyor.',
    solved: 'Denizin altında bir yanardağ fokur fokur kaynıyor!',
    at: () => { const x = 950, z = 150; return new THREE.Vector3(x, terrainHeight(x, z) - 1, z); },
    mapAt: null,   // korsanların hazine sandığından çıkar
    build: buildVolcano,
  },
  {
    id: 'gokada', name: 'Gökyüzü Adası', radius: 40, xp: 500,
    riddle: 'Güneyin çok uzağında, bulutların üstünde bir ada uçuyor.',
    solved: 'Bulutların üstünde uçan bir ada ve altın bir megalodon heykeli!',
    at: () => new THREE.Vector3(0, 130, 1000),
    mapAt: null,   // Kraken yenilince düşer
    build: buildSkyIsland,
  },
];

function trenchCenter(u) {
  return new THREE.Vector3(lerp(TRENCH.ax, TRENCH.bx, u), 0, lerp(TRENCH.az, TRENCH.bz, u));
}

const Mysteries = {
  scene: null,
  scrolls: [],
  panelTimer: 0,

  init(scene) {
    this.scene = scene;
    for (const m of MYSTERIES) {
      m.pos = m.at();
      m.model = m.build();
      m.model.group.position.copy(m.pos);
      scene.add(m.model.group);
    }
    this.syncScrolls();
    this.el = { panel: document.getElementById('mapNote'), canvas: document.getElementById('mapNoteCanvas'), text: document.getElementById('mapNoteText') };
  },

  hasMap(id) { return Save.data.maps.includes(id); },
  isSolved(id) { return Save.data.mysteries.includes(id); },
  allSolved() { return MYSTERIES.every((m) => this.isSolved(m.id)); },

  // Henüz bulunmamış ve bir yere saklanmış haritaların tomarları dünyada dursun
  syncScrolls() {
    for (const s of this.scrolls) this.scene.remove(s.mesh);
    this.scrolls = [];
    for (const m of MYSTERIES) {
      if (!m.mapAt || this.hasMap(m.id)) continue;
      const mesh = buildMapScroll();
      const pos = m.mapAt();
      mesh.position.copy(pos);
      this.scene.add(mesh);
      this.scrolls.push({ id: m.id, mesh, pos });
    }
  },

  giveMap(id) {
    if (this.hasMap(id)) return;
    const m = MYSTERIES.find((x) => x.id === id);
    Save.data.maps.push(id);
    Save.write();
    const s = this.scrolls.find((x) => x.id === id);
    if (s) {
      this.scene.remove(s.mesh);
      this.scrolls.splice(this.scrolls.indexOf(s), 1);
    }
    Sound.levelUp();
    Hud.big('GİZEMLİ BİR HARİTA!');
    this.showMap(m);
  },

  solve(m) {
    Save.data.mysteries.push(m.id);
    // Haritası bulunmadan çözülen gizemin haritası artık gerekmez
    if (!this.hasMap(m.id)) Save.data.maps.push(m.id);
    this.syncScrolls();
    Save.write();
    Player.addXp(m.xp);
    Sound.mystery();
    Hud.big('GİZEM ÇÖZÜLDÜ!');
    Hud.msg(m.name + ': ' + m.solved + '  +' + m.xp + ' XP');
    Effects.spawn(Player.pos, { count: 60, color: 0xffd040, size: 0.7, speed: 14, life: 1.5, grow: 1, spread: 4, opacity: 0.9 });
    if (this.allSolved()) {
      Hud.big('BÜTÜN GİZEMLERİ ÇÖZDÜN!');
      Hud.msg('Artık bir ALTIN MEGALODON\'sun! (1 ile megalodona dön)');
      if (Player.form === 'megalodon') Player.buildModel();
    }
  },

  // Haritayı birkaç saniye ekranda göster: dünya, gizemin yerinde kırmızı bir X ve bir ipucu
  showMap(m) {
    const c = this.el.canvas, g = c.getContext('2d');
    const S = c.width, C = S / 2, k = (C - 14) / WORLD_HALF;
    const mx = (x) => C - x * k, my = (z) => C - z * k;
    g.fillStyle = '#ecd9a8';
    g.fillRect(0, 0, S, S);
    g.strokeStyle = '#7a5a2e';
    g.lineWidth = 6;
    g.strokeRect(3, 3, S - 6, S - 6);
    g.strokeStyle = 'rgba(90,60,30,.6)';
    g.lineWidth = TRENCH.width * 1.1 * k;
    g.lineCap = 'round';
    g.beginPath(); g.moveTo(mx(TRENCH.ax), my(TRENCH.az)); g.lineTo(mx(TRENCH.bx), my(TRENCH.bz)); g.stroke();
    for (const isl of ISLANDS) {
      g.fillStyle = '#b8945a';
      g.beginPath(); g.arc(mx(isl.x), my(isl.z), isl.r * k, 0, Math.PI * 2); g.fill();
    }
    const x = mx(m.pos.x), y = my(m.pos.z);
    g.strokeStyle = '#c01818';
    g.lineWidth = 6;
    g.beginPath(); g.moveTo(x - 10, y - 10); g.lineTo(x + 10, y + 10); g.moveTo(x + 10, y - 10); g.lineTo(x - 10, y + 10); g.stroke();
    this.el.text.textContent = m.riddle;
    this.el.panel.classList.remove('hidden');
    this.panelTimer = 9;
  },

  update(dt, t) {
    const P = Player;
    for (const m of MYSTERIES) {
      const md = m.model;
      if (md.spin) md.spin.rotation.y += dt * 0.5;
      if (md.lights) md.lights.forEach((l, i) => { l.visible = Math.floor(t * 3 + i) % 3 !== 0; });
      if (md.crater && P.pos.distanceToSquared(m.pos) < 200 * 200 && Math.random() < dt * (this.isSolved(m.id) ? 12 : 4)) {
        const p = m.pos.clone().add(md.crater);
        Effects.spawn(p, { count: 3, color: 0xff7a20, size: 0.6, speed: 3, up: 3, life: 1.6, rise: 2, grow: 1, spread: 2, opacity: 0.9 });
        Effects.bubbles(p, 3);
      }
      if (!this.isSolved(m.id) && P.pos.distanceTo(m.pos) < m.radius) this.solve(m);
    }
    for (const s of [...this.scrolls]) {
      s.mesh.rotation.y += dt * 1.5;
      s.mesh.position.y = s.pos.y + Math.sin(t * 2) * 0.5;
      if (Math.random() < dt * 4) Effects.spawn(s.mesh.position, { count: 1, color: 0xffe9a0, size: 0.25, speed: 1.5, life: 1, spread: 2, opacity: 0.9 });
      if (P.pos.distanceTo(s.mesh.position) < P.radius() + 5) this.giveMap(s.id);
    }
    if (this.panelTimer > 0) {
      this.panelTimer -= dt;
      if (this.panelTimer <= 0) this.el.panel.classList.add('hidden');
    }
  },
};
