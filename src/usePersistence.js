import { LAYOUTS } from './room.js';
import { createFurniture } from './furniture.js';
import { getOpeningSpec, createOpening } from './openings.js';
import { createWall } from './walls.js';

const STORAGE_KEY = 'roomplan.layout.v2';

// Saving/loading the layout to localStorage, clearing the scene, and the
// small "flash a message in the readout" helper.
export function usePersistence() {
  return {
    serialize() {
      return {
        room: { shape: this.room.shape, height: this.room.height, vertices: this.room.vertices, floorFinish: this.room.floorFinish, wallFinish: this.room.wallFinish },
        items: this.furniture.map((f) => ({
          type: f.userData.type,
          x: +f.position.x.toFixed(3), y: +f.position.y.toFixed(3), z: +f.position.z.toFixed(3),
          rot: +f.rotation.y.toFixed(4), color: f.userData.color,
          w: +f.userData.w.toFixed(3), d: +f.userData.d.toFixed(3), h: +f.userData.h.toFixed(3),
        })),
        openings: this.openings.map((o) => ({
          type: o.userData.type, edgeIndex: o.userData.edgeIndex, wallIndex: o.userData.wallIndex ?? null, t: +o.userData.t.toFixed(4),
        })),
        lights: this.lights.map((l) => ({
          type: l.userData.type, x: +l.position.x.toFixed(3), z: +l.position.z.toFixed(3),
          intensity: l.userData.intensity, color: l.userData.color,
        })),
        walls: this.walls.map((w) => ({
          a: [...w.userData.a], b: [...w.userData.b], thickness: w.userData.thickness,
        })),
      };
    },

    save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.serialize())); this.flash('Saved'); },

    load() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { this.flash('No saved layout'); return; }
      this.applyState(JSON.parse(raw));
      this.flash('Loaded');
    },

    applyState(data) {
      this.clearAll(true);
      const r = data.room;
      this.room.shape = r.shape || 'custom';
      if (r.vertices) this.room.vertices = r.vertices.map((p) => [...p]);
      this.room.floorFinish = r.floorFinish || 'plain';
      this.room.wallFinish = r.wallFinish || 'plain';
      this.room.setHeight(r.height);
      document.getElementById('room-shape').value = LAYOUTS[this.room.shape] ? this.room.shape : 'rectangle';
      document.getElementById('floor-finish').value = this.room.floorFinish;
      document.getElementById('wall-finish').value = this.room.wallFinish;
      document.getElementById('room-h').value = r.height;
      document.getElementById('rh-val').textContent = r.height.toFixed(1) + ' m';
      this.rebuildHandles();
      this.updateRoomControls();
      (data.walls || []).forEach((w) => {
        const g = createWall(w.a, w.b, w.thickness, this.room.height);
        this.scene.add(g);
        this.walls.push(g);
      });
      this.rebuildWallHandles();
      (data.items || []).forEach((it) => {
        const g = createFurniture(it.type, it.color);
        g.rotation.y = it.rot;
        if (it.w != null) { g.userData.w = it.w; g.userData.d = it.d; g.userData.h = it.h; this.applyFurnitureScale(g); }
        g.position.set(it.x, it.y ?? 0, it.z);
        this.scene.add(g);
        this.furniture.push(g);
      });
      (data.openings || []).forEach((op) => {
        if (!getOpeningSpec(op.type)) return; // skip types removed since the save
        const g = createOpening(op.type);
        g.userData.edgeIndex = op.edgeIndex;
        g.userData.wallIndex = op.wallIndex ?? null;
        g.userData.t = op.t;
        this.positionOpening(g);
        this.scene.add(g);
        this.openings.push(g);
      });
      (data.lights || []).forEach((lt) => {
        const g = this.makeCeilingLight();
        g.position.set(lt.x, this.room.height - 0.02, lt.z);
        g.userData.intensity = lt.intensity; g.userData.light.intensity = lt.intensity;
        g.userData.color = lt.color; g.userData.light.color.setHex(lt.color);
        this.scene.add(g);
        this.lights.push(g);
      });
      this.select(null);
    },

    clearAll(silent) {
      [...this.furniture, ...this.openings, ...this.lights, ...this.walls].forEach((o) => this.scene.remove(o));
      this.furniture = [];
      this.openings = [];
      this.lights = [];
      this.walls = [];
      this.wallHandleGroup.clear();
      this.wallHandleMeshes = [];
      this.select(null);
      if (!silent) this.flash('Cleared');
    },

    flash(msg) {
      const el = document.getElementById('readout');
      const prev = el.textContent;
      el.textContent = msg;
      clearTimeout(this._flashT);
      this._flashT = setTimeout(() => { el.textContent = prev; }, 1400);
    },
  };
}
