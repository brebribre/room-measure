import * as THREE from 'three';
import { wallMid, wallLength } from './walls';
import type { Editor, EdgeLabelsMixin } from './Editor';

// Floating length labels over each room edge and interior wall, shown only
// in the top-down view. The overlay is this.labelsEl; the label divs are
// created and positioned imperatively because this runs every frame in the
// render loop, where Vue's reactivity would only add overhead.
export function useEdgeLabels(): EdgeLabelsMixin & ThisType<Editor> {
  return {
    updateEdgeLabels() {
      const box = this.labelsEl;
      if (this.view !== 'top') { if (box.childElementCount) box.innerHTML = ''; return; }
      const roomN = this.room.vertices.length;
      const n = roomN + this.walls.length;
      while (box.childElementCount < n) {
        const s = document.createElement('div');
        s.className = 'edge-label';
        box.appendChild(s);
      }
      // There is at least one child while the element count is above n.
      while (box.childElementCount > n) box.removeChild(box.lastChild!);
      const r = this.canvas.getBoundingClientRect();
      const v = new THREE.Vector3();
      for (let i = 0; i < roomN; i++) {
        const mid = this.room.edgeMid(i);
        v.set(mid.x, 0, mid.z).project(this.camera);
        const el = box.children[i] as HTMLElement;
        el.style.left = (v.x * 0.5 + 0.5) * r.width + 'px';
        el.style.top = (-v.y * 0.5 + 0.5) * r.height + 'px';
        el.textContent = this.room.edgeLength(i).toFixed(2) + ' m';
      }
      this.walls.forEach((wall, wi) => {
        const mid = wallMid(wall);
        v.set(mid.x, 0, mid.z).project(this.camera);
        const el = box.children[roomN + wi] as HTMLElement;
        el.style.left = (v.x * 0.5 + 0.5) * r.width + 'px';
        el.style.top = (-v.y * 0.5 + 0.5) * r.height + 'px';
        el.textContent = wallLength(wall).toFixed(2) + ' m';
      });
    },
  };
}
