// Kan bulutu, kabarcık ve su sıçraması parçacıkları
const Effects = {
  scene: null,
  geo: null,
  list: [],
  max: 350,

  init(scene) {
    this.scene = scene;
    this.geo = new THREE.SphereGeometry(1, 6, 4);
  },

  spawn(pos, o) {
    for (let i = 0; i < o.count; i++) {
      if (this.list.length >= this.max) this.kill(0);
      const m = new THREE.Mesh(this.geo, new THREE.MeshBasicMaterial({
        color: o.color, transparent: true, opacity: o.opacity || 0.8, depthWrite: false,
      }));
      m.position.copy(pos).add(new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).multiplyScalar(o.spread || 0.5));
      const size = o.size * rand(0.6, 1.3);
      m.scale.setScalar(size);
      this.scene.add(m);
      const life = o.life * rand(0.7, 1.2);
      this.list.push({
        mesh: m, life, maxLife: life, size, grow: o.grow || 0,
        vel: new THREE.Vector3(rand(-1, 1), rand(-1, 1) + (o.up || 0), rand(-1, 1)).multiplyScalar(o.speed),
        gravity: o.gravity || 0, rise: o.rise || 0, drag: o.drag || 0.96, startOpacity: o.opacity || 0.8,
      });
    }
  },

  blood(pos, amount) {
    this.spawn(pos, { count: amount || 12, color: 0xb01010, size: 0.9, speed: 2.5, life: 2.2, grow: 1.6, spread: 1.2, opacity: 0.7, drag: 0.93 });
  },

  bubbles(pos, n) {
    this.spawn(pos, { count: n || 3, color: 0xdff6ff, size: 0.15, speed: 0.6, life: 2.5, rise: 4, spread: 0.8, opacity: 0.6 });
  },

  splash(pos, big) {
    const s = big ? 1.6 : 1;
    this.spawn(pos, { count: Math.floor(26 * s), color: 0xffffff, size: 0.35 * s, speed: 5 * s, up: 2.2, life: 1.2, gravity: 22, spread: 1.5 * s, opacity: 0.9, drag: 0.99 });
  },

  // Lazer ışını: a'dan b'ye parlayan, hızla sönen çubuk
  beam(a, b, color) {
    const len = a.distanceTo(b);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, len, 6, 1, true),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false }));
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    this.scene.add(m);
    this.list.push({
      mesh: m, life: 0.18, maxLife: 0.18, size: 1, grow: 0, ownGeometry: true,
      vel: new THREE.Vector3(), gravity: 0, rise: 0, drag: 1, startOpacity: 0.9,
    });
  },

  kill(i) {
    const p = this.list[i];
    this.scene.remove(p.mesh);
    p.mesh.material.dispose();
    if (p.ownGeometry) p.mesh.geometry.dispose();
    this.list.splice(i, 1);
  },

  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.life -= dt;
      if (p.life <= 0) { this.kill(i); continue; }
      p.vel.y += (p.rise - p.gravity) * dt;
      p.vel.multiplyScalar(Math.pow(p.drag, dt * 60));
      p.mesh.position.addScaledVector(p.vel, dt);
      // Kabarcıklar yüzeyde patlar
      if (p.rise > 0 && p.mesh.position.y > WATER_Y) { this.kill(i); continue; }
      const k = p.life / p.maxLife;
      p.mesh.material.opacity = p.startOpacity * k;
      p.mesh.scale.setScalar(p.size * (1 + p.grow * (1 - k)));
    }
  },
};
