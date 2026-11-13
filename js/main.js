// Oyunun ana döngüsü ve ekranlar
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.3, 1500);

const LASER_RANGE = 90;

const Game = {
  state: 'menu',
  inTrench: false,
  time: 0,
  saveTimer: 0,

  // Vurulabilecek her şey: düşmanlar, kara hayvanları, gemiler. dist(p): yüzeyine uzaklık.
  targets() {
    const list = [];
    for (const e of Enemies.list) list.push({ obj: e, dist: (p) => p.distanceTo(e.pos) - e.radius });
    for (const a of Land.list) list.push({ obj: a, dist: (p) => p.distanceTo(a.targetPoint()) - 1 });
    for (const s of Ships.list) if (!s.sinking) list.push({ obj: s, dist: (p) => s.distanceTo(p) });
    return list;
  },

  tryBite() {
    Sound.bite();
    const mouth = Player.mouthPos(new THREE.Vector3());
    const reach = 3.5 + 1.3 * Player.scale;
    let dmg = Player.damage * (Player.lungeTimer > 0 ? 1.6 : 1);

    let best = null, bestD = Infinity;
    for (const t of this.targets()) {
      const d = t.dist(mouth);
      if (d < reach && d < bestD) { best = t.obj; bestD = d; }
    }
    if (best) {
      // Fark edilmeden yapılan saldırı çok daha güçlü (gemiler hariç)
      const unaware = best instanceof Ship ? false
        : best instanceof LandAnimal ? best.state !== 'flee' : !best.angry && best.state !== 'chase';
      if (unaware) {
        dmg *= 3;
        Hud.msg('SÜRPRİZ SALDIRI!');
      }
      best.hurt(dmg);
      Hud.setTarget(best);
      return;
    }
    const n = Fish.eatNear(mouth, reach + 1);
    if (n > 0) {
      Player.eat(n * 4);
      Player.addXp(n * 3);
      Sound.eat();
      Hud.float('+' + n * 3 + ' XP', mouth, '#8fe3ff');
      Effects.blood(mouth, 3);
    } else {
      Effects.bubbles(mouth, 6);
    }
  },

  // Robot: ileriye lazer; yoldaki ilk hedefi vurur
  fireLaser() {
    Sound.laser();
    const from = Player.mouthPos(new THREE.Vector3());
    const dir = Player.fwd.clone();
    const targets = this.targets();
    const p = new THREE.Vector3();
    let hit = null, end = from.clone().addScaledVector(dir, LASER_RANGE);
    for (let s = 0; s <= LASER_RANGE && !hit; s += 1.5) {
      p.copy(from).addScaledVector(dir, s);
      for (const t of targets) {
        if (t.dist(p) < 1) { hit = t.obj; end = p.clone(); break; }
      }
    }
    Effects.beam(from, end, 0xff2020);
    if (hit) {
      hit.hurt(Player.damage);
      Hud.setTarget(hit);
      Effects.spawn(end, { count: 10, color: 0xffa020, size: 0.4, speed: 6, life: 0.4, spread: 0.5, opacity: 1 });
    }
  },

  // Kraken: dokunaçlarla çevresindeki herkese vurur, yakındaki balıkları yakalar
  tentacleSweep() {
    Sound.tentacle();
    const R = 8 + 3 * Player.scale;
    let nearest = null, nearestD = Infinity;
    for (const t of this.targets()) {
      const d = t.dist(Player.pos);
      if (d < R) {
        t.obj.hurt(Player.damage * 0.8);
        if (d < nearestD) { nearest = t.obj; nearestD = d; }
      }
    }
    if (nearest) Hud.setTarget(nearest);
    const n = Fish.eatNear(Player.pos, R * 0.7);
    if (n > 0) { Player.eat(n * 4); Player.addXp(n * 3); }
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      Effects.spawn(Player.pos.clone().add(new THREE.Vector3(Math.cos(a) * R * 0.8, 0, Math.sin(a) * R * 0.8)),
        { count: 2, color: 0xc070ff, size: 0.6, speed: 2, life: 0.6, spread: 0.5, opacity: 0.8 });
    }
  },

  onDeath() {
    Save.data.deaths++;
    Save.write();
    this.state = 'dead';
    document.getElementById('deathInfo').textContent =
      'Seviyen korunuyor (Seviye ' + Player.level + '). Yendiğin düşman: ' + Save.data.kills +
      ', avladığın kara hayvanı: ' + Save.data.eaten + ', batırdığın gemi: ' + Save.data.sunk + '.';
    document.getElementById('deathScreen').classList.remove('hidden');
    if (document.pointerLockElement) document.exitPointerLock();
  },
};

// Kurulum
Save.load();
Hud.init();
Voice.init();
World.init(scene);
Effects.init(scene);
Player.init(scene);
Fish.init(scene);
Enemies.init(scene);
Land.init(scene);
Ships.init(scene);
camera.position.copy(Player.pos).add(new THREE.Vector3(0, 4, -15));

