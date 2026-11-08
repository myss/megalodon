// Okyanus, adalar, Mariana Çukuru, deniz tabanı ve bitkiler
const WORLD_HALF = 1200;     // dünyanın yarı genişliği
const WORLD_LIMIT = 1150;    // oyuncu bu yarıçapın dışına çıkamaz
const WATER_Y = 0;
const SEA_MIN_Y = -95;       // normal deniz canlıları bundan derine inmez
const TRENCH_TOP = -130;     // çukur canlıları bundan yukarı çıkmaz
const DEPTH_TO_METERS = 26;  // çukurun dibi yaklaşık 11.000 metre olsun

const ISLANDS = [
  { x: 110, z: -70, r: 100 },
  { x: -150, z: 110, r: 120 },
  { x: 70, z: 230, r: 70 },
  { x: -210, z: -200, r: 88 },
  { x: 260, z: 120, r: 65 },
  { x: -600, z: -500, r: 150 },
  { x: -750, z: 300, r: 118 },
  { x: -400, z: 700, r: 100 },
  { x: 300, z: 750, r: 135 },
  { x: 800, z: 650, r: 85 },
  { x: -950, z: -50, r: 85 },
  { x: 100, z: -650, r: 110 },
  { x: -300, z: -950, r: 92 },
  { x: 900, z: -500, r: 76 },
];

// Mariana Çukuru: A'dan B'ye uzanan, dik duvarlı, çok derin bir kanyon
const TRENCH = { ax: 520, az: -700, bx: 820, bz: 300, width: 110, bottom: -420 };

function trenchDistance(x, z) {
  const T = TRENCH;
  const vx = T.bx - T.ax, vz = T.bz - T.az;
  const u = clamp(((x - T.ax) * vx + (z - T.az) * vz) / (vx * vx + vz * vz), 0, 1);
  const px = T.ax + vx * u, pz = T.az + vz * u;
  // Uçlara doğru daralır
  const taper = Math.min(1, Math.min(u, 1 - u) * 6);
  return { d: Math.hypot(x - px, z - pz), u, width: T.width * (0.35 + 0.65 * taper) };
}

function inTrench(x, z) {
  const t = trenchDistance(x, z);
  return t.d < t.width * 0.6;
}

function terrainHeight(x, z) {
  let h = -38 + fbm(x * 0.008, z * 0.008) * 20 + fbm(x * 0.04 + 33, z * 0.04) * 4;
  for (const isl of ISLANDS) {
    const dx = x - isl.x, dz = z - isl.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d > isl.r * 2.4) continue;
    const t = d / isl.r;
    const top = 6 + isl.r * 0.08;  // büyük adalar biraz daha yüksek
    let hi = top - t * t * top;
    hi += (fbm(x * 0.05, z * 0.05) - 0.5) * 8 * clamp(1 - t, 0, 1);
    h = smax(h, hi, 8);
  }
  const tr = trenchDistance(x, z);
  if (tr.d < tr.width) {
    const k = smoothstep(clamp((1 - tr.d / tr.width) * 2, 0, 1));
    const endFade = smoothstep(clamp(Math.min(tr.u, 1 - tr.u) * 5, 0, 1));
    const bottom = lerp(-120, TRENCH.bottom, endFade) + fbm(x * 0.03, z * 0.03) * 25;
    h = lerp(h, bottom, k);
  }
  return h;
}

// Karadan denize giden yön: en yakın adanın merkezinden dışarı doğru.
// Adalar merkezden kıyıya hep alçalır; tepe ve çukurlara takılmaz.
function seawardDirection(x, z, out) {
  let best = ISLANDS[0], bestT = Infinity;
  for (const isl of ISLANDS) {
    const t = Math.hypot(x - isl.x, z - isl.z) / isl.r;
    if (t < bestT) { bestT = t; best = isl; }
  }
  out.set(x - best.x, 0, z - best.z);
  if (out.lengthSq() < 1e-6) out.set(1, 0, 0);
  return out.normalize();
}

// En az minDepth derinlikte rastgele bir su noktası (çukurun derinliklerine değil).
// center verilirse ona minDist..maxDist uzaklıkta.
function randomWaterPos(minDepth, center, minDist, maxDist) {
  for (let i = 0; i < 60; i++) {
    let x, z;
    if (center) {
      const a = rand(0, Math.PI * 2), d = rand(minDist, maxDist);
      x = center.x + Math.cos(a) * d; z = center.z + Math.sin(a) * d;
    } else {
      x = rand(-WORLD_LIMIT, WORLD_LIMIT); z = rand(-WORLD_LIMIT, WORLD_LIMIT);
    }
    if (Math.hypot(x, z) > WORLD_LIMIT - 10) continue;
    const ground = terrainHeight(x, z);
    if (ground > -minDepth) continue;
    return new THREE.Vector3(x, rand(Math.max(ground + 3, SEA_MIN_Y), WATER_Y - 2), z);
  }
  return new THREE.Vector3(0, -10, 0);
}

