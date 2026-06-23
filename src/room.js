import * as THREE from 'three';

// Layout presets. Each `outline(W, L)` returns a polygon as an array of [x, z]
// points (meters), centered on the origin in a W×L box. A preset only seeds the
// initial corners — afterwards every corner is editable independently, so any
// wall can be made longer or shorter (the room is no longer a fixed proportion).
export const LAYOUTS = {
  rectangle: {
    label: 'Rectangle',
    outline: (W, L) => [
      [-W / 2, -L / 2], [W / 2, -L / 2], [W / 2, L / 2], [-W / 2, L / 2],
    ],
  },
  l: {
    label: 'L-shaped',
    outline: (W, L) => {
      const nx = W * 0.42, nz = L * 0.42;
      return [
        [-W / 2, -L / 2], [W / 2, -L / 2],
        [W / 2, L / 2 - nz], [W / 2 - nx, L / 2 - nz],
        [W / 2 - nx, L / 2], [-W / 2, L / 2],
      ];
    },
  },
  t: {
    label: 'T-shaped',
    outline: (W, L) => {
      const bar = L * 0.42, stem = W * 0.26;
      return [
        [-stem, -L / 2], [stem, -L / 2],
        [stem, L / 2 - bar], [W / 2, L / 2 - bar],
        [W / 2, L / 2], [-W / 2, L / 2],
        [-W / 2, L / 2 - bar], [-stem, L / 2 - bar],
      ];
    },
  },
  u: {
    label: 'U-shaped',
    outline: (W, L) => {
      const arm = (W - W * 0.34) / 2, notchZ = L * 0.5;
      return [
        [-W / 2, -L / 2], [W / 2, -L / 2], [W / 2, L / 2], [W / 2 - arm, L / 2],
        [W / 2 - arm, L / 2 - notchZ], [-W / 2 + arm, L / 2 - notchZ],
        [-W / 2 + arm, L / 2], [-W / 2, L / 2],
      ];
    },
  },
};

