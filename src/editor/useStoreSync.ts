import { store } from '../store';
import type { Selection } from '../store';
import { getVariant } from './furniture';
import { wallLength } from './walls';
import { isFurnitureGroup, isLightGroup, isOpeningGroup, isWallGroup } from './types';
import type { SceneObject } from './types';
import type { Editor, StoreSyncMixin } from './Editor';

// The one place the editor writes to the store. Each sync method copies plain
// values out of the live scene; the panels render from those and never read a
// Three.js object.
export function useStoreSync(): StoreSyncMixin & ThisType<Editor> {
  return {
    syncRoom() {
      const r = this.room;
      store.room = {
        shape: r.shape,
        width: r.bboxWidth,
        length: r.bboxLength,
        height: r.height,
        area: r.area,
        floorFinish: r.floorFinish,
        wallFinish: r.wallFinish,
        floorColor: r.floorColor,
        wallColor: r.wallColor,
      };
    },

    syncSelection() {
      store.selection = snapshot(this.selected);
    },

    syncFloors() {
      store.floors = this.floors.map((f) => f.name);
      store.activeFloor = this.activeFloor;
    },

    syncLayouts() {
      const names = Object.keys(this.loadLayoutsMap()).sort((a, b) => a.localeCompare(b));
      store.layouts = names;
      store.layoutPick =
        this.currentLayoutName && names.includes(this.currentLayoutName) ? this.currentLayoutName : '';
    },

    setReadout(text) {
      store.readout = text;
    },

    flash(msg) {
      store.flash = msg;
      clearTimeout(this.flashTimer);
      this.flashTimer = setTimeout(() => {
        store.flash = null;
      }, 1400);
    },
  };
}

function snapshot(sel: SceneObject | null): Selection | null {
  if (!sel) return null;

  if (isWallGroup(sel)) {
    return { kind: 'wall', length: wallLength(sel), thickness: sel.userData.thickness };
  }

  if (isLightGroup(sel)) {
    const u = sel.userData;
    return { kind: 'light', intensity: u.intensity, color: u.color, on: u.on };
  }

  if (isOpeningGroup(sel)) {
    const u = sel.userData;
    return {
      kind: 'opening',
      openingKind: u.kind,
      type: u.type,
      glazed: u.glazed,
      w: u.w,
      h: u.h,
      sill: u.sill,
      hasEmitter: !!(u.sun || u.light),
      lightOn: u.lightOn,
      intensity: u.intensity,
      lightColor: u.lightColor,
    };
  }

  if (isFurnitureGroup(sel)) {
    const u = sel.userData;
    let deg = Math.round(((sel.rotation.y * 180) / Math.PI) % 360);
    if (deg < 0) deg += 360;
    const variant = getVariant(u.type);
    // Match the current footprint to a preset (within 1 cm).
    const matched = variant?.options.find((o) => Math.abs(o.w - u.w) < 0.01 && Math.abs(o.d - u.d) < 0.01);
    return {
      kind: 'furniture',
      type: u.type,
      label: u.label,
      w: u.w,
      d: u.d,
      h: u.h,
      rotationDeg: deg,
      color: u.color,
      variant: variant
        ? {
            label: variant.label,
            options: variant.options.map((o) => ({ id: o.id, label: o.label })),
            value: matched ? matched.id : 'custom',
          }
        : null,
    };
  }

  return null;
}
