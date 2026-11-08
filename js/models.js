// Basit şekillerden yapılmış canlı modelleri. Hepsi +Z yönüne bakar.
const _matCache = {};
function mat(color) {
  if (!_matCache[color]) _matCache[color] = new THREE.MeshLambertMaterial({ color });
  return _matCache[color];
}

function ellipsoid(rx, ry, rz, color, seg) {
  seg = seg || 18;
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, seg, Math.floor(seg * 0.7)), mat(color));
  m.scale.set(rx, ry, rz);
  return m;
}

function box(w, h, d, color) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
}

// Yukarı bakan, ucu geriye kıvrık üçgen yüzgeç (YZ düzleminde)
function finGeo(length, height, thick) {
  const s = new THREE.Shape();
  s.moveTo(length * 0.5, 0);
  s.lineTo(-length * 0.5, 0);
  s.lineTo(-length * 0.75, height);
  s.lineTo(length * 0.1, height * 0.25);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false });
  g.translate(0, 0, -thick / 2);
  g.rotateY(-Math.PI / 2);
  return g;
}

function addTeeth(parent, count, y, zCenter, radiusX, radiusZ, down) {
  const geo = new THREE.ConeGeometry(0.09, 0.32, 4);
  for (let i = 0; i < count; i++) {
    const a = -1.2 + (2.4 * i) / (count - 1);
    const t = new THREE.Mesh(geo, mat(0xffffff));
    t.position.set(Math.sin(a) * radiusX, y, zCenter + Math.cos(a) * radiusZ);
    if (down) t.rotation.x = Math.PI;
    parent.add(t);
  }
}

// Köpekbalığı benzeri gövde: megalodon, büyük beyaz, çekiç başlı, orka
function buildShark(o) {
  o = Object.assign({ top: 0x5f6f7a, belly: 0xe2e2d6, dorsalH: 2.2, hammer: false, orca: false }, o);
  const g = new THREE.Group();
  g.add(ellipsoid(1.2, 1.15, 4.2, o.top));
  const belly = ellipsoid(1.08, 0.85, 3.95, o.belly);
  belly.position.set(0, -0.38, 0.05);
  g.add(belly);

  const dorsal = new THREE.Mesh(finGeo(2.4, o.dorsalH, 0.25), mat(o.top));
  dorsal.position.set(0, 0.95, 0.3);
  g.add(dorsal);

  const fins = [];
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(finGeo(1.8, 2.0, 0.18), mat(o.top));
    p.rotation.z = -s * (Math.PI / 2 + 0.4);
    p.position.set(s * 0.9, -0.5, 1.0);
    p.userData.s = s;
    fins.push(p);
    g.add(p);
  }

  const tail = new THREE.Group();
  tail.position.z = -3.6;
  const stalk = ellipsoid(0.5, 0.6, 1.5, o.top);
  stalk.position.z = -0.8;
  tail.add(stalk);
  const upper = new THREE.Mesh(finGeo(1.6, 2.8, 0.2), mat(o.top));
  upper.position.z = -1.7;
  const lower = new THREE.Mesh(finGeo(1.4, 2.0, 0.2), mat(o.top));
  lower.rotation.z = Math.PI;
  lower.position.z = -1.7;
  if (o.orca) { upper.rotation.z = Math.PI / 2; lower.rotation.z = -Math.PI / 2; lower.scale.y = 1.4; }
  tail.add(upper, lower);
  g.add(tail);

  // Gözler
  const eyeGeo = new THREE.SphereGeometry(0.16, 8, 6);
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(eyeGeo, mat(0x111111));
    if (o.hammer) e.position.set(s * 1.6, 0.15, 3.9);
    else e.position.set(s * 0.78, 0.35, 3.1);
    g.add(e);
    if (o.orca) {
      const patch = ellipsoid(0.15, 0.35, 0.7, 0xffffff, 10);
      patch.position.set(s * 0.95, 0.45, 2.4);
      g.add(patch);
    }
  }
  if (o.hammer) {
    const head = box(3.4, 0.35, 0.9, o.top);
    head.position.set(0, 0.1, 3.9);
    g.add(head);
  }

  // Ağız ve çene
  const mouth = ellipsoid(0.75, 0.3, 1.1, 0x5a1010, 12);
  mouth.position.set(0, -0.55, 3.0);
  g.add(mouth);
  addTeeth(g, 9, -0.6, 2.9, 0.75, 1.0, true);
  const jaw = new THREE.Group();
  jaw.position.set(0, -0.55, 2.2);
  const jawMesh = ellipsoid(0.85, 0.3, 1.5, o.belly, 12);
  jawMesh.position.set(0, -0.1, 0.8);
  jaw.add(jawMesh);
  addTeeth(jaw, 9, 0.15, 0.7, 0.7, 1.0, false);
  g.add(jaw);

  return { group: g, tail, jaw, fins, tailAxis: o.orca ? 'x' : 'y' };
}

