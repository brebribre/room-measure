import { LAYOUTS } from './room.js';
import { createFurniture } from './furniture.js';
import { getOpeningSpec, createOpening } from './openings.js';
import { createWall } from './walls.js';

// Multi-floor support. Each floor holds its own room (shape/vertices/height/
// finishes), furniture, openings, lights and interior walls — fully
// independent. Only the active floor is live in the scene; switching floors
// captures the current scene into `this.floors[this.activeFloor]` and rebuilds
// the scene from the target floor's data.
export function useFloors() {
  return {
    // Snapshot of everything that belongs to the *current* floor.
    serializeFloor() {
      return {
        room: { shape: this.room.shape, height: this.room.height, vertices: this.room.vertices, floorFinish: this.room.floorFinish, wallFinish: this.room.wallFinish, floorColor: this.room.floorColor, wallColor: this.room.wallColor },
        items: this.furniture.map((f) => ({
          type: f.userData.type,
          x: +f.position.x.toFixed(3), y: +f.position.y.toFixed(3), z: +f.position.z.toFixed(3),
          rot: +f.rotation.y.toFixed(4), color: f.userData.color,
          w: +f.userData.w.toFixed(3), d: +f.userData.d.toFixed(3), h: +f.userData.h.toFixed(3),
        })),
        openings: this.openings.map((o) => ({
          type: o.userData.type, edgeIndex: o.userData.edgeIndex, wallIndex: o.userData.wallIndex ?? null, t: +o.userData.t.toFixed(4),
          w: +o.userData.w.toFixed(3), h: +o.userData.h.toFixed(3), sill: +o.userData.sill.toFixed(3),
          lightOn: o.userData.lightOn, intensity: o.userData.intensity, lightColor: o.userData.lightColor,
        })),
        lights: this.lights.map((l) => ({
          type: l.userData.type, x: +l.position.x.toFixed(3), z: +l.position.z.toFixed(3),
          intensity: l.userData.intensity, color: l.userData.color, on: l.userData.on,
        })),
        walls: this.walls.map((w) => ({
          a: [...w.userData.a], b: [...w.userData.b], thickness: w.userData.thickness,
        })),
      };
    },

    // Rebuild the live scene (room, furniture, openings, lights, interior
    // walls) from one floor's saved data.
    applyFloor(data) {
      this.clearAll(true);
      const r = data.room;
      this.room.shape = r.shape || 'custom';
      if (r.vertices) this.room.vertices = r.vertices.map((p) => [...p]);
      this.room.floorFinish = r.floorFinish || 'plain';
      this.room.wallFinish = r.wallFinish || 'plain';
      this.room.floorColor = r.floorColor ?? 0xffffff;
      this.room.wallColor = r.wallColor ?? 0xf1ede4;
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
        const overrides = { w: op.w, h: op.h, sill: op.sill, lightOn: op.lightOn, intensity: op.intensity, lightColor: op.lightColor };
        const g = createOpening(op.type, overrides);
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
        if (lt.on === false) {
          g.userData.on = false;
          g.userData.light.visible = false;
          g.userData.shade.material.emissiveIntensity = 0.05;
          g.userData.bulb.material.emissiveIntensity = 0.1;
        }
        this.scene.add(g);
        this.lights.push(g);
      });
      this.select(null);
    },

    // First-time setup: treat whatever is currently on screen as the ground floor.
    initFloors() {
      this.floors = [{ name: 'Ground floor', ...this.serializeFloor() }];
      this.activeFloor = 0;
      this.buildFloorTabs();
    },

    suggestFloorName(index) {
      return index === 0 ? 'Ground floor' : `Floor ${index}`;
    },

    // Save the live scene back into floors[activeFloor] before switching away
    // from it (or before serializing the whole building).
    captureActiveFloor() {
      const name = this.floors[this.activeFloor]?.name ?? this.suggestFloorName(this.activeFloor);
      this.floors[this.activeFloor] = { name, ...this.serializeFloor() };
    },

    switchFloor(index) {
      if (index === this.activeFloor || !this.floors[index]) return;
      this.captureActiveFloor();
      this.activeFloor = index;
      this.applyFloor(this.floors[index]);
      this.buildFloorTabs();
    },

    // New floor starts with the current floor's room (same footprint/height/
    // finishes, so floors line up) but with no furniture, openings, lights or
    // interior walls of its own.
    addFloor() {
      this.captureActiveFloor();
      const current = this.floors[this.activeFloor];
      const newFloor = {
        name: this.suggestFloorName(this.floors.length),
        room: { ...current.room, vertices: current.room.vertices.map((p) => [...p]) },
        items: [],
        openings: [],
        lights: [],
        walls: [],
      };
      this.floors.push(newFloor);
      this.activeFloor = this.floors.length - 1;
      this.applyFloor(newFloor);
      this.buildFloorTabs();
      this.flash(`Added "${newFloor.name}"`);
    },

    removeFloor(index) {
      if (this.floors.length <= 1) { this.flash('At least one floor is required'); return; }
      const name = this.floors[index].name;
      if (!confirm(`Delete "${name}"? This removes its room, furniture, and openings.`)) return;
      this.floors.splice(index, 1);
      if (index === this.activeFloor) {
        if (this.activeFloor >= this.floors.length) this.activeFloor = this.floors.length - 1;
        this.applyFloor(this.floors[this.activeFloor]);
      } else if (index < this.activeFloor) {
        this.activeFloor--;
      }
      this.buildFloorTabs();
      this.flash(`Deleted "${name}"`);
    },

    renameFloor(index) {
      const floor = this.floors[index];
      const name = prompt('Rename floor:', floor.name);
      if (!name) return;
      const trimmed = name.trim();
      if (!trimmed) return;
      floor.name = trimmed;
      this.buildFloorTabs();
    },

    buildFloorTabs() {
      const container = document.getElementById('floor-tabs');
      container.innerHTML = '';
      this.floors.forEach((floor, i) => {
        const tab = document.createElement('button');
        tab.className = 'floor-tab' + (i === this.activeFloor ? ' active' : '');
        tab.title = 'Double-click to rename';
        const label = document.createElement('span');
        label.textContent = floor.name;
        tab.appendChild(label);
        if (this.floors.length > 1) {
          const remove = document.createElement('span');
          remove.className = 'floor-tab-remove';
          remove.textContent = '×';
          remove.title = 'Delete floor';
          remove.addEventListener('click', (e) => { e.stopPropagation(); this.removeFloor(i); });
          tab.appendChild(remove);
        }
        tab.addEventListener('click', () => this.switchFloor(i));
        tab.addEventListener('dblclick', () => this.renameFloor(i));
        container.appendChild(tab);
      });
    },
  };
}