// Çukurun içinde, TRENCH_TOP'un altında rastgele bir nokta
function randomTrenchPos(center, minDist, maxDist) {
  const T = TRENCH;
  for (let i = 0; i < 80; i++) {
    let x, z;
    if (center && i < 50) {
      const a = rand(0, Math.PI * 2), d = rand(minDist, maxDist);
      x = center.x + Math.cos(a) * d; z = center.z + Math.sin(a) * d;
    } else {
      const u = rand(0.15, 0.85);
      x = lerp(T.ax, T.bx, u) + rand(-25, 25);
      z = lerp(T.az, T.bz, u) + rand(-25, 25);
    }
    const ground = terrainHeight(x, z);
    if (ground > TRENCH_TOP - 40) continue;
    return new THREE.Vector3(x, rand(ground + 4, TRENCH_TOP - 10), z);
  }
  return new THREE.Vector3(lerp(T.ax, T.bx, 0.5), TRENCH.bottom + 30, lerp(T.az, T.bz, 0.5));
}

const World = {
  scene: null,
  water: null,
  waterBase: null,
  seaweed: null,
  seaweedData: [],
  shoreSpots: [],
  underwater: null,
  hemi: null,
  sun: null,
  playerLight: null,

  init(scene) {
    this.scene = scene;
    this.buildLights();
    this.buildTerrain();
    this.buildWater();
    this.buildTrees();
    this.buildSeaLife();
    this.buildTrenchLife();
    this.findShoreSpots();
  },

  buildLights() {
    this.hemi = new THREE.HemisphereLight(0xcfeeff, 0x335544, 1.4);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff2d8, 2.6);
    this.sun.position.set(120, 200, 80);
    this.scene.add(this.sun);
    // Karanlık derinliklerde megalodonun çevresini hafifçe aydınlatır
    this.playerLight = new THREE.PointLight(0x9fc8ff, 0, 110, 0);
    this.scene.add(this.playerLight);
  },

  // Zemin tek bir yükseklik ızgarasından parça parça (chunk) kurulur
  buildTerrain() {
    const CHUNKS = 12, SEG = 48;
    const N = CHUNKS * SEG + 1;
    const step = (WORLD_HALF * 2) / (N - 1);
    const H = new Float32Array(N * N);
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        H[j * N + i] = terrainHeight(-WORLD_HALF + i * step, -WORLD_HALF + j * step);
      }
    }
    const hAt = (i, j) => H[clamp(j, 0, N - 1) * N + clamp(i, 0, N - 1)];

    const V = SEG + 1;
    const index = [];
    for (let j = 0; j < SEG; j++) {
      for (let i = 0; i < SEG; i++) {
        const a = j * V + i, b = a + 1, c = a + V, d = c + 1;
        index.push(a, c, b, b, c, d);
      }
    }
    const indexAttr = new THREE.Uint32BufferAttribute(index, 1);

    const c = new THREE.Color();
    const grass = new THREE.Color(0x4f9a3a), grassDark = new THREE.Color(0x3b7a2c);
    const sand = new THREE.Color(0xe8d49a), wetSand = new THREE.Color(0xc9b47a);
    const deep = new THREE.Color(0x5e6a5a), rock = new THREE.Color(0x3a3a42), abyss = new THREE.Color(0x24222a);
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true });

    for (let cz = 0; cz < CHUNKS; cz++) {
      for (let cx = 0; cx < CHUNKS; cx++) {
        const pos = new Float32Array(V * V * 3), nor = new Float32Array(V * V * 3), col = new Float32Array(V * V * 3);
        for (let j = 0; j < V; j++) {
          for (let i = 0; i < V; i++) {
            const gi = cx * SEG + i, gj = cz * SEG + j;
            const x = -WORLD_HALF + gi * step, z = -WORLD_HALF + gj * step, y = hAt(gi, gj);
            const k = (j * V + i) * 3;
            pos[k] = x; pos[k + 1] = y; pos[k + 2] = z;
            const nx = hAt(gi - 1, gj) - hAt(gi + 1, gj), nz = hAt(gi, gj - 1) - hAt(gi, gj + 1), ny = 2 * step;
            const nl = Math.hypot(nx, ny, nz);
            nor[k] = nx / nl; nor[k + 1] = ny / nl; nor[k + 2] = nz / nl;
            if (y > 2.5) c.copy(grass).lerp(grassDark, noise2(x * 0.2, z * 0.2));
            else if (y > 1.0) c.copy(sand).lerp(grass, (y - 1.0) / 1.5);
            else if (y > -2) c.copy(sand);
            else if (y > -45) c.copy(wetSand).lerp(deep, clamp((-y - 2) / 36, 0, 1));
            else if (y > -200) c.copy(deep).lerp(rock, clamp((-y - 45) / 80, 0, 1));
            else c.copy(rock).lerp(abyss, clamp((-y - 200) / 150, 0, 1));
            if (y < -2) c.multiplyScalar(0.9 + noise2(x * 0.3, z * 0.3) * 0.2);
            col[k] = c.r; col[k + 1] = c.g; col[k + 2] = c.b;
          }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        geo.setIndex(indexAttr);
        geo.computeBoundingSphere();
        this.scene.add(new THREE.Mesh(geo, mat));
      }
    }

    // Dünyanın kenarının ötesinde derin taban
    const farGeo = new THREE.PlaneGeometry(12000, 12000);
    farGeo.rotateX(-Math.PI / 2);
    const far = new THREE.Mesh(farGeo, new THREE.MeshLambertMaterial({ color: 0x4a5548 }));
    far.position.y = -41;
    this.scene.add(far);
  },

  // Su yüzeyi kamerayla birlikte kayar, dalgalar dünya koordinatına göre hesaplanır
  buildWater() {
    const geo = new THREE.PlaneGeometry(1400, 1400, 140, 140);
    geo.rotateX(-Math.PI / 2);
    this.waterBase = Float32Array.from(geo.attributes.position.array);
    const mat = new THREE.MeshPhongMaterial({
      color: 0x2a8cc4, specular: 0xaad8ff, shininess: 90,
      transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false,
    });
    this.water = new THREE.Mesh(geo, mat);
    this.water.renderOrder = 2;
    this.water.frustumCulled = false;
    this.scene.add(this.water);
  },

  buildTrees() {
    const spots = [];
    for (let tries = 0; tries < 30000 && spots.length < 2400; tries++) {
      const isl = pick(ISLANDS);
      const a = rand(0, Math.PI * 2), d = Math.sqrt(Math.random()) * isl.r;
      const x = isl.x + Math.cos(a) * d, z = isl.z + Math.sin(a) * d;
      const y = terrainHeight(x, z);
      if (y > 2.8) spots.push({ x, y, z, s: rand(0.7, 1.5), kind: Math.random() < 0.5 ? 0 : 1 });
    }
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.5, 4, 6); trunkGeo.translate(0, 2, 0);
    const pineGeo = new THREE.ConeGeometry(2.4, 6, 7); pineGeo.translate(0, 6.5, 0);
    const roundGeo = new THREE.IcosahedronGeometry(2.6, 1); roundGeo.translate(0, 5.5, 0);
    const trunks = new THREE.InstancedMesh(trunkGeo, new THREE.MeshLambertMaterial({ color: 0x6b4a2b }), spots.length);
    const pines = new THREE.InstancedMesh(pineGeo, new THREE.MeshLambertMaterial({ color: 0x2f6e35 }), spots.length);
    const rounds = new THREE.InstancedMesh(roundGeo, new THREE.MeshLambertMaterial({ color: 0x4c9a3d, flatShading: true }), spots.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    const hide = new THREE.Matrix4().makeScale(0, 0, 0);
    spots.forEach((t, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rand(0, 6.28));
      p.set(t.x, t.y - 0.3, t.z); s.set(t.s, t.s, t.s);
      m.compose(p, q, s);
      trunks.setMatrixAt(i, m);
      if (t.kind === 0) { pines.setMatrixAt(i, m); rounds.setMatrixAt(i, hide); }
      else { rounds.setMatrixAt(i, m); pines.setMatrixAt(i, hide); }
    });
    this.scene.add(trunks, pines, rounds);
  },

  buildSeaLife() {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);

    // Yosunlar (dalgalanır)
    const weedGeo = new THREE.ConeGeometry(0.35, 6, 4); weedGeo.translate(0, 3, 0);
    const weedCount = 3000;
    this.seaweed = new THREE.InstancedMesh(weedGeo, new THREE.MeshLambertMaterial({ color: 0x2f8a3f }), weedCount);
    for (let i = 0; i < weedCount; i++) {
      let x, z, y;
      do { x = rand(-WORLD_LIMIT, WORLD_LIMIT); z = rand(-WORLD_LIMIT, WORLD_LIMIT); y = terrainHeight(x, z); } while (y > -6 || y < -60);
      const h = rand(0.6, 2.2);
      this.seaweedData.push({ x, y, z, h, phase: rand(0, 6.28), rot: rand(0, 6.28) });
    }
    this.scene.add(this.seaweed);
    this.updateSeaweed(0);

    // Mercanlar (adaların çevresindeki sığ sularda, rengârenk)
    const coralGeo = new THREE.IcosahedronGeometry(1, 0);
    const coralColors = [0xff6f61, 0xffa94d, 0xf06bd0, 0xffe066, 0x8a6bff, 0x4fd1c5];
    const coralCount = 3000;
    const corals = new THREE.InstancedMesh(coralGeo, new THREE.MeshLambertMaterial({ flatShading: true }), coralCount);
    const col = new THREE.Color();
    for (let i = 0; i < coralCount; i++) {
      let x, z, y, tries = 0;
      do {
        const isl = pick(ISLANDS);
        const a = rand(0, 6.28), d = isl.r * rand(1.0, 1.9);
        x = isl.x + Math.cos(a) * d; z = isl.z + Math.sin(a) * d; y = terrainHeight(x, z);
      } while ((y > -3 || y < -22) && ++tries < 50);
      q.setFromAxisAngle(up, rand(0, 6.28));
      const sc = rand(0.6, 2.0);
      s.set(sc * rand(0.7, 1.3), sc * rand(0.8, 2.0), sc * rand(0.7, 1.3));
      p.set(x, y + sc * 0.5, z);
      m.compose(p, q, s);
      corals.setMatrixAt(i, m);
      corals.setColorAt(i, col.setHex(pick(coralColors)));
    }
    this.scene.add(corals);

    // Kayalar
    const rockGeo = new THREE.DodecahedronGeometry(1, 0);
    const rockCount = 900;
    const rocks = new THREE.InstancedMesh(rockGeo, new THREE.MeshLambertMaterial({ color: 0x6d6d68, flatShading: true }), rockCount);
    for (let i = 0; i < rockCount; i++) {
      let x, z, y;
      do { x = rand(-WORLD_LIMIT, WORLD_LIMIT); z = rand(-WORLD_LIMIT, WORLD_LIMIT); y = terrainHeight(x, z); } while (y > -4);
      q.setFromEuler(new THREE.Euler(rand(0, 3), rand(0, 3), rand(0, 3)));
      const sc = rand(1, 4.5);
      s.set(sc, sc * rand(0.5, 1), sc);
      p.set(x, y, z);
      m.compose(p, q, s);
      rocks.setMatrixAt(i, m);
    }
    this.scene.add(rocks);
  },

  // Çukurun dibinde parlayan tüp solucanları ve sıcak su bacaları
  buildTrenchLife() {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    const T = TRENCH;
    const bottomPos = () => {
      for (;;) {
        const u = rand(0.1, 0.9);
        const x = lerp(T.ax, T.bx, u) + rand(-30, 30), z = lerp(T.az, T.bz, u) + rand(-30, 30);
        const y = terrainHeight(x, z);
        if (y < -250) return { x, y, z };
      }
    };

    const stalkGeo = new THREE.CylinderGeometry(0.15, 0.2, 3, 5); stalkGeo.translate(0, 1.5, 0);
    const tipGeo = new THREE.SphereGeometry(0.4, 6, 4); tipGeo.translate(0, 3.1, 0);
    const wormCount = 900;
    const stalks = new THREE.InstancedMesh(stalkGeo, new THREE.MeshLambertMaterial({ color: 0xe8e0d0 }), wormCount);
    const tips = new THREE.InstancedMesh(tipGeo, new THREE.MeshLambertMaterial({ color: 0xff3030, emissive: 0xff2020, emissiveIntensity: 0.9 }), wormCount);
    let cluster = bottomPos();
    for (let i = 0; i < wormCount; i++) {
      if (i % 30 === 0) cluster = bottomPos();
      const x = cluster.x + rand(-6, 6), z = cluster.z + rand(-6, 6);
      q.setFromEuler(new THREE.Euler(rand(-0.25, 0.25), 0, rand(-0.25, 0.25)));
      const sc = rand(0.6, 1.6);
      s.set(sc, sc * rand(0.8, 1.6), sc);
      p.set(x, terrainHeight(x, z) - 0.2, z);
      m.compose(p, q, s);
      stalks.setMatrixAt(i, m);
      tips.setMatrixAt(i, m);
    }
    this.scene.add(stalks, tips);

    const ventGeo = new THREE.CylinderGeometry(1.2, 3, 9, 7); ventGeo.translate(0, 4.5, 0);
    const ventCount = 40;
    const vents = new THREE.InstancedMesh(ventGeo, new THREE.MeshLambertMaterial({ color: 0x1c1a1a, flatShading: true }), ventCount);
    this.vents = [];
    for (let i = 0; i < ventCount; i++) {
      const b = bottomPos();
      const sc = rand(0.8, 2.2);
      q.identity(); s.set(sc, sc, sc); p.set(b.x, b.y - 0.5, b.z);
      m.compose(p, q, s);
      vents.setMatrixAt(i, m);
      this.vents.push(new THREE.Vector3(b.x, b.y + 9 * sc, b.z));
    }
    this.scene.add(vents);
  },

  updateSeaweed(t) {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    const e = new THREE.Euler();
    this.seaweedData.forEach((w, i) => {
      e.set(Math.sin(t * 1.2 + w.phase) * 0.18, w.rot, Math.cos(t + w.phase) * 0.18);
      q.setFromEuler(e);
      p.set(w.x, w.y, w.z); s.set(1, w.h, 1);
      m.compose(p, q, s);
      this.seaweed.setMatrixAt(i, m);
    });
    this.seaweed.instanceMatrix.needsUpdate = true;
  },

  // Kıyıda hayvanların su içebileceği noktalar
  findShoreSpots() {
    ISLANDS.forEach((isl, idx) => {
      const n = Math.round(isl.r / 5);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + rand(-0.1, 0.1);
        const dx = Math.cos(a), dz = Math.sin(a);
        let d = 0;
        while (d < isl.r * 2.2 && terrainHeight(isl.x + dx * d, isl.z + dz * d) > 0.25) d += 0.5;
        const edge = d - 1.2;
        const inland = d - 22;
        const sx = isl.x + dx * edge, sz = isl.z + dz * edge;
        const ix = isl.x + dx * inland, iz = isl.z + dz * inland;
        if (inland < 4) continue;
        if (terrainHeight(ix, iz) < 1.5) continue;
        if (terrainHeight(isl.x + dx * (d + 10), isl.z + dz * (d + 10)) > -1.5) continue;
        this.shoreSpots.push({
          island: idx,
          drink: new THREE.Vector3(sx, terrainHeight(sx, sz), sz),
          inland: new THREE.Vector3(ix, terrainHeight(ix, iz), iz),
          facing: Math.atan2(dx, dz),
          busy: false,
        });
      }
    });
  },

  update(t, camera, dt) {
    // Dalgalar
    const wx = Math.round(camera.position.x / 10) * 10, wz = Math.round(camera.position.z / 10) * 10;
    this.water.position.set(wx, 0, wz);
    const pos = this.water.geometry.attributes.position;
    const arr = pos.array, base = this.waterBase;
    for (let i = 0; i < arr.length; i += 3) {
      const x = base[i] + wx, z = base[i + 2] + wz;
      arr[i + 1] = Math.sin(x * 0.05 + t * 1.1) * 0.35 + Math.sin(z * 0.07 + t * 1.4) * 0.25;
    }
    pos.needsUpdate = true;
    this.water.geometry.computeVertexNormals();

    this.updateSeaweed(t);

    // Sıcak su bacalarından kabarcık
    if (dt && Player.pos.y < -200) {
      for (const v of this.vents) {
        if (v.distanceToSquared(Player.pos) < 150 * 150 && Math.random() < dt * 6) Effects.bubbles(v, 2);
      }
    }

    // Suyun altı / üstü atmosferi; derine indikçe karanlık
    const under = camera.position.y < WATER_Y;
    if (under !== this.underwater) {
      this.underwater = under;
      if (under) {
        this.scene.background = new THREE.Color(0x0b4a6e);
        this.scene.fog = new THREE.Fog(0x0b4a6e, 2, 140);
      } else {
        this.scene.background = new THREE.Color(0x8fd0f2);
        this.scene.fog = new THREE.Fog(0xa8dcf4, 80, 600);
      }
    }
    const dark = under ? clamp((-camera.position.y - 30) / 220, 0, 1) : 0;
    if (under) {
      this.scene.background.setHex(0x0b4a6e).lerp(new THREE.Color(0x030c1e), dark);
      this.scene.fog.color.copy(this.scene.background);
      this.scene.fog.far = lerp(140, 110, dark);
    }
    this.hemi.intensity = 1.4 * (1 - 0.8 * dark);
    this.sun.intensity = 2.6 * (1 - 0.95 * dark);
    this.playerLight.intensity = dark * 1.6;
    this.playerLight.position.copy(Player.pos).y += 6 * Player.scale;
  },
};
