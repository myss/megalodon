// Deniz düşmanları ve barışçıl deniz canlıları.
// Hepsi megalodondan küçüktür. Bayraklar:
//   passive: hiç saldırmaz, kaçar · neutral: sadece ısırılınca saldırır
//   drifter: yavaş süzülür, değince sokar · bottom: deniz tabanında gezer · upright: hep dik durur
//   nearBottom: tabana yakın doğar · boss: aynı anda en fazla bir tane
//   trench: sadece Mariana Çukuru'nun derinliklerinde yaşar
const ENEMY_TYPES = {
  beyaz: {
    name: 'Büyük Beyaz Köpekbalığı', hp: 70, dmg: 8, speed: 13, aggro: 40, size: 0.65, radius: 2.4,
    xp: 40, food: 25, minLevel: 1, weight: 2,
    build: () => buildShark({ top: 0x7a8792, belly: 0xf0f0ea }),
  },
  cekic: {
    name: 'Çekiç Başlı Köpekbalığı', hp: 55, dmg: 7, speed: 14, aggro: 35, size: 0.55, radius: 2.2,
    xp: 35, food: 20, minLevel: 1, weight: 1,
    build: () => buildShark({ top: 0x8a8a70, belly: 0xe8e6d0, hammer: true }),
  },
  barakuda: {
    name: 'Barakuda', hp: 25, dmg: 4, speed: 15, aggro: 30, size: 1.2, radius: 1.5,
    xp: 15, food: 10, minLevel: 1, weight: 2,
    build: () => buildBigFish({ top: 0x6f8590, belly: 0xdfe8ec, w: 0.35, h: 0.45, l: 2.6, jaw: true }),
  },
  kalamar: {
    name: 'Dev Kalamar', hp: 130, dmg: 11, speed: 9, aggro: 35, size: 1.0, radius: 3,
    xp: 70, food: 40, minLevel: 1, weight: 3, nearBottom: true,
    build: buildSquid,
  },
  ahtapot: {
    name: 'Dev Ahtapot', hp: 90, dmg: 9, speed: 7, aggro: 25, size: 1.1, radius: 2.8,
    xp: 55, food: 35, minLevel: 1, weight: 2, bottom: true,
    build: buildOctopus,
  },
  denizanasi: {
    name: 'Denizanası', hp: 12, dmg: 5, speed: 1.5, aggro: 0, size: 1.0, radius: 1.6,
    xp: 8, food: 3, minLevel: 1, weight: 3, drifter: true,
    build: buildJelly,
  },
  orka: {
    name: 'Katil Balina', hp: 170, dmg: 13, speed: 15, aggro: 50, size: 0.95, radius: 3.6,
    xp: 100, food: 60, minLevel: 1, weight: 2,
    build: () => buildShark({ top: 0x14181c, belly: 0xf4f4f4, dorsalH: 3.8, orca: true }),
  },
  kasalot: {
    name: 'Kaşalot Balinası', hp: 320, dmg: 18, speed: 10, aggro: 0, size: 0.85, radius: 4.2,
    xp: 180, food: 100, minLevel: 2, weight: 1, neutral: true,
    build: buildWhale,
  },
  mozasor: {
    name: 'Mozasor', hp: 450, dmg: 24, speed: 15, aggro: 60, size: 0.75, radius: 3.5,
    xp: 300, food: 100, minLevel: 5, weight: 1, boss: true,
    build: buildMosasaurus,
  },

  // ---- Mariana Çukuru ----
  fener: {
    name: 'Fener Balığı', hp: 70, dmg: 12, speed: 9, aggro: 40, size: 1.4, radius: 2.4,
    xp: 80, food: 30, minLevel: 1, weight: 3, trench: true,
    build: buildAnglerfish,
  },
  engerek: {
    name: 'Engerek Balığı', hp: 40, dmg: 9, speed: 16, aggro: 45, size: 1.3, radius: 1.8,
    xp: 60, food: 20, minLevel: 1, weight: 3, trench: true,
    build: buildViperfish,
  },
  goblin: {
    name: 'Goblin Köpekbalığı', hp: 140, dmg: 14, speed: 14, aggro: 50, size: 0.75, radius: 2.8,
    xp: 120, food: 45, minLevel: 1, weight: 2, trench: true,
    build: buildGoblinShark,
  },
  vampir: {
    name: 'Vampir Kalamar', hp: 60, dmg: 8, speed: 11, aggro: 35, size: 0.6, radius: 2,
    xp: 70, food: 25, minLevel: 1, weight: 2, trench: true,
    build: () => buildSquid({ color: 0x5a0f1f, head: 0x4a0c1a, arm: 0x6a1525, eye: 0x60c0ff, glowEyes: true }),
  },
  parlayanDenizanasi: {
    name: 'Parlayan Denizanası', hp: 15, dmg: 8, speed: 1.5, aggro: 0, size: 1.5, radius: 2.2,
    xp: 20, food: 3, minLevel: 1, weight: 3, trench: true, drifter: true,
    build: () => buildJelly(true),
  },
  izopod: {
    name: 'Dev İzopod', hp: 50, dmg: 0, speed: 4, aggro: 0, size: 1.3, radius: 2,
    xp: 40, food: 35, minLevel: 1, weight: 2, trench: true, passive: true, bottom: true,
    build: buildIsopod,
  },
  dumbo: {
    name: 'Dumbo Ahtapotu', hp: 25, dmg: 0, speed: 5, aggro: 0, size: 1.2, radius: 1.8,
    xp: 35, food: 20, minLevel: 1, weight: 2, trench: true, passive: true, upright: true,
    build: buildDumbo,
  },
  kraken: {
    name: 'KRAKEN', hp: 1000, dmg: 28, speed: 12, aggro: 70, size: 1.45, radius: 6,
    xp: 800, food: 100, minLevel: 4, weight: 1, trench: true, boss: true,
    build: () => buildSquid({ color: 0x3e1636, head: 0x34102c, arm: 0x55204a, eye: 0xffd040, glowEyes: true }),
  },
  kaplumbaga: {
    name: 'Deniz Kaplumbağası', hp: 30, dmg: 0, speed: 6, aggro: 0, size: 1.0, radius: 2,
    xp: 15, food: 30, minLevel: 1, weight: 2, passive: true,
    build: buildTurtle,
  },
  ton: {
    name: 'Ton Balığı', hp: 20, dmg: 0, speed: 12, aggro: 0, size: 1.3, radius: 1.6,
    xp: 12, food: 20, minLevel: 1, weight: 3, passive: true,
    build: () => buildBigFish({ top: 0x2d4e7a, belly: 0xc8d4e0 }),
  },
};

