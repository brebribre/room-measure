import * as THREE from 'three';
import { createFurniture, getVariant } from './furniture';
import { isFurnitureGroup, isMesh, isStandardMesh } from './types';
import type { Editor, FurnitureMixin } from './Editor';

// Furniture placement, sizing/variant presets, recoloring and worktop
// finishes, plus the floor-collision helpers used while dragging. The
// inspector renders from the store, so anything that changes a piece's size,
// preset or colour ends with syncSelection() instead of touching a control.
export function useFurniture(): FurnitureMixin & ThisType<Editor> {
  return {
    addFurniture(type, pos) {
      const group = createFurniture(type);
      const { w, d } = group.userData;
      const pref = pos ?? { x: (Math.random() - 0.5) * 1.5, z: (Math.random() - 0.5) * 1.5 };
      const c = this.room.findPlacement(0, w, d, pref,
        (x: number, z: number, rot: number, w: number, d: number) => this.wallsBlock(x, z, rot, w, d));
      group.position.set(c.x, 0, c.z);
      this.scene.add(group);
      this.furniture.push(group);
      this.select(group);
      return group;
    },

    // Snap a furniture group back to a valid placement after a resize/rotate
    // that may have pushed it outside the room or into a wall.
    reclamp(group) {
      const { w, d } = group.userData;
      const c = this.room.findPlacement(group.rotation.y, w, d, { x: group.position.x, z: group.position.z },
        (x: number, z: number, rot: number, w: number, d: number) => this.wallsBlock(x, z, rot, w, d));
      group.position.x = c.x; group.position.z = c.z;
    },

    // Non-uniformly scale a furniture group from its base mesh dimensions.
    applyFurnitureScale(g) {
      const u = g.userData;
      g.scale.set(u.w / u.baseW, u.h / u.baseH, u.d / u.baseD);
    },

    applyVariant(id) {
      const g = this.selected;
      if (!g || !isFurnitureGroup(g)) return;
      const variant = getVariant(g.userData.type);
      const opt = variant && variant.options.find((o) => o.id === id);
      if (!opt) return;
      g.userData.w = opt.w;
      g.userData.d = opt.d;
      this.applyFurnitureScale(g);
      this.reclamp(g);
      this.syncSelection();
    },

    // dim: 'w' | 'd' | 'h'
    resizeSelected(dim, value) {
      const g = this.selected;
      if (!g || !isFurnitureGroup(g)) return;
      g.userData[dim] = value;
      this.applyFurnitureScale(g);
      if (dim !== 'h') this.reclamp(g); // height doesn't affect the floor footprint
      this.syncSelection();
    },

    resetSelectedSize() {
      const g = this.selected;
      if (!g || !isFurnitureGroup(g)) return;
      const u = g.userData;
      u.w = u.baseW; u.d = u.baseD; u.h = u.baseH;
      this.applyFurnitureScale(g);
      this.reclamp(g);
      this.syncSelection();
    },

    recolorSelected(hex) {
      const g = this.selected;
      if (g && isFurnitureGroup(g)) { this.recolor(g, hex); this.syncSelection(); }
    },

    recolor(group, hex) {
      group.userData.color = hex;
      group.traverse((o) => {
        if (isStandardMesh(o) && !o.userData.isWorktop) {
          const { l } = o.material.color.getHSL({ h: 0, s: 0, l: 0 });
          if (l > 0.18) o.material.color.setHex(hex);
        }
      });
    },

    hasWorktop(group) {
      let found = false;
      group.traverse((o) => { if (o.userData.isWorktop) found = true; });
      return found;
    },

    // Swap a kitchen unit's worktop between plain stone and the light-wood texture.
    setWorktopFinish(group, finish) {
      group.userData.worktopFinish = finish;
      group.traverse((o) => {
        if (!isMesh(o) || !o.userData.isWorktop) return;
        if (finish === 'wood') {
          const t = this.room.woodBase.clone();
          t.repeat.set(1.2, 0.6); t.needsUpdate = true; // planks along the worktop
          o.material = new THREE.MeshStandardMaterial({ color: 0xffffff, map: t, roughness: 0.55 });
        } else {
          o.material = new THREE.MeshStandardMaterial({ color: o.userData.baseColor ?? 0x3a3f48, roughness: 0.5, metalness: 0.1 });
        }
        o.castShadow = true; o.receiveShadow = true;
      });
    },

    // Height of the top surface of the tallest furniture whose footprint sits under
    // (x,z) — i.e. what an item dragged there would rest on. 0 if nothing is under it.
    supportUnder(g, x, z) {
      let top = 0;
      for (const f of this.furniture) {
        if (f === g) continue;
        const offX = x - f.position.x, offZ = z - f.position.z;
        const c = Math.cos(f.rotation.y), s = Math.sin(f.rotation.y);
        const lx = c * offX - s * offZ, lz = s * offX + c * offZ;
        if (Math.abs(lx) <= f.userData.w / 2 && Math.abs(lz) <= f.userData.d / 2) {
          const surface = f.position.y + f.userData.h;
          if (surface > top) top = surface;
        }
      }
      return top;
    },
  };
}
