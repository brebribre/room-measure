import * as THREE from 'three';
import { createFurniture, getVariant } from './furniture.js';

// Furniture placement, sizing/variant presets, recoloring and worktop
// finishes, plus the floor-collision helpers used while dragging.
export function useFurniture() {
  return {
    addFurniture(type, pos) {
      const group = createFurniture(type);
      const { w, d } = group.userData;
      const pref = pos ?? { x: (Math.random() - 0.5) * 1.5, z: (Math.random() - 0.5) * 1.5 };
      const c = this.room.findPlacement(0, w, d, pref, (x, z, rot, w, d) => this.wallsBlock(x, z, rot, w, d));
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
        (x, z, rot, w, d) => this.wallsBlock(x, z, rot, w, d));
      group.position.x = c.x; group.position.z = c.z;
    },

    // Non-uniformly scale a furniture group from its base mesh dimensions.
    applyFurnitureScale(g) {
      const u = g.userData;
      g.scale.set(u.w / u.baseW, u.h / u.baseH, u.d / u.baseD);
    },

    // Populate / show the size-preset dropdown for furniture types that have variants.
    updateVariantUI(u) {
      const field = document.getElementById('sel-variant-field');
      const sel = document.getElementById('sel-variant');
      const variant = getVariant(u.type);
      if (!variant) { field.hidden = true; return; }
      field.hidden = false;
      document.getElementById('sel-variant-label').textContent = variant.label;
      sel.innerHTML = '';
      let matched = false;
      variant.options.forEach((o) => {
        const opt = document.createElement('option');
        opt.value = o.id; opt.textContent = o.label;
        // Match the current footprint to a preset (within 1 cm).
        if (Math.abs(o.w - u.w) < 0.01 && Math.abs(o.d - u.d) < 0.01) { opt.selected = true; matched = true; }
        sel.appendChild(opt);
      });
      if (!matched) {
        const opt = document.createElement('option');
        opt.value = 'custom'; opt.textContent = 'Custom'; opt.selected = true;
        sel.appendChild(opt);
      }
    },

    applyVariant(id) {
      const g = this.selected;
      if (!g || !g.userData.isFurniture) return;
      const variant = getVariant(g.userData.type);
      const opt = variant && variant.options.find((o) => o.id === id);
      if (!opt) return;
      g.userData.w = opt.w;
      g.userData.d = opt.d;
      this.applyFurnitureScale(g);
      this.reclamp(g);
      this.setSizeSlider('sel-w', opt.w);
      this.setSizeSlider('sel-d', opt.d);
    },

    setSizeSlider(id, value) {
      const el = document.getElementById(id);
      el.value = Math.min(Math.max(value, el.min), el.max);
      document.getElementById(id + '-val').textContent = value.toFixed(2) + ' m';
    },

    // dim: 'w' | 'd' | 'h'
    resizeSelected(dim, value) {
      const g = this.selected;
      if (!g || !g.userData.isFurniture) return;
      g.userData[dim] = value;
      this.applyFurnitureScale(g);
      if (dim !== 'h') this.reclamp(g); // height doesn't affect the floor footprint
      document.getElementById('sel-' + dim + '-val').textContent = value.toFixed(2) + ' m';
      if (dim !== 'h' && getVariant(g.userData.type)) this.updateVariantUI(g.userData);
    },

    resetSelectedSize() {
      const g = this.selected;
      if (!g || !g.userData.isFurniture) return;
      const u = g.userData;
      u.w = u.baseW; u.d = u.baseD; u.h = u.baseH;
      this.applyFurnitureScale(g);
      this.reclamp(g);
      this.updateInspector();
    },

    recolorSelected(hex) { if (this.selected && this.selected.userData.isFurniture) { this.recolor(this.selected, hex); this.updateInspector(); } },

    recolor(group, hex) {
      group.userData.color = hex;
      group.traverse((o) => {
        if (o.isMesh && o.material && !o.userData.isWorktop) {
          const { l } = o.material.color.getHSL({});
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
        if (!o.isMesh || !o.userData.isWorktop) return;
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
