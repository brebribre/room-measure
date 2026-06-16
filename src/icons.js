// Inline line-icon set — no emoji, no external dependencies. Every glyph is
// drawn on a 24×24 grid with a 1.6px stroke and inherits `currentColor`, so CSS
// alone controls size and colour. Render one with `icon(name)`, or mark up an
// element with `data-icon="name"` and call `hydrateIcons()` to fill it.
const PATHS = {
  /* ---- Furniture ---- */
  bed: '<path d="M3 4v16"/><path d="M3 9h16a2 2 0 0 1 2 2v9"/><path d="M3 16h18"/><path d="M7 9v4"/>',
  sofa: '<path d="M4 9V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2"/><path d="M3 10a1.5 1.5 0 0 1 1.5 1.5V15h15v-3.5A1.5 1.5 0 0 1 21 10"/><path d="M4.5 15v2h15v-2"/><path d="M6 17v2"/><path d="M18 17v2"/>',
  table: '<rect x="2" y="7" width="20" height="2.5" rx="0.5"/><path d="M5 9.5V20"/><path d="M19 9.5V20"/>',
  desk: '<rect x="2" y="6.5" width="20" height="2.5" rx="0.5"/><path d="M4 9V20"/><rect x="13" y="9" width="7" height="9" rx="0.5"/><path d="M15.5 12.5h2"/>',
  chair: '<path d="M7 3v8"/><path d="M17 3v8"/><path d="M7 4.5h10"/><rect x="5" y="11" width="14" height="3" rx="0.5"/><path d="M7 14v6"/><path d="M17 14v6"/>',
  wardrobe: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M12 3v18"/><path d="M10 11h1"/><path d="M13 11h1"/>',
  rug: '<rect x="3" y="6" width="18" height="12" rx="1"/><rect x="6.5" y="9" width="11" height="6" rx="0.5"/>',
  plant: '<path d="M8.5 21h7"/><path d="M9.5 21 9 14h6l-.5 7"/><path d="M12 14c0-3 1.2-4.8 4-5.5"/><path d="M12 14c0-3.5-1.6-5.3-4.5-5.5"/><path d="M12 14V9"/>',
  tv: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8"/><path d="M12 16v4"/>',
  shelf: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M4 9h16"/><path d="M4 15h16"/><path d="M7 5v2.5"/><path d="M9.5 5v2.5"/><path d="M12 5v2.5"/>',
  suitcase: '<rect x="5" y="7" width="14" height="13" rx="2"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><path d="M9.5 11v5"/><path d="M14.5 11v5"/>',
  monitor: '<rect x="3" y="4" width="18" height="11" rx="1.5"/><path d="M12 15v3"/><path d="M9 18h6"/>',

  /* ---- Kitchen ---- */
  counter: '<path d="M3 8h18"/><rect x="4" y="8" width="16" height="12" rx="0.5"/><path d="M12 8v12"/><path d="M9.5 13.5h1"/><path d="M13.5 13.5h1"/>',
  sink: '<rect x="3" y="11" width="18" height="9" rx="1"/><rect x="6.5" y="13" width="11" height="5" rx="0.5"/><path d="M12 11V7.5A1.5 1.5 0 0 1 13.5 6H16"/><path d="M16 4.5V7.5"/>',
  stove: '<rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="9" cy="9" r="2"/><circle cx="15" cy="9" r="2"/><circle cx="9" cy="15" r="2"/><circle cx="15" cy="15" r="2"/>',
  fridge: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M6 10h12"/><path d="M9.5 5.5v2.5"/><path d="M9.5 12.5v3"/>',
  'dish-rack': '<path d="M4 16h16"/><path d="M5 16 4 12h16l-1 4"/><path d="M8.5 12V7"/><path d="M12 12V6"/><path d="M15.5 12V7"/>',
  espresso: '<path d="M5 8h11v3.5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M16 9.5h1.5a2 2 0 0 1 0 4H16"/><path d="M8 3.5v1.5"/><path d="M11.5 3.5v1.5"/>',
  microwave: '<rect x="2" y="5" width="20" height="14" rx="2"/><rect x="5" y="8" width="9" height="8" rx="1"/><path d="M17.5 9v.01"/><path d="M17.5 12v.01"/><path d="M17.5 15v.01"/>',

  /* ---- Bathroom ---- */
  toilet: '<rect x="8" y="3" width="8" height="3.5" rx="0.5"/><path d="M6 6.5h12v2a6 6 0 0 1-12 0z"/><path d="M9 14l-.8 6"/><path d="M15 14l.8 6"/><path d="M8 20h8"/>',
  bathtub: '<path d="M3 12h18v3.5a3.5 3.5 0 0 1-3.5 3.5h-11A3.5 3.5 0 0 1 3 15.5z"/><path d="M5 12V7.5A2.5 2.5 0 0 1 9.5 7"/><path d="M9.5 9.5h.01"/><path d="M5 19l-1 1.5"/><path d="M19 19l1 1.5"/>',
  shower: '<path d="M12 3v3"/><path d="M7 10a5 5 0 0 1 10 0z"/><path d="M9 14v.01"/><path d="M12 14v.01"/><path d="M15 14v.01"/><path d="M10.5 17v.01"/><path d="M13.5 17v.01"/><path d="M12 20v.01"/>',
  'bathroom-sink': '<path d="M5 9.5h14v1.5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M12 9.5V6.5A2 2 0 0 1 14 4.5h1"/><path d="M15 3v3"/><path d="M10.5 15l-.5 5"/><path d="M13.5 15l.5 5"/><path d="M9 20h6"/>',

  /* ---- Stairs ---- */
  'stairs-up': '<path d="M3 20h5v-4h4v-4h4v-4h5"/>',
  'stairs-down': '<path d="M3 4h5v4h4v4h4v4h5"/>',

  /* ---- Openings & fixtures ---- */
  door: '<path d="M5 21V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v17"/><path d="M3 21h16"/><path d="M12.5 12v.01"/>',
  'window-door': '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M12 3v18"/><path d="M5 8h14"/>',
  window: '<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M12 4v16"/><path d="M4 12h16"/>',
  cabinet: '<rect x="3" y="5" width="18" height="11" rx="1"/><path d="M12 5v11"/><path d="M10 12.5h1"/><path d="M13 12.5h1"/>',
  screen: '<path d="M3 4h18"/><rect x="5.5" y="4" width="13" height="11" rx="0.5"/><path d="M12 15v3"/>',
  'ceiling-light': '<path d="M12 3v2.5"/><path d="M7 6h10l2 6H5z"/><path d="M9.5 12a2.5 2.5 0 0 0 5 0"/>',

  /* ---- Chrome ---- */
  cube: '<path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7z"/><path d="M3.7 7 12 11.7 20.3 7"/><path d="M12 11.7V21.5"/>',
  grid: '<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/>',
  walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="M12.5 8l-1.5 4 3 2.5 1 5.5"/><path d="M11 12l-3 1-1.5 4.5"/><path d="M14 9.5l2.5 1.5"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-7H7v7"/><path d="M7 3v5h7"/>',
  load: '<path d="M3 7a2 2 0 0 1 2-2h3.5l2 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M18.5 6 17.5 20a2 2 0 0 1-2 1.8H8.5a2 2 0 0 1-2-1.8L5.5 6"/><path d="M10 11v5"/><path d="M14 11v5"/>',
  share: '<circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="M8.3 13.3l7.4 4.4"/><path d="M15.7 6.3l-7.4 4.4"/>',
  eraser: '<path d="M7.5 20.5H20"/><path d="M3.5 16.5 12 8l5 5-7.5 7.5H6z"/><path d="M9 11.5l5 5"/>',
  rotate: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 4.5V9.5H16"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  _missing: '<rect x="4" y="4" width="16" height="16" rx="2"/>',
};

// Return an inline <svg> string for the named icon.
export function icon(name, { size = 24, stroke = 1.6, cls = '' } = {}) {
  const body = PATHS[name] || PATHS._missing;
  return `<svg class="icon${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" width="${size}" height="${size}" `
    + `fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" `
    + `stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

// Fill every element carrying a `data-icon="name"` attribute with its glyph.
// Optional `data-icon-size` overrides the default pixel size.
export function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    const name = el.dataset.icon;
    const size = el.dataset.iconSize ? Number(el.dataset.iconSize) : 24;
    el.innerHTML = icon(name, { size });
  });
}

export const ICON_NAMES = Object.keys(PATHS).filter((n) => n[0] !== '_');
