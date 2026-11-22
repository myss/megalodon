// Uzay: Güneş, sekiz gezegen, Her Şey Gezegeni ve uzay istasyonu.
// Dünya'ya girince okyanusa dönülür; öteki gezegenlere girince yüzeylerine inilir.

// ---- Gezegen dokuları (canvas üstüne çizilir) ----

function paintPlanet(g, style, x0, x1, H) {
  const W = x1 - x0;
  const fill = (c) => { g.fillStyle = c; g.fillRect(x0, 0, W, H); };
  const bands = (colors) => {
    const n = colors.length * 3;
    for (let i = 0; i < n; i++) {
      g.fillStyle = colors[i % colors.length];
      g.fillRect(x0, (i / n) * H, W, H / n + 1);
    }
  };
  const blobs = (color, n, rMin, rMax, yMin, yMax) => {
    g.fillStyle = color;
    for (let i = 0; i < n; i++) {
      g.beginPath();
      g.ellipse(x0 + Math.random() * W, H * (yMin + Math.random() * (yMax - yMin)), rand(rMin, rMax) * 1.6, rand(rMin, rMax), 0, 0, Math.PI * 2);
      g.fill();
    }
  };
  const craters = (n) => {
    for (let i = 0; i < n; i++) {
      const x = x0 + Math.random() * W, y = Math.random() * H, r = rand(3, 14);
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 2; g.beginPath(); g.arc(x - 1, y - 1, r, 0, Math.PI * 2); g.stroke();
    }
  };
  if (style === 'merkur') { fill('#8a8580'); craters(60 * W / 512); }
  else if (style === 'venus') { bands(['#e8c070', '#d9a441', '#f0d090', '#c8903a']); blobs('rgba(255,240,200,.35)', 20, 10, 30, 0, 1); }
  else if (style === 'dunya') {
    fill('#2a6fc0'); blobs('#3f9a3f', 18 * W / 512, 12, 40, 0.15, 0.85); blobs('#a08a5a', 6 * W / 512, 8, 20, 0.3, 0.7);
    g.fillStyle = '#f4f8ff'; g.fillRect(x0, 0, W, H * 0.07); g.fillRect(x0, H * 0.93, W, H * 0.07);
    blobs('rgba(255,255,255,.55)', 20 * W / 512, 8, 26, 0.05, 0.95);
  }
  else if (style === 'mars') {
    fill('#c1502b'); blobs('#8a3a1e', 20 * W / 512, 8, 30, 0.1, 0.9); blobs('#e07a4a', 10 * W / 512, 6, 18, 0.1, 0.9);
    g.fillStyle = '#f4f0ea'; g.fillRect(x0, 0, W, H * 0.05); g.fillRect(x0, H * 0.95, W, H * 0.05);
  }
  else if (style === 'jupiter') {
    bands(['#e8d2b0', '#b5835a', '#f0e0c8', '#a06a40', '#d8b890']);
    g.fillStyle = '#c0442a'; g.beginPath(); g.ellipse(x0 + W * 0.6, H * 0.62, W * 0.09, H * 0.06, 0, 0, Math.PI * 2); g.fill();
  }
  else if (style === 'saturn') { bands(['#e8d8a8', '#d4bc80', '#f0e4c0', '#c8aa70']); }
  else if (style === 'uranus') { fill('#9fe0e8'); bands(['rgba(159,224,232,1)', 'rgba(140,210,224,1)', 'rgba(170,232,238,1)']); }
  else if (style === 'neptun') {
    bands(['#2f5fd0', '#2850b8', '#3a6ee0']);
    g.fillStyle = '#1a2f80'; g.beginPath(); g.ellipse(x0 + W * 0.4, H * 0.4, W * 0.07, H * 0.05, 0, 0, Math.PI * 2); g.fill();
  }
}

// Her Şey Gezegeni: her dilimde başka bir gezegen
const EVERYTHING_PARTS = ['merkur', 'venus', 'dunya', 'mars', 'jupiter', 'saturn', 'uranus', 'neptun'];

