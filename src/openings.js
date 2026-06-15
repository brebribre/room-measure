import * as THREE from 'three';

// Doors & windows, sized to German standards.
//
// Doors follow DIN 18101 nominal leaf sizes (Türblatt-Nennmaße): widths
// 610/735/860/985/1110 mm, heights 1985/2110 mm. The 860×1985 interior door is
// the most common in German homes.
//
// Windows use the German Brüstungshöhe (sill height) of 0.90 m as the default —
// below 0.90 m a window needs fall protection (Absturzsicherung). Sizes are
// common German Rohbaumaße.
export const DOOR_TYPES = [
  { type: 'door-std',      label: 'Interior · 860×1985', kind: 'door', w: 0.86,  h: 1.985, sill: 0 },
  { type: 'door-wide',     label: 'Wide · 985×1985',     kind: 'door', w: 0.985, h: 1.985, sill: 0 },
  { type: 'door-entrance', label: 'Entrance · 1110×2110', kind: 'door', w: 1.11,  h: 2.11,  sill: 0 },
  // Fenstertür / Balkontür — a full-height glazed door that doubles as a window,
  // standard in German apartments for balconies and patios.
  { type: 'door-balcony',  label: 'Balcony · 900×2100 (Fenstertür)', kind: 'door', w: 0.90, h: 2.10, sill: 0, glazed: true, leaves: 1 },
  { type: 'door-french',   label: 'French · 1500×2100 (glazed)',     kind: 'door', w: 1.50, h: 2.10, sill: 0, glazed: true, leaves: 2 },
];

export const WINDOW_TYPES = [
  { type: 'win-small', label: 'Small · 600×600',    kind: 'window', w: 0.60,  h: 0.60,  sill: 0.90 },
  { type: 'win-std',   label: 'Standard · 1135×1135', kind: 'window', w: 1.135, h: 1.135, sill: 0.90 },
  { type: 'win-large', label: 'Large · 1260×1510',  kind: 'window', w: 1.26,  h: 1.51,  sill: 0.90 },
];

// Wall-mounted fixtures. `sill` is the mounting height of the unit's bottom edge.
export const FIXTURE_TYPES = [
  { type: 'cabinet', label: 'Wall cabinet · 1200×720', kind: 'cabinet', w: 1.20, h: 0.72, sill: 1.45 },
  { type: 'screen',  label: 'Projector screen · 2000×1130', kind: 'screen', w: 2.00, h: 1.13, sill: 1.00 },
];

export function getOpeningSpec(type) {
  return [...DOOR_TYPES, ...WINDOW_TYPES, ...FIXTURE_TYPES].find((o) => o.type === type);
}

// How far a door leaf / cabinet door swings open, in radians.
export const OPEN_ANGLE = Math.PI * 0.55;

const mat = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.05, ...opts });

function box(w, h, d, color, x = 0, y = 0, z = 0, opts) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts));
  m.position.set(x, y, z);
  return m;
}

// Group `parts` into a pivot positioned at local x = hingeX, re-anchoring each
// part's x so the group's overall appearance is unchanged at rotation 0.
// `openSign` records which way the group should rotate to swing the parts
// (which sit on one side of the hinge) toward +z — "into the room".
function makeLeafPivot(parts, hingeX) {
  const pivot = new THREE.Group();
  pivot.position.x = hingeX;
  let sum = 0;
  parts.forEach((m) => { m.position.x -= hingeX; sum += m.position.x; pivot.add(m); });
  pivot.userData.openSign = sum >= 0 ? -1 : 1;
  return pivot;
}

