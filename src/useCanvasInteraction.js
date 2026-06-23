import * as THREE from 'three';
import { rebuildWall } from './walls.js';

// Closest fraction t (0..1) on segment a→b to world point (x,z).
function projectOntoSegment(a, b, x, z) {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const len2 = dx * dx + dz * dz || 1;
  return Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / len2));
}

// Pointer/raycasting interaction with the 3D canvas: picking, dragging
// furniture/openings/lights/walls, and resizing the room via edge handles.
export function useCanvasInteraction() {
  return {
    bindCanvas() {
      const c = this.canvas;
      c.addEventListener('pointerdown', (e) => this.onPointerDown(e));
      c.addEventListener('pointermove', (e) => this.onPointerMove(e));
      window.addEventListener('pointerup', () => this.onPointerUp());
    },

    setPointer(e) {
      const r = this.canvas.getBoundingClientRect();
      this.pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      this.pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    },

    pickFrom(objects) {
      this.raycaster.setFromCamera(this.pointer, this.camera);
      return this.raycaster.intersectObjects(objects, true);
    },

    pickSelectable() {
      const hits = this.pickFrom([...this.furniture, ...this.openings, ...this.lights, ...this.walls]);
      if (!hits.length) return null;
      let o = hits[0].object;
      while (o && !o.userData.isFurniture && !o.userData.isOpening && !o.userData.isLight && !o.userData.isWall) o = o.parent;
      return o || null;
    },

    floorPoint() { return this.planePoint(0); },

    // World height where the cursor ray crosses the vertical plane of wall
    // segment a→b, for dragging a window/fixture up and down the wall. Null if
    // the ray runs parallel to that plane.
    wallHeightAtCursor(a, b) {
      const n = new THREE.Vector3(b[1] - a[1], 0, -(b[0] - a[0]));
      if (n.lengthSq() < 1e-9) return null;
      n.normalize();
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(n, new THREE.Vector3(a[0], 0, a[1]));
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const out = new THREE.Vector3();
      return this.raycaster.ray.intersectPlane(plane, out) ? out.y : null;
    },

    // Intersection of the cursor ray with a horizontal plane at height y.
    planePoint(y) {
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -y);
      const out = new THREE.Vector3();
      return this.raycaster.ray.intersectPlane(plane, out) ? out : null;
    },

    onPointerDown(e) {
      // In walk mode a click captures the mouse for looking around.
      if (this.view === 'walk') { if (!this.plControls.isLocked) this.plControls.lock(); return; }

      this.setPointer(e);

      // Wall handles take priority in top-down view.
      if (this.view === 'top') {
        const wh = this.pickFrom(this.wallHandleMeshes);
        if (wh.length) {
          const { wall, end } = wh[0].object.userData;
          this.dragMode = 'wall-vertex';
          this.dragWall = wall;
          this.dragEnd = end;
          this.controls.enabled = false;
          this.canvas.style.cursor = 'grabbing';
          this.select(this.walls[wall]);
          return;
        }
        const h = this.pickFrom(this.handleMeshes);
        if (h.length) {
          const i = h[0].object.userData.edge;
          const fp = this.floorPoint();
          this.dragMode = 'edge';
          this.dragEdge = i;
          this.dragNormal = this.room.edgeOutwardNormal(i);
          this.dragOrigA = this.room.edgeA(i).slice();
          this.dragOrigB = this.room.edgeB(i).slice();
          this.dragStart = fp ? { x: fp.x, z: fp.z } : { x: 0, z: 0 };
          this.controls.enabled = false;
          this.canvas.style.cursor = 'grabbing';
          return;
        }
      }

      const hit = this.pickSelectable();
      if (hit) {
        this.select(hit);
        this.controls.enabled = false;
        this.canvas.style.cursor = 'grabbing';
        if (hit.userData.isOpening) {
          this.dragMode = 'opening';
        } else if (hit.userData.isLight) {
          this.dragMode = 'light';
        } else if (hit.userData.isWall) {
          this.dragMode = 'wall';
          const fp = this.floorPoint();
          this.dragWallStart = fp ? { a: [...hit.userData.a], b: [...hit.userData.b], x: fp.x, z: fp.z } : null;
        } else {
          this.dragMode = 'furniture';
          const fp = this.floorPoint();
          if (fp) this.dragOffset.set(hit.position.x - fp.x, 0, hit.position.z - fp.z);
        }
      } else {
        this.select(null);
      }
    },

    onPointerMove(e) {
      this.setPointer(e);
      if (this.dragMode === 'edge') {
        const fp = this.floorPoint();
        if (fp) {
          const dx = fp.x - this.dragStart.x, dz = fp.z - this.dragStart.z;
          let amount = dx * this.dragNormal.x + dz * this.dragNormal.z; // distance along the wall normal
          amount = Math.round(amount / 0.1) * 0.1;                      // snap to 0.1 m
          const nx = this.dragNormal.x * amount, nz = this.dragNormal.z * amount;
          this.room.setEdgeEndpoints(this.dragEdge,
            this.dragOrigA[0] + nx, this.dragOrigA[1] + nz,
            this.dragOrigB[0] + nx, this.dragOrigB[1] + nz);
          this.afterRoomChange(false);
        }
        return;
      }
      if (this.dragMode === 'wall-vertex') {
        const fp = this.floorPoint();
        if (fp) {
          const wall = this.walls[this.dragWall];
          const snap = 0.1;
          const x = Math.round(fp.x / snap) * snap, z = Math.round(fp.z / snap) * snap;
          if (this.room.contains(x, z)) {
            wall.userData[this.dragEnd] = [x, z];
            rebuildWall(wall);
            this.updateWallHandlePositions();
            this.refreshOpenings();
          }
        }
        return;
      }
      if (this.dragMode === 'wall' && this.selected && this.dragWallStart) {
        const fp = this.floorPoint();
        if (fp) {
          const dx = fp.x - this.dragWallStart.x, dz = fp.z - this.dragWallStart.z;
          const na = [this.dragWallStart.a[0] + dx, this.dragWallStart.a[1] + dz];
          const nb = [this.dragWallStart.b[0] + dx, this.dragWallStart.b[1] + dz];
          if (this.room.contains(na[0], na[1]) && this.room.contains(nb[0], nb[1])) {
            this.selected.userData.a = na;
            this.selected.userData.b = nb;
            rebuildWall(this.selected);
            this.updateWallHandlePositions();
            this.refreshOpenings();
          }
        }
        return;
      }
      if (this.dragMode === 'furniture' && this.selected) {
        const fp = this.floorPoint();
        if (!fp) return;
        const g = this.selected, { w, d } = g.userData, rot = g.rotation.y;
        const tx = fp.x + this.dragOffset.x, tz = fp.z + this.dragOffset.z;
        if (this.placementOk(tx, tz, rot, w, d)) { g.position.x = tx; g.position.z = tz; }
        else if (this.placementOk(tx, g.position.z, rot, w, d)) g.position.x = tx;
        else if (this.placementOk(g.position.x, tz, rot, w, d)) g.position.z = tz;
        // Rest on top of any furniture underneath; otherwise drop to the floor.
        g.position.y = this.supportUnder(g, g.position.x, g.position.z);
        return;
      }
      if (this.dragMode === 'light' && this.selected) {
        const p = this.planePoint(this.selected.position.y); // drag across the ceiling plane
        if (p && this.room.contains(p.x, p.z)) { this.selected.position.x = p.x; this.selected.position.z = p.z; }
        return;
      }
      if (this.dragMode === 'opening' && this.selected) {
        const fp = this.floorPoint();
        if (!fp) return;
        // Snap the opening to the nearest wall (room edge or interior wall) under
        // the cursor, then slide along it.
        const best = this.nearestEdge(fp.x, fp.z);
        const u = this.selected.userData;
        if (best.kind === 'wall') { u.wallIndex = best.i; u.edgeIndex = 0; }
        else { u.wallIndex = null; u.edgeIndex = best.i; }
        u.t = projectOntoSegment(best.a, best.b, fp.x, fp.z);
        // Wall-mounted fixtures (windows, cabinets, screens) also slide
        // vertically: map the cursor's height on the wall to the sill so you can
        // stack e.g. two windows one above the other. Doors stay floor-anchored.
        if (u.kind === 'window' || u.kind === 'cabinet' || u.kind === 'screen' || u.kind === 'lamp') {
          const y = this.wallHeightAtCursor(best.a, best.b);
          if (y != null) {
            const maxSill = Math.max(0, this.room.height - u.h);
            const sill = Math.min(maxSill, Math.max(0, Math.round((y - u.h / 2) / 0.05) * 0.05));
            if (Math.abs(sill - u.sill) >= 0.001) { this.resizeOpening('sill', sill); return; }
          }
        }
        this.positionOpening(this.selected);
        return;
      }
      // hover cursor
      if (this.view === 'top' && this.pickFrom(this.handleMeshes).length) this.canvas.style.cursor = 'grab';
      else this.canvas.style.cursor = this.pickSelectable() ? 'grab' : 'default';
    },

    // The room edge or interior wall closest to a floor point, for snapping
    // doors/windows/fixtures as they're dragged.
    nearestEdge(x, z) {
      let best = { kind: 'room', i: 0, a: this.room.edgeA(0), b: this.room.edgeB(0) }, bd = Infinity;
      for (let i = 0; i < this.room.vertices.length; i++) {
        const a = this.room.edgeA(i), b = this.room.edgeB(i);
        const t = projectOntoSegment(a, b, x, z);
        const px = a[0] + (b[0] - a[0]) * t, pz = a[1] + (b[1] - a[1]) * t;
        const d = (px - x) ** 2 + (pz - z) ** 2;
        if (d < bd) { bd = d; best = { kind: 'room', i, a, b }; }
      }
      this.walls.forEach((wall, wi) => {
        const a = wall.userData.a, b = wall.userData.b;
        const t = projectOntoSegment(a, b, x, z);
        const px = a[0] + (b[0] - a[0]) * t, pz = a[1] + (b[1] - a[1]) * t;
        const d = (px - x) ** 2 + (pz - z) ** 2;
        if (d < bd) { bd = d; best = { kind: 'wall', i: wi, a, b }; }
      });
      return best;
    },

    onPointerUp() {
      if (this.dragMode) {
        this.dragMode = null;
        this.dragVertex = -1;
        this.dragWall = null;
        this.dragWallStart = null;
        this.controls.enabled = true;
        this.canvas.style.cursor = 'default';
      }
    },
  };
}
