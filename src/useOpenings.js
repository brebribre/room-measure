import * as THREE from 'three';
import { createOpening, OPEN_ANGLE } from './openings.js';
import { wallLength, wallNormal } from './walls.js';

// Doors, windows and wall fixtures: placement on a room edge or interior
// wall, opening/closing animation, and the walk-mode "press E" interaction.
export function useOpenings() {
  return {
    addOpening(type, edgeIndex) {
      const g = createOpening(type);
      g.userData.edgeIndex = edgeIndex ?? this.room.longestEdge();
      g.userData.wallIndex = null;
      g.userData.t = 0.5;
      this.positionOpening(g);
      this.scene.add(g);
      this.openings.push(g);
      this.select(g);
      return g;
    },

    // Geometry of the wall an opening is mounted on — either a room edge or an
    // interior partition wall. Returns endpoints `a`/`b`, `len` and a unit
    // `normal` the opening should face.
    openingWallGeometry(u) {
      if (u.wallIndex != null) {
        const wall = this.walls[u.wallIndex];
        if (wall) return { a: wall.userData.a, b: wall.userData.b, len: wallLength(wall), normal: wallNormal(wall) };
        u.wallIndex = null;
      }
      if (u.edgeIndex >= this.room.vertices.length) u.edgeIndex = this.room.longestEdge();
      const i = u.edgeIndex;
      return { a: this.room.edgeA(i), b: this.room.edgeB(i), len: this.room.edgeLength(i), normal: this.room.edgeInwardNormal(i) };
    },

    // Place an opening on its wall (room edge or interior wall), centered at
    // fraction t, facing the wall's normal.
    positionOpening(g) {
      const u = g.userData;
      const { a, b, len, normal } = this.openingWallGeometry(u);
      const half = (u.w / 2) / (len || 1);
      u.t = len > u.w ? Math.max(half, Math.min(1 - half, u.t)) : 0.5;
      const p = { x: a[0] + (b[0] - a[0]) * u.t, z: a[1] + (b[1] - a[1]) * u.t };
      g.position.set(p.x + normal.x * 0.02, 0, p.z + normal.z * 0.02);
      g.rotation.y = Math.atan2(normal.x, normal.z);
      this.refreshWallOpenings();
    },

    refreshOpenings() { this.openings.forEach((g) => this.positionOpening(g)); },

    // Toggle a door/cabinet's leaves open or closed, animating the swing.
    toggleOpening(g) {
      const u = g.userData;
      if (!u.leaves || !u.leaves.length) return false;
      u.isOpen = !u.isOpen;
      u.leaves.forEach((p) => { p.userData.target = u.isOpen ? OPEN_ANGLE * p.userData.openSign : 0; });
      this.animatingOpenings.add(g);
      return true;
    },

    updateOpeningAnimations(dt) {
      for (const g of this.animatingOpenings) {
        let done = true;
        g.userData.leaves.forEach((p) => {
          const target = p.userData.target ?? 0;
          const diff = target - p.rotation.y;
          if (Math.abs(diff) < 0.01) p.rotation.y = target;
          else { p.rotation.y += diff * Math.min(1, dt * 8); done = false; }
        });
        if (done) this.animatingOpenings.delete(g);
      }
    },

    // Open/close the nearest door or cabinet in front of the walking camera ('E').
    interactNearestOpening() {
      const cam = this.camera.position;
      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);
      dir.y = 0;
      if (dir.lengthSq() < 1e-6) return;
      dir.normalize();
      const REACH = 1.6, FOV_COS = Math.cos(THREE.MathUtils.degToRad(70));
      let best = null, bestDist = Infinity;
      for (const g of this.openings) {
        if (!g.userData.leaves || !g.userData.leaves.length) continue;
        const dx = g.position.x - cam.x, dz = g.position.z - cam.z;
        const dist = Math.hypot(dx, dz);
        if (dist > REACH) continue;
        if (dist > 0.001) {
          const facing = (dx / dist) * dir.x + (dz / dist) * dir.z;
          if (facing < FOV_COS) continue;
        }
        if (dist < bestDist) { bestDist = dist; best = g; }
      }
      if (best) {
        this.toggleOpening(best);
        this.flash(best.userData.isOpen ? 'Opened' : 'Closed');
      }
    },

    changeOpeningType(type) {
      const s = this.selected;
      if (!s || !s.userData.isOpening) return;
      const { edgeIndex, t } = s.userData;
      this.scene.remove(s);
      this.openings = this.openings.filter((o) => o !== s);
      const g = createOpening(type);
      g.userData.edgeIndex = edgeIndex;
      g.userData.t = t;
      this.positionOpening(g);
      this.scene.add(g);
      this.openings.push(g);
      this.select(g);
    },
  };
}