// Kendi ışığını saçan malzeme (derin deniz canlıları için)
function glowMat(color, intensity) {
  const key = 'glow' + color + '_' + (intensity || 1);
  if (!_matCache[key]) _matCache[key] = new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: intensity || 1 });
  return _matCache[key];
}

function buildSquid(o) {
  o = Object.assign({ color: 0xc0504a, head: 0xb04844, arm: 0xd06058, eye: 0xfff2a0, glowEyes: false }, o);
  const g = new THREE.Group();
  const color = o.color;
  const mantleGeo = new THREE.ConeGeometry(1.4, 5.5, 12);
  mantleGeo.rotateX(-Math.PI / 2);
  const mantle = new THREE.Mesh(mantleGeo, mat(color));
  mantle.position.z = 0;
  g.add(mantle);
  const head = ellipsoid(1.2, 1.1, 1.3, o.head);
  head.position.z = 3.0;
  g.add(head);
  for (const s of [-1, 1]) {
    const eye = ellipsoid(0.4, 0.4, 0.4, o.eye, 10);
    if (o.glowEyes) eye.material = glowMat(o.eye, 1.2);
    eye.position.set(s * 1.0, 0.3, 3.1);
    const pupil = ellipsoid(0.2, 0.22, 0.2, 0x111111, 8);
    pupil.position.set(s * 1.3, 0.3, 3.15);
    g.add(eye, pupil);
    const fin = ellipsoid(1.2, 0.1, 0.8, color, 10);
    fin.position.set(s * 0.9, 0, -2.2);
    g.add(fin);
  }
  const tentacles = [];
  const tGeo = new THREE.CylinderGeometry(0.12, 0.25, 6, 6);
  tGeo.rotateX(Math.PI / 2);
  tGeo.translate(0, 0, 3);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const t = new THREE.Group();
    t.position.set(Math.cos(a) * 0.7, Math.sin(a) * 0.7, 3.8);
    const m = new THREE.Mesh(tGeo, mat(o.arm));
    t.add(m);
    t.userData.a = a;
    tentacles.push(t);
    g.add(t);
  }
  return { group: g, tentacles };
}

function buildMosasaurus() {
  const g = new THREE.Group();
  const top = 0x4d6650, belly = 0xcfc8a0;
  g.add(ellipsoid(1.3, 1.2, 5.0, top));
  const b = ellipsoid(1.15, 0.9, 4.7, belly);
  b.position.y = -0.4;
  g.add(b);
  const neck = ellipsoid(0.9, 0.85, 1.8, top);
  neck.position.z = 4.8;
  g.add(neck);
  const head = ellipsoid(0.8, 0.6, 2.2, top);
  head.position.set(0, 0.1, 7.0);
  g.add(head);
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), mat(0xffcc00));
    e.position.set(s * 0.6, 0.45, 6.6);
    g.add(e);
  }
  addTeeth(g, 11, -0.3, 7.1, 0.6, 1.9, true);
  const jaw = new THREE.Group();
  jaw.position.set(0, -0.3, 5.6);
  const jm = ellipsoid(0.65, 0.25, 2.0, belly, 12);
  jm.position.set(0, -0.1, 1.5);
  jaw.add(jm);
  addTeeth(jaw, 11, 0.12, 1.5, 0.55, 1.8, false);
  g.add(jaw);
  const flipGeo = new THREE.BoxGeometry(2.6, 0.15, 1.0);
  flipGeo.translate(1.3, 0, 0);
  const flippers = [];
  for (const [s, z] of [[1, 2.6], [-1, 2.6], [1, -2.4], [-1, -2.4]]) {
    const f = new THREE.Mesh(flipGeo, mat(top));
    f.position.set(s * 1.0, -0.6, z);
    f.rotation.y = s > 0 ? -0.5 : Math.PI + 0.5;
    f.userData.s = s;
    flippers.push(f);
    g.add(f);
  }
  const tail = new THREE.Group();
  tail.position.z = -4.6;
  const tGeo = new THREE.ConeGeometry(0.9, 6, 10);
  tGeo.rotateX(-Math.PI / 2);
  tGeo.translate(0, 0, -3);
  tail.add(new THREE.Mesh(tGeo, mat(top)));
  const fluke = new THREE.Mesh(finGeo(2.0, 2.2, 0.2), mat(top));
  fluke.rotation.z = Math.PI;
  fluke.position.z = -5.5;
  tail.add(fluke);
  g.add(tail);
  return { group: g, tail, jaw, flippers, tailAxis: 'y' };
}