function planetTexture(style) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  if (style === 'herSey') {
    EVERYTHING_PARTS.forEach((s, i) => paintPlanet(g, s, (i / 8) * 512, ((i + 1) / 8) * 512, 256));
  } else {
    paintPlanet(g, style, 0, 512, 256);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---- Gezegenler ----
// surface: yüzeye inince görülecek dünya. palette: alçaktan yükseğe zemin renkleri.

const PLANETS = [
  { id: 'merkur', name: 'Merkür', r: 14, dist: 420, fact: 'Güneş\'e en yakın gezegen. Havası yok, gökyüzü hep kapkara.',
    surface: { palette: [0x5a5550, 0x8a8580, 0xb0aaa4], sky: 0x000000, fog: 900, amp: 18, freq: 0.012, craters: 60, rocks: 80, bigSun: true } },
  { id: 'venus', name: 'Venüs', r: 22, dist: 620, fact: 'En sıcak gezegen! Kalın sarı bulutlarla kaplı.',
    surface: { palette: [0x8a5a20, 0xc8903a, 0xe8c070], sky: 0xd9a441, fog: 260, amp: 14, freq: 0.01, rocks: 60, lava: 14 } },
  { id: 'dunya', name: 'Dünya', r: 24, dist: 840, fact: 'Evimiz!', home: true },
  { id: 'mars', name: 'Mars', r: 18, dist: 1060, fact: 'Kızıl gezegen. Toprağındaki pas yüzünden kırmızı görünür.',
    surface: { palette: [0x7a2e16, 0xb5532c, 0xd8804a], sky: 0xd8a080, fog: 700, amp: 45, freq: 0.006, rocks: 140, craters: 15 } },
  { id: 'jupiter', name: 'Jüpiter', r: 80, dist: 1450, fact: 'En büyük gezegen. Gazdan bir dev: ayak basacak yeri yok, dev bir kızıl fırtınası var.',
    surface: { palette: [0xa06a40, 0xd8b890, 0xf0e0c8], sky: 0xd8b890, fog: 600, amp: 6, freq: 0.02, gas: true, storm: true } },
  { id: 'saturn', name: 'Satürn', r: 66, dist: 1900, rings: true, fact: 'Halkaları buz ve kaya parçalarından yapılmış.',
    surface: { palette: [0xc8aa70, 0xe8d8a8, 0xf0e4c0], sky: 0xe8d8a8, fog: 700, amp: 6, freq: 0.02, gas: true, skyRings: true } },
  { id: 'uranus', name: 'Uranüs', r: 42, dist: 2300, fact: 'Yan yatmış dönen bir buz devi.',
    surface: { palette: [0x6ab8c8, 0x9fe0e8, 0xe0f8fa], sky: 0x9fe0e8, fog: 650, amp: 10, freq: 0.012, spikes: 120 } },
  { id: 'neptun', name: 'Neptün', r: 40, dist: 2650, fact: 'Güneş\'e en uzak gezegen. Rüzgârları çok çok hızlı.',
    surface: { palette: [0x1a2f80, 0x2f5fd0, 0x8ab0ff], sky: 0x2040a0, fog: 600, amp: 12, freq: 0.012, spikes: 90 } },
  { id: 'herSey', name: 'Her Şey Gezegeni', r: 90, dist: 3100, rings: true, fact: 'Bütün gezegenlerin birleşimi! Her köşesi başka bir gezegen.',
    surface: { everything: true, palette: [0x6a4a9a, 0xb070d0, 0xffd0f0], sky: 0x6a4a9a, fog: 800, amp: 25, freq: 0.008,
      rocks: 120, spikes: 80, craters: 30, lava: 10, skyRings: true, moons: 5 } },
];

function buildStation() {
  const g = new THREE.Group();
  const hull = 0xd8dce2;
  const core = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 40, 16), mat(hull));
  core.rotation.z = Math.PI / 2;
  g.add(core);
  for (const x of [-14, 0, 14]) {
    const mod = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 8, 16), mat(0xb8bec8));
    mod.rotation.z = Math.PI / 2;
    mod.position.x = x;
    g.add(mod);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(18, 1.5, 10, 40), mat(0xa8aeb8));
  ring.rotation.y = Math.PI / 2;
  g.add(ring);
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 30, 8), mat(0x888e98));
    arm.position.set(s * 20, 0, 0);
    arm.rotation.z = Math.PI / 2;
    g.add(arm);
    for (const y of [-9, 9]) {
      const panel = box(14, 0.4, 12, 0x2a4ab0);
      panel.material = glowMat(0x2a4ab0, 0.4);
      panel.position.set(s * 30, 0, y);
      g.add(panel);
    }
  }
  const lights = [];
  for (let i = 0; i < 8; i++) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 6), glowMat(i % 2 ? 0xff4040 : 0x40ff60, 2));
    l.position.set(-20 + i * 5.7, 5.5, 0);
    lights.push(l);
    g.add(l);
  }
  return { group: g, lights };
}

