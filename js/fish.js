// Suyun altında dolaşan küçük balık sürüleri
const FISH_COLORS = [0xffd43b, 0xff922b, 0xc0d6e8, 0x4dabf7, 0xff6b6b, 0x9775fa, 0x69db7c];
const FISH_PER_SCHOOL = 24;

class School {
  constructor(scene, geo) {
    this.mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: pick(FISH_COLORS) }), FISH_PER_SCHOOL);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
    this.size = rand(0.8, 1.6);
    this.center = randomWaterPos(10);
    this.target = this.center.clone();
    this.vel = new THREE.Vector3(0, 0, 1);
    this.spread = 1;
    this.fish = [];
    for (let i = 0; i < FISH_PER_SCHOOL; i++) {
      this.fish.push({
        off: new THREE.Vector3(rand(-5, 5), rand(-2, 2), rand(-5, 5)),
        phase: rand(0, 6.28),
        alive: true,
        respawn: 0,
        pos: new THREE.Vector3(),
      });
    }
  }

  update(dt, t) {
    const toPlayer = this.center.distanceTo(Player.pos);
    let speed = 4;
    if (toPlayer < 20 + Player.radius() * 2) {
      // Kaç!
      const away = this.center.clone().sub(Player.pos).setY(0).normalize();
      this.target.copy(this.center).addScaledVector(away, 40);
      speed = 13;
      this.spread = Math.min(2.2, this.spread + dt * 3);
    } else {
      this.spread = Math.max(1, this.spread - dt);
      if (this.center.distanceTo(this.target) < 4) {
        this.target = randomWaterPos(8, this.center, 20, 70);
      }
    }
    const dir = this.target.clone().sub(this.center);
    if (dir.lengthSq() > 0.01) dir.normalize();
    this.vel.lerp(dir.multiplyScalar(speed), 1 - Math.exp(-dt * 2));
    this.center.addScaledVector(this.vel, dt);
    const ground = terrainHeight(this.center.x, this.center.z);
    if (ground > -5) {
      // Sığlığa girme
      this.center.addScaledVector(this.vel, -dt);
      this.target = randomWaterPos(8, this.center, 20, 70);
    }
    this.center.y = clamp(this.center.y, ground + 3, WATER_Y - 1.5);

    const yaw = Math.atan2(this.vel.x, this.vel.z);
    const pitch = Math.atan2(this.vel.y, Math.hypot(this.vel.x, this.vel.z));
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-pitch, yaw, 0, 'YXZ'));
    const m = new THREE.Matrix4(), s = new THREE.Vector3(this.size, this.size, this.size);
    const zero = new THREE.Matrix4().makeScale(0, 0, 0);
    this.fish.forEach((f, i) => {
      if (!f.alive) {
        f.respawn -= dt;
        if (f.respawn <= 0) f.alive = true;
        this.mesh.setMatrixAt(i, zero);
        return;
      }
      f.pos.copy(f.off).multiplyScalar(this.spread);
      f.pos.x += Math.sin(t * 1.3 + f.phase) * 0.8;
      f.pos.y += Math.sin(t * 2.1 + f.phase) * 0.4;
      f.pos.applyQuaternion(q).add(this.center);
      const fq = q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.sin(t * 10 + f.phase) * 0.25));
      m.compose(f.pos, fq, s);
      this.mesh.setMatrixAt(i, m);
    });
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

const Fish = {
  schools: [],

  init(scene) {
    const geo = smallFishGeometry();
    for (let i = 0; i < 16; i++) this.schools.push(new School(scene, geo));
  },

  update(dt, t) {
    for (const s of this.schools) s.update(dt, t);
  },

  // Ağzın yakınındaki balıkları yut, yutulan sayısını döndür
  eatNear(mouth, reach) {
    let n = 0;
    for (const s of this.schools) {
      if (s.center.distanceTo(mouth) > reach + 15) continue;
      for (const f of s.fish) {
        if (f.alive && f.pos.distanceTo(mouth) < reach) {
          f.alive = false;
          f.respawn = 25;
          n++;
          if (n >= 6) return n;
        }
      }
    }
    return n;
  },
};
