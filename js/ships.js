// Kayıkçı tekneleri ve korsan gemisi.
// Isırınca hasar alır ve batar; uçarken ya da havadan düşerken üstlerine dalınca parçalanır.

// ---- Modeller (her parça ayrı bir mesh: parçalanınca hepsi ayrı uçar) ----

function buildFishingBoat() {
  const g = new THREE.Group();
  const hull = pick([0xb5532c, 0x2c6db5, 0x3a8a4a]);
  const add = (mesh, x, y, z) => { mesh.position.set(x, y, z); g.add(mesh); return mesh; };

  add(box(2.6, 0.4, 7.4, hull), 0, -0.6, -0.3);
  for (const s of [-1, 1]) add(box(0.25, 1.5, 7.6, hull), s * 1.4, 0, -0.3);
  add(box(3.0, 1.5, 0.25, hull), 0, 0, -4.0);
  const bowGeo = new THREE.ConeGeometry(2.1, 2.6, 4);
  const bow = add(new THREE.Mesh(bowGeo, mat(hull)), 0, 0, 4.7);
  bow.rotation.set(Math.PI / 2, Math.PI / 4, 0);
  bow.scale.set(1, 1, 0.5);
  add(box(2.8, 0.15, 7.4, 0x9a7650), 0, 0.55, -0.3);

  add(box(2.0, 1.7, 2.4, 0xf2f2ee), 0, 1.45, -1.6);
  add(box(2.3, 0.2, 2.8, hull), 0, 2.4, -1.6);
  add(box(2.05, 0.5, 0.6, 0x335577), 0, 1.7, -0.9);
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 4, 6), mat(0x6b4a2b)), 0, 2.6, 1.6);
  add(box(2.4, 0.1, 0.1, 0x6b4a2b), 0, 3.6, 1.6);
  add(box(0.8, 0.8, 0.8, 0x8a5a2a), 0.6, 1.0, 2.4);
  add(new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), mat(0xff7a1a)), -0.8, 0.9, 2.8);
  return { group: g };
}

function skullFlagTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 80;
  const g = c.getContext('2d');
  g.fillStyle = '#111';
  g.fillRect(0, 0, 128, 80);
  g.strokeStyle = '#eee';
  g.lineWidth = 9;
  g.lineCap = 'round';
  g.beginPath(); g.moveTo(34, 62); g.lineTo(94, 22); g.moveTo(34, 22); g.lineTo(94, 62); g.stroke();
  g.fillStyle = '#eee';
  g.beginPath(); g.arc(64, 34, 17, 0, Math.PI * 2); g.fill();
  g.fillRect(55, 44, 18, 12);
  g.fillStyle = '#111';
  g.beginPath(); g.arc(57, 32, 5, 0, Math.PI * 2); g.arc(71, 32, 5, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function buildPirateShip() {
  const g = new THREE.Group();
  const wood = 0x4a2e1a, plank = 0x7a5a38, trim = 0xc9a227, sail = 0xe8dcc0, iron = 0x1a1a1a;
  const add = (mesh, x, y, z) => { mesh.position.set(x, y, z); g.add(mesh); return mesh; };
  const halfLen = 17, beam = 11;
  // Gövde ortada en geniş, pruvaya doğru daralır
  const widthAt = (z) => {
    const t = z / halfLen;
    return beam * (1 - 0.35 * t * t) * (t > 0 ? 1 - 0.4 * t : 1);
  };

  const segs = 7, segLen = (halfLen * 2) / segs;
  for (let i = 0; i < segs; i++) {
    const z = -halfLen + segLen * (i + 0.5);
    const w = widthAt(z);
    add(box(w, 4.5, segLen * 1.02, wood), 0, -0.4, z);
    add(box(w * 0.92, 0.3, segLen * 1.02, plank), 0, 1.95, z);
    for (const s of [-1, 1]) {
      add(box(0.3, 1.0, segLen * 1.02, wood), s * (w / 2 - 0.1), 2.6, z);
      add(box(0.32, 0.25, segLen * 1.02, trim), s * (w / 2), 0.6, z);
    }
  }
  const bow = add(new THREE.Mesh(new THREE.ConeGeometry(3.8, 7, 4), mat(wood)), 0, -0.4, halfLen + 3.5);
  bow.rotation.set(Math.PI / 2, Math.PI / 4, 0);
  bow.scale.set(1, 1, 0.84);
  const sprit = add(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 12, 6), mat(wood)), 0, 3.5, halfLen + 6);
  sprit.rotation.x = Math.PI / 2 - 0.35;

  // Kıç kasarası ve parlayan pencereleri
  add(box(9, 4, 8, wood), 0, 4, -13);
  add(box(9.2, 0.3, 8.2, plank), 0, 6.1, -13);
  add(box(9.3, 0.3, 8.3, trim), 0, 2.2, -13);
  for (let i = 0; i < 4; i++) add(box(1.2, 1.0, 0.2, 0xffd27a), -3 + i * 2, 4, -17.05).material = glowMat(0xffd27a, 0.9);

  // Direkler, yelkenler, seren ağaçları
  for (const [z, h] of [[9, 20], [-1, 25], [-10, 17]]) {
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, h, 8), mat(wood)), 0, 2 + h / 2, z);
    const k = h / 25;
    for (const [fy, sw, sh] of [[0.42, 13, 8], [0.75, 9.5, 6]]) {
      add(box(sw * k, sh * k, 0.25, sail), 0, 2 + h * fy, z + 0.4);
      const yard = add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, sw * k + 1, 6), mat(wood)), 0, 2 + h * fy + (sh * k) / 2, z + 0.4);
      yard.rotation.z = Math.PI / 2;
    }
  }
  add(new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.1, 1.3, 10), mat(wood)), 0, 2 + 25 * 0.88, -1);

  const flag = add(new THREE.Mesh(new THREE.PlaneGeometry(4.5, 2.8), new THREE.MeshLambertMaterial({ map: skullFlagTexture(), side: THREE.DoubleSide })), 0, 2 + 25 + 1.2, -3.4);
  flag.rotation.y = Math.PI / 2;

  // Toplar: her yanda beş tane
  const cannons = [];
  const cannonGeo = new THREE.CylinderGeometry(0.4, 0.5, 2.2, 8);
  for (const s of [-1, 1]) {
    for (let k = -2; k <= 2; k++) {
      const z = k * 5;
      const w = widthAt(z);
      const c = add(new THREE.Mesh(cannonGeo, mat(iron)), s * (w / 2 + 0.6), 0.9, z);
      c.rotation.z = Math.PI / 2;
      cannons.push({ side: s, local: new THREE.Vector3(s * (w / 2 + 1.8), 0.9, z) });
    }
  }
  return { group: g, cannons };
}

function buildTreasureChest() {
  const g = new THREE.Group();
  g.add(box(2.2, 1.3, 1.5, 0x7a4a1a));
  const lid = box(2.3, 0.5, 1.6, 0x8a5a22);
  lid.position.y = 0.9;
  g.add(lid);
  for (const x of [-0.8, 0, 0.8]) {
    const band = box(0.2, 1.9, 1.62, 0xc9a227);
    band.position.set(x, 0.3, 0);
    g.add(band);
  }
  const coins = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 6), glowMat(0xffd040, 1.2));
  coins.scale.set(1.3, 0.4, 0.9);
  coins.position.y = 1.3;
  g.add(coins);
  return g;
}

// ---- Gemiler ----

const SHIP_TYPES = {
  kayik: {
    name: 'Balıkçı Teknesi', hp: 60, speed: 6, fleeSpeed: 12, xp: 40,
    length: 9.5, beam: 3.2, draft: 0.9, deck: 0.7, build: buildFishingBoat,
  },
  korsan: {
    name: 'Korsan Gemisi', hp: 700, speed: 5, fleeSpeed: 5, xp: 400, pirate: true,
    length: 42, beam: 11, draft: 2.7, deck: 2.2, build: buildPirateShip,
  },
};

const CANNON_GRAVITY = 20;

