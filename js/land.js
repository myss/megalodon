// Kıyıya su içmeye gelen kara hayvanları
const LAND_TYPES = {
  geyik: { name: 'Geyik', hp: 20, food: 35, xp: 30, speed: 10 },
  zebra: { name: 'Zebra', hp: 25, food: 40, xp: 35, speed: 11 },
  bizon: { name: 'Bizon', hp: 45, food: 70, xp: 60, speed: 8 },
  domuz: { name: 'Yaban Domuzu', hp: 15, food: 25, xp: 20, speed: 9 },
};
const LAND_MAX = 7;

class LandAnimal {
  constructor(scene, spot) {
    this.kind = pick(Object.keys(LAND_TYPES));
    this.type = LAND_TYPES[this.kind];
    this.name = this.type.name;
    this.model = buildLandAnimal(this.kind);
    scene.add(this.model.group);
    this.scene = scene;
    this.spot = spot;
    spot.busy = true;
    this.pos = spot.inland.clone();
    this.yaw = spot.facing;
    this.state = 'walk';
    this.timer = 0;
    this.alert = 0;
    this.hp = this.type.hp;
    this.maxHp = this.type.hp;
    this.walkPhase = 0;
    this.dead = false;
    this.fleeTarget = null;
    this.question = textSprite('?', '#ffe066', 2.2);
    this.exclaim = textSprite('!', '#ff4040', 2.6);
    this.question.visible = this.exclaim.visible = false;
    scene.add(this.question, this.exclaim);
  }

  targetPoint() {
    const f = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    return this.pos.clone().addScaledVector(f, 1.2).setY(this.pos.y + this.model.height * 0.6);
  }

  moveTo(target, speed, dt) {
    const d = target.clone().sub(this.pos).setY(0);
    const len = d.length();
    if (len < 0.4) return true;
    this.yaw = angleLerp(this.yaw, Math.atan2(d.x, d.z), 1 - Math.exp(-dt * 6));
    this.pos.addScaledVector(d.normalize(), Math.min(len, speed * dt));
    this.walkPhase += dt * speed * 2.2;
    return false;
  }

  notice(dt) {
    const d = this.pos.distanceTo(Player.pos);
    let rate = 0;
    if (Player.airborne || Player.beached || Player.flying) rate = d < 45 ? 3 : 0;
    else if (Player.stealthy) rate = d < 8 ? 0.8 : 0;
    else rate = d < 35 ? (Player.sprinting ? 2.2 : 1.1) : 0;
    if (rate > 0) this.alert += rate * dt;
    else this.alert = Math.max(0, this.alert - 0.25 * dt);
    if (this.alert >= 1) this.startFlee();
  }

  startFlee() {
    if (this.state === 'flee') return;
    this.state = 'flee';
    const away = this.spot.inland.clone().sub(this.spot.drink).setY(0).normalize();
    this.fleeTarget = this.spot.inland.clone().addScaledVector(away, 15);
    Sound.alert();
    Hud.msg(this.name + ' seni fark etti ve kaçıyor!');
  }

  update(dt) {
    let moving = false;
    if (this.state === 'walk') {
      this.notice(dt);
      moving = true;
      if (this.moveTo(this.spot.drink, 3, dt)) { this.state = 'drink'; this.timer = rand(14, 28); }
    } else if (this.state === 'drink') {
      this.notice(dt);
      this.yaw = angleLerp(this.yaw, this.spot.facing, 1 - Math.exp(-dt * 3));
      this.timer -= dt;
      if (this.timer <= 0) this.state = 'leave';
    } else if (this.state === 'leave') {
      moving = true;
      if (this.moveTo(this.spot.inland, 3, dt)) this.remove();
    } else if (this.state === 'flee') {
      moving = true;
      if (this.moveTo(this.fleeTarget, this.type.speed, dt)) this.remove();
    }
    this.pos.y = terrainHeight(this.pos.x, this.pos.z);

    const m = this.model;
    m.group.position.copy(this.pos);
    m.group.rotation.y = this.yaw;
    const swing = moving ? Math.sin(this.walkPhase) * 0.5 : 0;
    m.legs.forEach((l, i) => { l.rotation.x = (i === 0 || i === 3) ? swing : -swing; });
    const headDown = this.state === 'drink' ? 1.0 : 0;
    m.head.rotation.x = lerp(m.head.rotation.x, headDown + (this.state === 'drink' ? Math.sin(performance.now() / 300) * 0.06 : 0), 1 - Math.exp(-dt * 4));

    const top = this.pos.clone();
    top.y += m.height + 2.2;
    this.question.position.copy(top);
    this.exclaim.position.copy(top);
    this.exclaim.visible = this.state === 'flee';
    this.question.visible = !this.exclaim.visible && this.alert > 0.15;
  }

  hurt(n) {
    this.hp -= n;
    Effects.blood(this.targetPoint(), 10);
    Hud.float('-' + Math.round(n), this.targetPoint(), '#ffdd55');
    Sound.hit();
    if (this.hp <= 0) {
      Player.addXp(this.type.xp);
      Player.eat(this.type.food);
      Save.data.eaten++;
      Sound.eat();
      Hud.msg('Avladın: ' + this.name + '  +' + this.type.xp + ' XP');
      Hud.float('+' + this.type.xp + ' XP', this.targetPoint(), '#8fe3ff');
      Effects.blood(this.targetPoint(), 25);
      this.remove();
    } else {
      this.alert = 1;
      this.startFlee();
    }
  }

  remove() {
    this.dead = true;
    this.spot.busy = false;
    this.scene.remove(this.model.group, this.question, this.exclaim);
  }
}

const Land = {
  list: [],
  scene: null,
  spawnTimer: 0,

  init(scene) {
    this.scene = scene;
    for (let i = 0; i < 4; i++) this.spawn();
  },

  spawn() {
    const free = World.shoreSpots.filter((s) => !s.busy);
    if (!free.length) return;
    // Megalodona yakın kıyıları tercih et
    free.sort((a, b) => a.drink.distanceTo(Player.pos) - b.drink.distanceTo(Player.pos));
    const spot = Math.random() < 0.7 ? pick(free.slice(0, 6)) : pick(free);
    this.list.push(new LandAnimal(this.scene, spot));
  },

  update(dt) {
    for (const a of this.list) a.update(dt);
    this.list = this.list.filter((a) => !a.dead);
    this.spawnTimer -= dt;
    if (this.list.length < LAND_MAX && this.spawnTimer <= 0) {
      this.spawn();
      this.spawnTimer = rand(4, 9);
    }
  },
};