function buildTurtle() {
  const g = new THREE.Group();
  const shell = ellipsoid(1.6, 0.6, 2.0, 0x6b7a3a);
  shell.position.y = 0.2;
  g.add(shell);
  g.add(ellipsoid(1.4, 0.35, 1.8, 0xc8b878));
  const head = ellipsoid(0.45, 0.4, 0.6, 0x8a9a5a);
  head.position.set(0, 0.1, 2.2);
  g.add(head);
  const flipGeo = new THREE.BoxGeometry(1.8, 0.12, 0.7);
  flipGeo.translate(0.9, 0, 0);
  const flippers = [];
  for (const [s, z] of [[1, 1.0], [-1, 1.0], [1, -1.3], [-1, -1.3]]) {
    const f = new THREE.Mesh(flipGeo, mat(0x8a9a5a));
    f.position.set(s * 1.2, 0, z);
    f.rotation.y = s > 0 ? -0.3 : Math.PI + 0.3;
    f.userData.s = s;
    flippers.push(f);
    g.add(f);
  }
  return { group: g, flippers };
}

// Ton balığı, barakuda gibi uzun balıklar
function buildBigFish(o) {
  o = Object.assign({ top: 0x2d4e7a, belly: 0xc8d4e0, w: 0.5, h: 0.75, l: 1.8, jaw: false }, o);
  const g = new THREE.Group();
  g.add(ellipsoid(o.w, o.h, o.l, o.top));
  const b = ellipsoid(o.w * 0.9, o.h * 0.6, o.l * 0.95, o.belly);
  b.position.y = -o.h * 0.3;
  g.add(b);
  const d = new THREE.Mesh(finGeo(o.l * 0.6, o.h * 1.0, 0.08), mat(o.top));
  d.position.y = o.h * 0.8;
  g.add(d);
  const tail = new THREE.Group();
  tail.position.z = -o.l * 0.9;
  const up = new THREE.Mesh(finGeo(o.l * 0.4, o.h * 1.3, 0.08), mat(o.top));
  up.position.z = -o.l * 0.25;
  const dn = up.clone();
  dn.rotation.z = Math.PI;
  tail.add(up, dn);
  g.add(tail);
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(o.h * 0.15, 6, 5), mat(0x111111));
    e.position.set(s * o.w * 0.7, o.h * 0.2, o.l * 0.7);
    g.add(e);
  }
  let jaw = null;
  if (o.jaw) {
    jaw = new THREE.Group();
    jaw.position.set(0, -o.h * 0.3, o.l * 0.5);
    const jm = ellipsoid(o.w * 0.7, o.h * 0.25, o.l * 0.5, o.belly, 10);
    jm.position.z = o.l * 0.35;
    jaw.add(jm);
    g.add(jaw);
  }
  return { group: g, tail, jaw, tailAxis: 'y' };
}