class Enemy {
  constructor(scene, key, pos) {
    this.key = key;
    this.type = ENEMY_TYPES[key];
    this.name = this.type.name;
    this.model = this.type.build();
    this.model.group.rotation.order = 'YXZ';
    this.model.group.scale.setScalar(this.type.size);
    scene.add(this.model.group);
    this.scene = scene;
    this.pos = pos.clone();
    this.yaw = rand(0, Math.PI * 2);
    this.pitch = 0;
    this.fwd = new THREE.Vector3();
    this.maxHp = this.type.hp;
    this.hp = this.maxHp;
    this.radius = this.type.radius;
    this.state = 'wander';
    this.wanderTarget = this.newWanderTarget();
    this.angry = false;
    this.attackCd = 0;
    this.attackAnim = 0;
    this.phase = rand(0, 6.28);
    this.dead = false;
  }

  newWanderTarget() {
    return this.type.trench ? randomTrenchPos(this.pos, 20, 80) : randomWaterPos(8, this.pos, 20, 60);
  }

  update(dt, t) {
    const T = this.type;
    const toP = Player.pos.clone().sub(this.pos);
    const d = toP.length();

    // Ne yapacağına karar ver
    if (T.drifter) {
      this.state = 'wander';
    } else if (T.passive) {
      this.state = d < 22 || this.angry ? 'flee' : 'wander';
      if (d > 60) this.angry = false;
    } else {
      const range = T.neutral ? 0 : T.aggro * (Player.stealthy ? 0.5 : 1);
      if (this.hp < this.maxHp * 0.2 && !T.boss) this.state = 'flee';
      else if (!Player.dead && (this.angry || d < range) && d < 100) this.state = 'chase';
      else this.state = 'wander';
      if (d > 100) this.angry = false;
    }

    let dir, speed;
    if (this.state === 'chase') {
      dir = toP.clone().normalize();
      speed = T.speed;
    } else if (this.state === 'flee') {
      dir = toP.clone().negate().setY(rand(-0.1, 0.1)).normalize();
      speed = T.speed * 1.1;
    } else {
      if (this.pos.distanceTo(this.wanderTarget) < 5) this.wanderTarget = this.newWanderTarget();
      dir = this.wanderTarget.clone().sub(this.pos).normalize();
      speed = T.drifter ? T.speed : T.speed * 0.4;
    }
    if (T.drifter || T.bottom) dir.y *= 0.3;

    const wantYaw = Math.atan2(dir.x, dir.z);
    const wantPitch = clamp(Math.asin(clamp(dir.y, -1, 1)), -0.8, 0.8);
    this.yaw = angleLerp(this.yaw, wantYaw, 1 - Math.exp(-dt * 2.5));
    this.pitch = lerp(this.pitch, wantPitch, 1 - Math.exp(-dt * 2.5));
    forwardFrom(this.yaw, this.pitch, this.fwd);

    const next = this.pos.clone().addScaledVector(this.fwd, speed * dt);
    const ground = terrainHeight(next.x, next.z);
    // Sığlığa (çukur canlıları için çukurun dışına) çıkamaz, başka yöne döner
    if (ground < (T.trench ? TRENCH_TOP - 20 : -4)) {
      this.pos.copy(next);
    } else {
      this.wanderTarget = this.newWanderTarget();
      this.yaw += dt * 2;
    }
    const g2 = terrainHeight(this.pos.x, this.pos.z);
    let lo = g2 + 1.5 * T.size + 1, hi = WATER_Y - 1.2;
    if (T.trench) hi = TRENCH_TOP;
    else lo = Math.max(lo, SEA_MIN_Y);
    this.pos.y = clamp(this.pos.y, lo, hi);
    if (T.bottom && this.state !== 'chase') this.pos.y = lerp(this.pos.y, g2 + 1.2, 1 - Math.exp(-dt * 2));
    if (Math.hypot(this.pos.x, this.pos.z) > WORLD_LIMIT) this.wanderTarget = this.newWanderTarget();

    // Megalodonun içine girme
    const minD = this.radius + Player.radius();
    if (d < minD && d > 0.01) this.pos.addScaledVector(toP, -(minD - d) / d);

    // Saldırı
    this.attackCd -= dt;
    this.attackAnim -= dt;
    const touching = T.drifter ? d < minD + 0.5 : this.state === 'chase' && d < minD + 2.5;
    if (touching && this.attackCd <= 0) {
      this.attackCd = 1.4;
      this.attackAnim = 0.35;
      Player.hurt(T.dmg);
    }

    this.updateModel(dt, t, speed);
  }