class Ship {
  constructor(scene, key, pos) {
    this.key = key;
    this.type = SHIP_TYPES[key];
    this.name = this.type.name;
    this.model = this.type.build();
    this.model.group.rotation.order = 'YXZ';
    scene.add(this.model.group);
    this.scene = scene;
    this.pos = pos.clone();
    this.pos.y = WATER_Y;
    this.yaw = rand(0, Math.PI * 2);
    this.hp = this.type.hp;
    this.maxHp = this.type.hp;
    this.phase = rand(0, 6.28);
    this.waypoint = this.newWaypoint();
    this.fleeTimer = 0;
    this.fireCd = 3;
    this.shots = [];
    this.diveCd = 0;
    this.sinking = false;
    this.dead = false;
    this.tilt = new THREE.Vector2();
  }

  newWaypoint() {
    return randomWaterPos(this.type.pirate ? 20 : 10, this.pos, 80, 220);
  }

  // Dünya noktasını geminin kendi eksenlerine çevir (z: ileri, x: yan)
  toLocal(p, out) {
    const dx = p.x - this.pos.x, dz = p.z - this.pos.z;
    const c = Math.cos(this.yaw), s = Math.sin(this.yaw);
    return out.set(dx * c - dz * s, p.y - this.pos.y, dx * s + dz * c);
  }

  toWorld(local, out) {
    const c = Math.cos(this.yaw), s = Math.sin(this.yaw);
    return out.set(this.pos.x + local.x * c + local.z * s, this.pos.y + local.y, this.pos.z - local.x * s + local.z * c);
  }

  // Gövdeye olan uzaklık (ısırma menzili için)
  distanceTo(p) {
    const T = this.type, l = this.toLocal(p, new THREE.Vector3());
    const ex = Math.max(Math.abs(l.x) - T.beam / 2, 0);
    const ez = Math.max(Math.abs(l.z) - T.length / 2, 0);
    const ey = l.y < -T.draft ? -T.draft - l.y : l.y > T.deck ? l.y - T.deck : 0;
    return Math.hypot(ex, ey, ez);
  }

  update(dt, t) {
    if (this.sinking) { this.updateSinking(dt); return; }
    const T = this.type, P = Player;
    const toP = P.pos.clone().sub(this.pos).setY(0);
    const dist = toP.length();
    const playerUp = P.pos.y > -12;

    // Nereye gidecek?
    let heading, speed = T.speed;
    this.fleeTimer -= dt;
    if (!T.pirate && (this.fleeTimer > 0 || (dist < 45 && playerUp))) {
      heading = Math.atan2(-toP.x, -toP.z);
      speed = T.fleeSpeed;
    } else if (T.pirate && dist < 220 && playerUp) {
      // Korsanlar megalodonu avlamaya gelir, yakında yan dönüp top atar
      heading = Math.atan2(toP.x, toP.z) + (dist < 80 ? Math.PI / 2 : 0);
    } else {
      if (this.pos.distanceTo(this.waypoint) < 15) this.waypoint = this.newWaypoint();
      const w = this.waypoint.clone().sub(this.pos);
      heading = Math.atan2(w.x, w.z);
    }
    this.yaw = angleLerp(this.yaw, heading, 1 - Math.exp(-dt * (T.pirate ? 0.4 : 1.2)));

    const fwd = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const probe = this.pos.clone().addScaledVector(fwd, T.length / 2 + 6);
    if (terrainHeight(probe.x, probe.z) < -6 && Math.hypot(probe.x, probe.z) < WORLD_LIMIT) {
      this.pos.addScaledVector(fwd, speed * dt);
    } else {
      this.yaw += dt * 0.8;
      this.waypoint = this.newWaypoint();
    }

    // Dalgalarda sallanma
    const g = this.model.group;
    g.position.set(this.pos.x, this.pos.y + Math.sin(t * 1.3 + this.phase) * (T.pirate ? 0.25 : 0.35), this.pos.z);
    g.rotation.set(Math.sin(t * 0.9 + this.phase) * 0.03, this.yaw, Math.sin(t * 1.1 + this.phase) * (T.pirate ? 0.03 : 0.07));

    if (T.pirate) this.updateCannons(dt, dist);
    this.checkSmash(dt);
    this.pushPlayerOut();
  }

