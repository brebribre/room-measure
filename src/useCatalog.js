import { CATALOG } from './furniture.js';
import { DOOR_TYPES, WINDOW_TYPES } from './openings.js';
import { icon } from './icons.js';

// Builds the left-hand furniture/openings/lighting catalog and the color
// swatch pickers, and populates the opening "standard size" dropdown.
export function useCatalog() {
  return {
    buildCatalog() {
      const furn = document.getElementById('catalog');
      const kitchen = document.getElementById('kitchen-catalog');
      const bathroom = document.getElementById('bathroom-catalog');
      const stairs = document.getElementById('stairs-catalog');
      const lighting = document.getElementById('lighting-catalog');
      const GROUP_TARGETS = { kitchen, bathroom, structure: stairs, lighting };
      CATALOG.forEach((entry) => {
        const item = document.createElement('button');
        item.className = 'cat-item';
        item.innerHTML = `<span class="cat-icon">${icon(entry.icon)}</span><span class="cat-label">${entry.label}</span>`;
        item.addEventListener('click', () => this.addFurniture(entry.type));
        const target = GROUP_TARGETS[entry.group] || furn;
        target.appendChild(item);
      });
      const make = (container, type, iconName, label) => {
        const item = document.createElement('button');
        item.className = 'cat-item';
        item.innerHTML = `<span class="cat-icon">${icon(iconName)}</span><span class="cat-label">${label}</span>`;
        item.addEventListener('click', () => this.addOpening(type));
        container.appendChild(item);
      };
      const oc = document.getElementById('openings-catalog');
      [['door-std', 'door', 'Door'], ['door-balcony', 'window-door', 'Window door'], ['win-std', 'window', 'Window']]
        .forEach(([type, iconName, label]) => make(oc, type, iconName, label));
      const fc = document.getElementById('fixtures-catalog');
      [['cabinet', 'cabinet', 'Wall cabinet'], ['screen', 'screen', 'Projector screen']]
        .forEach(([type, iconName, label]) => make(fc, type, iconName, label));
      const lc = document.getElementById('lighting-catalog');
      make(lc, 'wall-lamp', 'wall-lamp', 'Wall lamp'); // wall-mounted opening, not furniture
      const lamp = document.createElement('button');
      lamp.className = 'cat-item';
      lamp.innerHTML = `<span class="cat-icon">${icon('ceiling-light')}</span><span class="cat-label">Ceiling light</span>`;
      lamp.addEventListener('click', () => this.addCeilingLight());
      lc.appendChild(lamp);

      const swatchRow = (containerId, onPick) => {
        const el = document.getElementById(containerId);
        this.LIGHT_COLORS.forEach((hex) => {
          const s = document.createElement('span');
          s.className = 'swatch';
          s.style.background = '#' + hex.toString(16).padStart(6, '0');
          s.dataset.hex = hex;
          s.addEventListener('click', () => onPick(hex));
          el.appendChild(s);
        });
      };
      swatchRow('light-swatches', (hex) => this.setLightColor(hex));      // ceiling light
      swatchRow('op-light-swatches', (hex) => this.setOpeningLightColor(hex)); // wall lamp
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
