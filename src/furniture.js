import * as THREE from 'three';

// Catalog of furniture. Dimensions in meters: w (width, x), d (depth, z), h (height, y).
// `group` sorts items into catalog sections ('furniture' | 'kitchen').
// `build` returns a THREE.Group centered on the floor (y=0 at the bottom).
export const CATALOG = [
  { type: 'bed',      label: 'Bed',      icon: 'bed',      w: 1.6, d: 2.0, h: 0.5, color: 0x6c8ebf },
  { type: 'sofa',     label: 'Sofa',     icon: 'sofa',     w: 2.0, d: 0.9, h: 0.8, color: 0x57b894 },
  { type: 'table',    label: 'Table',    icon: 'table',    w: 1.2, d: 0.8, h: 0.75, color: 0xc9963f },
  { type: 'desk',     label: 'Desk',     icon: 'desk',     w: 1.4, d: 0.7, h: 0.74, color: 0xd07a52 },
  { type: 'chair',    label: 'Chair',    icon: 'chair',    w: 0.5, d: 0.5, h: 0.9, color: 0xb0764b },
  { type: 'wardrobe', label: 'Wardrobe', icon: 'wardrobe', w: 1.2, d: 0.6, h: 2.0, color: 0x8a7a66 },
  { type: 'rug',      label: 'Rug',      icon: 'rug',      w: 1.6, d: 1.1, h: 0.02, color: 0xb05a7a },
  { type: 'plant',    label: 'Plant',    icon: 'plant',    w: 0.4, d: 0.4, h: 0.8, color: 0x6a9a3a },
  { type: 'tv',       label: 'TV unit',  icon: 'tv',       w: 1.5, d: 0.4, h: 0.5, color: 0x4a5266 },
  { type: 'shelf',    label: 'Shelf',    icon: 'shelf',    w: 0.9, d: 0.35, h: 1.8, color: 0x9a8466 },
  { type: 'suitcase', label: 'Suitcase', icon: 'suitcase', w: 0.7, d: 0.45, h: 0.3, color: 0x3f7a8c },
  { type: 'monitor',  label: 'Monitor',  icon: 'monitor',  w: 0.55, d: 0.18, h: 0.42, color: 0x23262b },
  // Kitchen
  // Kitchen base units share a 0.6 m depth so they line up in a row; counter
  // is a 1.2 × 0.6 m module, sink and stove are square 0.6 × 0.6 m units.
  { type: 'counter', label: 'Counter', icon: 'counter', w: 1.2, d: 0.6, h: 0.9, color: 0xd8d8dc, group: 'kitchen' },
  { type: 'sink',    label: 'Sink',    icon: 'sink',    w: 0.6, d: 0.6, h: 0.9, color: 0xd8d8dc, group: 'kitchen' },
  { type: 'stove',   label: 'Stove',   icon: 'stove',   w: 0.6, d: 0.6, h: 0.9, color: 0xcfcfd3, group: 'kitchen' },
  { type: 'fridge',  label: 'Fridge',  icon: 'fridge',  w: 0.7, d: 0.7, h: 1.8, color: 0xe6e6ea, group: 'kitchen' },
  { type: 'dish-rack',       label: 'Dish rack',       icon: 'dish-rack', w: 0.45, d: 0.35, h: 0.25, color: 0xb8c0c8, group: 'kitchen' },
  { type: 'espresso-machine', label: 'Espresso machine', icon: 'espresso', w: 0.30, d: 0.35, h: 0.35, color: 0x3a3f48, group: 'kitchen' },
  { type: 'microwave',       label: 'Microwave',       icon: 'microwave', w: 0.50, d: 0.35, h: 0.30, color: 0xe6e6ea, group: 'kitchen' },
  { type: 'rice-cooker',     label: 'Rice cooker',     icon: 'rice-cooker', w: 0.34, d: 0.34, h: 0.30, color: 0xe6e6ea, group: 'kitchen' },
  // Bathroom
  { type: 'toilet',       label: 'Toilet',       icon: 'toilet',        w: 0.40, d: 0.65, h: 0.42, color: 0xf4f4f2, group: 'bathroom' },
  { type: 'bathtub',      label: 'Bathtub',      icon: 'bathtub',       w: 1.70, d: 0.75, h: 0.55, color: 0xf4f4f2, group: 'bathroom' },
  { type: 'shower',       label: 'Shower',       icon: 'shower',        w: 0.90, d: 0.90, h: 2.00, color: 0xeef0f2, group: 'bathroom' },
  { type: 'bathroom-sink', label: 'Bathroom sink', icon: 'bathroom-sink', w: 0.60, d: 0.45, h: 0.85, color: 0xf4f4f2, group: 'bathroom' },
  // Stairs — "up" is a solid flight of steps you place like furniture (occupies
  // floor-to-ceiling space and blocks walking through it). "Down" is the floor
  // opening above a flight on the floor below — flush with the floor like a rug,
  // so you walk over it.
  { type: 'stairs-up',   label: 'Stairs (up)',   icon: 'stairs-up',   w: 1.0, d: 3.0, h: 2.6,  color: 0x9a8466, group: 'structure' },
  { type: 'stairs-down', label: 'Stairs (down)', icon: 'stairs-down', w: 1.0, d: 3.0, h: 0.02, color: 0x4a5266, group: 'structure' },
  // Lighting — the desk lamp is a furniture piece whose shade emits light.
  // (The wall lamp is a wall-mounted opening — see openings.js — so it can slide
  // along and up/down a wall like a window.)
  { type: 'desk-lamp', label: 'Desk lamp', icon: 'desk-lamp', w: 0.22, d: 0.20, h: 0.40, color: 0x3a3f48, group: 'lighting' },
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

const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.05, ...opts });