  updateModel(dt, t, speed) {
    const m = this.model;
    m.group.position.copy(this.pos);
    const flat = this.type.drifter || this.type.bottom || this.type.upright;
    m.group.rotation.set(flat ? 0 : -this.pitch, this.yaw, 0);
    this.phase += dt * (2 + speed * 0.4);
    if (m.tail) m.tail.rotation[m.tailAxis] = Math.sin(this.phase) * 0.35;
    if (m.jaw) {
      const open = this.attackAnim > 0 ? Math.sin((1 - this.attackAnim / 0.35) * Math.PI) * 0.7 : 0.05;
      m.jaw.rotation.x = open;
    }
    if (m.tentacles) {
      m.tentacles.forEach((tt, i) => {
        const w = Math.sin(this.phase * 0.6 + i) * 0.25;
        const grab = this.attackAnim > 0 ? -0.3 : 0.15;
        tt.rotation.x = -Math.sin(tt.userData.a) * (grab + w);
        tt.rotation.y = Math.cos(tt.userData.a) * (grab + w);
      });
    }
    if (m.flippers) {
      m.flippers.forEach((f) => { f.rotation.z = Math.sin(this.phase * 0.5) * 0.4 * f.userData.s; });
    }
    if (m.arms) {
      // Kollar dalgalanır, saldırırken ileri uzanır
      m.arms.forEach((arm) => {
        const i = arm.userData.i;
        const reach = this.attackAnim > 0 ? -0.6 : 0;
        arm.rotation.x = 0.35 + Math.sin(this.phase * 0.5 + i * 0.8) * 0.25 + (i < 2 || i > 6 ? reach : 0);
      });
    }
    if (m.lure) m.lure.rotation.x = Math.sin(this.phase * 0.4) * 0.15;
    if (m.legs) m.legs.forEach((l) => { l.rotation.x = Math.sin(this.phase * 2 + l.userData.i) * 0.4; });
    if (m.ears) {
      m.ears.forEach((e) => { e.rotation.z = e.userData.s * Math.sin(this.phase * 0.8) * 0.6; });
      m.skirt.scale.y = 1 + Math.sin(this.phase * 0.8) * 0.15;
    }
    if (m.dome) {
      // Denizanası atım atım süzülür
      const pulse = Math.sin(this.phase * 0.8);
      m.dome.scale.set(1 + pulse * 0.12, 1 - pulse * 0.15, 1 + pulse * 0.12);
      m.jellyTentacles.forEach((tt, i) => {
        tt.rotation.x = Math.sin(this.phase * 0.5 + i) * 0.2;
        tt.rotation.z = Math.cos(this.phase * 0.4 + i) * 0.2;
      });
    }
  }