// Kaşalot: kutu gibi kocaman kafa, ince alt çene, yatay kuyruk
function buildWhale() {
  const g = new THREE.Group();
  const top = 0x4a4f58, belly = 0x8a8f96;
  const body = ellipsoid(1.7, 1.7, 4.6, top);
  body.position.z = -1.0;
  g.add(body);
  const head = ellipsoid(1.75, 1.85, 2.9, top);
  head.position.set(0, 0.25, 3.0);
  g.add(head);
  const nose = box(2.6, 2.8, 1.6, top);
  nose.position.set(0, 0.3, 5.0);
  g.add(nose);
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), mat(0x111111));
    e.position.set(s * 1.55, -0.2, 2.6);
    g.add(e);
    const p = new THREE.Mesh(finGeo(1.4, 1.6, 0.18), mat(top));
    p.rotation.z = -s * (Math.PI / 2 + 0.5);
    p.position.set(s * 1.4, -0.9, 1.6);
    g.add(p);
  }
  const hump = ellipsoid(0.5, 0.5, 1.0, top, 10);
  hump.position.set(0, 1.55, -2.5);
  g.add(hump);
  const jaw = new THREE.Group();
  jaw.position.set(0, -1.35, 1.6);
  const jm = ellipsoid(0.45, 0.25, 2.2, belly, 10);
  jm.position.z = 1.8;
  jaw.add(jm);
  addTeeth(jaw, 9, 0.2, 1.9, 0.35, 2.0, false);
  g.add(jaw);
  const tail = new THREE.Group();
  tail.position.z = -5.2;
  const stalk = ellipsoid(0.8, 0.8, 2.0, top);
  stalk.position.z = -1.2;
  tail.add(stalk);
  for (const s of [-1, 1]) {
    const f = new THREE.Mesh(finGeo(1.6, 2.6, 0.22), mat(top));
    f.rotation.z = -s * Math.PI / 2;
    f.position.z = -2.6;
    tail.add(f);
  }
  g.add(tail);
  return { group: g, tail, jaw, tailAxis: 'x' };
}

// Deniz tabanında yaşayan dev ahtapot
function buildOctopus() {
  const g = new THREE.Group();
  const color = 0xd0703a;
  const mantle = ellipsoid(1.4, 1.7, 1.6, color);
  mantle.position.set(0, 1.6, -0.6);
  mantle.rotation.x = -0.4;
  g.add(mantle);
  const head = ellipsoid(1.1, 0.9, 1.0, 0xc2622f);
  head.position.set(0, 0.6, 0.3);
  g.add(head);
  for (const s of [-1, 1]) {
    const eye = ellipsoid(0.32, 0.32, 0.32, 0xfff2a0, 10);
    eye.position.set(s * 0.75, 1.0, 0.9);
    const pupil = box(0.08, 0.3, 0.12, 0x111111);
    pupil.position.set(s * 0.82, 1.0, 1.18);
    g.add(eye, pupil);
  }
  const armGeo = new THREE.CylinderGeometry(0.08, 0.32, 4.5, 6);
  armGeo.rotateX(Math.PI / 2);
  armGeo.translate(0, 0, 2.25);
  const arms = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const arm = new THREE.Group();
    arm.position.set(0, 0.2, 0.2);
    arm.rotation.order = 'YXZ';
    arm.rotation.y = a;
    arm.add(new THREE.Mesh(armGeo, mat(0xe08048)));
    arm.userData.i = i;
    arms.push(arm);
    g.add(arm);
  }
  return { group: g, arms };
}

// Yarı saydam, parlayan denizanası
function buildJelly(deep) {
  const g = new THREE.Group();
  const color = deep ? pick([0xff3050, 0x30a0ff, 0x60ffb0]) : pick([0xff7ad9, 0x9d7aff, 0x7ad9ff]);
  const domeMat = new THREE.MeshLambertMaterial({
    color, emissive: color, emissiveIntensity: deep ? 1.4 : 0.45, transparent: true, opacity: 0.6, side: THREE.DoubleSide,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.4, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
  g.add(dome);
  const tMat = new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.3, transparent: true, opacity: 0.5 });
  const tentacles = [];
  const tGeo = new THREE.CylinderGeometry(0.04, 0.07, 4, 4);
  tGeo.translate(0, -2, 0);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const t = new THREE.Mesh(tGeo, tMat);
    t.position.set(Math.cos(a) * 0.9, 0, Math.sin(a) * 0.9);
    t.userData.a = a;
    tentacles.push(t);
    g.add(t);
  }
  return { group: g, dome, jellyTentacles: tentacles };
}