export class Room {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.shape = 'rectangle';
    this.height = 2.6;
    this.vertices = LAYOUTS.rectangle.outline(4.2, 3.6);
    this.floorFinish = 'plain';
    this.wallFinish = 'plain';
    // Surface tint multiplied over the finish. Defaults preserve the original
    // look: neutral white for the floor, the warm off-white for plain walls.
    this.floorColor = 0xffffff;
    this.wallColor = 0xf1ede4;
    this.gridTexture = this.makeGridTexture();
    this.woodBase = this.makeWoodTexture();
    this.build();
  }

  /* ---------- Geometry source ---------- */
  get points() { return this.vertices; }

  get bboxWidth() {
    const xs = this.vertices.map((p) => p[0]);
    return Math.max(...xs) - Math.min(...xs);
  }

  get bboxLength() {
    const zs = this.vertices.map((p) => p[1]);
    return Math.max(...zs) - Math.min(...zs);
  }

  makeGridTexture() {
    const s = 256;
    const cv = document.createElement('canvas');
    cv.width = cv.height = s;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#ece7df';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = '#cfc8bb';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, s, s);
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 1); // ShapeGeometry UVs are raw meters → one tile = 1 m
    return tex;
  }

  // Procedural light-coloured wood: ~1 m of light-oak planks with subtle grain.
  makeWoodTexture() {
    const s = 256, planks = 5, ph = s / planks;
    const tones = ['#e0c79e', '#d7bc8f', '#e4cda4', '#d9bf94', '#cfb389'];
    const cv = document.createElement('canvas');
    cv.width = cv.height = s;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#dcc196';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < planks; i++) {
      ctx.fillStyle = tones[i % tones.length];
      ctx.fillRect(0, i * ph, s, ph);
      ctx.strokeStyle = 'rgba(120,95,60,0.35)'; // plank seam
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, i * ph); ctx.lineTo(s, i * ph); ctx.stroke();
      ctx.strokeStyle = 'rgba(150,120,80,0.16)'; // grain
      ctx.lineWidth = 1;
      for (let gr = 0; gr < 6; gr++) {
        const y = i * ph + 4 + Math.random() * (ph - 8);
        ctx.beginPath(); ctx.moveTo(0, y);
        for (let x = 0; x <= s; x += 16) ctx.lineTo(x, y + Math.sin((x / s) * Math.PI * 2 + i) * 1.5);
        ctx.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  floorMaterial() {
    if (this.floorFinish === 'wood') {
      const t = this.woodBase.clone();
      t.repeat.set(1, 1); t.needsUpdate = true; // ShapeGeometry UVs in meters → 1 m tile
      return new THREE.MeshStandardMaterial({ color: this.floorColor, map: t, roughness: 0.72 });
    }
    return new THREE.MeshStandardMaterial({ color: this.floorColor, map: this.gridTexture, roughness: 0.92 });
  }

  wallMaterial(len, h) {
    if (this.wallFinish === 'wood') {
      const t = this.woodBase.clone();
      t.repeat.set(len, h); t.needsUpdate = true; // 1 m tile across the wall
      return new THREE.MeshStandardMaterial({ color: this.wallColor, map: t, roughness: 0.8, side: THREE.BackSide });
    }
    return new THREE.MeshStandardMaterial({ color: this.wallColor, roughness: 1, side: THREE.BackSide });
  }

  setFloorFinish(f) { this.floorFinish = f; this.build(); }
  setWallFinish(f) { this.wallFinish = f; this.build(); }
  setFloorColor(hex) { this.floorColor = hex; this.build(); }
  setWallColor(hex) { this.wallColor = hex; this.build(); }

  build() {
    this.group.clear();
    const pts = this.vertices;
    const h = this.height;

    // Floor — filled polygon clipped to the room shape, with the chosen finish.
    const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
    const floor = new THREE.Mesh(new THREE.ShapeGeometry(shape), this.floorMaterial());
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.001;
    floor.receiveShadow = true;
    floor.userData.isFloor = true;
    this.group.add(floor);

    // Walls — one back-side plane per edge (dollhouse cull: near walls hide).
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const mid = this.edgeMid(i);
      const len = this.edgeLength(i);
      const n = this.edgeInwardNormal(i);
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(len, h), this.wallMaterial(len, h));
      wall.position.set(mid.x, h / 2, mid.z);
      wall.rotation.y = Math.atan2(-n.x, -n.z); // outward normal
      wall.receiveShadow = true;
      this.group.add(wall);
    }

    this.group.add(this.buildCage(pts, h));
  }

  buildCage(pts, h) {
    const verts = [];
    const push = (x, y, z) => verts.push(x, y, z);
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      push(a[0], 0, a[1]); push(b[0], 0, b[1]);
      push(a[0], h, a[1]); push(b[0], h, b[1]);
      push(a[0], 0, a[1]); push(a[0], h, a[1]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    return new THREE.LineSegments(
      g, new THREE.LineBasicMaterial({ color: 0x9aa1ad, transparent: true, opacity: 0.45 })
    );
  }

  /* ---------- Edge helpers (used by walls + openings) ---------- */
  edgeA(i) { return this.vertices[i]; }
  edgeB(i) { return this.vertices[(i + 1) % this.vertices.length]; }
  edgeLength(i) {
    const a = this.edgeA(i), b = this.edgeB(i);
    return Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  edgeMid(i) {
    const a = this.edgeA(i), b = this.edgeB(i);
    return { x: (a[0] + b[0]) / 2, z: (a[1] + b[1]) / 2 };
  }
  edgeDir(i) {
    const a = this.edgeA(i), b = this.edgeB(i);
    const len = this.edgeLength(i) || 1;
    return { x: (b[0] - a[0]) / len, z: (b[1] - a[1]) / len };
  }
  // Unit inward normal, found by nudging the midpoint and testing containment.
  edgeInwardNormal(i) {
    const d = this.edgeDir(i);
    const n = { x: d.z, z: -d.x };
    const mid = this.edgeMid(i);
    return this.contains(mid.x + n.x * 0.02, mid.z + n.z * 0.02) ? n : { x: -n.x, z: -n.z };
  }
  // World point at fraction t (0..1) along edge i.
  pointOnEdge(i, t) {
    const a = this.edgeA(i), b = this.edgeB(i);
    return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t };
  }
  // Closest fraction t on edge i to world point (x,z).
  projectOntoEdge(i, x, z) {
    const a = this.edgeA(i), b = this.edgeB(i);
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const len2 = dx * dx + dz * dz || 1;
    return Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / len2));
  }

  /* ---------- State edits ---------- */
  setShape(shape) {
    if (!LAYOUTS[shape]) return;
    this.shape = shape;
    this.vertices = LAYOUTS[shape].outline(this.bboxWidth || 4.2, this.bboxLength || 3.6);
    this.build();
  }

  setHeight(h) { this.height = h; this.build(); }

  // Uniformly scale the polygon so its bounding box matches a target width/length.
  scaleWidthTo(target) {
    const cur = this.bboxWidth || 1;
    const f = target / cur;
    this.vertices = this.vertices.map(([x, z]) => [x * f, z]);
    this.build();
  }
  scaleLengthTo(target) {
    const cur = this.bboxLength || 1;
    const f = target / cur;
    this.vertices = this.vertices.map(([x, z]) => [x, z * f]);
    this.build();
  }

  // Move a single corner (with optional grid snap). Marks the shape custom.
  moveVertex(i, x, z, snap = 0.1) {
    const sx = Math.round(x / snap) * snap;
    const sz = Math.round(z / snap) * snap;
    this.vertices[i] = [sx, sz];
    this.shape = 'custom';
    this.build();
  }

  // Set both endpoints of an edge at once (used to slide a whole wall).
  setEdgeEndpoints(i, ax, az, bx, bz) {
    const j = (i + 1) % this.vertices.length;
    this.vertices[i] = [ax, az];
    this.vertices[j] = [bx, bz];
    this.shape = 'custom';
    this.build();
  }

  edgeOutwardNormal(i) {
    const n = this.edgeInwardNormal(i);
    return { x: -n.x, z: -n.z };
  }

  /* ---------- Area & containment ---------- */
  get area() {
    const p = this.vertices;
    let a = 0;
    for (let i = 0; i < p.length; i++) {
      const j = (i + 1) % p.length;
      a += p[i][0] * p[j][1] - p[j][0] * p[i][1];
    }
    return Math.abs(a) / 2;
  }

  contains(x, z) {
    const p = this.vertices;
    let inside = false;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const xi = p[i][0], zi = p[i][1], xj = p[j][0], zj = p[j][1];
      const hit = (zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi;
      if (hit) inside = !inside;
    }
    return inside;
  }

  footprintCorners(cx, cz, rotY, w, d) {
    const c = Math.cos(rotY), s = Math.sin(rotY);
    const hw = w / 2, hd = d / 2;
    return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([lx, lz]) => [
      cx + lx * c + lz * s,
      cz - lx * s + lz * c,
    ]);
  }

  footprintInside(cx, cz, rotY, w, d) {
    return this.footprintCorners(cx, cz, rotY, w, d).every(([x, z]) => this.contains(x, z));
  }

  // `blocked(x, z, rotY, w, d)` — optional extra exclusion test (e.g. interior
  // walls), applied on top of the room polygon containment check.
  findPlacement(rotY, w, d, pref, blocked) {
    const valid = (x, z) => this.footprintInside(x, z, rotY, w, d) && !(blocked && blocked(x, z, rotY, w, d));
    if (pref && valid(pref.x, pref.z)) return { x: pref.x, z: pref.z };
    const W = this.bboxWidth, L = this.bboxLength, N = 11;
    const minX = Math.min(...this.vertices.map((p) => p[0]));
    const minZ = Math.min(...this.vertices.map((p) => p[1]));
    let best = null, bestDist = Infinity;
    const ox = pref ? pref.x : 0, oz = pref ? pref.z : 0;
    for (let i = 0; i <= N; i++) {
      for (let j = 0; j <= N; j++) {
        const x = minX + (W * i) / N, z = minZ + (L * j) / N;
        if (!valid(x, z)) continue;
        const dist = (x - ox) ** 2 + (z - oz) ** 2;
        if (dist < bestDist) { bestDist = dist; best = { x, z }; }
      }
    }
    return best || { x: 0, z: 0 };
  }

  // Longest edge — a sensible default wall for new doors/windows.
  longestEdge() {
    let bi = 0, bl = -1;
    for (let i = 0; i < this.vertices.length; i++) {
      const l = this.edgeLength(i);
      if (l > bl) { bl = l; bi = i; }
    }
    return bi;
  }
}
