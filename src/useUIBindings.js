import { LAYOUTS } from './room.js';
import { rebuildWall } from './walls.js';

// Wires up all the static DOM controls in the top bar and inspector panels,
// plus global keyboard shortcuts and walk-mode movement keys.
export function useUIBindings() {
  return {
    bindUI() {
      document.getElementById('view-tabs').addEventListener('click', (e) => {
        const tab = e.target.closest('.tab');
        if (!tab) return;
        document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this.setView(tab.dataset.view);
      });

      const shapeSel = document.getElementById('room-shape');
      Object.entries(LAYOUTS).forEach(([key, def]) => {
        const opt = document.createElement('option');
        opt.value = key; opt.textContent = def.label;
        shapeSel.appendChild(opt);
      });
      shapeSel.value = this.room.shape;
      shapeSel.addEventListener('change', (e) => {
        this.room.setShape(e.target.value);
        this.afterRoomChange();
      });

      document.getElementById('room-w').addEventListener('input', (e) => {
        const target = parseFloat(e.target.value);
        const f = target / (this.room.bboxWidth || 1);
        this.room.scaleWidthTo(target);
        this.walls.forEach((w) => { w.userData.a[0] *= f; w.userData.b[0] *= f; rebuildWall(w); });
        this.afterRoomChange(false);
      });
      document.getElementById('room-l').addEventListener('input', (e) => {
        const target = parseFloat(e.target.value);
        const f = target / (this.room.bboxLength || 1);
        this.room.scaleLengthTo(target);
        this.walls.forEach((w) => { w.userData.a[1] *= f; w.userData.b[1] *= f; rebuildWall(w); });
        this.afterRoomChange(false);
      });
      document.getElementById('room-h').addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        document.getElementById('rh-val').textContent = v.toFixed(1) + ' m';
        this.room.setHeight(v);
        this.walls.forEach((w) => { w.userData.height = v; rebuildWall(w); });
        this.refreshOpenings();
        this.lights.forEach((l) => { l.position.y = this.room.height - 0.02; }); // keep on the ceiling
      });
      document.getElementById('floor-finish').addEventListener('change', (e) => this.room.setFloorFinish(e.target.value));
      document.getElementById('wall-finish').addEventListener('change', (e) => this.room.setWallFinish(e.target.value));
      document.getElementById('floor-color').addEventListener('input', (e) => this.room.setFloorColor(parseInt(e.target.value.slice(1), 16)));
      document.getElementById('wall-color').addEventListener('input', (e) => this.room.setWallColor(parseInt(e.target.value.slice(1), 16)));

      document.getElementById('sel-rot').addEventListener('input', (e) => {
        if (!this.selected || !this.selected.userData.isFurniture) return;
        this.selected.rotation.y = parseFloat(e.target.value) * Math.PI / 180;
        document.getElementById('sel-rot-val').textContent = e.target.value + '°';
        this.reclamp(this.selected);
      });

      ['w', 'd', 'h'].forEach((dim) => {
        document.getElementById('sel-' + dim).addEventListener('input', (e) =>
          this.resizeSelected(dim, parseFloat(e.target.value)));
      });
      document.getElementById('sel-variant').addEventListener('change', (e) => this.applyVariant(e.target.value));
      document.getElementById('sel-color').addEventListener('input', (e) => this.recolorSelected(parseInt(e.target.value.slice(1), 16)));
      document.getElementById('btn-reset-size').addEventListener('click', () => this.resetSelectedSize());
      document.getElementById('light-int').addEventListener('input', (e) => this.setLightIntensity(parseFloat(e.target.value)));
      document.getElementById('btn-toggle-light').addEventListener('click', () => this.toggleLight());
      document.getElementById('btn-duplicate-light').addEventListener('click', () => this.duplicateSelected());

      document.getElementById('op-type').addEventListener('change', (e) => this.changeOpeningType(e.target.value));
      ['w', 'h'].forEach((dim) => {
        document.getElementById('op-' + dim).addEventListener('input', (e) =>
          this.resizeOpening(dim, parseFloat(e.target.value)));
      });
      document.getElementById('op-sill-slider').addEventListener('input', (e) =>
        this.resizeOpening('sill', parseFloat(e.target.value)));
      document.getElementById('op-bright').addEventListener('input', (e) => this.setOpeningBrightness(parseFloat(e.target.value)));
      document.getElementById('btn-toggle-sun').addEventListener('click', () => this.toggleOpeningLight());
      document.getElementById('btn-duplicate').addEventListener('click', () => this.duplicateSelected());
      document.getElementById('btn-duplicate-op').addEventListener('click', () => this.duplicateSelected());
      document.getElementById('btn-duplicate-wall').addEventListener('click', () => this.duplicateSelected());
      document.getElementById('btn-add-wall').addEventListener('click', () => this.addWall());
      document.getElementById('wall-length').addEventListener('input', (e) => {
        if (!this.selected || !this.selected.userData.isWall) return;
        this.resizeWall(this.selected, parseFloat(e.target.value));
      });
      document.getElementById('wall-thickness').addEventListener('input', (e) => {
        if (!this.selected || !this.selected.userData.isWall) return;
        const v = parseFloat(e.target.value);
        this.selected.userData.thickness = v;
        rebuildWall(this.selected, this.doorGapsForWall(this.walls.indexOf(this.selected)));
        document.getElementById('wall-thickness-val').textContent = Math.round(v * 100) + ' cm';
        this.furniture.forEach((f) => this.reclamp(f));
      });
      document.getElementById('fab-rotate').addEventListener('click', () => this.rotateSelected());
      document.getElementById('fab-delete').addEventListener('click', () => this.deleteSelected());
      document.getElementById('btn-save').addEventListener('click', () => this.save());
      document.getElementById('btn-load').addEventListener('click', () => this.load());
      document.getElementById('btn-delete-layout').addEventListener('click', () => this.deleteLayout());
      document.getElementById('btn-share').addEventListener('click', () => this.shareLink());
      document.getElementById('btn-clear').addEventListener('click', () => this.clearAll());
      document.getElementById('btn-add-floor').addEventListener('click', () => this.addFloor());

      window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        if (this.view === 'walk') {
          if ((e.key === 'e' || e.key === 'E') && this.plControls.isLocked) this.interactNearestOpening();
          return; // walking uses WASD, not the editor shortcuts
        }
        if (e.key === 'r' || e.key === 'R') this.rotateSelected();
        if (e.key === 'Delete' || e.key === 'Backspace') this.deleteSelected();
        if ((e.key === 'd' || e.key === 'D') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); this.duplicateSelected(); }
        if (e.key === 'Escape') this.select(null);
      });

      // Walk-mode movement keys
      const KEYMAP = { KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r' };
      window.addEventListener('keydown', (e) => { const k = KEYMAP[e.code]; if (k && this.view === 'walk') { this.move[k] = true; e.preventDefault(); } });
      window.addEventListener('keyup', (e) => { const k = KEYMAP[e.code]; if (k) this.move[k] = false; });
    },
  };
}
