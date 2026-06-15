import * as THREE from 'three';

// Interior partition walls — free-standing segments inside the room polygon,
// used to split off areas (e.g. a bathroom) from the main room. Each wall is a
// THREE.Group whose userData holds the two endpoints `a`/`b` (meters, [x,z]),
// a `thickness` (meters) and the room `height` it spans.

export function createWall(a, b, thickness = 0.1, height = 2.6) {
  const g = new THREE.Group();
  g.userData = { isWall: true, label: 'Wall', a: [...a], b: [...b], thickness, height };
  rebuildWall(g);
  return g;
}

export function wallLength(g) {
  const { a, b } = g.userData;
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

// Rotation (rotation.y) that maps the local +x axis onto the a→b direction,
// matching the convention used by Room#footprintCorners.
export function wallRotation(g) {
  const { a, b } = g.userData;
  return Math.atan2(-(b[1] - a[1]), b[0] - a[0]);
}

export function wallMid(g) {
  const { a, b } = g.userData;
  return { x: (a[0] + b[0]) / 2, z: (a[1] + b[1]) / 2 };
}

// Unit vector perpendicular to the wall, consistent with footprintCorners'
// local-z axis — used to face doors mounted on the wall.
export function wallNormal(g) {
  const { a, b } = g.userData;
  const len = wallLength(g) || 1;
  return { x: -(b[1] - a[1]) / len, z: (b[0] - a[0]) / len };
}

// Rebuild the wall's box mesh after a/b/thickness/height change. `gaps` is an
// array of `{ t, w, h }` doorways mounted on this wall (fraction along the
// wall, width, door height) — each cuts a passable hole, with a lintel
// segment above it if the door is shorter than the wall.
export function rebuildWall(g, gaps = []) {
  g.clear();
  const { thickness, height } = g.userData;
  const len = Math.max(wallLength(g), 0.05);
  const mid = wallMid(g);
  const rotY = wallRotation(g);
  const { a, b } = g.userData;
  const dir = { x: (b[0] - a[0]) / len, z: (b[1] - a[1]) / len };

  const addSeg = (x0, x1, y0, y1) => {
    const segLen = x1 - x0, segH = y1 - y0;
    if (segLen <= 0.01 || segH <= 0.01) return;
    const offset = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(segLen, segH, thickness),
      new THREE.MeshStandardMaterial({ color: 0xdfd9cc, roughness: 0.95 })
    );
    mesh.position.set(mid.x + dir.x * offset, cy, mid.z + dir.z * offset);
    mesh.rotation.y = rotY;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.isWallPart = true;
    g.add(mesh);
  };

  const intervals = gaps
    .map(({ t, w, h: doorH }) => {
      const cx = (t - 0.5) * len;
      return { x0: cx - w / 2, x1: cx + w / 2, doorH };
    })
    .sort((p, q) => p.x0 - q.x0);

  let cursor = -len / 2;
  for (const gap of intervals) {
    const gx0 = Math.max(gap.x0, -len / 2), gx1 = Math.min(gap.x1, len / 2);
    if (gx1 <= cursor) continue;
    if (gx0 > cursor) addSeg(cursor, gx0, 0, height);
    if (gap.doorH < height) addSeg(Math.max(gx0, cursor), gx1, gap.doorH, height); // lintel
    cursor = Math.max(cursor, gx1);
  }
  if (cursor < len / 2 - 0.001) addSeg(cursor, len / 2, 0, height);
}

function corners(cx, cz, rot, w, d) {
  const c = Math.cos(rot), s = Math.sin(rot);
  const hw = w / 2, hd = d / 2;
  return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([lx, lz]) => [
    cx + lx * c + lz * s,
    cz - lx * s + lz * c,
  ]);
}

function axesOf(rot) {
  const c = Math.cos(rot), s = Math.sin(rot);
  return [[c, -s], [s, c]];
}

// True if two oriented rectangles (footprintCorners convention) overlap.
// `margin` grows rect 1 on every side — used to add a furniture clamp margin
// or a walker's body radius.
export function rectsOverlap(cx1, cz1, rot1, w1, d1, cx2, cz2, rot2, w2, d2, margin = 0) {
  const c1 = corners(cx1, cz1, rot1, w1 + margin * 2, d1 + margin * 2);
  const c2 = corners(cx2, cz2, rot2, w2, d2);
  for (const [ax, az] of [...axesOf(rot1), ...axesOf(rot2)]) {
    let min1 = Infinity, max1 = -Infinity, min2 = Infinity, max2 = -Infinity;
    for (const [x, z] of c1) { const p = x * ax + z * az; if (p < min1) min1 = p; if (p > max1) max1 = p; }
    for (const [x, z] of c2) { const p = x * ax + z * az; if (p < min2) min2 = p; if (p > max2) max2 = p; }
    if (max1 < min2 || max2 < min1) return false; // separating axis found
  }
  return true;
}
