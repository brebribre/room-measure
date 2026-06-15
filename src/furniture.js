import * as THREE from 'three';

// Catalog of furniture. Dimensions in meters: w (width, x), d (depth, z), h (height, y).
// `group` sorts items into catalog sections ('furniture' | 'kitchen').
// `build` returns a THREE.Group centered on the floor (y=0 at the bottom).
export const CATALOG = [
  { type: 'bed',      label: 'Bed',      icon: '🛏',  w: 1.6, d: 2.0, h: 0.5, color: 0x6c8ebf },
  { type: 'sofa',     label: 'Sofa',     icon: '🛋',  w: 2.0, d: 0.9, h: 0.8, color: 0x57b894 },
  { type: 'table',    label: 'Table',    icon: '🪑',  w: 1.2, d: 0.8, h: 0.75, color: 0xc9963f },
  { type: 'desk',     label: 'Desk',     icon: '🖥',  w: 1.4, d: 0.7, h: 0.74, color: 0xd07a52 },
  { type: 'chair',    label: 'Chair',    icon: '🪑',  w: 0.5, d: 0.5, h: 0.9, color: 0xb0764b },
  { type: 'wardrobe', label: 'Wardrobe', icon: '🚪',  w: 1.2, d: 0.6, h: 2.0, color: 0x8a7a66 },
  { type: 'rug',      label: 'Rug',      icon: '▭',   w: 1.6, d: 1.1, h: 0.02, color: 0xb05a7a },
  { type: 'plant',    label: 'Plant',    icon: '🪴',  w: 0.4, d: 0.4, h: 0.8, color: 0x6a9a3a },
  { type: 'tv',       label: 'TV unit',  icon: '📺',  w: 1.5, d: 0.4, h: 0.5, color: 0x4a5266 },
  { type: 'shelf',    label: 'Shelf',    icon: '📚',  w: 0.9, d: 0.35, h: 1.8, color: 0x9a8466 },
  { type: 'suitcase', label: 'Suitcase', icon: '🧳',  w: 0.7, d: 0.45, h: 0.3, color: 0x3f7a8c },
  { type: 'monitor',  label: 'Monitor',  icon: '🖥',  w: 0.55, d: 0.18, h: 0.42, color: 0x23262b },
  // Kitchen
  // Kitchen base units share a 1.2 × 0.6 m footprint so they line up in a row.
  { type: 'counter', label: 'Counter', icon: '🍽', w: 1.2, d: 0.6, h: 0.9, color: 0xd8d8dc, group: 'kitchen' },
  { type: 'sink',    label: 'Sink',    icon: '🚰', w: 1.2, d: 0.6, h: 0.9, color: 0xd8d8dc, group: 'kitchen' },
  { type: 'stove',   label: 'Stove',   icon: '🍳', w: 1.2, d: 0.6, h: 0.9, color: 0xcfcfd3, group: 'kitchen' },
  { type: 'fridge',  label: 'Fridge',  icon: '🧊', w: 0.7, d: 0.7, h: 1.8, color: 0xe6e6ea, group: 'kitchen' },
];

export const SWATCHES = [0x6c8ebf, 0x57b894, 0xc9963f, 0xd07a52, 0xb05a7a, 0x8a7a66, 0x6a9a3a, 0xcfcfcf];

// Size presets per furniture type, surfaced as a dropdown in the inspector.
// Beds use common mattress sizes (width × length, mm).
export const VARIANTS = {
  bed: {
    label: 'Bed size',
    options: [
      { id: 'single', label: 'Single · 900×2000', w: 0.90, d: 2.0 },
      { id: 'queen',  label: 'Queen · 1600×2000', w: 1.60, d: 2.0 },
      { id: 'king',   label: 'King · 1800×2000',  w: 1.80, d: 2.0 },
    ],
  },
};

export function getVariant(type) { return VARIANTS[type] || null; }

const mat = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.05 });

