import { isFurnitureGroup, isLightGroup, isOpeningGroup, isStandardMesh, isWallGroup } from './types';
import type { Editor, SelectionMixin } from './Editor';

// Selection state and selection-scoped actions (rotate, duplicate, delete).
// The inspector panel renders from the store snapshot (see useStoreSync.ts),
// so every change here ends with syncSelection() instead of touching the DOM.
export function useSelection(): SelectionMixin & ThisType<Editor> {
  return {
    select(obj) {
      if (this.selected) this.setHighlight(this.selected, false);
      this.selected = obj;
      if (obj) this.setHighlight(obj, true);
      this.syncSelection();
    },

    setHighlight(group, on) {
      if (isLightGroup(group)) return; // lights are emissive already — don't tint them
      group.traverse((o) => {
        if (isStandardMesh(o) && !o.userData.keepEmissive) { // skip glowing lamp parts
          o.material.emissive.setHex(on ? 0x33415f : 0x000000);
        }
      });
    },

    // Rotation slider in the inspector: degrees, furniture only.
    setSelectedRotation(deg) {
      if (!this.selected || !isFurnitureGroup(this.selected)) return;
      const selected = this.selected;
      selected.rotation.y = deg * Math.PI / 180;
      this.reclamp(selected);
      this.syncSelection();
    },

    rotateSelected() {
      if (!this.selected) return;
      if (isWallGroup(this.selected)) {
        this.rotateWall(this.selected);
        return;
      }
      if (!isFurnitureGroup(this.selected)) return;
      const selected = this.selected;
      selected.rotation.y += Math.PI / 2;
      this.reclamp(selected);
      this.syncSelection();
    },

    duplicateSelected() {
      if (!this.selected) return;
      const s = this.selected;
      if (isWallGroup(s)) {
        const offset = 0.4;
        const copy = this.addWall(
          [s.userData.a[0] + offset, s.userData.a[1] + offset],
          [s.userData.b[0] + offset, s.userData.b[1] + offset],
          s.userData.thickness
        );
        this.select(copy);
        return;
      }
      if (isOpeningGroup(s)) {
        const copy = this.addOpening(s.userData.type, s.userData.edgeIndex,
          { w: s.userData.w, h: s.userData.h, sill: s.userData.sill, lightOn: s.userData.lightOn, intensity: s.userData.intensity, lightColor: s.userData.lightColor });
        copy.userData.wallIndex = s.userData.wallIndex;
        copy.userData.t = Math.min(0.92, s.userData.t + 0.12);
        this.positionOpening(copy);
        this.select(copy);
        return;
      }
      if (isLightGroup(s)) {
        const copy = this.addCeilingLight({ x: s.position.x + 0.4, z: s.position.z + 0.4 });
        this.selected = copy; this.setLightColor(s.userData.color); this.setLightIntensity(s.userData.intensity);
        this.select(copy);
        return;
      }
      const copy = this.addFurniture(s.userData.type, { x: s.position.x + 0.3, z: s.position.z + 0.3 });
      copy.rotation.y = s.rotation.y;
      this.recolor(copy, s.userData.color);
      copy.userData.w = s.userData.w; copy.userData.d = s.userData.d; copy.userData.h = s.userData.h;
      this.applyFurnitureScale(copy);
      const c = this.room.findPlacement(copy.rotation.y, copy.userData.w, copy.userData.d,
        { x: s.position.x + 0.3, z: s.position.z + 0.3 },
        (x: number, z: number, rot: number, w: number, d: number) => this.wallsBlock(x, z, rot, w, d));
      copy.position.set(c.x, 0, c.z);
      this.syncSelection();
    },

    /* ---------- Delete (generic) ---------- */
    deleteSelected() {
      const s = this.selected;
      if (!s) return;
      this.scene.remove(s);
      this.furniture = this.furniture.filter((f) => f !== s);
      this.openings = this.openings.filter((o) => o !== s);
      this.lights = this.lights.filter((l) => l !== s);
      if (isWallGroup(s)) {
        const idx = this.walls.indexOf(s);
        this.walls = this.walls.filter((w) => w !== s);
        this.openings.forEach((o) => {
          if (o.userData.wallIndex === idx) {
            o.userData.wallIndex = null;
            o.userData.edgeIndex = this.room.longestEdge();
            this.positionOpening(o);
          } else if (o.userData.wallIndex != null && o.userData.wallIndex > idx) {
            o.userData.wallIndex -= 1;
          }
        });
        this.rebuildWallHandles();
      }
      this.refreshWallOpenings();
      this.select(null);
    },
  };
}
