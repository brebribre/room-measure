import * as THREE from 'three';

// Room-edge drag handles (top-down view) and the width/length/area readouts
// in the inspector, plus the shared "room polygon changed" refresh.
export function useRoomHandles() {
  return {
    // One grip per wall, sitting at the wall's midpoint and aligned with it. Drag a
    // grip to slide the whole wall in/out (both endpoints move along the normal).
    rebuildHandles() {
      this.handleGroup.clear();
      this.handleMeshes = [];
      const mat = new THREE.MeshBasicMaterial({ color: 0x5b8cff });
      this.room.vertices.forEach((_, i) => {
        const len = Math.min(0.5, this.room.edgeLength(i) * 0.6);
        const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.03, 0.12), mat);
        m.userData = { isHandle: true, edge: i };
        this.handleGroup.add(m);
        this.handleMeshes.push(m);
      });
      this.updateHandlePositions();
      this.handleGroup.visible = this.view === 'top';
    },

    updateHandlePositions() {
      this.handleMeshes.forEach((m) => {
        const i = m.userData.edge;
        const mid = this.room.edgeMid(i);
        const d = this.room.edgeDir(i);
        m.position.set(mid.x, 0.05, mid.z);
        m.rotation.y = Math.atan2(-d.z, d.x); // align long axis with the wall
      });
    },

    // Called after the room polygon changes (shape/scale/vertex). resetCount=true
    // when the vertex count may have changed (shape switch).
    afterRoomChange(resetCount = true) {
      if (resetCount) this.rebuildHandles(); else this.updateHandlePositions();
      this.updateWallHandlePositions();
      this.refreshOpenings();
      this.furniture.forEach((f) => this.reclamp(f));
      this.updateRoomControls();
    },

    updateRoomControls() {
      document.getElementById('area-val').textContent = this.room.area.toFixed(1) + ' m²';
      const w = this.room.bboxWidth, l = this.room.bboxLength;
      const wEl = document.getElementById('room-w'), lEl = document.getElementById('room-l');
      wEl.value = Math.min(Math.max(w, wEl.min), wEl.max);
      lEl.value = Math.min(Math.max(l, lEl.min), lEl.max);
      document.getElementById('rw-val').textContent = w.toFixed(1) + ' m';
      document.getElementById('rl-val').textContent = l.toFixed(1) + ' m';
    },
  };
}