function showSaveInfo() {
  const d = Save.data;
  document.getElementById('saveInfo').textContent = d.level > 1 || d.kills > 0
    ? 'Kayıtlı oyun: Seviye ' + d.level + ' · Yendiğin düşman: ' + d.kills + ' · Avladığın kara hayvanı: ' + d.eaten +
      ' · Batırdığın gemi: ' + d.sunk + ' · Hazine: ' + d.treasures
    : '';
}
showSaveInfo();

// Girdi
function lockPointer() {
  try {
    const p = canvas.requestPointerLock();
    if (p && p.catch) p.catch(() => {});
  } catch (e) { /* kilit yoksa ok tuşlarıyla oynanır */ }
}

function startPlaying() {
  Sound.unlock();
  ['startScreen', 'pauseScreen', 'deathScreen'].forEach((id) => document.getElementById(id).classList.add('hidden'));
  Game.state = 'playing';
  if (!touchControls) lockPointer();
}

function pause() {
  Game.state = 'paused';
  Save.write();
  document.getElementById('pauseScreen').classList.remove('hidden');
}

// Ekran düğmesine basınca odak onda kalırsa Boşluk (atılma) ona yeniden basar
const onButton = (id, action) => {
  const b = document.getElementById(id);
  b.onclick = () => { b.blur(); action(); };
};
onButton('playBtn', startPlaying);
onButton('resumeBtn', startPlaying);
onButton('respawnBtn', () => { Player.respawn(); startPlaying(); });
onButton('resetBtn', () => {
  if (!confirm('Kayıtlı oyun silinsin mi?')) return;
  Save.reset();
  Player.level = 1;
  Player.xp = 0;
  Player.form = 'megalodon';
  Player.buildModel();
  Player.respawn();
  showSaveInfo();
});

document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement && Game.state === 'playing') pause();
});

// Tuşlar e.code ile, yani klavyedeki yerleriyle tanınır (Kaplan Macerası'ndaki gibi)
const GAME_KEYS = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
const FORM_KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'];

// Bir tuşun inişi; ekran düğmeleri de bunu çağırır
function pressKey(code) {
  if (!Input.keys[code]) {
    Input.pressed[code] = true;
    onKeyPressed(code);
  }
  Input.keys[code] = true;
}

function onKeyPressed(code) {
  if (code === 'KeyP' || code === 'Escape') {
    if (Game.state === 'playing') {
      if (document.pointerLockElement) document.exitPointerLock();
      else pause();
    } else if (Game.state === 'paused') startPlaying();
    return;
  }
  if (Game.state !== 'playing') return;
  if (code === 'KeyM') Hud.toggleBigMap();
  if (code === 'KeyV') Voice.toggle();
  if (code === 'KeyQ') Player.switchSprint();
  if (code === 'KeyC') Player.switchSneak();
  const formIndex = FORM_KEYS.indexOf(code);
  if (formIndex >= 0) Player.transform(FORM_ORDER[formIndex]);
}

window.addEventListener('keydown', (e) => {
  if (GAME_KEYS.includes(e.code)) e.preventDefault();
  pressKey(e.code);
});
window.addEventListener('keyup', (e) => { Input.keys[e.code] = false; });
window.addEventListener('blur', () => { Input.keys = {}; });
document.addEventListener('mousemove', (e) => {
  if (document.pointerLockElement === canvas) {
    Input.mouseDX += e.movementX;
    Input.mouseDY += e.movementY;
  }
});
canvas.addEventListener('mousedown', (e) => {
  if (e.button !== 0 || Game.state !== 'playing') return;
  if (document.pointerLockElement !== canvas && !touchControls) lockPointer();
  Input.clicked = true;
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
window.addEventListener('beforeunload', () => Save.write());

// Ana döngü
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (Game.state === 'playing') {
    Game.time += dt;
    const t = Game.time;
    Player.update(dt);
    Fish.update(dt, t);
    Enemies.update(dt, t);
    Land.update(dt);
    Ships.update(dt, t);
    Effects.update(dt);
    Player.updateCamera(camera, dt);
    Hud.update(dt, camera);
    if (touchControls) showTouchSwitches();
    const inTrenchNow = Enemies.playerInTrench();
    if (inTrenchNow && !Game.inTrench) {
      Hud.big('MARİANA ÇUKURU');
      Hud.msg('Karanlıkta tuhaf canlılar yaşıyor...');
    }
    Game.inTrench = inTrenchNow;
    Game.saveTimer -= dt;
    if (Game.saveTimer <= 0) { Save.write(); Game.saveTimer = 10; }
  } else if (Game.state === 'menu') {
    // Menüde kamera yavaşça dönsün
    const a = now / 9000;
    camera.position.set(Player.pos.x + Math.sin(a) * 20, Player.pos.y + 4, Player.pos.z + Math.cos(a) * 20);
    camera.lookAt(Player.pos);
    Player.updateModel(dt, 4, 0);
  }
  World.update(now / 1000, camera, Game.state === 'playing' ? dt : 0);
  Input.endFrame();
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);
