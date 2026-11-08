// Oyunun ana döngüsü ve ekranlar
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.3, 1500);

const Game = {
  state: 'menu',
  inTrench: false,
  time: 0,
  saveTimer: 0,

  tryBite() {
    Sound.bite();
    const mouth = Player.mouthPos(new THREE.Vector3());
    const reach = 3.5 + 1.3 * Player.scale;
    let dmg = Player.damage * (Player.lungeTimer > 0 ? 1.6 : 1);

    let best = null, bestD = Infinity;
    for (const e of Enemies.list) {
      const d = mouth.distanceTo(e.pos) - e.radius;
      if (d < reach && d < bestD) { best = e; bestD = d; }
    }
    for (const a of Land.list) {
      const d = mouth.distanceTo(a.targetPoint()) - 1;
      if (d < reach && d < bestD) { best = a; bestD = d; }
    }
    for (const s of Ships.list) {
      if (s.sinking) continue;
      const d = s.distanceTo(mouth);
      if (d < reach && d < bestD) { best = s; bestD = d; }
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
  lockPointer();
}

document.getElementById('playBtn').onclick = startPlaying;
document.getElementById('resumeBtn').onclick = startPlaying;
document.getElementById('respawnBtn').onclick = () => { Player.respawn(); startPlaying(); };
document.getElementById('resetBtn').onclick = () => {
  if (!confirm('Kayıtlı oyun silinsin mi?')) return;
  Save.reset();
  Player.level = 1;
  Player.xp = 0;
  Player.recalc();
  Player.respawn();
  showSaveInfo();
};

document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement && Game.state === 'playing') {
    Game.state = 'paused';
    Save.write();
    document.getElementById('pauseScreen').classList.remove('hidden');
  }
});

window.addEventListener('keydown', (e) => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (!Input.keys[e.code]) Input.pressed[e.code] = true;
  if (e.code === 'KeyM' && !Input.keys[e.code] && Game.state === 'playing') Hud.toggleBigMap();
  Input.keys[e.code] = true;
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
  if (document.pointerLockElement !== canvas) lockPointer();
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
