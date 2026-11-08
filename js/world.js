// Okyanus, adalar, deniz tabanı ve bitkiler
const WORLD_HALF = 400;      // dünyanın yarı genişliği
const WORLD_LIMIT = 370;     // oyuncu bu yarıçapın dışına çıkamaz
const WATER_Y = 0;

const ISLANDS = [
  { x: 110, z: -70, r: 60 },
  { x: -150, z: 110, r: 72 },
  { x: 70, z: 230, r: 42 },
  { x: -210, z: -200, r: 52 },
  { x: 260, z: 120, r: 38 },
];

function terrainHeight(x, z) {
  let h = -38 + fbm(x * 0.008, z * 0.008) * 20 + fbm(x * 0.04 + 33, z * 0.04) * 4;
  for (const isl of ISLANDS) {
    const dx = x - isl.x, dz = z - isl.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d > isl.r * 2.4) continue;
    const t = d / isl.r;
    let hi = 10 - t * t * 10;
    hi += (fbm(x * 0.05, z * 0.05) - 0.5) * 8 * clamp(1 - t, 0, 1);
    h = smax(h, hi, 8);
  }
  return h;
}

// Arazinin eğimi: aşağı doğru yön (karaya vuran megalodonu suya kaydırmak için)
function terrainDownhill(x, z, out) {
  const e = 1;
  const gx = terrainHeight(x + e, z) - terrainHeight(x - e, z);
  const gz = terrainHeight(x, z + e) - terrainHeight(x, z - e);
  out.set(-gx, 0, -gz);
  if (out.lengthSq() < 1e-6) out.set(x, 0, z).negate();
  return out.normalize();
}

// En az minDepth derinlikte rastgele bir su noktası. center verilirse ona minDist..maxDist uzaklıkta.
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
    return new THREE.Vector3(x, rand(ground + 3, WATER_Y - 2), z);
  }
  return new THREE.Vector3(0, -10, 0);
}

const World = {
  scene: null,
  water: null,
  waterBase: null,
  seaweed: null,
  seaweedData: [],
  shoreSpots: [],
  underwater: null,

  init(scene) {
    this.scene = scene;
    this.buildLights();
    this.buildTerrain();
    this.buildWater();
    this.buildTrees();
    this.buildSeaLife();
    this.findShoreSpots();
  },

  buildLights() {
    const hemi = new THREE.HemisphereLight(0xcfeeff, 0x335544, 1.4);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff2d8, 2.6);
    sun.position.set(120, 200, 80);
    this.scene.add(sun);
  },

  buildTerrain() {
    const seg = 220;
    const geo = new THREE.PlaneGeometry(WORLD_HALF * 2, WORLD_HALF * 2, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    const grass = new THREE.Color(0x4f9a3a), grassDark = new THREE.Color(0x3b7a2c);
    const sand = new THREE.Color(0xe8d49a), wetSand = new THREE.Color(0xc9b47a);
    const deep = new THREE.Color(0x5e6a5a);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const y = terrainHeight(x, z);
      pos.setY(i, y);
      if (y > 2.5) {
        c.copy(grass).lerp(grassDark, noise2(x * 0.2, z * 0.2));
      } else if (y > 1.0) {
        c.copy(sand).lerp(grass, (y - 1.0) / 1.5);
      } else if (y > -2) {
        c.copy(sand);
      } else {
        c.copy(wetSand).lerp(deep, clamp((-y - 2) / 36, 0, 1));
        c.multiplyScalar(0.9 + noise2(x * 0.3, z * 0.3) * 0.2);
      }
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
    this.scene.add(mesh);

    // Dünyanın kenarının ötesinde derin taban
    const farGeo = new THREE.PlaneGeometry(6000, 6000);
    farGeo.rotateX(-Math.PI / 2);
    const far = new THREE.Mesh(farGeo, new THREE.MeshLambertMaterial({ color: 0x4a5548 }));
    far.position.y = -41;
    this.scene.add(far);
  },

  buildWater() {
    const geo = new THREE.PlaneGeometry(1600, 1600, 160, 160);
    geo.rotateX(-Math.PI / 2);
    this.waterBase = Float32Array.from(geo.attributes.position.array);
    const mat = new THREE.MeshPhongMaterial({
      color: 0x2a8cc4, specular: 0xaad8ff, shininess: 90,
      transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false,
    });
    this.water = new THREE.Mesh(geo, mat);
    this.water.renderOrder = 2;
    this.scene.add(this.water);
  },

  buildTrees() {
    const spots = [];
    for (let tries = 0; tries < 3000 && spots.length < 260; tries++) {
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
    const weedCount = 700;
    this.seaweed = new THREE.InstancedMesh(weedGeo, new THREE.MeshLambertMaterial({ color: 0x2f8a3f }), weedCount);
    for (let i = 0; i < weedCount; i++) {
      let x, z, y;
      do { x = rand(-WORLD_LIMIT, WORLD_LIMIT); z = rand(-WORLD_LIMIT, WORLD_LIMIT); y = terrainHeight(x, z); } while (y > -6);
      const h = rand(0.6, 2.2);
      this.seaweedData.push({ x, y, z, h, phase: rand(0, 6.28), rot: rand(0, 6.28) });
    }
    this.scene.add(this.seaweed);
    this.updateSeaweed(0);

    // Mercanlar (sığ sularda, rengârenk)
    const coralGeo = new THREE.IcosahedronGeometry(1, 0);
    const coralColors = [0xff6f61, 0xffa94d, 0xf06bd0, 0xffe066, 0x8a6bff, 0x4fd1c5];
    const coralCount = 450;
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
    const rockCount = 220;
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
      const n = 14;
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

  update(t, camera) {
    // Dalgalar
    const pos = this.water.geometry.attributes.position;
    const arr = pos.array, base = this.waterBase;
    for (let i = 0; i < arr.length; i += 3) {
      const x = base[i], z = base[i + 2];
      arr[i + 1] = Math.sin(x * 0.05 + t * 1.1) * 0.35 + Math.sin(z * 0.07 + t * 1.4) * 0.25;
    }
    pos.needsUpdate = true;
    this.water.geometry.computeVertexNormals();

    this.updateSeaweed(t);

    // Suyun altı / üstü atmosferi
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
  },
};