function box(w, h, d, color, y = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.y = y;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// A kitchen worktop slab, flagged so its finish (plain / wood) can be swapped.
function worktop(w, h, d, color, y) {
  const m = box(w, h, d, color, y);
  m.userData.isWorktop = true;
  m.userData.baseColor = color;
  return m;
}

// Each builder constructs a recognizable silhouette out of primitives.
const BUILDERS = {
  bed(c) {
    const g = new THREE.Group();
    g.add(box(1.6, 0.3, 2.0, c, 0.15));                       // base
    g.add(box(1.5, 0.18, 1.9, 0xe8e8ea, 0.36));               // mattress top
    g.add(box(1.6, 0.5, 0.12, c, 0.4).translateZ(-0.94));     // headboard
    return g;
  },
  sofa(c) {
    const g = new THREE.Group();
    g.add(box(2.0, 0.4, 0.9, c, 0.2));                         // seat base
    g.add(box(2.0, 0.45, 0.2, c, 0.55).translateZ(-0.35));    // backrest
    g.add(box(0.2, 0.5, 0.9, c, 0.45).translateX(-0.9));      // left arm
    g.add(box(0.2, 0.5, 0.9, c, 0.45).translateX(0.9));       // right arm
    return g;
  },
  table(c) {
    const g = new THREE.Group();
    g.add(box(1.2, 0.06, 0.8, c, 0.72));                       // top
    const legGeom = [[-0.55, -0.35], [0.55, -0.35], [-0.55, 0.35], [0.55, 0.35]];
    legGeom.forEach(([x, z]) => g.add(box(0.07, 0.72, 0.07, 0x5a4632, 0.36).translateX(x).translateZ(z)));
    return g;
  },
  desk(c) {
    const g = new THREE.Group();
    g.add(box(1.4, 0.05, 0.7, c, 0.72));
    g.add(box(0.5, 0.7, 0.6, c, 0.35).translateX(0.4));        // drawer block
    g.add(box(0.06, 0.7, 0.06, 0x5a4632, 0.35).translateX(-0.62).translateZ(-0.28));
    g.add(box(0.06, 0.7, 0.06, 0x5a4632, 0.35).translateX(-0.62).translateZ(0.28));
    return g;
  },
  chair(c) {
    const g = new THREE.Group();
    g.add(box(0.5, 0.06, 0.5, c, 0.45));                       // seat
    g.add(box(0.5, 0.5, 0.06, c, 0.68).translateZ(-0.22));     // back
    [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].forEach(([x, z]) =>
      g.add(box(0.05, 0.45, 0.05, 0x5a4632, 0.22).translateX(x).translateZ(z)));
    return g;
  },
  wardrobe(c) {
    const g = new THREE.Group();
    g.add(box(1.2, 2.0, 0.6, c, 1.0));
    g.add(box(0.02, 1.8, 0.02, 0x2a2a2a, 1.0).translateZ(0.3));   // center seam
    g.add(box(0.04, 0.12, 0.04, 0xdddddd, 1.0).translateX(-0.1).translateZ(0.31)); // handle
    g.add(box(0.04, 0.12, 0.04, 0xdddddd, 1.0).translateX(0.1).translateZ(0.31));
    return g;
  },
  rug(c) {
    const g = new THREE.Group();
    g.add(box(1.6, 0.02, 1.1, c, 0.011));
    g.add(box(1.4, 0.022, 0.9, 0xffffff, 0.012));               // inner border (lighter)
    g.children[1].material.color.setHex(c).offsetHSL(0, -0.2, 0.15);
    return g;
  },
  plant(c) {
    const g = new THREE.Group();
    g.add(box(0.3, 0.3, 0.3, 0x8a6a4a, 0.15));                  // pot
    const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), mat(c));
    foliage.position.y = 0.55; foliage.scale.y = 1.4; foliage.castShadow = true;
    g.add(foliage);
    return g;
  },
  tv(c) {
    const g = new THREE.Group();
    g.add(box(1.5, 0.5, 0.4, c, 0.25));                         // unit
    g.add(box(1.2, 0.7, 0.05, 0x111316, 0.95).translateZ(0.0)); // screen
    return g;
  },
  shelf(c) {
    const g = new THREE.Group();
    g.add(box(0.9, 1.8, 0.35, c, 0.9));
    for (let i = 1; i <= 4; i++) g.add(box(0.86, 0.03, 0.33, 0x2a2a2a, i * 0.36).translateZ(0.0));
    return g;
  },
  counter(c) {
    const g = new THREE.Group();
    g.add(box(1.2, 0.85, 0.6, c, 0.425));                       // cabinet body
    g.add(worktop(1.24, 0.05, 0.64, 0x3a3f48, 0.875));          // worktop
    g.add(box(0.02, 0.7, 0.02, 0x2a2a2a, 0.45).translateZ(0.31)); // door seam
    g.add(box(0.04, 0.1, 0.04, 0xbfc4cc, 0.6).translateX(-0.25).translateZ(0.31)); // handle
    g.add(box(0.04, 0.1, 0.04, 0xbfc4cc, 0.6).translateX(0.25).translateZ(0.31));
    return g;
  },
  sink(c) {
    // Same 1.2 × 0.6 counter base, with the basin set into the worktop.
    const g = new THREE.Group();
    g.add(box(1.2, 0.85, 0.6, c, 0.425));                       // cabinet
    g.add(worktop(1.24, 0.05, 0.64, 0x3a3f48, 0.875));         // worktop
    g.add(box(0.5, 0.06, 0.42, 0xc2c8cf, 0.9));               // stainless basin rim
    g.add(box(0.4, 0.05, 0.32, 0x9aa1ab, 0.885));            // basin recess
    g.add(box(0.05, 0.22, 0.05, 0xc2c8cf, 1.0).translateZ(-0.2)); // faucet stem
    g.add(box(0.05, 0.05, 0.16, 0xc2c8cf, 1.1).translateZ(-0.13)); // faucet spout
    g.add(box(0.04, 0.1, 0.04, 0xbfc4cc, 0.6).translateX(-0.45).translateZ(0.31)); // cabinet handle
    return g;
  },
  stove(c) {
    // Same 1.2 × 0.6 counter base, with the cooktop + oven set into it.
    const g = new THREE.Group();
    g.add(box(1.2, 0.85, 0.6, c, 0.425));                       // cabinet body
    g.add(worktop(1.24, 0.05, 0.64, 0x3a3f48, 0.875));         // worktop
    g.add(box(0.6, 0.04, 0.5, 0x23262b, 0.9));               // cooktop (centered)
    [[-0.15, -0.11], [0.15, -0.11], [-0.15, 0.13], [0.15, 0.13]].forEach(([x, z]) =>
      g.add(box(0.16, 0.02, 0.16, 0x111316, 0.92).translateX(x).translateZ(z))); // burners
    g.add(box(0.55, 0.42, 0.02, 0x33373d, 0.41).translateZ(0.3)); // oven door (centered)
    g.add(box(0.45, 0.04, 0.03, 0xbfc4cc, 0.64).translateZ(0.31)); // oven handle
    return g;
  },
  monitor(c) {
    const g = new THREE.Group();
    g.add(box(0.24, 0.02, 0.16, 0x3a3d44, 0.01));               // stand base
    g.add(box(0.05, 0.18, 0.05, 0x3a3d44, 0.1));                // neck
    g.add(box(0.55, 0.33, 0.03, c, 0.27));                      // bezel
    g.add(box(0.5, 0.28, 0.01, 0x0a0c10, 0.27).translateZ(0.02)); // screen
    return g;
  },
  suitcase(c) {
    const g = new THREE.Group();
    g.add(box(0.7, 0.25, 0.45, c, 0.13));                       // shell (lying flat)
    g.add(box(0.72, 0.03, 0.47, 0x222428, 0.13));              // zipper seam band
    g.add(box(0.2, 0.03, 0.05, 0x222428, 0.31));               // top handle bar
    g.add(box(0.03, 0.06, 0.05, 0x222428, 0.28).translateX(-0.09)); // handle posts
    g.add(box(0.03, 0.06, 0.05, 0x222428, 0.28).translateX(0.09));
    return g;
  },
  fridge(c) {
    const g = new THREE.Group();
    g.add(box(0.7, 1.8, 0.7, c, 0.9));                          // body
    g.add(box(0.7, 0.02, 0.7, 0x9aa1ab, 1.12));               // freezer/fridge seam
    g.add(box(0.04, 0.5, 0.04, 0x8b9099, 1.45).translateX(-0.3).translateZ(0.36)); // upper handle
    g.add(box(0.04, 0.3, 0.04, 0x8b9099, 0.85).translateX(-0.3).translateZ(0.36)); // lower handle
    return g;
  },
};

export function getCatalogEntry(type) {
  return CATALOG.find((e) => e.type === type);
}

// Create a furniture object as a Group with metadata in userData.
export function createFurniture(type, color) {
  const entry = getCatalogEntry(type);
  const c = color ?? entry.color;
  const group = (BUILDERS[type] || BUILDERS.table)(c);
  group.userData = {
    isFurniture: true,
    type,
    label: entry.label,
    // current footprint/height (mutable — resized by scaling the group)
    w: entry.w,
    d: entry.d,
    h: entry.h,
    // base dimensions the mesh was built at; scale = current / base
    baseW: entry.w,
    baseD: entry.d,
    baseH: entry.h,
    color: c,
  };
  group.traverse((o) => { if (o.isMesh) o.userData.isFurniturePart = true; });
  return group;
}
