import * as THREE from 'three';
import { createWall, rebuildWall, wallLength, wallMid, wallNormal, wallRotation, rectsOverlap } from './walls.js';

// Interior partition walls: creation, resizing/rotating, endpoint handles,
// floor-collision against them, and cutting door-shaped gaps into them.
export function useInteriorWalls() {
  return {
    // Resize a wall to `len` meters by moving endpoint `b` along the a→b
    // direction, keeping `a` fixed. Clamps to the longest length that still
    // keeps `b` inside the room if the requested length would exit it.
    resizeWall(g, len) {
      const { a, b } = g.userData;
      const cur = wallLength(g) || 1;
      const dir = { x: (b[0] - a[0]) / cur, z: (b[1] - a[1]) / cur };
      let l = len;
      let nb = [a[0] + dir.x * l, a[1] + dir.z * l];
      if (!this.room.contains(nb[0], nb[1])) {
        let lo = 0, hi = l;
        for (let i = 0; i < 20; i++) {
          const mid = (lo + hi) / 2;
          const p = [a[0] + dir.x * mid, a[1] + dir.z * mid];
          if (this.room.contains(p[0], p[1])) lo = mid; else hi = mid;
        }
        l = lo;
        nb = [a[0] + dir.x * l, a[1] + dir.z * l];
      }
      g.userData.b = nb;
      rebuildWall(g);
      this.updateWallHandlePositions();
      this.refreshOpenings();
      document.getElementById('wall-length').value = l;
      document.getElementById('wall-length-val').textContent = l.toFixed(2) + ' m';
    },

    // Rotate a wall 90° about its midpoint, keeping its length. No-op if either
    // new endpoint would land outside the room.
    rotateWall(g) {
      const { a, b } = g.userData;
      const mid = wallMid(g);
      const rot = ([x, z]) => [mid.x - (z - mid.z), mid.z + (x - mid.x)];
      const na = rot(a), nb = rot(b);
      if (!this.room.contains(na[0], na[1]) || !this.room.contains(nb[0], nb[1])) return;
      g.userData.a = na;
      g.userData.b = nb;
      rebuildWall(g);
      this.updateWallHandlePositions();
      this.refreshOpenings();
    },

    // True if a furniture footprint at (cx,cz) with rotation rot and size w×d
    // would overlap any interior partition wall.
    wallsBlock(cx, cz, rot, w, d) {
      for (const wall of this.walls) {
        const mid = wallMid(wall);
        if (rectsOverlap(cx, cz, rot, w, d, mid.x, mid.z, wallRotation(wall), wallLength(wall), wall.userData.thickness)) return true;
      }
      return false;
    },

    // True if a circular walker of radius r at (x,z) would intersect any wall.
    // An open door cuts a passable gap, letting the walker through to the
    // other side.
    collidesWalls(x, z, r = 0.22) {
      for (let i = 0; i < this.walls.length; i++) {
        const wall = this.walls[i];
        const mid = wallMid(wall);
        if (!rectsOverlap(x, z, 0, r * 2, r * 2, mid.x, mid.z, wallRotation(wall), wallLength(wall), wall.userData.thickness)) continue;
        if (this.wallGapOpenAt(wall, i, x, z)) continue;
        return true;
      }
      return false;
    },

    // True if (x,z) falls within an open door's gap on `wall` (index `wallIndex`).
    wallGapOpenAt(wall, wallIndex, x, z) {
      const len = wallLength(wall) || 1;
      const mid = wallMid(wall);
      const { a, b } = wall.userData;
      const dir = { x: (b[0] - a[0]) / len, z: (b[1] - a[1]) / len };
      const localX = (x - mid.x) * dir.x + (z - mid.z) * dir.z;
      return this.openings.some((o) => {
        const u = o.userData;
        if (u.kind !== 'door' || u.wallIndex !== wallIndex || !u.isOpen) return false;
        const cx = (u.t - 0.5) * len;
        return Math.abs(localX - cx) <= u.w / 2;
      });
    },

    // Combined containment check for furniture: inside the room polygon and
    // clear of every interior wall.
    placementOk(cx, cz, rot, w, d) {
      return this.room.footprintInside(cx, cz, rot, w, d) && !this.wallsBlock(cx, cz, rot, w, d);
    },

    addWall(a, b, thickness) {
      let pa = a, pb = b;
      if (!pa || !pb) {
        const v = this.room.vertices;
        const minX = Math.min(...v.map((p) => p[0])), maxX = Math.max(...v.map((p) => p[0]));
        const minZ = Math.min(...v.map((p) => p[1])), maxZ = Math.max(...v.map((p) => p[1]));
        const size = Math.max(1.0, Math.min(1.8, (maxX - minX) * 0.4, (maxZ - minZ) * 0.4));
        pa = [maxX - size, minZ];
        pb = [maxX - size, minZ + size];
      }
      const g = createWall(pa, pb, thickness ?? 0.1, this.room.height);
      this.scene.add(g);
      this.walls.push(g);
      this.rebuildWallHandles();
      this.select(g);
      return g;
    },

    /* ---------- Wall (interior) endpoint handles ---------- */
    rebuildWallHandles() {
      this.wallHandleGroup.clear();
      this.wallHandleMeshes = [];
      const mat = new THREE.MeshBasicMaterial({ color: 0xffb454 });
      this.walls.forEach((wall, wi) => {
        ['a', 'b'].forEach((end) => {
          const m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), mat);
          m.userData = { isWallHandle: true, wall: wi, end };
          this.wallHandleGroup.add(m);
          this.wallHandleMeshes.push(m);
        });
      });
      this.updateWallHandlePositions();
      this.wallHandleGroup.visible = this.view === 'top';
    },

    updateWallHandlePositions() {
      this.wallHandleMeshes.forEach((m) => {
        const wall = this.walls[m.userData.wall];
        const p = wall.userData[m.userData.end];
        m.position.set(p[0], 0.08, p[1]);
      });
    },

    // Doors mounted on interior wall `wallIndex`, as `{t, w, h}` gap specs.
    doorGapsForWall(wallIndex) {
      return this.openings
        .filter((o) => o.userData.kind === 'door' && o.userData.wallIndex === wallIndex)
        .map((o) => ({ t: o.userData.t, w: o.userData.w, h: o.userData.h }));
    },

    // Cut a passable hole in each interior wall wherever a door is mounted on it.
    refreshWallOpenings() {
      this.walls.forEach((w, i) => rebuildWall(w, this.doorGapsForWall(i)));
    },
  };
}
