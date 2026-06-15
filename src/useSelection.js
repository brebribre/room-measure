import * as THREE from 'three';
import { wallLength } from './walls.js';

// Selection state, the right-hand inspector panel, and selection-scoped
// actions (rotate, duplicate, delete).
export function useSelection() {
  return {
    select(obj) {
      if (this.selected) this.setHighlight(this.selected, false);
      this.selected = obj;
      if (obj) this.setHighlight(obj, true);
      this.updateInspector();
    },

    setHighlight(group, on) {
      if (group.userData.isLight) return; // lights are emissive already — don't tint them
      group.traverse((o) => {
        if (o.isMesh && o.material) {
          o.material.emissive = o.material.emissive ?? new THREE.Color(0x000000);
          o.material.emissive.setHex(on ? 0x33415f : 0x000000);
        }
      });
    },

    updateInspector() {
      const none = document.getElementById('no-selection');
      const fdet = document.getElementById('selection-details');
      const odet = document.getElementById('opening-details');
      const ldet = document.getElementById('light-details');
      const wdet = document.getElementById('wall-details');
      const rotateFab = document.getElementById('fab-rotate');
      const deleteFab = document.getElementById('fab-delete');
      const sel = this.selected;

      none.hidden = !!sel;
      fdet.hidden = !(sel && sel.userData.isFurniture);
      odet.hidden = !(sel && sel.userData.isOpening);
      ldet.hidden = !(sel && sel.userData.isLight);
      wdet.hidden = !(sel && sel.userData.isWall);
      deleteFab.disabled = !sel;
      rotateFab.disabled = !(sel && (sel.userData.isFurniture || sel.userData.isWall));
      if (!sel) return;

      if (sel.userData.isWall) {
        const len = wallLength(sel);
        document.getElementById('wall-length').value = len;
        document.getElementById('wall-length-val').textContent = len.toFixed(2) + ' m';
        document.getElementById('wall-thickness').value = sel.userData.thickness;
        document.getElementById('wall-thickness-val').textContent = Math.round(sel.userData.thickness * 100) + ' cm';
        return;
      }

      if (sel.userData.isLight) {
        const u = sel.userData;
        document.getElementById('light-int').value = u.intensity;
        document.getElementById('light-int-val').textContent = u.intensity;
        document.querySelectorAll('#light-swatches .swatch').forEach((s) =>
          s.classList.toggle('active', Number(s.dataset.hex) === u.color));
        const toggleLightBtn = document.getElementById('btn-toggle-light');
        toggleLightBtn.textContent = u.on ? 'Turn light off' : 'Turn light on';
        toggleLightBtn.classList.toggle('btn-off', !u.on);
        return;
      }

      const u = sel.userData;
      if (u.isFurniture) {
        document.getElementById('sel-name').textContent = u.label;
        this.updateVariantUI(u);
        this.setSizeSlider('sel-w', u.w);
        this.setSizeSlider('sel-d', u.d);
        this.setSizeSlider('sel-h', u.h);
        this.applyRotationUI();
        document.querySelectorAll('.swatch').forEach((s) =>
          s.classList.toggle('active', Number(s.dataset.hex) === u.color));
      } else {
        const names = { cabinet: 'Wall cabinet', screen: 'Projector screen' };
        const hasSizes = u.kind === 'door' || u.kind === 'window';
        const isWindow = u.kind === 'window';
        const isGlazedDoor = u.kind === 'door' && u.glazed;
        const showW = isWindow || u.kind === 'cabinet';
        const showH = isWindow || u.kind === 'cabinet' || isGlazedDoor;
        document.getElementById('op-name').textContent =
          u.glazed ? 'Window door' : (names[u.kind] || (u.kind === 'door' ? 'Door' : 'Window'));
        document.getElementById('op-size-row').hidden = showW || showH;
        document.getElementById('op-size').textContent =
          `${Math.round(u.w * 1000)} × ${Math.round(u.h * 1000)} mm`;
        document.getElementById('op-w-field').hidden = !showW;
        document.getElementById('op-h-field').hidden = !showH;
        if (showW) this.setSizeSlider('op-w', u.w);
        if (showH) this.setSizeSlider('op-h', u.h);
        document.getElementById('op-sill-row').hidden = u.kind === 'door' || isWindow;
        document.getElementById('op-sill-field').hidden = !isWindow;
        document.getElementById('op-sill-label').textContent = isWindow ? 'Sill height' : 'Mounting height';
        document.getElementById('op-sill').textContent = `${Math.round(u.sill * 1000)} mm`;
        if (isWindow) this.setSizeSlider('op-sill-slider', u.sill);
        document.getElementById('op-type-field').hidden = !hasSizes;
        const toggleSunBtn = document.getElementById('btn-toggle-sun');
        toggleSunBtn.hidden = !u.sun;
        if (u.sun) {
          toggleSunBtn.textContent = u.lightOn ? 'Turn sunlight off' : 'Turn sunlight on';
          toggleSunBtn.classList.toggle('btn-off', !u.lightOn);
        }
        document.getElementById('op-note').textContent =
          u.glazed ? 'Fenstertür — a full-height glazed balcony/patio door that doubles as a window.'
          : u.kind === 'door' ? 'DIN 18101 standard door sizes.'
          : u.kind === 'window' ? 'Sill at 0.90 m — the German Brüstungshöhe (below it needs fall protection).'
          : u.kind === 'cabinet' ? 'Wall-mounted upper cabinet (Hängeschrank), bottom edge at 1.45 m.'
          : 'Pull-down projector screen mounted on the wall; drag it along any wall.';
        if (hasSizes) { this.fillOpeningTypeSelect(u.kind); this.opTypeSel.value = u.type; }
      }
    },

    applyRotationUI() {
      if (!this.selected || !this.selected.userData.isFurniture) return;
      let deg = Math.round((this.selected.rotation.y * 180 / Math.PI) % 360);
      if (deg < 0) deg += 360;
      document.getElementById('sel-rot').value = deg - (deg % 15);
      document.getElementById('sel-rot-val').textContent = deg + '°';
    },

    rotateSelected() {
      if (!this.selected) return;
      if (this.selected.userData.isWall) {
        this.rotateWall(this.selected);
        return;
      }
      if (!this.selected.userData.isFurniture) return;
      this.selected.rotation.y += Math.PI / 2;
      this.applyRotationUI();
      this.reclamp(this.selected);
    },

    duplicateSelected() {
      if (!this.selected) return;
      const s = this.selected;
      if (s.userData.isWall) {
        const offset = 0.4;
        const copy = this.addWall(
          [s.userData.a[0] + offset, s.userData.a[1] + offset],
          [s.userData.b[0] + offset, s.userData.b[1] + offset],
          s.userData.thickness
        );
        this.select(copy);
        return;
      }
      if (s.userData.isOpening) {
        const copy = this.addOpening(s.userData.type, s.userData.edgeIndex,
          { w: s.userData.w, h: s.userData.h, sill: s.userData.sill, lightOn: s.userData.lightOn });
        copy.userData.wallIndex = s.userData.wallIndex;
        copy.userData.t = Math.min(0.92, s.userData.t + 0.12);
        this.positionOpening(copy);
        this.select(copy);
        return;
      }
      if (s.userData.isLight) {
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
        { x: s.position.x + 0.3, z: s.position.z + 0.3 }, (x, z, rot, w, d) => this.wallsBlock(x, z, rot, w, d));
      copy.position.set(c.x, 0, c.z);
      this.updateInspector();
    },

    /* ---------- Delete (generic) ---------- */
    deleteSelected() {
      const s = this.selected;
      if (!s) return;
      this.scene.remove(s);
      this.furniture = this.furniture.filter((f) => f !== s);
      this.openings = this.openings.filter((o) => o !== s);
      this.lights = this.lights.filter((l) => l !== s);
      if (s.userData.isWall) {
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