// Build a door/window as a group in local space: local +x runs along the wall,
// +y is up (base at y=0), +z points into the room. Mounted flush to the wall line.
// `overrides` lets w/h/sill differ from the catalog spec — used for the
// width/height-adjustable window.
export function createOpening(type, overrides = {}) {
  const spec = getOpeningSpec(type);
  const kind = spec.kind;
  const g = new THREE.Group();
  const w = overrides.w ?? spec.w, h = overrides.h ?? spec.h, sill = overrides.sill ?? spec.sill;
  const frameT = 0.06;     // frame thickness
  const depth = 0.12;      // how far it reads off the wall
  const leaves = [];       // hinged pivots — toggled open/closed via 'E' in walk mode

  if (kind === 'door' && spec.glazed) {
    // Fenstertür — full-height glazed door (single leaf or French double).
    const frameC = 0xd0d2d6, glassC = 0xbcd4e6;
    const leafCount = spec.leaves || 1;
    g.add(box(frameT, h, depth, frameC, -w / 2 + frameT / 2, h / 2, 0));   // jambs
    g.add(box(frameT, h, depth, frameC, w / 2 - frameT / 2, h / 2, 0));
    g.add(box(w, frameT, depth, frameC, 0, h - frameT / 2, 0));            // head
    g.add(box(w, frameT, depth, frameC, 0, frameT / 2, 0));                // threshold
    const innerW = w - frameT * 2, glassH = h - frameT * 2, cy = h / 2;
    const glassOpts = { transparent: true, opacity: 0.4, roughness: 0.1 };
    const hingeX = -w / 2 + frameT;
    if (leafCount === 2) {
      const mullion = box(0.06, glassH, depth, frameC, 0, cy, 0);                   // centre mullion
      const paneW = (innerW - 0.06) / 2 - 0.03;
      const off = 0.03 + paneW / 2 + 0.015;
      const pane1 = box(paneW, glassH - 0.02, 0.02, glassC, -off, cy, 0, glassOpts);
      const pane2 = box(paneW, glassH - 0.02, 0.02, glassC, off, cy, 0, glassOpts);
      const handle1 = box(0.04, 0.18, 0.06, 0x2a2a2a, -0.12, 1.05, depth / 2 + 0.02); // handles by the mullion
      const handle2 = box(0.04, 0.18, 0.06, 0x2a2a2a, 0.12, 1.05, depth / 2 + 0.02);
      // Both glazed leaves swing together as one panel, hinged at the left jamb.
      const pivot = makeLeafPivot([mullion, pane1, pane2, handle1, handle2], hingeX);
      g.add(pivot);
      leaves.push(pivot);
    } else {
      const pane = box(innerW - 0.02, glassH - 0.02, 0.02, glassC, 0, cy, 0, glassOpts);
      const handle = box(0.04, 0.18, 0.06, 0x2a2a2a, w / 2 - 0.14, 1.05, depth / 2 + 0.02); // lever handle
      const pivot = makeLeafPivot([pane, handle], hingeX);
      g.add(pivot);
      leaves.push(pivot);
    }
  } else if (kind === 'door') {
    const frameC = 0x6b5640, leafC = 0xb08a5a;
    // jambs + lintel
    g.add(box(frameT, h, depth, frameC, -w / 2 + frameT / 2, h / 2, 0));
    g.add(box(frameT, h, depth, frameC, w / 2 - frameT / 2, h / 2, 0));
    g.add(box(w, frameT, depth, frameC, 0, h - frameT / 2, 0));
    // leaf, pushed slightly into the room so it's clearly a door
    const leaf = box(w - frameT * 2, h - frameT, 0.04, leafC, 0, (h - frameT) / 2, depth / 2 + 0.02);
    // handle
    const handle = box(0.04, 0.04, 0.08, 0x2a2a2a, w / 2 - 0.18, h / 2, depth / 2 + 0.08);
    const pivot = makeLeafPivot([leaf, handle], -w / 2 + frameT);
    g.add(pivot);
    leaves.push(pivot);
  } else if (kind === 'window') {
    const frameC = 0xd8d8dc, glassC = 0xbcd4e6;
    const cy = sill + h / 2;
    g.add(box(frameT, h, depth, frameC, -w / 2 + frameT / 2, cy, 0));
    g.add(box(frameT, h, depth, frameC, w / 2 - frameT / 2, cy, 0));
    g.add(box(w, frameT, depth, frameC, 0, sill + h - frameT / 2, 0));
    g.add(box(w, frameT, depth, frameC, 0, sill + frameT / 2, 0));
    // glass
    g.add(box(w - frameT * 2, h - frameT * 2, 0.02, glassC, 0, cy, 0,
      { transparent: true, opacity: 0.45, roughness: 0.1 }));
    // sill ledge below
    g.add(box(w + 0.06, 0.04, depth + 0.04, frameC, 0, sill - 0.02, depth / 2 - 0.02));
  } else if (kind === 'cabinet') {
    // Wall-mounted upper kitchen cabinet (Hängeschrank), bottom edge at `sill`.
    const bodyC = 0xd8d8dc, dep = 0.35, cy = sill + h / 2, front = dep;
    g.add(box(w, h, dep, bodyC, 0, cy, dep / 2));               // body, back at wall
    // A pair of hinged doors covering the front, split with a small gap.
    const doorT = 0.02, gap = 0.01, panelW = (w - gap) / 2;
    const leftX = -gap / 2 - panelW / 2, rightX = gap / 2 + panelW / 2;
    const leftDoor = box(panelW, h - 0.02, doorT, bodyC, leftX, cy, front + doorT / 2);
    const rightDoor = box(panelW, h - 0.02, doorT, bodyC, rightX, cy, front + doorT / 2);
    const leftHandle = box(0.03, 0.1, 0.03, 0xbfc4cc, leftX + panelW / 2 - 0.06, sill + 0.08, front + doorT + 0.02);
    const rightHandle = box(0.03, 0.1, 0.03, 0xbfc4cc, rightX - panelW / 2 + 0.06, sill + 0.08, front + doorT + 0.02);
    const leftPivot = makeLeafPivot([leftDoor, leftHandle], -w / 2);
    const rightPivot = makeLeafPivot([rightDoor, rightHandle], w / 2);
    g.add(leftPivot, rightPivot);
    leaves.push(leftPivot, rightPivot);
  } else if (kind === 'screen') {
    // Pull-down projector screen: a roller casing at the top with the matte
    // screen hanging below it, bottom edge at `sill`.
    const casingC = 0x2a2c30, screenC = 0xf2f2ee, top = sill + h;
    g.add(box(w + 0.06, 0.1, 0.12, casingC, 0, top + 0.05, 0.06));   // roller casing
    g.add(box(w, h, 0.02, screenC, 0, sill + h / 2, 0.04));          // screen surface
    g.add(box(0.02, h, 0.025, 0x111316, -w / 2 + 0.01, sill + h / 2, 0.045)); // side borders
    g.add(box(0.02, h, 0.025, 0x111316, w / 2 - 0.01, sill + h / 2, 0.045));
    g.add(box(w + 0.02, 0.03, 0.03, casingC, 0, sill, 0.05));        // bottom weight bar
  }

  // Sunlight raking through the glazing — windows and glazed "Fenstertür" doors.
  // A spotlight placed outside-and-above the glass throws a stretched shaft of
  // light across the floor; the frame/mullions cast the window-pane shadow into it.
  let sun = null;
  if (kind === 'window' || (kind === 'door' && spec.glazed)) {
    const top = sill + h;
    sun = new THREE.SpotLight(0xfff1d4, 110, 18, 0.5, 0.45, 2);
    sun.position.set(0.8, top + 1.8, -2.6);  // sun: above and outside the glass
    sun.target.position.set(-1.1, 0, 3.2);   // streak of light across the floor inside
    sun.visible = overrides.lightOn ?? true;
    sun.castShadow = true;
    sun.shadow.mapSize.set(512, 512);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 20;
    sun.shadow.bias = -0.0006;
    g.add(sun);
    g.add(sun.target);
    // opaque frame parts cast the muntin shadow; glass lets light through
    g.traverse((o) => { if (o.isMesh) o.castShadow = !(o.material && o.material.transparent); });
  }

  g.userData = {
    isOpening: true, kind, type, label: spec.label, glazed: !!spec.glazed,
    w, h, sill, edgeIndex: 0, t: 0.5, color: 0,
    leaves, isOpen: false,
    sun, lightOn: overrides.lightOn ?? true,
  };
  g.traverse((o) => { if (o.isMesh) o.userData.isOpeningPart = true; });
  return g;
}
