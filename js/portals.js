// Renkli portal çiftleri: her renkten tam iki portal var, birinden girince ötekinden çıkılır.
// Bir de gizli gökkuşağı portalı var: uzaya açılır, haritada ancak bulunduktan sonra görünür.

const PORTAL_RADIUS = 12;
const PORTAL_COOLDOWN = 1.5;

// Bir portal halkası: yüzü yaw yönüne bakar (normal = (sin yaw, 0, cos yaw))
function buildPortal(colors, radius) {
  const g = new THREE.Group();
  colors.forEach((c, i) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius - i * 0.9, 0.55, 10, 48), glowMat(c, 1.6));
    g.add(ring);
  });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.92, 40),
    new THREE.MeshBasicMaterial({ color: colors[0], transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false }));
  g.add(disc);
  const swirl = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.5, 0.35, 6, 32, Math.PI * 1.5), glowMat(colors[colors.length - 1], 2));
  g.add(swirl);
  return { group: g, swirl, disc };
}

const RAINBOW = [0xff3030, 0xff9020, 0xffe030, 0x30d060, 0x3a8cff, 0xb050ff];

// Karada, kıyının biraz içinde, denize bakan bir yer (megalodon sudan fırlayıp girebilsin)
function shorePortalSpot(islandIndex, towardX, towardZ) {
  const isl = ISLANDS[islandIndex];
  const dir = new THREE.Vector3(towardX - isl.x, 0, towardZ - isl.z).normalize();
  let d = 0;
  while (d < isl.r * 2.2 && terrainHeight(isl.x + dir.x * d, isl.z + dir.z * d) > 0.25) d += 0.5;
  d -= 10;
  const x = isl.x + dir.x * d, z = isl.z + dir.z * d;
  return { pos: new THREE.Vector3(x, terrainHeight(x, z) + PORTAL_RADIUS - 1, z), yaw: Math.atan2(dir.x, dir.z) };
}

// Çukurun dibinde, çukur boyunca bakan bir yer
function trenchPortalSpot(u, lift) {
  const p = trenchCenter(u);
  return { pos: p.setY(terrainHeight(p.x, p.z) + PORTAL_RADIUS + (lift || 4)), yaw: Math.atan2(TRENCH.bx - TRENCH.ax, TRENCH.bz - TRENCH.az) };
}

const PORTAL_PAIRS = [
  // Anne megalodonun altında, çukurun dibinden gökyüzüne
  { name: 'Mavi', color: 0x3a8cff, a: () => trenchPortalSpot(0.8), b: () => ({ pos: new THREE.Vector3(0, 120, -60), yaw: Math.PI }) },
  // Başlangıca yakın, su yüzeyinden çukurun dibine
  { name: 'Yeşil', color: 0x30d060, a: () => ({ pos: new THREE.Vector3(40, 0, 80), yaw: Math.atan2(SPAWN.x - 40, SPAWN.z - 80) }), b: () => trenchPortalSpot(0.5) },
  // Büyük adanın kıyısından çukurun dibine
  { name: 'Mor', color: 0xb050ff, a: () => shorePortalSpot(1, 0, 40), b: () => trenchPortalSpot(0.4) },
  // Adadan uzak bir adaya
  { name: 'Turuncu', color: 0xff9020, a: () => shorePortalSpot(4, 0, 40), b: () => shorePortalSpot(7, -150, 110) },
];

// Gizli portal: dünyanın kuzey ucunda, deniz dibinde
const SECRET_PORTAL_AT = () => { const x = 0, z = -1120; return { pos: new THREE.Vector3(x, terrainHeight(x, z) + 9, z), yaw: 0 }; };

const Portals = {
  scene: null,
  list: [],      // { pos, normal, yaw, color, partner, model, secret }
  cooldown: 0,

  init(scene) {
    this.scene = scene;
    for (const pair of PORTAL_PAIRS) {
      const a = this.add(pair.a(), [pair.color], PORTAL_RADIUS);
      const b = this.add(pair.b(), [pair.color], PORTAL_RADIUS);
      a.partner = b; b.partner = a;
      a.color = b.color = pair.color;
    }
    this.secret = this.add(SECRET_PORTAL_AT(), RAINBOW, 8);
    this.secret.secret = true;
  },

  add(spot, colors, radius) {
    const model = buildPortal(colors, radius);
    model.group.position.copy(spot.pos);
    model.group.rotation.y = spot.yaw;
    this.scene.add(model.group);
    const p = { pos: spot.pos.clone(), yaw: spot.yaw, normal: new THREE.Vector3(Math.sin(spot.yaw), 0, Math.cos(spot.yaw)), radius, model, color: colors[0] };
    this.list.push(p);
    return p;
  },

  secretFound() { return !!Save.data.secretPortal; },

  // Oyuncu halkanın içinden geçiyor mu?
  inside(p, pos) {
    const rel = pos.clone().sub(p.pos);
    const along = rel.dot(p.normal);
    const across = rel.addScaledVector(p.normal, -along).length();
    return Math.abs(along) < 4 && across < p.radius * 0.85;
  },

  // Portalın önünden, yüzünün baktığı yöne doğru çık
  exitAt(p) {
    const P = Player;
    P.pos.copy(p.pos).addScaledVector(p.normal, p.radius * 0.6 + P.radius());
    P.yaw = p.yaw;
    P.pitch = 0;
    P.vel.copy(p.normal).multiplyScalar(12);
    if (P.pos.y > WATER_Y && !P.flying) P.airborne = true;
    if (P.pos.y < WATER_Y) { P.airborne = false; if (!P.formDef().alwaysFly) P.flying = false; }
    this.cooldown = PORTAL_COOLDOWN;
    P.snapCamera = true;
  },

  update(dt, t) {
    for (const p of this.list) {
      p.model.swirl.rotation.z -= dt * 2;
      p.model.disc.material.opacity = 0.25 + Math.sin(t * 3) * 0.08;
      if (Math.random() < dt * 3 && p.pos.distanceToSquared(Player.pos) < 150 * 150) {
        Effects.spawn(p.pos, { count: 1, color: p.color, size: 0.4, speed: 2, life: 1.2, spread: p.radius * 0.6, opacity: 0.9 });
      }
    }
    this.cooldown -= dt;
    if (this.cooldown > 0 || Player.dead) return;
    for (const p of this.list) {
      if (!this.inside(p, Player.pos)) continue;
      Sound.portal();
      Game.flash();
      if (p.secret) {
        if (!this.secretFound()) { Save.data.secretPortal = true; Save.write(); }
        Game.enterSpace();
      } else {
        this.exitAt(p.partner);
      }
      return;
    }
  },
};
