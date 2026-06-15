import { CATALOG, SWATCHES } from './furniture.js';
import { DOOR_TYPES, WINDOW_TYPES } from './openings.js';

// Builds the left-hand furniture/openings/lighting catalog and the color
// swatch pickers, and populates the opening "standard size" dropdown.
export function useCatalog() {
  return {
    buildCatalog() {
      const furn = document.getElementById('catalog');
      const kitchen = document.getElementById('kitchen-catalog');
      const bathroom = document.getElementById('bathroom-catalog');
      CATALOG.forEach((entry) => {
        const item = document.createElement('button');
        item.className = 'cat-item';
        item.innerHTML = `<span class="cat-icon">${entry.icon}</span><span class="cat-label">${entry.label}</span>`;
        item.addEventListener('click', () => this.addFurniture(entry.type));
        const target = entry.group === 'kitchen' ? kitchen : entry.group === 'bathroom' ? bathroom : furn;
        target.appendChild(item);
      });
      const make = (container, type, icon, label) => {
        const item = document.createElement('button');
        item.className = 'cat-item';
        item.innerHTML = `<span class="cat-icon">${icon}</span><span class="cat-label">${label}</span>`;
        item.addEventListener('click', () => this.addOpening(type));
        container.appendChild(item);
      };
      const oc = document.getElementById('openings-catalog');
      [['door-std', '🚪', 'Door'], ['door-balcony', '🚪', 'Window door'], ['win-std', '🪟', 'Window']]
        .forEach(([type, icon, label]) => make(oc, type, icon, label));
      const fc = document.getElementById('fixtures-catalog');
      [['cabinet', '🗄', 'Wall cabinet'], ['screen', '📽', 'Projector screen']]
        .forEach(([type, icon, label]) => make(fc, type, icon, label));
      const lc = document.getElementById('lighting-catalog');
      const lamp = document.createElement('button');
      lamp.className = 'cat-item';
      lamp.innerHTML = '<span class="cat-icon">💡</span><span class="cat-label">Ceiling light</span>';
      lamp.addEventListener('click', () => this.addCeilingLight());
      lc.appendChild(lamp);

      const ls = document.getElementById('light-swatches');
      this.LIGHT_COLORS.forEach((hex) => {
        const s = document.createElement('span');
        s.className = 'swatch';
        s.style.background = '#' + hex.toString(16).padStart(6, '0');
        s.dataset.hex = hex;
        s.addEventListener('click', () => this.setLightColor(hex));
        ls.appendChild(s);
      });
    },

    buildSwatches() {
      const el = document.getElementById('sel-swatches');
      SWATCHES.forEach((hex) => {
        const s = document.createElement('span');
        s.className = 'swatch';
        s.style.background = '#' + hex.toString(16).padStart(6, '0');
        s.dataset.hex = hex;
        s.addEventListener('click', () => this.recolorSelected(hex));
        el.appendChild(s);
      });
    },

    buildOpeningTypeSelect() {
      this.opTypeSel = document.getElementById('op-type');
    },

    fillOpeningTypeSelect(kind) {
      const list = kind === 'door' ? DOOR_TYPES : WINDOW_TYPES;
      this.opTypeSel.innerHTML = '';
      list.forEach((o) => {
        const opt = document.createElement('option');
        opt.value = o.type; opt.textContent = o.label;
        this.opTypeSel.appendChild(opt);
      });
    },
  };
}