const Space = {
  scene: null,
  bodies: [],
  station: null,
  portal: null,
  sunWarned: 0,

  init() {
    const s = this.scene = new THREE.Scene();
    s.background = new THREE.Color(0x02030a);
    s.add(new THREE.AmbientLight(0xffffff, 0.35));
    const sunLight = new THREE.PointLight(0xfff2d8, 2.6, 0, 0);
    s.add(sunLight);

    // Yıldızlar
    const n = 4000, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize().multiplyScalar(rand(12000, 16000));
      pos.set([v.x, v.y, v.z], i * 3);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    s.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false })));

    const sun = new THREE.Mesh(new THREE.SphereGeometry(150, 32, 20), new THREE.MeshBasicMaterial({ color: 0xffd040 }));
    s.add(sun);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(190, 32, 20), new THREE.MeshBasicMaterial({ color: 0xffa020, transparent: true, opacity: 0.25 }));
    s.add(halo);
    this.bodies.push({ id: 'gunes', name: 'Güneş', r: 150, pos: new THREE.Vector3(), sun: true });

    PLANETS.forEach((p, i) => {
      const a = -0.35 + i * 0.42;
      p.pos = new THREE.Vector3(Math.cos(a) * p.dist, Math.sin(i * 1.7) * 30, Math.sin(a) * p.dist);
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(p.r, 40, 24), new THREE.MeshLambertMaterial({ map: planetTexture(p.id) }));
      mesh.position.copy(p.pos);
      mesh.rotation.z = p.id === 'uranus' ? 1.5 : 0.3;
      s.add(mesh);
      p.mesh = mesh;
      if (p.rings) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(p.r * 1.3, p.r * 2.2, 64),
          new THREE.MeshLambertMaterial({ color: p.id === 'herSey' ? 0xd8a0ff : 0xe0cc98, side: THREE.DoubleSide, transparent: true, opacity: 0.8 }));
        ring.position.copy(p.pos);
        ring.rotation.x = Math.PI / 2 - 0.4;
        s.add(ring);
      }
      if (p.id === 'dunya') {
        const moon = new THREE.Mesh(new THREE.SphereGeometry(6, 20, 12), new THREE.MeshLambertMaterial({ map: planetTexture('merkur') }));
        moon.position.copy(p.pos).add(new THREE.Vector3(60, 10, 0));
        s.add(moon);
      }
      this.bodies.push(p);
    });

    // Uzay istasyonu Dünya'nın yakınında; gizli portalın öbür ucu onun önünde
    const earth = PLANETS.find((p) => p.id === 'dunya');
    this.station = buildStation();
    this.station.group.position.copy(earth.pos).add(new THREE.Vector3(0, 60, -170));
    s.add(this.station.group);
    const portalModel = buildPortal(RAINBOW, 8);
    const portalPos = this.station.group.position.clone().add(new THREE.Vector3(0, 0, 26));
    portalModel.group.position.copy(portalPos);
    s.add(portalModel.group);
    this.portal = { pos: portalPos, yaw: 0, normal: new THREE.Vector3(0, 0, 1), radius: 8, model: portalModel, color: RAINBOW[0] };
  },

  arrive() {
    const P = Player;
    P.pos.copy(this.portal.pos).addScaledVector(this.portal.normal, 20 + P.radius());
    P.yaw = 0; P.pitch = 0;
    P.vel.set(0, 0, 10);
    Portals.cooldown = PORTAL_COOLDOWN;
  },

  update(dt, t) {
    const P = Player;
    for (const b of this.bodies) if (b.mesh) b.mesh.rotation.y += dt * 0.05;
    this.station.group.rotation.x += dt * 0.05;
    this.station.lights.forEach((l, i) => { l.visible = Math.floor(t * 2 + i) % 2 === 0; });
    this.portal.model.swirl.rotation.z -= dt * 2;
    this.sunWarned -= dt;

    Portals.cooldown -= dt;
    if (Portals.cooldown <= 0 && Portals.inside(this.portal, P.pos)) {
      Sound.portal();
      Game.flash();
      Game.goOcean({ portal: true });
      return;
    }
    for (const b of this.bodies) {
      const d = P.pos.distanceTo(b.pos);
      if (d > b.r + P.radius()) continue;
      if (b.sun) {
        // Güneş'e girilmez: geri itilir
        P.pos.copy(b.pos).addScaledVector(P.pos.clone().sub(b.pos).normalize(), b.r + P.radius() + 1);
        if (this.sunWarned <= 0) { Hud.msg('Güneş çok sıcak! Yaklaşamazsın ☀️'); this.sunWarned = 3; }
      } else if (b.home) {
        Sound.portal();
        Game.flash();
        Game.goOcean({ fromSky: true });
        return;
      } else {
        Sound.portal();
        Game.flash();
        Game.enterPlanet(b);
        return;
      }
    }
  },
};