  hurt(n) {
    this.hp -= n;
    this.angry = true;
    Effects.blood(this.pos, this.type.drifter ? 2 : 10);
    Hud.float('-' + Math.round(n), this.pos, '#ffdd55');
    Sound.hit();
    if (this.type.drifter && this.attackCd <= 0) {
      this.attackCd = 1.4;
      Hud.msg('Denizanası seni soktu!');
      Player.hurt(this.type.dmg);
    }
    if (this.hp <= 0) this.die();
  }

  die() {
    this.dead = true;
    this.scene.remove(this.model.group);
    Effects.blood(this.pos, 30);
    Player.addXp(this.type.xp);
    Player.eat(this.type.food);
    Save.data.kills++;
    Sound.eat();
    Hud.msg((this.type.passive ? 'Avladın: ' : 'Yendin: ') + this.name + '  +' + this.type.xp + ' XP');
    Hud.float('+' + this.type.xp + ' XP', this.pos, '#8fe3ff');
  }
}

const Enemies = {
  list: [],
  scene: null,
  spawnTimer: 0,

  init(scene) {
    this.scene = scene;
    for (let i = 0; i < this.wanted(); i++) this.spawn(true);
  },

  wanted() { return Math.min(14 + Player.level, 24); },

  // Megalodon çukurun derinliklerindeyse çukur canlıları doğar
  playerInTrench() {
    return inTrench(Player.pos.x, Player.pos.z) && Player.pos.y < TRENCH_TOP + 40;
  },

  spawn(initial) {
    const lvl = Player.level;
    const trench = this.playerInTrench();
    const pool = Object.keys(ENEMY_TYPES).filter((k) => {
      const t = ENEMY_TYPES[k];
      if (!!t.trench !== trench) return false;
      if (t.minLevel > lvl) return false;
      if (t.boss && this.list.some((e) => e.key === k)) return false;
      return true;
    });
    let total = pool.reduce((s, k) => s + ENEMY_TYPES[k].weight, 0);
    let r = Math.random() * total, key = pool[0];
    for (const k of pool) { r -= ENEMY_TYPES[k].weight; if (r <= 0) { key = k; break; } }
    const T = ENEMY_TYPES[key];
    let pos;
    if (trench) {
      pos = randomTrenchPos(Player.pos, initial ? 40 : 70, initial ? 160 : 180);
      if (T.bottom) pos.y = terrainHeight(pos.x, pos.z) + 1.5;
    } else {
      pos = randomWaterPos(T.nearBottom ? 22 : 10, Player.pos, initial ? 50 : 90, initial ? 250 : 200);
      if (T.nearBottom || T.bottom) pos.y = Math.max(terrainHeight(pos.x, pos.z) + (T.nearBottom ? 5 : 1.5), SEA_MIN_Y);
    }
    const e = new Enemy(this.scene, key, pos);
    if (e.type.boss) Hud.big('Dikkat! ' + e.name + ' yakınlarda!');
    this.list.push(e);
  },

  update(dt, t) {
    for (const e of this.list) {
      e.update(dt, t);
      // Çok uzaktakileri kaldır
      if (e.pos.distanceTo(Player.pos) > 320) { e.dead = true; this.scene.remove(e.model.group); }
    }
    this.list = this.list.filter((e) => !e.dead);
    this.spawnTimer -= dt;
    const trench = this.playerInTrench();
    const here = this.list.filter((e) => !!e.type.trench === trench).length;
    if (here < this.wanted() && this.spawnTimer <= 0) {
      this.spawn(false);
      // Çukura ilk girişte canlılar hızlıca belirsin
      this.spawnTimer = here < this.wanted() / 2 ? 0.5 : 3;
    }
  },
};