function box(w, h, d, color, y = 0, opts) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts));
  m.position.y = y;
  m.castShadow = true;
  // Furniture casts shadows onto the floor/walls but doesn't receive them — the
  // floor and walls are the visible shadow catchers, and skipping per-furniture
  // shadow sampling cuts main-pass fragment cost as piece count grows.
  m.receiveShadow = false;
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
    // Open bookshelf: an outer carcass with horizontal shelves and a centre
    // divider, leaving a grid of open cubby holes at the front.
    const g = new THREE.Group();
    const w = 0.9, h = 1.8, d = 0.35, t = 0.04;
    g.add(box(t, h, d, c, h / 2).translateX(-(w / 2 - t / 2)));   // left side
    g.add(box(t, h, d, c, h / 2).translateX(w / 2 - t / 2));      // right side
    g.add(box(w, t, d, c, h - t / 2));                            // top
    g.add(box(w, t, d, c, t / 2));                                // bottom
    const innerW = w - 2 * t, innerH = h - 2 * t, rows = 4, rowH = innerH / rows;
    for (let i = 1; i < rows; i++) {                              // horizontal shelves
      g.add(box(innerW, t, d - t, c, t + rowH * i));
    }
    g.add(box(t, innerH, d - t, c, t + innerH / 2));             // centre divider → 2 columns
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
    // Square 0.6 × 0.6 base, with the basin set into the worktop.
    const g = new THREE.Group();
    g.add(box(0.6, 0.85, 0.6, c, 0.425));                       // cabinet
    g.add(worktop(0.64, 0.05, 0.64, 0x3a3f48, 0.875));         // worktop
    g.add(box(0.42, 0.06, 0.42, 0xc2c8cf, 0.9));              // stainless basin rim
    g.add(box(0.32, 0.05, 0.32, 0x9aa1ab, 0.885));           // basin recess
    g.add(box(0.05, 0.22, 0.05, 0xc2c8cf, 1.0).translateZ(-0.2)); // faucet stem
    g.add(box(0.05, 0.05, 0.16, 0xc2c8cf, 1.1).translateZ(-0.13)); // faucet spout
    g.add(box(0.04, 0.1, 0.04, 0xbfc4cc, 0.6).translateX(-0.2).translateZ(0.31)); // cabinet handle
    return g;
  },
  stove(c) {
    // Square 0.6 × 0.6 base, with the cooktop + oven set into it.
    const g = new THREE.Group();
    g.add(box(0.6, 0.85, 0.6, c, 0.425));                       // cabinet body
    g.add(worktop(0.64, 0.05, 0.64, 0x3a3f48, 0.875));         // worktop
    g.add(box(0.5, 0.04, 0.5, 0x23262b, 0.9));               // cooktop (centered)
    [[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]].forEach(([x, z]) =>
      g.add(box(0.16, 0.02, 0.16, 0x111316, 0.92).translateX(x).translateZ(z))); // burners
    g.add(box(0.5, 0.42, 0.02, 0x33373d, 0.41).translateZ(0.3)); // oven door (centered)
    g.add(box(0.4, 0.04, 0.03, 0xbfc4cc, 0.64).translateZ(0.31)); // oven handle
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
  'dish-rack'(c) {
    const g = new THREE.Group();
    const wire = 0xb8c0c8;
    g.add(box(0.45, 0.02, 0.35, wire, 0.01));                   // base tray
    g.add(box(0.45, 0.015, 0.015, wire, 0.02).translateZ(0.16)); // tray rim
    g.add(box(0.45, 0.015, 0.015, wire, 0.02).translateZ(-0.16));
    for (let i = -3; i <= 3; i++) {
      g.add(box(0.015, 0.18, 0.015, wire, 0.1).translateX(i * 0.06)); // wire prongs
    }
    const plate1 = box(0.26, 0.015, 0.22, c, 0.14);
    plate1.rotation.z = 0.35;
    g.add(plate1);
    const plate2 = box(0.24, 0.015, 0.2, 0xe8e8ea, 0.13);
    plate2.rotation.z = -0.32;
    plate2.position.x = 0.1;
    g.add(plate2);
    return g;
  },
  'espresso-machine'(c) {
    const g = new THREE.Group();
    g.add(box(0.3, 0.32, 0.35, c, 0.16));                       // body
    g.add(box(0.32, 0.03, 0.37, 0x23262b, 0.325));              // top plate
    g.add(box(0.08, 0.05, 0.08, 0x9aa1ab, 0.025));              // drip tray
    g.add(box(0.05, 0.08, 0.05, 0x111316, 0.22).translateZ(0.16)); // portafilter spout
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.06, 16), mat(0xffffff));
    cup.position.set(0, 0.06, 0.16);
    cup.castShadow = true; cup.receiveShadow = true;
    g.add(cup);
    g.add(box(0.03, 0.16, 0.03, 0x9aa1ab, 0.21).translateX(0.12).translateZ(0.14)); // steam wand
    return g;
  },
  microwave(c) {
    const g = new THREE.Group();
    g.add(box(0.5, 0.3, 0.35, c, 0.15));                        // body
    g.add(box(0.32, 0.22, 0.02, 0x1d2024, 0.16).translateX(-0.06).translateZ(0.175)); // door glass
    g.add(box(0.1, 0.26, 0.02, c, 0.15).translateX(0.18).translateZ(0.176));         // control panel
    g.add(box(0.015, 0.18, 0.01, 0x444a55, 0.18).translateX(0.07).translateZ(0.18)); // door handle
    return g;
  },
  toilet(c) {
    const g = new THREE.Group();
    g.add(box(0.42, 0.4, 0.16, c, 0.42).translateZ(-0.245));    // cistern
    g.add(box(0.36, 0.36, 0.46, c, 0.18).translateZ(0.04));     // bowl/pedestal
    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.05, 20), mat(0xffffff));
    seat.position.set(0, 0.385, 0.04);
    seat.castShadow = true; seat.receiveShadow = true;
    g.add(seat);
    g.add(box(0.06, 0.04, 0.02, 0xbfc4cc, 0.6).translateZ(-0.32)); // flush handle
    return g;
  },
  bathtub(c) {
    const g = new THREE.Group();
    g.add(box(1.70, 0.50, 0.75, c, 0.25));                                     // outer shell
    g.add(box(1.52, 0.36, 0.57, 0xeaf4fb, 0.33));                              // basin recess
    g.add(box(0.06, 0.20, 0.06, 0xc2c8cf, 0.55).translateX(0.78));            // faucet stem
    g.add(box(0.16, 0.04, 0.04, 0xc2c8cf, 0.63).translateX(0.78));            // faucet spout
    return g;
  },
  shower(c) {
    const g = new THREE.Group();
    const glass = { transparent: true, opacity: 0.25, roughness: 0.05 };
    g.add(box(0.90, 0.06, 0.90, c, 0.03));                                      // tray
    g.add(box(0.04, 0.04, 0.04, 0x6b7280, 0.06));                              // drain
    g.add(box(0.90, 2.0, 0.02, 0xbcd4e6, 1.06, glass).translateZ(-0.44));      // back wall
    g.add(box(0.02, 2.0, 0.90, 0xbcd4e6, 1.06, glass).translateX(-0.44));      // side wall
    g.add(box(0.05, 2.0, 0.05, 0x9aa1ab, 1.06).translateX(-0.44).translateZ(-0.44)); // corner post
    g.add(box(0.10, 0.05, 0.05, 0xbfc4cc, 1.95).translateX(0.4).translateZ(-0.42));  // showerhead arm
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 16), mat(0xbfc4cc));
    head.position.set(0.4, 1.85, -0.42);
    head.castShadow = true; head.receiveShadow = true;
    g.add(head);
    return g;
  },
  'stairs-up'(c) {
    // A flight of steps, each tread+riser drawn as one block so the
    // ascending blocks form a staircase silhouette, plus a row of railing
    // posts along one edge.
    const g = new THREE.Group();
    const steps = 12, totalW = 1.0, totalD = 3.0, totalH = 2.6;
    const stepD = totalD / steps, stepH = totalH / steps;
    const railColor = new THREE.Color(c).offsetHSL(0, 0, -0.2).getHex();
    for (let i = 0; i < steps; i++) {
      const treadTop = (i + 1) * stepH;
      const z = -totalD / 2 + i * stepD + stepD / 2;
      g.add(box(totalW, treadTop, stepD * 0.96, c, treadTop / 2).translateZ(z));
      const postH = 0.45;
      g.add(box(0.05, postH, 0.05, railColor, treadTop + postH / 2).translateZ(z + stepD * 0.4).translateX(totalW / 2 - 0.05));
    }
    return g;
  },
  'stairs-down'(c) {
    // Flat floor opening above the flight below — a striped rectangle, flush
    // with the floor (walkable, like a rug).
    const g = new THREE.Group();
    const w = 1.0, d = 3.0, steps = 10;
    g.add(box(w, 0.02, d, c, 0.011));
    const stepD = d / steps;
    for (let i = 0; i < steps; i++) {
      const shade = new THREE.Color(c).offsetHSL(0, 0, i % 2 === 0 ? 0.05 : -0.04).getHex();
      g.add(box(w * 0.92, 0.022, stepD * 0.5, shade, 0.012).translateZ(-d / 2 + (i + 0.5) * stepD));
    }
    return g;
  },
  'bathroom-sink'(c) {
    const g = new THREE.Group();
    g.add(box(0.60, 0.75, 0.45, c, 0.375));                      // vanity cabinet
    g.add(worktop(0.64, 0.05, 0.49, 0xffffff, 0.775));           // counter top
    g.add(box(0.46, 0.04, 0.33, 0xe8eef2, 0.81));                // basin rim
    g.add(box(0.05, 0.20, 0.05, 0xc2c8cf, 0.95).translateZ(-0.18)); // faucet stem
    g.add(box(0.14, 0.04, 0.04, 0xc2c8cf, 1.03).translateZ(-0.11)); // faucet spout
    const mirror = box(0.50, 0.60, 0.02, 0xcfd6e0, 1.55, { transparent: true, opacity: 0.55, roughness: 0.05 });
    mirror.translateZ(-0.215);
    g.add(mirror);                                               // mirror above
    return g;
  },
  'rice-cooker'(c) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.15, 0.20, 24), mat(c));
    body.position.y = 0.10; body.castShadow = true;
    g.add(body);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.16, 0.06, 24), mat(0xe9e9ee));
    lid.position.y = 0.23; lid.castShadow = true;
    g.add(lid);
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 14), mat(0x2a2f3a));
    knob.position.y = 0.275;
    g.add(knob);
    g.add(box(0.16, 0.07, 0.02, 0x2a2f3a, 0.10).translateZ(0.15));      // control panel
    const led = box(0.05, 0.02, 0.012, 0x123018, 0.10, { emissive: 0x6cf0a0, emissiveIntensity: 1 });
    led.translateZ(0.162); led.userData.keepEmissive = true;            // status light
    g.add(led);
    g.add(box(0.04, 0.03, 0.06, 0x2a2f3a, 0.16).translateX(0.17));      // side handles
    g.add(box(0.04, 0.03, 0.06, 0x2a2f3a, 0.16).translateX(-0.17));
    return g;
  },
  'desk-lamp'(c) {
    const g = new THREE.Group();
    g.add(box(0.18, 0.025, 0.18, c, 0.012));                            // base
    g.add(box(0.03, 0.30, 0.03, c, 0.16).translateX(-0.05));           // upright
    g.add(box(0.16, 0.03, 0.03, c, 0.30).translateX(0.02));            // arm
    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.075, 0.10, 18, 1, true),
      new THREE.MeshStandardMaterial({ color: c, emissive: 0xfff1cf, emissiveIntensity: 0.5, side: THREE.DoubleSide }));
    shade.position.set(0.09, 0.29, 0); shade.castShadow = true;
    shade.userData.keepEmissive = true;
    g.add(shade);
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.028, 12, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2cc, emissiveIntensity: 2 }));
    bulb.position.set(0.09, 0.265, 0); bulb.userData.keepEmissive = true;
    g.add(bulb);
    const light = new THREE.PointLight(0xfff1d0, 3, 2.6, 2);
    light.position.set(0.09, 0.24, 0);
    g.add(light);
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
