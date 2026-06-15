const STORAGE_KEY = 'roomplan.layouts.v1';
const LEGACY_KEY = 'roomplan.layout.v2'; // single-layout format from before named layouts

// Saving/loading named layouts to localStorage, clearing the scene, and the
// small "flash a message in the readout" helper.
export function usePersistence() {
  return {
    // Bring an old single-layout save into the new named-layouts map, and
    // populate the layout picker. Called once on startup.
    initLayoutStorage() {
      this.currentLayoutName = null;
      const map = this.loadLayoutsMap();
      if (Object.keys(map).length === 0) {
        const legacy = localStorage.getItem(LEGACY_KEY);
        if (legacy) {
          try {
            map['Layout 1'] = JSON.parse(legacy);
            this.saveLayoutsMap(map);
          } catch { /* ignore corrupt legacy data */ }
        }
      }
      this.refreshLayoutSelect();
    },

    loadLayoutsMap() {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
      catch { return {}; }
    },

    saveLayoutsMap(map) { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)); },

    suggestLayoutName(map) {
      let n = 1;
      while (map['Layout ' + n]) n++;
      return 'Layout ' + n;
    },

    refreshLayoutSelect() {
      const sel = document.getElementById('layout-select');
      const map = this.loadLayoutsMap();
      const names = Object.keys(map).sort((a, b) => a.localeCompare(b));
      sel.innerHTML = '';
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = names.length ? 'New layout…' : 'No saved layouts';
      sel.appendChild(placeholder);
      names.forEach((name) => {
        const opt = document.createElement('option');
        opt.value = name; opt.textContent = name;
        sel.appendChild(opt);
      });
      sel.value = this.currentLayoutName && names.includes(this.currentLayoutName) ? this.currentLayoutName : '';
    },

    // Serialize the whole building: every floor (syncing the live scene back
    // into the active floor first) plus which one is active.
    serialize() {
      this.captureActiveFloor();
      return { floors: this.floors, activeFloor: this.activeFloor };
    },

    save() {
      const sel = document.getElementById('layout-select');
      const map = this.loadLayoutsMap();
      let name = sel.value;
      if (!name) {
        name = prompt('Save layout as:', this.suggestLayoutName(map));
        if (!name) return;
        name = name.trim();
        if (!name) return;
      }
      map[name] = this.serialize();
      this.saveLayoutsMap(map);
      this.currentLayoutName = name;
      this.refreshLayoutSelect();
      this.flash(`Saved "${name}"`);
    },

    load() {
      const sel = document.getElementById('layout-select');
      const name = sel.value;
      const map = this.loadLayoutsMap();
      if (!name || !map[name]) { this.flash('Choose a layout to load'); return; }
      this.applyState(map[name]);
      this.currentLayoutName = name;
      this.refreshLayoutSelect();
      this.flash(`Loaded "${name}"`);
    },

    deleteLayout() {
      const sel = document.getElementById('layout-select');
      const name = sel.value;
      if (!name) return;
      if (!confirm(`Delete saved layout "${name}"?`)) return;
      const map = this.loadLayoutsMap();
      delete map[name];
      this.saveLayoutsMap(map);
      if (this.currentLayoutName === name) this.currentLayoutName = null;
      this.refreshLayoutSelect();
      this.flash(`Deleted "${name}"`);
    },

    // Base64url-encode the JSON layout for embedding in a URL hash.
    encodeLayoutForShare(data) {
      const bytes = new TextEncoder().encode(JSON.stringify(data));
      let binary = '';
      bytes.forEach((b) => { binary += String.fromCharCode(b); });
      return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    },

    decodeSharedLayout(encoded) {
      const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
      const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
      const binary = atob(b64 + pad);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(bytes));
    },

    // Copy a link encoding the current layout to the clipboard.
    shareLink() {
      const url = `${location.origin}${location.pathname}#share=${this.encodeLayoutForShare(this.serialize())}`;
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(url)
          .then(() => this.flash('Share link copied!'))
          .catch(() => prompt('Copy this link to share your layout:', url));
      } else {
        prompt('Copy this link to share your layout:', url);
      }
    },

    // If the URL has a #share=... fragment, load that layout and strip it
    // from the address bar. Returns true if a shared layout was applied.
    loadSharedLayoutFromURL() {
      const m = location.hash.match(/^#share=(.+)$/);
      if (!m) return false;
      history.replaceState(null, '', location.pathname + location.search);
      try {
        this.applyState(this.decodeSharedLayout(m[1]));
        this.currentLayoutName = null;
        this.refreshLayoutSelect();
        this.flash('Loaded shared layout — Save to keep it');
        return true;
      } catch {
        this.flash('That share link looks invalid');
        return false;
      }
    },

    // Load a whole building (multi-floor format), or fall back to wrapping an
    // older single-floor save as a one-floor building.
    applyState(data) {
      let floors, activeFloor;
      if (Array.isArray(data.floors)) {
        floors = data.floors.map((f, i) => ({
          name: f.name || this.suggestFloorName(i),
          room: f.room, items: f.items || [], openings: f.openings || [], lights: f.lights || [], walls: f.walls || [],
        }));
        activeFloor = data.activeFloor ?? 0;
      } else {
        floors = [{ name: 'Ground floor', room: data.room, items: data.items || [], openings: data.openings || [], lights: data.lights || [], walls: data.walls || [] }];
        activeFloor = 0;
      }
      if (activeFloor < 0 || activeFloor >= floors.length) activeFloor = 0;
      this.floors = floors;
      this.activeFloor = activeFloor;
      this.applyFloor(this.floors[this.activeFloor]);
      this.buildFloorTabs();
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