// ---- Mariana Çukuru canlıları ----

// Fener balığı: kocaman ağız, başının üstünde parlayan yem
function buildAnglerfish() {
  const g = new THREE.Group();
  const skin = 0x2b2a33;
  g.add(ellipsoid(1.5, 1.4, 1.7, skin));
  const jaw = new THREE.Group();
  jaw.position.set(0, -0.5, 0.6);
  const jm = ellipsoid(1.3, 0.5, 1.2, 0x3a3842, 12);
  jm.position.z = 0.7;
  jaw.add(jm);
  const fangGeo = new THREE.ConeGeometry(0.08, 0.7, 4);
  for (let i = 0; i < 9; i++) {
    const a = -1.1 + (2.2 * i) / 8;
    const t = new THREE.Mesh(fangGeo, mat(0xf4f0e0));
    t.position.set(Math.sin(a) * 1.1, 0.45, 0.8 + Math.cos(a) * 1.0);
    jaw.add(t);
    const u = new THREE.Mesh(fangGeo, mat(0xf4f0e0));
    u.position.set(Math.sin(a) * 1.15, -0.3, 0.9 + Math.cos(a) * 1.05);
    u.rotation.x = Math.PI;
    g.add(u);
  }
  g.add(jaw);
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), glowMat(0xc8ffd0, 0.6));
    e.position.set(s * 0.75, 0.75, 1.2);
    g.add(e);
    const f = new THREE.Mesh(finGeo(0.8, 0.9, 0.08), mat(skin));
    f.rotation.z = -s * (Math.PI / 2 + 0.3);
    f.position.set(s * 1.3, -0.2, -0.3);
    g.add(f);
  }
  // Yem: kıvrık sap + parlayan top
  const lure = new THREE.Group();
  lure.position.set(0, 1.3, 0.6);
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.2, 5), mat(skin));
  stalk.position.set(0, 0.9, 0.5);
  stalk.rotation.x = 0.6;
  lure.add(stalk);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), glowMat(0x9fffe0, 2.5));
  bulb.position.set(0, 1.8, 1.25);
  lure.add(bulb);
  g.add(lure);
  const tail = new THREE.Group();
  tail.position.z = -1.6;
  const tf = new THREE.Mesh(finGeo(1.0, 1.3, 0.1), mat(skin));
  tf.position.z = -0.4;
  const tf2 = tf.clone();
  tf2.rotation.z = Math.PI;
  tail.add(tf, tf2);
  g.add(tail);
  return { group: g, tail, jaw, lure, tailAxis: 'y' };
}

// Engerek balığı: ince uzun gövde, dışarı taşan dişler, karnında ışık noktaları
function buildViperfish() {
  const fish = buildBigFish({ top: 0x1d2a3a, belly: 0x2c3e55, w: 0.4, h: 0.6, l: 2.4, jaw: true });
  const g = fish.group;
  const fangGeo = new THREE.ConeGeometry(0.06, 0.9, 4);
  for (const s of [-1, 1]) {
    const f = new THREE.Mesh(fangGeo, mat(0xf0f0ff));
    f.position.set(s * 0.18, 0.1, 2.3);
    f.rotation.x = -0.4;
    g.add(f);
    const f2 = new THREE.Mesh(fangGeo, mat(0xf0f0ff));
    f2.position.set(s * 0.15, -0.5, 2.2);
    f2.rotation.x = Math.PI + 0.4;
    g.add(f2);
  }
  const dotGeo = new THREE.SphereGeometry(0.07, 5, 4);
  for (let i = 0; i < 10; i++) {
    for (const s of [-1, 1]) {
      const d = new THREE.Mesh(dotGeo, glowMat(0x5fd0ff, 2));
      d.position.set(s * 0.25, -0.45, 1.8 - i * 0.38);
      g.add(d);
    }
  }
  return fish;
}