  updateCannons(dt, dist) {
    this.fireCd -= dt;
    if (this.fireCd <= 0 && dist < 140 && Player.pos.y > -6 && !Player.dead) {
      this.fireCd = 5;
      const side = Math.sign(this.toLocal(Player.pos, new THREE.Vector3()).x) || 1;
      this.model.cannons.filter((c) => c.side === side).forEach((c, i) => this.shots.push({ cannon: c, delay: i * 0.18 }));
    }
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const s = this.shots[i];
      s.delay -= dt;
      if (s.delay <= 0) {
        Ships.fireBall(this.toWorld(s.cannon.local, new THREE.Vector3()));
        this.shots.splice(i, 1);
      }
    }
  }

  // Gemiye çarpınca kırılır: uçarken ya da sudan fırlamışken üstüne düşünce,
  // ya da suyun altından Boşluk ile atılıp gövdeye vurunca
  checkSmash(dt) {
    this.diveCd -= dt;
    const P = Player, T = this.type;
    if (this.diveCd > 0) return;
    const fromAbove = (P.flying && P.vel.y < -6) || (P.airborne && P.vel.y < -2);
    const ram = P.lungeTimer > 0 && P.vel.length() > 15;
    if (!fromAbove && !ram) return;
    const l = this.toLocal(P.pos, new THREE.Vector3());
    const pad = P.radius() * 0.8;
    if (Math.abs(l.x) < T.beam / 2 + pad && Math.abs(l.z) < T.length / 2 + pad && l.y < T.deck + pad && l.y > -T.draft - pad) {
      this.diveCd = 1;
      const dmg = T.pirate ? 160 + P.damage * 4 : this.hp;
      this.hp -= dmg;
      Sound.crash();
      Effects.splash(P.pos.clone().setY(WATER_Y), true);
      Hud.float('-' + Math.round(dmg), P.pos, '#ffdd55');
      Hud.setTarget(this);
      if (this.hp <= 0) this.shatter();
      else {
        Hud.big('ÇATIRT!');
        Ships.planks(P.pos, 14, 0x4a2e1a);
      }
    }
  }

  // Megalodon gövdenin içinden geçmesin
  pushPlayerOut() {
    const P = Player, T = this.type;
    const l = this.toLocal(P.pos, new THREE.Vector3());
    const pad = P.radius() * 0.5;
    const hx = T.beam / 2 + pad;
    if (Math.abs(l.x) < hx && Math.abs(l.z) < T.length / 2 + pad && l.y < T.deck + pad && l.y > -T.draft - pad) {
      const push = (hx - Math.abs(l.x)) * (l.x >= 0 ? 1 : -1);
      const c = Math.cos(this.yaw), s = Math.sin(this.yaw);
      P.pos.x += push * c;
      P.pos.z -= push * s;
    }
  }

  hurt(n) {
    this.hp -= n;
    this.fleeTimer = 8;
    Sound.wood();
    Hud.float('-' + Math.round(n), Player.mouthPos(new THREE.Vector3()), '#ffdd55');
    Ships.planks(Player.mouthPos(new THREE.Vector3()), 3, 0x6b4a2b);
    if (this.hp <= 0) this.sink();
  }

  reward(verb) {
    Player.addXp(this.type.xp);
    Save.data.sunk++;
    Hud.msg(verb + ': ' + this.name + '  +' + this.type.xp + ' XP');
    Hud.float('+' + this.type.xp + ' XP', this.pos.clone().setY(4), '#8fe3ff');
    if (this.type.pirate) {
      Ships.dropChest(this.pos);
      Ships.pirateTimer = 90;
    }
  }

  // Isırılarak: yan yatıp yavaşça batar
  sink() {
    this.sinking = true;
    Sound.crash();
    Ships.planks(this.pos.clone().setY(1), this.type.pirate ? 16 : 6, 0x6b4a2b);
    this.reward('Batırdın');
  }

  updateSinking(dt) {
    const g = this.model.group;
    this.pos.y -= (this.type.pirate ? 1.2 : 1.6) * dt;
    g.position.copy(this.pos);
    g.rotation.x = lerp(g.rotation.x, -0.35, 1 - Math.exp(-dt * 0.5));
    g.rotation.z = lerp(g.rotation.z, 0.4, 1 - Math.exp(-dt * 0.5));
    if (Math.random() < dt * 10) Effects.bubbles(this.pos.clone().add(new THREE.Vector3(rand(-3, 3), 1, rand(-3, 3))), 4);
    if (this.pos.y < (this.type.pirate ? -40 : -15)) this.remove();
  }

  // Dalışla: parça pinçik olur, bütün parçalar etrafa saçılır
  shatter() {
    this.sinking = true;
    const g = this.model.group;
    g.updateMatrixWorld(true);
    const center = this.pos.clone();
    for (const m of [...g.children]) Ships.debrisFromMesh(m, center);
    Ships.planks(center.clone().setY(2), this.type.pirate ? 40 : 15, this.type.pirate ? 0x4a2e1a : 0x9a7650);
    Effects.splash(center.clone().setY(WATER_Y), true);
    Hud.big('PARÇA PİNÇİK!');
    this.reward('Paramparça ettin');
    this.remove();
  }

  remove() {
    this.dead = true;
    this.scene.remove(this.model.group);
  }
}

