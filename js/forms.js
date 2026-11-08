// Megalodonun dönüşebildiği formlar (1-4 tuşları)

// Robot megalodon: metal gövde, parlayan kırmızı gözler, sırtında roket
function buildRobotShark() {
  const shark = buildShark({ top: 0x8a96a3, belly: 0xc4ccd4, dorsalH: 2.4 });
  const g = shark.group;
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), glowMat(0xff2020, 2));
    eye.position.set(s * 0.85, 0.4, 3.1);
    g.add(eye);
    // Yan paneller ve perçinler
    for (let i = 0; i < 4; i++) {
      const seam = box(0.06, 1.3, 0.08, 0x3a4048);
      seam.position.set(s * 1.13, 0.1, 1.8 - i * 1.3);
      g.add(seam);
      const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), mat(0x2a2e33));
      bolt.position.set(s * 1.15, 0.65, 1.2 - i * 1.3);
      g.add(bolt);
    }
  }
  const stripe = box(0.5, 0.08, 6.5, 0x2fb8ff);
  stripe.material = glowMat(0x2fb8ff, 1.4);
  stripe.position.set(0, 1.12, -0.2);
  g.add(stripe);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 5), mat(0x3a4048));
  antenna.position.set(0, 1.6, 2.4);
  g.add(antenna);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), glowMat(0xff2020, 2));
  tip.position.set(0, 2.35, 2.4);
  g.add(tip);
  // Sırtta roket, arkadan alev
  const rocket = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 2.4, 10), mat(0x50575f));
  rocket.rotation.x = Math.PI / 2;
  rocket.position.set(0, 1.25, -1.8);
  g.add(rocket);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.6, 8), glowMat(0xff9020, 2.5));
  flame.rotation.x = -Math.PI / 2;
  flame.position.set(0, 1.25, -3.8);
  g.add(flame);
  shark.flame = flame;
  return shark;
}

// Dev kartal: kocaman kanatlar, beyaz baş, sarı gaga
function buildEagle() {
  const g = new THREE.Group();
  const brown = 0x5a3a1e, dark = 0x3a2412, white = 0xf4f2ea, yellow = 0xf2b51a;
  g.add(ellipsoid(1.3, 1.2, 3.0, brown));
  const chest = ellipsoid(1.1, 1.0, 2.2, 0x6e4a28);
  chest.position.set(0, -0.3, 0.8);
  g.add(chest);
  const head = ellipsoid(0.9, 0.9, 1.1, white);
  head.position.set(0, 0.7, 3.2);
  g.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.3, 6), mat(yellow));
  beak.rotation.x = Math.PI / 2 + 0.35;
  beak.position.set(0, 0.45, 4.5);
  g.add(beak);
  for (const s of [-1, 1]) {
    const eye = ellipsoid(0.14, 0.14, 0.14, 0x111111, 6);
    eye.position.set(s * 0.55, 0.95, 3.75);
    g.add(eye);
    const brow = box(0.45, 0.12, 0.4, 0xe0dccc);
    brow.position.set(s * 0.5, 1.12, 3.7);
    brow.rotation.z = s * 0.3;
    g.add(brow);
  }
  // Kanatlar omuzdan döner
  const wings = [];
  for (const s of [-1, 1]) {
    const wing = new THREE.Group();
    wing.position.set(s * 1.0, 0.5, 0.6);
    const inner = box(4.2, 0.25, 2.8, brown);
    inner.position.x = s * 2.1;
    const outer = box(4.0, 0.2, 2.2, dark);
    outer.position.set(s * 6.0, 0, -0.3);
    wing.add(inner, outer);
    for (let i = 0; i < 5; i++) {
      const feather = box(1.8, 0.12, 0.5, dark);
      feather.position.set(s * (7.6 + i * 0.12), 0, 0.5 - i * 0.55);
      feather.rotation.y = -s * (0.15 + i * 0.1);
      wing.add(feather);
    }
    wing.userData.s = s;
    wings.push(wing);
    g.add(wing);
  }
  const tail = new THREE.Group();
  tail.position.z = -2.8;
  for (let i = -2; i <= 2; i++) {
    const f = box(0.6, 0.12, 2.6, white);
    f.position.set(i * 0.38, 0, -1.2);
    f.rotation.y = i * 0.15;
    tail.add(f);
  }
  g.add(tail);
  for (const s of [-1, 1]) {
    const leg = box(0.3, 0.9, 0.3, yellow);
    leg.position.set(s * 0.5, -1.2, -0.6);
    leg.rotation.x = 0.6;
    g.add(leg);
  }
  return { group: g, tail, wings, tailAxis: 'x' };
}

