import * as THREE from 'three';

// First-person "walk" mode: spawn point, per-frame movement with wall/furniture
// sliding collision, and the furniture-footprint collision test it relies on.
export function useWalkMode() {
  return {
    // A point guaranteed to be inside the room polygon (for spawning the walker).
    interiorPoint() {
      const ok = (x, z) => this.room.contains(x, z) && !this.collidesFurniture(x, z) && !this.collidesWalls(x, z);
      if (ok(0, 0)) return { x: 0, z: 0 };
      const v = this.room.vertices;
      const minX = Math.min(...v.map((p) => p[0])), maxX = Math.max(...v.map((p) => p[0]));
      const minZ = Math.min(...v.map((p) => p[1])), maxZ = Math.max(...v.map((p) => p[1]));
      for (let i = 1; i < 10; i++) for (let j = 1; j < 10; j++) {
        const x = minX + ((maxX - minX) * i) / 10, z = minZ + ((maxZ - minZ) * j) / 10;
        if (ok(x, z)) return { x, z };
      }
      return { x: 0, z: 0 };
    },

    // Move the first-person camera per frame, sliding along walls (no clipping through).
    updateWalk(dt) {
      const m = this.move;
      if (!(m.f || m.b || m.l || m.r)) return;
      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);
      dir.y = 0;
      if (dir.lengthSq() < 1e-6) return;
      dir.normalize();
      const right = { x: -dir.z, z: dir.x };
      let dx = 0, dz = 0;
      if (m.f) { dx += dir.x; dz += dir.z; }
      if (m.b) { dx -= dir.x; dz -= dir.z; }
      if (m.r) { dx += right.x; dz += right.z; }
      if (m.l) { dx -= right.x; dz -= right.z; }
      const len = Math.hypot(dx, dz);
      if (!len) return;
      const speed = 2.6, margin = 0.15;
      dx = (dx / len) * speed * dt;
      dz = (dz / len) * speed * dt;
      const cam = this.camera.position;
      // per-axis so you slide along a wall / furniture instead of sticking
      const tx = cam.x + dx;
      if (this.room.contains(tx + Math.sign(dx) * margin, cam.z) && !this.collidesFurniture(tx, cam.z) && !this.collidesWalls(tx, cam.z)) cam.x = tx;
      const tz = cam.z + dz;
      if (this.room.contains(cam.x, tz + Math.sign(dz) * margin) && !this.collidesFurniture(cam.x, tz) && !this.collidesWalls(cam.x, tz)) cam.z = tz;
      cam.y = 1.65;
    },

    // True if a walker point at (x,z) would be inside any furniture footprint
    // (plus a body radius). Flat items like rugs are walkable and ignored.
    collidesFurniture(x, z) {
      const r = 0.22;
      for (const f of this.furniture) {
        if (f.userData.h < 0.2) continue;                 // walk over rugs / flat items
        if (f.position.y > 1.8) continue;                 // walk under high-stacked items
        const offX = x - f.position.x, offZ = z - f.position.z;
        const c = Math.cos(f.rotation.y), s = Math.sin(f.rotation.y);
        const lx = c * offX - s * offZ;                   // into the piece's local frame
        const lz = s * offX + c * offZ;
        if (Math.abs(lx) <= f.userData.w / 2 + r && Math.abs(lz) <= f.userData.d / 2 + r) return true;
      }
      return false;
    },
  };
}