// Goblin köpekbalığı: pembe, uzun yassı burun, fırlayan çene
function buildGoblinShark() {
  const shark = buildShark({ top: 0xd9a0a6, belly: 0xf0cccc, dorsalH: 1.4 });
  const snout = ellipsoid(0.45, 0.22, 2.0, 0xe2b0b5, 12);
  snout.position.set(0, 0.45, 4.6);
  shark.group.add(snout);
  shark.jaw.position.z += 0.6;
  return shark;
}

// Dev izopod: zırhlı, bölümlü deniz böceği
function buildIsopod() {
  const g = new THREE.Group();
  const shell = 0xb8b0c8;
  for (let i = 0; i < 7; i++) {
    const seg = ellipsoid(1.3 - Math.abs(i - 3) * 0.12, 0.55, 0.45, i % 2 ? shell : 0xa8a0b8, 12);
    seg.position.set(0, 0.6, 1.8 - i * 0.6);
    g.add(seg);
  }
  const head = ellipsoid(0.8, 0.45, 0.5, 0x9890a8, 10);
  head.position.set(0, 0.5, 2.4);
  g.add(head);
  for (const s of [-1, 1]) {
    const eye = ellipsoid(0.2, 0.15, 0.2, 0x222222, 8);
    eye.position.set(s * 0.55, 0.65, 2.55);
    g.add(eye);
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 2.2, 4), mat(0xa8a0b8));
    ant.position.set(s * 0.6, 0.5, 3.4);
    ant.rotation.set(Math.PI / 2 - 0.2, 0, -s * 0.5);
    g.add(ant);
  }
  const legs = [];
  const legGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.9, 4);
  legGeo.translate(0, -0.45, 0);
  for (let i = 0; i < 7; i++) {
    for (const s of [-1, 1]) {
      const l = new THREE.Mesh(legGeo, mat(0x9890a8));
      l.position.set(s * 0.9, 0.4, 1.8 - i * 0.6);
      l.rotation.z = s * 0.6;
      l.userData.i = i;
      legs.push(l);
      g.add(l);
    }
  }
  return { group: g, legs };
}

// Dumbo ahtapotu: kulak gibi yüzgeçlerini çırparak yüzer
function buildDumbo() {
  const g = new THREE.Group();
  const pink = 0xffb0a0;
  const body = ellipsoid(1.1, 1.3, 1.1, pink);
  body.position.y = 0.6;
  g.add(body);
  const ears = [];
  for (const s of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(s * 0.9, 1.3, 0);
    const em = ellipsoid(0.7, 0.12, 0.5, 0xff9a8a, 10);
    em.position.x = s * 0.6;
    ear.add(em);
    ear.userData.s = s;
    ears.push(ear);
    g.add(ear);
    const eye = ellipsoid(0.18, 0.2, 0.15, 0x222222, 8);
    eye.position.set(s * 0.45, 0.8, 0.95);
    g.add(eye);
  }
  const skirt = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.2, 10, 1, true), new THREE.MeshLambertMaterial({ color: 0xff9a8a, side: THREE.DoubleSide }));
  skirt.position.y = -0.4;
  g.add(skirt);
  return { group: g, ears, skirt };
}

// Balık sürüsü için tek parça küçük balık geometrisi
function smallFishGeometry() {
  const body = new THREE.SphereGeometry(1, 8, 6);
  body.scale(0.22, 0.38, 0.75);
  const tail = new THREE.ConeGeometry(0.3, 0.5, 4);
  tail.rotateX(Math.PI / 2);
  tail.scale(0.3, 1, 1);
  tail.translate(0, 0, -0.85);
  const parts = [body.toNonIndexed(), tail.toNonIndexed()];
  const posArr = [], normArr = [];
  for (const p of parts) {
    posArr.push(...p.attributes.position.array);
    normArr.push(...p.attributes.normal.array);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(normArr, 3));
  return g;
}

function stripeTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#f2f2f2';
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#151515';
  for (let i = 0; i < 64; i += 12) g.fillRect(i, 0, 6, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Kara hayvanları: geyik, zebra, bizon, yaban domuzu
function buildLandAnimal(kind) {
  const spec = {
    geyik: { color: 0xa0683a, body: [1.1, 1.1, 2.2], leg: 1.7, neck: 1.2, head: [0.55, 0.6, 1.0] },
    zebra: { color: 0xf0f0f0, body: [1.3, 1.25, 2.5], leg: 1.6, neck: 1.2, head: [0.6, 0.65, 1.2], stripes: true },
    bizon: { color: 0x4a3222, body: [2.0, 1.9, 3.2], leg: 1.2, neck: 0.6, head: [1.0, 1.0, 1.1] },
    domuz: { color: 0x5a4a3a, body: [1.0, 0.95, 1.9], leg: 0.7, neck: 0.3, head: [0.7, 0.7, 0.9] },
  }[kind];
  const g = new THREE.Group();
  const bodyMat = spec.stripes ? new THREE.MeshLambertMaterial({ map: stripeTexture() }) : mat(spec.color);
  const body = new THREE.Mesh(new THREE.BoxGeometry(...spec.body), bodyMat);
  body.position.y = spec.leg + spec.body[1] / 2;
  g.add(body);
  if (kind === 'bizon') {
    const hump = box(1.7, 1.0, 1.4, 0x3a2618);
    hump.position.set(0, spec.leg + spec.body[1] + 0.2, 0.7);
    g.add(hump);
  }
  const legs = [];
  const legGeo = new THREE.BoxGeometry(0.3, spec.leg, 0.3);
  legGeo.translate(0, -spec.leg / 2, 0);
  const lx = spec.body[0] / 2 - 0.2, lz = spec.body[2] / 2 - 0.3;
  for (const [x, z] of [[lx, lz], [-lx, lz], [lx, -lz], [-lx, -lz]]) {
    const l = new THREE.Mesh(legGeo, spec.stripes ? bodyMat : mat(spec.color));
    l.position.set(x, spec.leg, z);
    legs.push(l);
    g.add(l);
  }
  // Baş grubu omuzdan döner (su içerken eğilir)
  const head = new THREE.Group();
  head.position.set(0, spec.leg + spec.body[1] * 0.8, spec.body[2] / 2);
  const neck = box(0.45, 0.45, spec.neck + 0.3, spec.stripes ? 0xe8e8e8 : spec.color);
  neck.position.set(0, spec.neck * 0.4, spec.neck * 0.4);
  neck.rotation.x = -0.7;
  head.add(neck);
  const skull = box(...spec.head, spec.stripes ? 0xe8e8e8 : spec.color);
  skull.position.set(0, spec.neck * 0.8, spec.neck * 0.8 + 0.3);
  head.add(skull);
  const snout = box(spec.head[0] * 0.7, spec.head[1] * 0.6, 0.4, kind === 'domuz' ? 0xd09a8a : 0x2a2a2a);
  snout.position.set(0, spec.neck * 0.8 - 0.1, spec.neck * 0.8 + 0.3 + spec.head[2] / 2 + 0.15);
  head.add(snout);
  for (const s of [-1, 1]) {
    const e = box(0.1, 0.12, 0.12, 0x111111);
    e.position.set(s * spec.head[0] / 2, spec.neck * 0.8 + 0.15, spec.neck * 0.8 + 0.5);
    head.add(e);
    if (kind === 'geyik') {
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 1.2, 4), mat(0xe0d0b0));
      ant.position.set(s * 0.3, spec.neck * 0.8 + 0.85, spec.neck * 0.8 + 0.1);
      ant.rotation.z = -s * 0.4;
      head.add(ant);
      const tine = ant.clone();
      tine.scale.set(1, 0.5, 1);
      tine.position.set(s * 0.55, spec.neck * 0.8 + 1.2, spec.neck * 0.8 + 0.1);
      tine.rotation.z = -s * 1.0;
      head.add(tine);
    }
    if (kind === 'bizon') {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 5), mat(0xe8e0c8));
      horn.position.set(s * 0.6, spec.neck * 0.8 + 0.5, spec.neck * 0.8 + 0.2);
      horn.rotation.z = -s * 0.8;
      head.add(horn);
    }
    if (kind === 'domuz') {
      const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.35, 4), mat(0xffffff));
      tusk.position.set(s * 0.25, spec.neck * 0.8 - 0.1, spec.neck * 0.8 + 0.3 + spec.head[2] / 2 + 0.1);
      head.add(tusk);
    }
  }
  g.add(head);
  return { group: g, legs, head, height: spec.leg + spec.body[1] };
}