// ---- Gezegen yüzeyleri ----

const PLANET_HALF = 600;
const PLANET_LEAVE_Y = 320;

const PlanetWorld = {
  scene: null,
  planet: null,
  spinner: null,
  cache: {},

  // Her Şey Gezegeni'nde zemin yönüne göre başka bir gezegenin parçası
  partAt(x, z) {
    const a = (Math.atan2(z, x) + Math.PI) / (Math.PI * 2);
    return PLANETS.filter((p) => p.surface && !p.surface.everything)[Math.floor(a * 7) % 7];
  },

  heightAt(x, z, S) {
    S = S || this.planet.surface;
    if (S.everything) {
      const part = this.partAt(x, z).surface;
      return (fbm(x * part.freq + 7, z * part.freq) - 0.5) * 2 * part.amp + Math.sin(x * 0.01) * 4;
    }
    let h = (fbm(x * S.freq + 7, z * S.freq) - 0.5) * 2 * S.amp;
    if (S.gas) h += Math.sin(x * 0.03 + z * 0.01) * 3;
    return h;
  },

  height(x, z) { return this.heightAt(x, z); },

  build(p) {
    const S = p.surface;
    const s = new THREE.Scene();
    s.background = new THREE.Color(S.sky);
    s.fog = new THREE.Fog(S.sky, 40, S.fog);
    s.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.3));
    const sun = new THREE.DirectionalLight(0xffffff, S.bigSun ? 3.2 : 2.2);
    sun.position.set(200, 300, 100);
    s.add(sun);

    const seg = 140, size = PLANET_HALF * 2;
    const geo = new THREE.PlaneGeometry(size, size, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const c = new THREE.Color(), c2 = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const y = this.heightAt(x, z, S);
      pos.setY(i, y);
      const pal = S.everything ? this.partAt(x, z).surface.palette : S.palette;
      const amp = S.everything ? this.partAt(x, z).surface.amp : S.amp;
      const k = clamp(y / (amp * 2) + 0.5, 0, 1);
      if (k < 0.5) c.setHex(pal[0]).lerp(c2.setHex(pal[1]), k * 2);
      else c.setHex(pal[1]).lerp(c2.setHex(pal[2]), (k - 0.5) * 2);
      if (S.gas) c.lerp(c2.setHex(pal[Math.floor((z + PLANET_HALF) / 60) % 3]), 0.5);
      c.multiplyScalar(0.9 + noise2(x * 0.1, z * 0.1) * 0.2);
      col.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    s.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true })));

    const spot = () => { const x = rand(-PLANET_HALF * 0.9, PLANET_HALF * 0.9), z = rand(-PLANET_HALF * 0.9, PLANET_HALF * 0.9); return [x, this.heightAt(x, z, S), z]; };
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), v = new THREE.Vector3();
    const scatter = (geom, material, n, sizeMin, sizeMax, sink, tall) => {
      const inst = new THREE.InstancedMesh(geom, material, n);
      for (let i = 0; i < n; i++) {
        const [x, y, z] = spot();
        const k = rand(sizeMin, sizeMax);
        q.setFromEuler(new THREE.Euler(rand(-0.2, 0.2), rand(0, 6.28), rand(-0.2, 0.2)));
        sc.set(k, k * (tall || 1), k);
        m.compose(v.set(x, y - sink * k, z), q, sc);
        inst.setMatrixAt(i, m);
      }
      s.add(inst);
    };
    const pal = S.palette;
    if (S.rocks) scatter(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ color: pal[0], flatShading: true }), S.rocks, 2, 9, 0.3);
    if (S.spikes) {
      const sg = new THREE.ConeGeometry(1, 6, 6); sg.translate(0, 3, 0);
      scatter(sg, new THREE.MeshLambertMaterial({ color: 0xe8f8ff, emissive: 0x204060, flatShading: true }), S.spikes, 1.5, 5, 0.1, 1.5);
    }
    if (S.craters) {
      const cg = new THREE.TorusGeometry(1, 0.25, 6, 20); cg.rotateX(Math.PI / 2);
      scatter(cg, new THREE.MeshLambertMaterial({ color: pal[0] }), S.craters, 6, 20, 0.05);
    }
    if (S.lava) {
      const lg = new THREE.CircleGeometry(1, 20); lg.rotateX(-Math.PI / 2);
      scatter(lg, glowMat(0xff5a10, 1.8), S.lava, 6, 16, -0.3);
    }
    let spinner = null;
    if (S.storm) {
      // Jüpiter'in kızıl fırtınası yavaşça döner
      spinner = new THREE.Mesh(new THREE.TorusGeometry(60, 18, 10, 40), new THREE.MeshLambertMaterial({ color: 0xc0442a, emissive: 0x401008 }));
      spinner.rotation.x = Math.PI / 2;
      spinner.position.set(180, 20, -220);
      s.add(spinner);
    }
    if (S.skyRings) {
      // Ufkun üstünde kocaman bir yay gibi görünsün
      const ring = new THREE.Mesh(new THREE.RingGeometry(800, 1400, 80),
        new THREE.MeshBasicMaterial({ color: S.everything ? 0xb060e0 : 0xa07838, side: THREE.DoubleSide, transparent: true, opacity: 0.85, fog: false }));
      ring.rotation.x = -0.3;
      ring.position.set(0, -100, -1800);
      s.add(ring);
    }
    if (S.bigSun || S.everything) {
      const sunBall = new THREE.Mesh(new THREE.SphereGeometry(S.bigSun ? 120 : 50, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffe070, fog: false }));
      sunBall.position.set(-700, 420, -900);
      s.add(sunBall);
    }
    if (S.moons) {
      for (let i = 0; i < S.moons; i++) {
        const moon = new THREE.Mesh(new THREE.SphereGeometry(rand(25, 60), 20, 12),
          new THREE.MeshBasicMaterial({ map: planetTexture(pick(EVERYTHING_PARTS)), fog: false }));
        const a = (i / S.moons) * Math.PI * 2;
        moon.position.set(Math.cos(a) * 1100, rand(300, 600), Math.sin(a) * 1100);
        s.add(moon);
      }
    }
    return { scene: s, spinner };
  },

  enter(p) {
    this.planet = p;
    if (!this.cache[p.id]) this.cache[p.id] = this.build(p);
    this.scene = this.cache[p.id].scene;
    this.spinner = this.cache[p.id].spinner;
    Player.pos.set(0, 220, 0);
    Player.vel.set(0, -20, 0);
    Player.pitch = -0.5;
  },

  update(dt) {
    if (this.spinner) this.spinner.rotation.z += dt * 0.3;
    if (Player.pos.y > PLANET_LEAVE_Y) Game.leavePlanet();
  },
};
