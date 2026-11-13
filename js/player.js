// Oyuncunun megalodonu ve dönüştüğü formlar
const Input = {
  keys: {},
  pressed: {},       // bu karede basılan tuşlar
  mouseDX: 0,
  mouseDY: 0,
  mouseDown: false,
  clicked: false,

  endFrame() {
    this.pressed = {};
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.clicked = false;
  },
};

const SPAWN = new THREE.Vector3(0, -8, 40);
const MOUSE_SENS = 0.0024;
const MAX_FLY_Y = 160;

const Player = {
  scene: null,
  model: null,
  form: 'megalodon',
  pos: new THREE.Vector3(),
  vel: new THREE.Vector3(),
  fwd: new THREE.Vector3(0, 0, 1),
  yaw: 0, pitch: 0, roll: 0, visPitch: 0,
  level: 1, xp: 0,
  hp: 100, maxHp: 100, hunger: 100, stamina: 100,
  scale: 1, speedMul: 1, damage: 18,
  biteCd: 0, biteAnim: 0, lungeCd: 0, lungeTimer: 0,
  airborne: false, flying: false, beached: false, grounded: false, stealthy: false, sprinting: false,
  sprintSwitchedOn: false, sneakSwitchedOn: false,
  hurtFlash: 0, swimPhase: 0, wingPhase: 0, dead: false, beachMsgCd: 0,

  init(scene) {
    this.scene = scene;
    this.level = Save.data.level;
    this.xp = Save.data.xp;
    this.form = FORMS[Save.data.form] ? Save.data.form : 'megalodon';
    this.buildModel();
    this.respawn();
  },

  formDef() { return FORMS[this.form]; },

  buildModel() {
    if (this.model) this.scene.remove(this.model.group);
    this.model = this.formDef().build();
    this.model.group.rotation.order = 'YXZ';
    this.scene.add(this.model.group);
    this.recalc();
  },

  recalc() {
    const F = this.formDef();
    // Megalodon başından beri okyanusun en büyüğü; seviyeyle daha da büyür
    this.scale = Math.min(1.8 + (this.level - 1) * 0.06, 3.2);
    this.speedMul = (1 + (this.scale - 1) * 0.4) * F.speedMul;
    this.maxHp = Math.round((100 + (this.level - 1) * 20) * F.hpMul);
    this.damage = (18 + (this.level - 1) * 5) * F.dmgMul;
    this.model.group.scale.setScalar(this.scale * F.modelScale);
  },

  transform(key) {
    if (key === this.form || !FORMS[key] || this.dead) return;
    const ratio = this.hp / this.maxHp;
    const wasAlwaysFly = this.formDef().alwaysFly;
    this.form = key;
    this.buildModel();
    this.hp = Math.max(1, ratio * this.maxHp);
    const F = this.formDef();
    // Kartaldan başka bir forma geçince uçuş biter, yeni form aşağı düşer
    if (wasAlwaysFly && !F.alwaysFly && this.flying) this.stopFlying();
    if (F.alwaysFly) {
      // Kartal sudan fırlayıp havalanır
      this.flying = true;
      this.airborne = false;
      if (this.pos.y < WATER_Y + 3) {
        if (this.pos.y < WATER_Y) Effects.splash(new THREE.Vector3(this.pos.x, WATER_Y, this.pos.z), true);
        this.pos.y = WATER_Y + 3;
        this.vel.y = 8;
      }
    }
    Save.data.form = key;
    Save.write();
    Effects.spawn(this.pos, { count: 40, color: F.color, size: 0.6, speed: 10, life: 0.9, grow: 1, spread: 3 * this.scale, opacity: 0.9 });
    Sound.transform();
    Hud.big(F.name.toUpperCase() + '!');
    Hud.msg(F.hint);
  },

  respawn() {
    this.pos.copy(SPAWN);
    this.vel.set(0, 0, 0);
    this.yaw = Math.atan2(110, -110);
    this.pitch = 0;
    this.hp = this.maxHp;
    this.hunger = 100;
    this.stamina = 100;
    this.airborne = false;
    this.flying = false;
    this.dead = false;
    if (this.formDef().alwaysFly) {
      this.pos.y = WATER_Y + 10;
      this.flying = true;
    }
  },

  xpNeeded() {
    return Math.floor(80 * Math.pow(this.level, 1.35));
  },

  addXp(n) {
    this.xp += n;
    let leveled = false;
    while (this.xp >= this.xpNeeded()) {
      this.xp -= this.xpNeeded();
      this.level++;
      leveled = true;
    }
    if (leveled) {
      this.recalc();
      this.hp = this.maxHp;
      Hud.big('SEVİYE ' + this.level + '!');
      Hud.msg('Daha büyük ve daha güçlüsün!');
      Sound.levelUp();
      Save.data.bestLevel = Math.max(Save.data.bestLevel, this.level);
    }
    Save.data.level = this.level;
    Save.data.xp = this.xp;
    if (leveled) Save.write();
  },

  eat(food) {
    this.hunger = Math.min(100, this.hunger + food);
    this.hp = Math.min(this.maxHp, this.hp + food * 0.4);
  },

  hurt(n) {
    if (this.dead) return;
    n *= this.formDef().armor;
    this.hp -= n;
    this.hurtFlash = 0.35;
    Sound.hurt();
    Effects.blood(this.pos, 6);
    Hud.float('-' + Math.round(n), this.pos, '#ff6060');
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      Game.onDeath();
    }
  },

  radius() { return 2.0 * this.scale; },

  startFlying() {
    this.flying = true;
    this.airborne = false;
    this.vel.y = Math.max(this.vel.y, 4);
    Sound.lunge();
    Hud.msg('UÇUYORSUN! (Boşluk ile in)');
  },

  stopFlying() {
    this.flying = false;
    this.airborne = true;
  },

  mouthPos(out) {
    return out.copy(this.pos).addScaledVector(this.fwd, 4.2 * this.scale);
  },

  lunge() {
    const power = 38 * (1 + 0.25 * (this.scale - 1));
    this.vel.copy(this.fwd).multiplyScalar(power);
    // Yüzeye yakınsa sudan fırla
    if (this.pos.y > WATER_Y - 5 * this.scale && this.pitch > -0.15) this.vel.y = Math.max(this.vel.y, 13);
    this.lungeTimer = 0.7;
    this.lungeCd = 1.2;
    this.stamina -= 20;
    Sound.lunge();
    Effects.bubbles(this.pos, 10);
  },

  // Kartal: uçarken ileri doğru hızlanma
  dash() {
    this.vel.addScaledVector(this.fwd, 30);
    this.lungeTimer = 0.5;
    this.lungeCd = 0.8;
    this.stamina -= 15;
    Sound.lunge();
  },

  // Q ve C bir basışta açılıp ikincide kapanır: ekran klavyesi iki tuşu birden basılı tutamaz.
  // Shift'e basılı tutmak da hızlı yüzdürür.
  switchSprint() {
    this.sprintSwitchedOn = !this.sprintSwitchedOn;
    if (this.sprintSwitchedOn) this.sneakSwitchedOn = false;
    Hud.msg(this.sprintSwitchedOn ? 'Hızlı yüzme açık! 💨 Q ile kapatırsın.' : 'Hızlı yüzme kapalı.');
  },

  switchSneak() {
    this.sneakSwitchedOn = !this.sneakSwitchedOn;
    if (this.sneakSwitchedOn) this.sprintSwitchedOn = false;
    Hud.msg(this.sneakSwitchedOn ? 'Gizli yüzme açık! 🤫 C ile kapatırsın.' : 'Gizli yüzme kapalı.');
  },

  attack() {
    const F = this.formDef();
    this.biteAnim = 0.35;
    if (F.attack === 'laser') { this.biteCd = 0.3; Game.fireLaser(); }
    else if (F.attack === 'tentacles') { this.biteCd = 0.9; Game.tentacleSweep(); }
    else { this.biteCd = 0.55; Game.tryBite(); }
  },

  update(dt) {
    if (this.dead) return;
    const k = Input.keys;
    const F = this.formDef();

    // Yön
    this.yaw -= Input.mouseDX * MOUSE_SENS;
    this.pitch = clamp(this.pitch - Input.mouseDY * MOUSE_SENS, -1.3, 1.3);
    let turn = 0;
    if (k.KeyA || k.ArrowLeft) turn += 1;
    if (k.KeyD || k.ArrowRight) turn -= 1;
    if (k.ArrowUp) this.pitch = Math.min(1.3, this.pitch + dt * 1.2);
    if (k.ArrowDown) this.pitch = Math.max(-1.3, this.pitch - dt * 1.2);
    this.yaw += turn * 1.8 * dt;
    const turnRate = turn * 1.8 - Input.mouseDX * MOUSE_SENS / Math.max(dt, 0.001);
    forwardFrom(this.yaw, this.pitch, this.fwd);

    // Hız
    const sneaking = this.sneakSwitchedOn;
    this.sprinting = (this.sprintSwitchedOn || !!(k.ShiftLeft || k.ShiftRight)) && !!k.KeyW && this.stamina > 1 && !sneaking;
    let target = 0;
    if (k.KeyW) target = sneaking ? 5 : this.sprinting ? 25 : 12;
    target *= this.speedMul;

    const surfaceY = WATER_Y - 0.5 * this.scale;
    const ground = terrainHeight(this.pos.x, this.pos.z);
    // Kollu bacaklı megalodon ayağı yere değecek kadar sığ yerde yürür
    const standY = ground + WALKER_STAND * this.scale * F.modelScale;
    const onFoot = F.walker && !this.flying && standY > surfaceY - 0.5;

    // Boşluk: suda atıl; sudan fırlamışken uç; uçarken in; karada zıpla; kartal hızlanır
    if (Input.pressed.Space) {
      if (F.alwaysFly) {
        if (this.lungeCd <= 0 && this.stamina >= 15) this.dash();
      } else if (this.flying) this.stopFlying();
      else if (this.airborne) {
        if (this.stamina >= 15) this.startFlying();
      } else if (onFoot) {
        if (this.grounded) { this.vel.y = 15; this.grounded = false; this.airborne = true; }
      } else if (this.lungeCd <= 0 && this.stamina >= 20 && !this.beached) this.lunge();
    }
    if ((Input.clicked || Input.pressed.KeyF) && this.biteCd <= 0) this.attack();

    if (this.flying) {
      const flySpeed = (k.KeyW ? (this.sprinting ? 34 : 20) : 0) * this.speedMul;
      this.vel.lerp(this.fwd.clone().multiplyScalar(flySpeed), 1 - Math.exp(-dt * (this.lungeTimer > 0 ? 0.5 : 2)));
      this.stamina -= F.flyDrain * dt;
      if (this.stamina <= 0 && !F.alwaysFly) {
        this.stamina = 0;
        this.stopFlying();
        Hud.msg('Enerjin bitti, düşüyorsun!');
      }
    } else if (onFoot) {
      const walk = (k.KeyW ? (sneaking ? 5 : this.sprinting ? 22 : 11) : k.KeyS ? -5 : 0) * this.speedMul;
      const dir = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)).multiplyScalar(walk);
      const r = 1 - Math.exp(-dt * 6);
      this.vel.x = lerp(this.vel.x, dir.x, r);
      this.vel.z = lerp(this.vel.z, dir.z, r);
      this.vel.y -= 30 * dt;
    } else if (this.airborne) {
      this.vel.y -= 30 * dt;
    } else {
      const desired = this.fwd.clone().multiplyScalar(target);
      const rate = this.lungeTimer > 0 ? 0.6 : k.KeyS ? 4 : 2.5;
      this.vel.lerp(desired, 1 - Math.exp(-dt * rate));
      if (this.lungeTimer > 0 && this.pos.y >= surfaceY - 1 && this.vel.y > 2) {
        this.airborne = true;
        Effects.splash(new THREE.Vector3(this.pos.x, WATER_Y, this.pos.z), this.scale > 1.5);
        Sound.splash();
      }
    }

    this.pos.addScaledVector(this.vel, dt);

    if (onFoot) {
      const g2 = terrainHeight(this.pos.x, this.pos.z) + WALKER_STAND * this.scale * F.modelScale;
      if (this.pos.y <= g2) {
        this.pos.y = g2;
        if (this.vel.y < 0) this.vel.y = 0;
        this.grounded = true;
        this.airborne = false;
      } else {
        this.grounded = false;
        this.airborne = this.pos.y > WATER_Y;
      }
    } else {
      this.grounded = false;
    }

    if (!this.airborne && !this.flying && !onFoot && this.pos.y > surfaceY) {
      this.pos.y = surfaceY;
      if (this.vel.y > 0) this.vel.y = 0;
    }
    if (this.flying && F.alwaysFly) {
      // Kartal suya girmez, yüzeyin hemen üstünde süzülür
      const low = WATER_Y + 1.2 * this.scale;
      if (this.pos.y < low) { this.pos.y = low; if (this.vel.y < 0) this.vel.y = 0; }
    } else if (this.flying && this.pos.y < surfaceY && this.vel.y < 0) {
      // Uçarken suya dalış
      this.flying = false;
      Effects.splash(new THREE.Vector3(this.pos.x, WATER_Y, this.pos.z), true);
      Sound.splash();
    }
    if (this.pos.y > MAX_FLY_Y) {
      this.pos.y = MAX_FLY_Y;
      if (this.vel.y > 0) this.vel.y = 0;
    }
    if (this.airborne && !onFoot && this.pos.y < surfaceY && this.vel.y < 0) {
      this.airborne = false;
      this.vel.multiplyScalar(0.7);
      // Suya burnunun gösterdiği yönde dalmaya devam etsin, hemen yüzeye geri dönmesin
      this.pitch = clamp(Math.atan2(this.vel.y, Math.hypot(this.vel.x, this.vel.z)), -0.6, 0);
      Effects.splash(new THREE.Vector3(this.pos.x, WATER_Y, this.pos.z), true);
      Sound.splash();
    }

    // Deniz tabanı ve kara
    const ground2 = terrainHeight(this.pos.x, this.pos.z);
    const minY = ground2 + (F.walker ? WALKER_STAND * F.modelScale : 0.9) * this.scale;
    this.beached = false;
    if (this.pos.y < minY) {
      this.pos.y = minY;
      if (this.vel.y < 0) this.vel.y = 0;
      if (this.airborne) this.airborne = false;
      if (minY > surfaceY + 0.3 && !this.flying && !F.walker) this.beached = true;
    }
    if (this.beached) {
      // Karaya vurdu: denize doğru kay, can azalır
      const seaward = seawardDirection(this.pos.x, this.pos.z, new THREE.Vector3());
      this.pos.addScaledVector(seaward, 12 * dt);
      this.vel.x *= 0.9; this.vel.z *= 0.9;
      this.hp -= 5 * dt;
      this.beachMsgCd -= dt;
      if (this.beachMsgCd <= 0) { Hud.msg('Karaya vurdun! Suya dön!'); this.beachMsgCd = 2.5; }
      if (this.hp <= 0) { this.hp = 1; this.hurt(1); }
    }

    // Dünyanın sınırı
    const r = Math.hypot(this.pos.x, this.pos.z);
    if (r > WORLD_LIMIT) {
      this.pos.x *= WORLD_LIMIT / r;
      this.pos.z *= WORLD_LIMIT / r;
    }

    // Sayaçlar ve durum
    this.biteCd -= dt;
    this.lungeCd -= dt;
    this.lungeTimer -= dt;
    this.biteAnim -= dt;
    this.hurtFlash -= dt;
    const speed = this.vel.length();
    this.stealthy = speed < 7 * this.speedMul && !this.airborne && !this.beached && !this.flying && this.lungeTimer <= 0;

    if (this.sprinting) this.stamina = Math.max(0, this.stamina - 18 * dt);
    else if (this.lungeTimer <= 0 && (!this.flying || F.alwaysFly)) this.stamina = Math.min(100, this.stamina + 15 * dt);

    this.hunger -= dt * (0.7 + (this.sprinting ? 0.8 : 0));
    if (this.hunger <= 0) {
      this.hunger = 0;
      this.hp -= 3 * dt;
      if (this.hp <= 0) { this.hp = 1; this.hurt(1); }
    } else if (this.hunger > 40) {
      this.hp = Math.min(this.maxHp, this.hp + dt * (1.5 + this.level * 0.2));
    }

    if (this.sprinting && this.pos.y < WATER_Y && Math.random() < dt * 12) Effects.bubbles(this.pos.clone().addScaledVector(this.fwd, -3 * this.scale), 2);

    this.updateModel(dt, speed, turnRate, onFoot);
  },

  updateModel(dt, speed, turnRate, onFoot) {
    const F = this.formDef(), m = this.model, g = m.group;
    g.position.copy(this.pos);
    let p = this.pitch;
    if (this.airborne) p = Math.atan2(this.vel.y, Math.hypot(this.vel.x, this.vel.z));
    if (this.beached) p = 0;
    this.visPitch = lerp(this.visPitch, p, 1 - Math.exp(-dt * 8));
    this.roll = lerp(this.roll, clamp(-turnRate * 0.25, -0.6, 0.6), 1 - Math.exp(-dt * 4));
    if (F.walker) g.rotation.set(onFoot ? 0 : -this.visPitch * 0.3, this.yaw, 0);
    else g.rotation.set(-this.visPitch, this.yaw, this.roll * (F.alwaysFly ? 1.6 : 1));

    this.swimPhase += dt * (2 + speed * 0.35);
    this.wingPhase += dt * 7;
    const flap = this.beached ? 0.8 : 0.35;
    if (m.tail) m.tail.rotation[m.tailAxis] = Math.sin(this.swimPhase * (this.beached ? 2.5 : 1)) * flap * (F.alwaysFly ? 0.3 : 1);

    // Uçarken yan yüzgeçler kanat gibi büyüyüp çırpar
    if (m.fins) {
      const wingOpen = lerp(m.fins[0].scale.x, this.flying ? 2.2 : 1, 1 - Math.exp(-dt * 6));
      for (const f of m.fins) {
        const s = f.userData.s;
        const lift = this.flying ? 0.9 + Math.sin(this.wingPhase) * 0.6 : 0;
        f.rotation.z = -s * (Math.PI / 2 + 0.4) + s * lift;
        f.scale.set(wingOpen, wingOpen, wingOpen);
      }
    }
    if (m.wings) {
      // Kartal kanat çırpar; hızlıyken süzülür
      const beat = speed > 25 ? 0.15 : 0.55;
      for (const w of m.wings) w.rotation.z = w.userData.s * (Math.sin(this.wingPhase * 0.8) * beat + 0.05);
    }
    if (m.flame) {
      m.flame.visible = this.flying || this.sprinting || this.lungeTimer > 0;
      m.flame.scale.set(1, 1 + Math.sin(this.wingPhase * 4) * 0.25, 1);
    }
    if (m.tentacles) {
      m.tentacles.forEach((tt, i) => {
        const w = Math.sin(this.swimPhase * 0.6 + i) * 0.25;
        const grab = this.biteAnim > 0 ? 0.9 : 0.15;
        tt.rotation.x = -Math.sin(tt.userData.a) * (grab + w);
        tt.rotation.y = Math.cos(tt.userData.a) * (grab + w);
      });
    }
    if (m.legs) {
      // Yürürken bacaklar ve kollar sallanır, suda çırpınır; yumrukta sağ kol ileri
      const walkSwing = onFoot && this.grounded ? Math.sin(this.swimPhase * 1.6) * Math.min(speed / 10, 1) * 0.7 : 0;
      const kick = !onFoot ? Math.sin(this.swimPhase * 3) * 0.5 : 0;
      for (const l of m.legs) l.rotation.x = l.userData.s * (walkSwing + kick) + (onFoot && !this.grounded ? -0.4 : 0);
      for (const a of m.arms) {
        let rx = -a.userData.s * walkSwing + (!onFoot ? -1.2 + Math.sin(this.swimPhase * 2 + a.userData.s) * 0.5 : 0);
        if (a.userData.s > 0 && this.biteAnim > 0) rx = -1.6 * Math.sin((1 - this.biteAnim / 0.35) * Math.PI);
        a.rotation.x = rx;
      }
    }

    if (m.jaw) {
      let jaw = 0.05;
      if (this.biteAnim > 0) jaw = Math.sin((1 - this.biteAnim / 0.35) * Math.PI) * 0.75;
      else if (this.lungeTimer > 0) jaw = 0.5;
      m.jaw.rotation.x = lerp(m.jaw.rotation.x, jaw, 1 - Math.exp(-dt * 25));
    }
  },

  updateCamera(camera, dt) {
    const dist = 11 * this.scale + 5;
    const height = 3.2 * this.scale;
    const fwd = forwardFrom(this.yaw, this.pitch * 0.85, new THREE.Vector3());
    const desired = this.pos.clone().addScaledVector(fwd, -dist);
    desired.y += height;
    const ground = terrainHeight(desired.x, desired.z) + 1.5;
    if (desired.y < ground) desired.y = ground;
    camera.position.lerp(desired, 1 - Math.exp(-dt * 6));
    if (this.hurtFlash > 0) {
      camera.position.x += rand(-0.3, 0.3);
      camera.position.y += rand(-0.3, 0.3);
    }
    const look = this.pos.clone().addScaledVector(fwd, 6 * this.scale);
    look.y += 1.2 * this.scale;
    camera.lookAt(look);
  },
};