// Kollu bacaklı megalodon: dik durur, karada yürür. Model merkezi gövdenin ortası,
// ayaklar WALKER_STAND kadar aşağıda.
const WALKER_STAND = 3.4;
function buildWalkerShark() {
  const g = new THREE.Group();
  const top = 0x56656f, belly = 0xe4e2d4;
  g.add(ellipsoid(1.25, 2.0, 1.05, top));
  const front = ellipsoid(0.95, 1.75, 0.6, belly);
  front.position.z = 0.5;
  g.add(front);

  // Baş: öne uzanan köpekbalığı burnu, alt çene, dişler
  const head = new THREE.Group();
  head.position.set(0, 1.9, 0.3);
  head.add(ellipsoid(0.95, 0.85, 1.7, top));
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), mat(0x111111));
    e.position.set(s * 0.65, 0.3, 1.0);
    head.add(e);
  }
  const mouth = ellipsoid(0.65, 0.25, 0.9, 0x5a1010, 10);
  mouth.position.set(0, -0.45, 0.9);
  head.add(mouth);
  addTeeth(head, 7, -0.5, 0.8, 0.6, 0.85, true);
  const jaw = new THREE.Group();
  jaw.position.set(0, -0.5, 0.2);
  const jm = ellipsoid(0.75, 0.25, 1.2, belly, 10);
  jm.position.set(0, -0.1, 0.7);
  jaw.add(jm);
  addTeeth(jaw, 7, 0.12, 0.7, 0.6, 0.85, false);
  head.add(jaw);
  g.add(head);

  const dorsal = new THREE.Mesh(finGeo(1.8, 1.8, 0.2), mat(top));
  dorsal.rotation.x = -Math.PI / 2 + 0.3;
  dorsal.position.set(0, 0.6, -0.9);
  g.add(dorsal);
  const tail = new THREE.Group();
  tail.position.set(0, -1.3, -0.8);
  const stalk = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.6, 8), mat(top));
  stalk.rotation.x = -Math.PI / 2 - 0.5;
  stalk.position.set(0, -0.5, -1.1);
  tail.add(stalk);
  const fin = new THREE.Mesh(finGeo(1.2, 1.8, 0.15), mat(top));
  fin.position.set(0, -1.1, -2.3);
  tail.add(fin);
  g.add(tail);

  // Kollar ve bacaklar omuzdan / kalçadan döner
  const arms = [], legs = [];
  for (const s of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(s * 1.35, 1.0, 0.1);
    const upper = box(0.55, 1.4, 0.55, top);
    upper.position.y = -0.7;
    const lower = box(0.5, 1.2, 0.5, top);
    lower.position.set(0, -1.9, 0.15);
    const fist = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), mat(belly));
    fist.position.set(0, -2.6, 0.2);
    arm.add(upper, lower, fist);
    arm.userData.s = s;
    arms.push(arm);
    g.add(arm);

    const leg = new THREE.Group();
    leg.position.set(s * 0.65, -1.5, 0);
    const thigh = box(0.7, 1.1, 0.7, top);
    thigh.position.y = -0.55;
    const shin = box(0.6, 0.9, 0.6, top);
    shin.position.y = -1.5;
    const foot = box(0.75, 0.35, 1.3, belly);
    foot.position.set(0, -1.75, 0.35);
    leg.add(thigh, shin, foot);
    leg.userData.s = s;
    legs.push(leg);
    g.add(leg);
  }
  return { group: g, head, jaw, tail, tailAxis: 'y', arms, legs };
}

const FORMS = {
  megalodon: {
    name: 'Megalodon', modelScale: 1, hpMul: 1, dmgMul: 1, speedMul: 1, armor: 1, flyDrain: 4,
    attack: 'bite', color: 0x8fe3ff, hint: 'Sol tık: ısır',
    build: () => buildShark({ top: 0x56656f, belly: 0xe4e2d4, dorsalH: 2.4 }),
  },
  robot: {
    name: 'Robot Megalodon', modelScale: 1, hpMul: 1.3, dmgMul: 0.8, speedMul: 1.1, armor: 0.5, flyDrain: 2,
    attack: 'laser', color: 0xff3030, hint: 'Sol tık: LAZER · hasarın yarısını alırsın',
    build: buildRobotShark,
  },
  kraken: {
    name: 'Kraken', modelScale: 0.72, hpMul: 1.5, dmgMul: 1.2, speedMul: 0.85, armor: 1, flyDrain: 6,
    attack: 'tentacles', color: 0xc070ff, hint: 'Sol tık: dokunaçlarla etrafındaki herkese vur',
    build: () => buildSquid({ color: 0x3e1636, head: 0x34102c, arm: 0x55204a, eye: 0xffd040, glowEyes: true }),
  },
  kartal: {
    name: 'Dev Kartal', modelScale: 1, hpMul: 0.9, dmgMul: 1, speedMul: 1.3, armor: 1, flyDrain: 0, alwaysFly: true,
    attack: 'bite', color: 0xffd040, hint: 'Hep uçar · Boşluk: hızlan · Sol tık: pençele',
    build: buildEagle,
  },
  kollu: {
    name: 'Kollu Bacaklı Megalodon', modelScale: 0.9, hpMul: 1.1, dmgMul: 1.1, speedMul: 0.9, armor: 1, flyDrain: 4,
    walker: true, attack: 'bite', color: 0x9fe870, hint: 'Karada yürür · Boşluk: zıpla · Sol tık: yumrukla',
    build: buildWalkerShark,
  },
};
const FORM_ORDER = ['megalodon', 'robot', 'kraken', 'kartal', 'kollu'];
