import * as THREE from 'three';
import { wallMid, wallLength } from './walls.js';

// Floating length labels over each room edge and interior wall, shown only
// in the top-down view.
export function useEdgeLabels() {
  return {
    updateEdgeLabels() {
      const box = document.getElementById('edge-labels');
      if (this.view !== 'top') { if (box.childElementCount) box.innerHTML = ''; return; }
      const roomN = this.room.vertices.length;
      const n = roomN + this.walls.length;
      while (box.childElementCount < n) {
        const s = document.createElement('div');
        s.className = 'edge-label';
        box.appendChild(s);
      }
      while (box.childElementCount > n) box.removeChild(box.lastChild);
      const r = this.canvas.getBoundingClientRect();
      const v = new THREE.Vector3();
      for (let i = 0; i < roomN; i++) {
        const mid = this.room.edgeMid(i);
        v.set(mid.x, 0, mid.z).project(this.camera);
        const el = box.children[i];
        el.style.left = (v.x * 0.5 + 0.5) * r.width + 'px';
        el.style.top = (-v.y * 0.5 + 0.5) * r.height + 'px';
        el.textContent = this.room.edgeLength(i).toFixed(2) + ' m';
      }
      this.walls.forEach((wall, wi) => {
        const mid = wallMid(wall);
        v.set(mid.x, 0, mid.z).project(this.camera);
        const el = box.children[roomN + wi];
        el.style.left = (v.x * 0.5 + 0.5) * r.width + 'px';
        el.style.top = (-v.y * 0.5 + 0.5) * r.height + 'px';
        el.textContent = wallLength(wall).toFixed(2) + ' m';
      });
    },
  };
}