const Ships = {
  scene: null,
  list: [],
  debris: [],
  balls: [],
  chests: [],
  pirateTimer: 0,
  boatTimer: 0,
  plankGeo: null,
  ballGeo: null,

  init(scene) {
    this.scene = scene;
    this.plankGeo = new THREE.BoxGeometry(0.35, 0.2, 2.2);
    this.ballGeo = new THREE.SphereGeometry(0.5, 8, 6);
    for (let i = 0; i < 5; i++) this.spawn('kayik', true);
    this.spawn('korsan', true);
  },

  spawn(key, initial) {
    const T = SHIP_TYPES[key];
    for (let tries = 0; tries < 30; tries++) {
      const p = randomWaterPos(T.pirate ? 25 : 10, Player.pos, initial ? 80 : 250, initial ? 350 : 450);
      // Gövdenin her yanı derin suda olsun
      const r = T.length / 2 + 5;
      if ([[r, 0], [-r, 0], [0, r], [0, -r]].some(([dx, dz]) => terrainHeight(p.x + dx, p.z + dz) > -8)) continue;
      const s = new Ship(this.scene, key, p);
      this.list.push(s);
      if (T.pirate && !initial) Hud.msg('Ufukta bir KORSAN GEMİSİ belirdi!');
      return;
    }
  },

  fireBall(from) {
    const P = Player;
    const target = P.pos.clone().addScaledVector(P.vel, 0.4).add(new THREE.Vector3(rand(-6, 6), 0, rand(-6, 6)));
    target.y = Math.max(target.y, WATER_Y);
    const flight = clamp(from.distanceTo(target) / 45, 0.6, 3);
    const vel = target.clone().sub(from).divideScalar(flight);
    vel.y += 0.5 * CANNON_GRAVITY * flight;
    const mesh = new THREE.Mesh(this.ballGeo, mat(0x151515));
    mesh.position.copy(from);
    this.scene.add(mesh);
    this.balls.push({ mesh, vel });
    Effects.spawn(from, { count: 6, color: 0x9a9a9a, size: 0.8, speed: 2, life: 1.2, grow: 2, spread: 0.6, opacity: 0.6 });
    Sound.cannon();
  },

  planks(center, n, color) {
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(this.plankGeo, mat(color));
      m.position.copy(center).add(new THREE.Vector3(rand(-2, 2), rand(0, 2), rand(-2, 2)));
      m.rotation.set(rand(0, 6), rand(0, 6), rand(0, 6));
      m.scale.setScalar(rand(0.6, 1.6));
      this.addDebris(m, new THREE.Vector3(rand(-1, 1), 0, rand(-1, 1)).normalize().multiplyScalar(rand(4, 14)).setY(rand(6, 16)));
    }
  },

  debrisFromMesh(src, center) {
    const m = new THREE.Mesh(src.geometry, src.material);
    src.matrixWorld.decompose(m.position, m.quaternion, m.scale);
    const out = m.position.clone().sub(center).setY(0);
    if (out.lengthSq() < 0.01) out.set(rand(-1, 1), 0, rand(-1, 1));
    out.normalize().multiplyScalar(rand(6, 18));
    out.y = rand(8, 20);
    this.addDebris(m, out);
  },

  addDebris(mesh, vel) {
    this.scene.add(mesh);
    this.debris.push({
      mesh, vel,
      spin: new THREE.Vector3(rand(-4, 4), rand(-4, 4), rand(-4, 4)),
      life: rand(14, 22),
    });
  },

  dropChest(pos) {
    const mesh = buildTreasureChest();
    mesh.position.set(pos.x, -2, pos.z);
    this.scene.add(mesh);
    this.chests.push({ mesh });
    Hud.msg('Korsanların hazine sandığı denizin dibine batıyor!');
  },

  update(dt, t) {
    for (const s of this.list) {
      s.update(dt, t);
      if (!s.sinking && s.pos.distanceTo(Player.pos) > 700) s.remove();
    }
    this.list = this.list.filter((s) => !s.dead);

    const boats = this.list.filter((s) => s.key === 'kayik' && !s.sinking).length;
    this.boatTimer -= dt;
    if (boats < 5 && this.boatTimer <= 0) { this.spawn('kayik', false); this.boatTimer = 8; }
    this.pirateTimer -= dt;
    if (!this.list.some((s) => s.key === 'korsan') && this.pirateTimer <= 0) { this.spawn('korsan', false); this.pirateTimer = 30; }

    this.updateDebris(dt);
    this.updateBalls(dt);
    this.updateChests(dt, t);
  },

  updateDebris(dt) {
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i], m = d.mesh;
      d.life -= dt;
      if (m.position.y > WATER_Y) {
        d.vel.y -= 25 * dt;
      } else {
        // Suda yavaşlar ve ağır ağır batar
        d.vel.multiplyScalar(Math.pow(0.15, dt));
        d.vel.y = lerp(d.vel.y, -0.7, 1 - Math.exp(-dt * 2));
        d.spin.multiplyScalar(Math.pow(0.3, dt));
      }
      m.position.addScaledVector(d.vel, dt);
      m.rotation.x += d.spin.x * dt;
      m.rotation.y += d.spin.y * dt;
      m.rotation.z += d.spin.z * dt;
      if (d.life <= 0 || m.position.y < terrainHeight(m.position.x, m.position.z)) {
        this.scene.remove(m);
        this.debris.splice(i, 1);
      }
    }
  },

  updateBalls(dt) {
    const P = Player;
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const b = this.balls[i];
      b.vel.y -= CANNON_GRAVITY * dt;
      b.mesh.position.addScaledVector(b.vel, dt);
      const p = b.mesh.position;
      let gone = false;
      if (!P.dead && p.distanceTo(P.pos) < P.radius() + 1.5) {
        P.hurt(8);
        Effects.spawn(p, { count: 14, color: 0xff8a20, size: 0.7, speed: 6, life: 0.6, grow: 1.5, spread: 1, opacity: 0.9 });
        Hud.msg('Top güllesi isabet etti!');
        gone = true;
      } else if (p.y < WATER_Y) {
        Effects.splash(p.clone().setY(WATER_Y), false);
        gone = true;
      }
      if (gone) {
        this.scene.remove(b.mesh);
        this.balls.splice(i, 1);
      }
    }
  },

  updateChests(dt, t) {
    const P = Player;
    for (let i = this.chests.length - 1; i >= 0; i--) {
      const c = this.chests[i], m = c.mesh;
      const floor = terrainHeight(m.position.x, m.position.z) + 0.7;
      if (m.position.y > floor) m.position.y = Math.max(floor, m.position.y - 5 * dt);
      m.rotation.y += dt * 0.5;
      if (Math.random() < dt * 3) Effects.bubbles(m.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 1);
      // Önce dibe batsın, sonra bulunabilsin
      if (m.position.y > floor) continue;
      const mouth = P.mouthPos(new THREE.Vector3());
      if (mouth.distanceTo(m.position) < 4 + P.scale * 1.3 || P.pos.distanceTo(m.position) < P.radius() + 3) {
        P.addXp(250);
        Save.data.treasures++;
        Sound.levelUp();
        Hud.big('HAZİNE BULDUN!');
        Hud.float('+250 XP', m.position, '#ffd040');
        this.scene.remove(m);
        this.chests.splice(i, 1);
      }
    }
  },
};
