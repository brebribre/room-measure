import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { Room, LAYOUTS } from './room.js';
import { CATALOG, SWATCHES, createFurniture, getVariant } from './furniture.js';
import { DOOR_TYPES, WINDOW_TYPES, FIXTURE_TYPES, getOpeningSpec, createOpening } from './openings.js';

const STORAGE_KEY = 'roomplan.layout.v2';

class Editor {
  constructor() {
    this.canvas = document.getElementById('scene');
    this.furniture = [];
    this.openings = [];
    this.lights = [];
    this.handleMeshes = [];
    this.LIGHT_COLORS = [0xfff0d0, 0xffffff, 0xdfeaff]; // warm, neutral, cool
    this.selected = null;
    this.view = 'perspective';
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.dragMode = null;            // 'furniture' | 'opening' | 'vertex' | null
    this.dragVertex = -1;
    this.dragOffset = new THREE.Vector3();

    this.initScene();
    this.room = new Room(this.scene);
    this.handleGroup = new THREE.Group();
    this.scene.add(this.handleGroup);
    this.buildCatalog();
    this.buildSwatches();
    this.buildOpeningTypeSelect();
    this.bindUI();
    this.bindCanvas();
    this.updateRoomControls();
    this.rebuildHandles();
    this.animate();

    this.addFurniture('bed', { x: -0.7, z: -0.6 });
    this.addFurniture('sofa', { x: 0.6, z: 0.8 });
    this.addOpening('door-std');
    this.select(null);
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b0d11);

    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    this.perspectivePos = new THREE.Vector3(5, 5, 6);
    this.camera.position.copy(this.perspectivePos);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI / 2.05;
    this.controls.target.set(0, 0.5, 0);

    // First-person "walk" mode
    this.clock = new THREE.Clock();
    this.move = { f: false, b: false, l: false, r: false };
    this.plControls = new PointerLockControls(this.camera, this.canvas);
    this.plControls.addEventListener('unlock', () => {
      if (this.view === 'walk') document.getElementById('readout').textContent = 'Click to look around · WASD / arrows to move';
    });
    this.plControls.addEventListener('lock', () => {
      if (this.view === 'walk') document.getElementById('readout').textContent = 'WASD / arrows to move · Esc to release the mouse';
    });

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x444a55, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(4, 8, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -8; key.shadow.camera.right = 8;
    key.shadow.camera.top = 8; key.shadow.camera.bottom = -8;
    key.shadow.bias = -0.0005;
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.3);
    fill.position.set(-5, 4, -3);
    this.scene.add(fill);

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const r = this.canvas.parentElement.getBoundingClientRect();
    this.renderer.setSize(r.width, r.height, false);
    this.camera.aspect = r.width / r.height;
    this.camera.updateProjectionMatrix();
  }

  /* ---------- Catalog ---------- */
  buildCatalog() {
    const furn = document.getElementById('catalog');
    const kitchen = document.getElementById('kitchen-catalog');
    CATALOG.forEach((entry) => {
      const item = document.createElement('button');
      item.className = 'cat-item';
      item.innerHTML = `<span class="cat-icon">${entry.icon}</span><span class="cat-label">${entry.label}</span>`;
      item.addEventListener('click', () => this.addFurniture(entry.type));
      (entry.group === 'kitchen' ? kitchen : furn).appendChild(item);
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
  }

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
  }

  buildOpeningTypeSelect() {
    this.opTypeSel = document.getElementById('op-type');
  }

  fillOpeningTypeSelect(kind) {
    const list = kind === 'door' ? DOOR_TYPES : WINDOW_TYPES;
    this.opTypeSel.innerHTML = '';
    list.forEach((o) => {
      const opt = document.createElement('option');
      opt.value = o.type; opt.textContent = o.label;
      this.opTypeSel.appendChild(opt);
    });
  }

  /* ---------- Furniture ---------- */
  addFurniture(type, pos) {
    const group = createFurniture(type);
    const { w, d } = group.userData;
    const pref = pos ?? { x: (Math.random() - 0.5) * 1.5, z: (Math.random() - 0.5) * 1.5 };
    const c = this.room.findPlacement(0, w, d, pref);
    group.position.set(c.x, 0, c.z);
    this.scene.add(group);
    this.furniture.push(group);
    this.select(group);
    return group;
  }

  duplicateSelected() {
    if (!this.selected) return;
    const s = this.selected;
    if (s.userData.isOpening) {
      const copy = this.addOpening(s.userData.type, s.userData.edgeIndex);
      copy.userData.t = Math.min(0.92, s.userData.t + 0.12);
      this.positionOpening(copy);
      this.select(copy);
      return;
    }
    if (s.userData.isLight) {
      const copy = this.addCeilingLight({ x: s.position.x + 0.4, z: s.position.z + 0.4 });
      this.selected = copy; this.setLightColor(s.userData.color); this.setLightIntensity(s.userData.intensity);
      this.select(copy);
      return;
    }
    const copy = this.addFurniture(s.userData.type, { x: s.position.x + 0.3, z: s.position.z + 0.3 });
    copy.rotation.y = s.rotation.y;
    this.recolor(copy, s.userData.color);
    copy.userData.w = s.userData.w; copy.userData.d = s.userData.d; copy.userData.h = s.userData.h;
    this.applyFurnitureScale(copy);
    const c = this.room.findPlacement(copy.rotation.y, copy.userData.w, copy.userData.d, { x: s.position.x + 0.3, z: s.position.z + 0.3 });
    copy.position.set(c.x, 0, c.z);
    this.updateInspector();
  }

  rotateSelected() {
    if (!this.selected || this.selected.userData.isOpening) return;
    this.selected.rotation.y += Math.PI / 2;
    this.applyRotationUI();
    this.reclamp(this.selected);
  }

  reclamp(group) {
    const { w, d } = group.userData;
    const c = this.room.findPlacement(group.rotation.y, w, d, { x: group.position.x, z: group.position.z });
    group.position.x = c.x; group.position.z = c.z;
  }

  // Non-uniformly scale a furniture group from its base mesh dimensions.
  applyFurnitureScale(g) {
    const u = g.userData;
    g.scale.set(u.w / u.baseW, u.h / u.baseH, u.d / u.baseD);
  }

  // Populate / show the size-preset dropdown for furniture types that have variants.
  updateVariantUI(u) {
    const field = document.getElementById('sel-variant-field');
    const sel = document.getElementById('sel-variant');
    const variant = getVariant(u.type);
    if (!variant) { field.hidden = true; return; }
    field.hidden = false;
    document.getElementById('sel-variant-label').textContent = variant.label;
    sel.innerHTML = '';
    let matched = false;
    variant.options.forEach((o) => {
      const opt = document.createElement('option');
      opt.value = o.id; opt.textContent = o.label;
      // Match the current footprint to a preset (within 1 cm).
      if (Math.abs(o.w - u.w) < 0.01 && Math.abs(o.d - u.d) < 0.01) { opt.selected = true; matched = true; }
      sel.appendChild(opt);
    });
    if (!matched) {
      const opt = document.createElement('option');
      opt.value = 'custom'; opt.textContent = 'Custom'; opt.selected = true;
      sel.appendChild(opt);
    }
  }

  applyVariant(id) {
    const g = this.selected;
    if (!g || !g.userData.isFurniture) return;
    const variant = getVariant(g.userData.type);
    const opt = variant && variant.options.find((o) => o.id === id);
    if (!opt) return;
    g.userData.w = opt.w;
    g.userData.d = opt.d;
    this.applyFurnitureScale(g);
    this.reclamp(g);
    this.setSizeSlider('sel-w', opt.w);
    this.setSizeSlider('sel-d', opt.d);
  }

  setSizeSlider(id, value) {
    const el = document.getElementById(id);
    el.value = Math.min(Math.max(value, el.min), el.max);
    document.getElementById(id + '-val').textContent = value.toFixed(2) + ' m';
  }

  // dim: 'w' | 'd' | 'h'
  resizeSelected(dim, value) {
    const g = this.selected;
    if (!g || !g.userData.isFurniture) return;
    g.userData[dim] = value;
    this.applyFurnitureScale(g);
    if (dim !== 'h') this.reclamp(g); // height doesn't affect the floor footprint
    document.getElementById('sel-' + dim + '-val').textContent = value.toFixed(2) + ' m';
    if (dim !== 'h' && getVariant(g.userData.type)) this.updateVariantUI(g.userData);
  }

  resetSelectedSize() {
    const g = this.selected;
    if (!g || !g.userData.isFurniture) return;
    const u = g.userData;
    u.w = u.baseW; u.d = u.baseD; u.h = u.baseH;
    this.applyFurnitureScale(g);
    this.reclamp(g);
    this.updateInspector();
  }

  recolorSelected(hex) { if (this.selected && this.selected.userData.isFurniture) { this.recolor(this.selected, hex); this.updateInspector(); } }

  recolor(group, hex) {
    group.userData.color = hex;
    group.traverse((o) => {
      if (o.isMesh && o.material && !o.userData.isWorktop) {
        const { l } = o.material.color.getHSL({});
        if (l > 0.18) o.material.color.setHex(hex);
      }
    });
  }

  hasWorktop(group) {
    let found = false;
    group.traverse((o) => { if (o.userData.isWorktop) found = true; });
    return found;
  }

  // Swap a kitchen unit's worktop between plain stone and the light-wood texture.
  setWorktopFinish(group, finish) {
    group.userData.worktopFinish = finish;
    group.traverse((o) => {
      if (!o.isMesh || !o.userData.isWorktop) return;
      if (finish === 'wood') {
        const t = this.room.woodBase.clone();
        t.repeat.set(1.2, 0.6); t.needsUpdate = true; // planks along the worktop
        o.material = new THREE.MeshStandardMaterial({ color: 0xffffff, map: t, roughness: 0.55 });
      } else {
        o.material = new THREE.MeshStandardMaterial({ color: o.userData.baseColor ?? 0x3a3f48, roughness: 0.5, metalness: 0.1 });
      }
      o.castShadow = true; o.receiveShadow = true;
    });
  }

  /* ---------- Openings (doors & windows) ---------- */
  addOpening(type, edgeIndex) {
    const g = createOpening(type);
    g.userData.edgeIndex = edgeIndex ?? this.room.longestEdge();
    g.userData.t = 0.5;
    this.positionOpening(g);
    this.scene.add(g);
    this.openings.push(g);
    this.select(g);
    return g;
  }

  // Place an opening on its wall edge, centered at fraction t, facing inward.
  positionOpening(g) {
    const u = g.userData;
    if (u.edgeIndex >= this.room.vertices.length) u.edgeIndex = this.room.longestEdge();
    const i = u.edgeIndex;
    const len = this.room.edgeLength(i);
    const half = (u.w / 2) / (len || 1);
    u.t = len > u.w ? Math.max(half, Math.min(1 - half, u.t)) : 0.5;
    const p = this.room.pointOnEdge(i, u.t);
    const n = this.room.edgeInwardNormal(i);
    g.position.set(p.x + n.x * 0.02, 0, p.z + n.z * 0.02);
    g.rotation.y = Math.atan2(n.x, n.z);
  }

  refreshOpenings() { this.openings.forEach((g) => this.positionOpening(g)); }

  changeOpeningType(type) {
    const s = this.selected;
    if (!s || !s.userData.isOpening) return;
    const { edgeIndex, t } = s.userData;
    this.scene.remove(s);
    this.openings = this.openings.filter((o) => o !== s);
    const g = createOpening(type);
    g.userData.edgeIndex = edgeIndex;
    g.userData.t = t;
    this.positionOpening(g);
    this.scene.add(g);
    this.openings.push(g);
    this.select(g);
  }

  /* ---------- Ceiling lights ---------- */
  makeCeilingLight() {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16),
      new THREE.MeshStandardMaterial({ color: 0x888888 })));                       // ceiling canopy
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.2, 22, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xf4f1e8, emissive: 0xfff0c0, emissiveIntensity: 1, side: THREE.DoubleSide }));
    shade.position.y = -0.15;
    g.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2cc, emissiveIntensity: 2 }));
    bulb.position.y = -0.2;
    g.add(bulb);
    const light = new THREE.PointLight(0xfff0d0, 12, 9, 2);
    light.position.y = -0.22;
    g.add(light);
    g.userData = { isLight: true, type: 'ceiling-light', label: 'Ceiling light', intensity: 12, color: 0xfff0d0, light, shade };
    return g;
  }

  addCeilingLight(pos) {
    const g = this.makeCeilingLight();
    const p = pos ?? this.interiorPoint();
    g.position.set(p.x, this.room.height - 0.02, p.z);
    this.scene.add(g);
    this.lights.push(g);
    this.select(g);
    return g;
  }

  setLightIntensity(v) {
    const g = this.selected;
    if (!g || !g.userData.isLight) return;
    g.userData.intensity = v;
    g.userData.light.intensity = v;
    g.userData.shade.material.emissiveIntensity = Math.min(1.6, 0.2 + v / 12);
    document.getElementById('light-int-val').textContent = v;
  }

  setLightColor(hex) {
    const g = this.selected;
    if (!g || !g.userData.isLight) return;
    g.userData.color = hex;
    g.userData.light.color.setHex(hex);
    document.querySelectorAll('#light-swatches .swatch').forEach((s) =>
      s.classList.toggle('active', Number(s.dataset.hex) === hex));
  }

  /* ---------- Selection ---------- */
  select(obj) {
    if (this.selected) this.setHighlight(this.selected, false);
    this.selected = obj;
    if (obj) this.setHighlight(obj, true);
    this.updateInspector();
  }

  setHighlight(group, on) {
    if (group.userData.isLight) return; // lights are emissive already — don't tint them
    group.traverse((o) => {
      if (o.isMesh && o.material) {
        o.material.emissive = o.material.emissive ?? new THREE.Color(0x000000);
        o.material.emissive.setHex(on ? 0x33415f : 0x000000);
      }
    });
  }

  updateInspector() {
    const none = document.getElementById('no-selection');
    const fdet = document.getElementById('selection-details');
    const odet = document.getElementById('opening-details');
    const ldet = document.getElementById('light-details');
    const rotateFab = document.getElementById('fab-rotate');
    const deleteFab = document.getElementById('fab-delete');
    const sel = this.selected;

    none.hidden = !!sel;
    fdet.hidden = !(sel && sel.userData.isFurniture);
    odet.hidden = !(sel && sel.userData.isOpening);
    ldet.hidden = !(sel && sel.userData.isLight);
    deleteFab.disabled = !sel;
    rotateFab.disabled = !(sel && sel.userData.isFurniture);
    if (!sel) return;

    if (sel.userData.isLight) {
      const u = sel.userData;
      document.getElementById('light-int').value = u.intensity;
      document.getElementById('light-int-val').textContent = u.intensity;
      document.querySelectorAll('#light-swatches .swatch').forEach((s) =>
        s.classList.toggle('active', Number(s.dataset.hex) === u.color));
      return;
    }

    const u = sel.userData;
    if (u.isFurniture) {
      document.getElementById('sel-name').textContent = u.label;
      this.updateVariantUI(u);
      this.setSizeSlider('sel-w', u.w);
      this.setSizeSlider('sel-d', u.d);
      this.setSizeSlider('sel-h', u.h);
      this.applyRotationUI();
      document.querySelectorAll('.swatch').forEach((s) =>
        s.classList.toggle('active', Number(s.dataset.hex) === u.color));
    } else {
      const names = { cabinet: 'Wall cabinet', screen: 'Projector screen' };
      const hasSizes = u.kind === 'door' || u.kind === 'window';
      document.getElementById('op-name').textContent =
        u.glazed ? 'Window door' : (names[u.kind] || (u.kind === 'door' ? 'Door' : 'Window'));
      document.getElementById('op-size-row').hidden = false;
      document.getElementById('op-size').textContent =
        `${Math.round(u.w * 1000)} × ${Math.round(u.h * 1000)} mm`;
      document.getElementById('op-sill-row').hidden = u.kind === 'door';
      document.getElementById('op-sill-label').textContent = u.kind === 'window' ? 'Sill height' : 'Mounting height';
      document.getElementById('op-sill').textContent = `${Math.round(u.sill * 1000)} mm`;
      document.getElementById('op-type-field').hidden = !hasSizes;
      document.getElementById('op-note').textContent =
        u.glazed ? 'Fenstertür — a full-height glazed balcony/patio door that doubles as a window.'
        : u.kind === 'door' ? 'DIN 18101 standard door sizes.'
        : u.kind === 'window' ? 'Sill at 0.90 m — the German Brüstungshöhe (below it needs fall protection).'
        : u.kind === 'cabinet' ? 'Wall-mounted upper cabinet (Hängeschrank), bottom edge at 1.45 m.'
        : 'Pull-down projector screen mounted on the wall; drag it along any wall.';
      if (hasSizes) { this.fillOpeningTypeSelect(u.kind); this.opTypeSel.value = u.type; }
    }
  }

  applyRotationUI() {
    if (!this.selected || !this.selected.userData.isFurniture) return;
    let deg = Math.round((this.selected.rotation.y * 180 / Math.PI) % 360);
    if (deg < 0) deg += 360;
    document.getElementById('sel-rot').value = deg - (deg % 15);
    document.getElementById('sel-rot-val').textContent = deg + '°';
  }

  /* ---------- Delete (generic) ---------- */
  deleteSelected() {
    const s = this.selected;
    if (!s) return;
    this.scene.remove(s);
    this.furniture = this.furniture.filter((f) => f !== s);
    this.openings = this.openings.filter((o) => o !== s);
    this.lights = this.lights.filter((l) => l !== s);
    this.select(null);
  }

  /* ---------- Wall (edge) handles ---------- */
  // One grip per wall, sitting at the wall's midpoint and aligned with it. Drag a
  // grip to slide the whole wall in/out (both endpoints move along the normal).
  rebuildHandles() {
    this.handleGroup.clear();
    this.handleMeshes = [];
    const mat = new THREE.MeshBasicMaterial({ color: 0x5b8cff });
    this.room.vertices.forEach((_, i) => {
      const len = Math.min(0.5, this.room.edgeLength(i) * 0.6);
      const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.03, 0.12), mat);
      m.userData = { isHandle: true, edge: i };
      this.handleGroup.add(m);
      this.handleMeshes.push(m);
    });
    this.updateHandlePositions();
    this.handleGroup.visible = this.view === 'top';
  }

  updateHandlePositions() {
    this.handleMeshes.forEach((m) => {
      const i = m.userData.edge;
      const mid = this.room.edgeMid(i);
      const d = this.room.edgeDir(i);
      m.position.set(mid.x, 0.05, mid.z);
      m.rotation.y = Math.atan2(-d.z, d.x); // align long axis with the wall
    });
  }

  /* ---------- UI bindings ---------- */
  bindUI() {
    document.getElementById('view-tabs').addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (!tab) return;
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      this.setView(tab.dataset.view);
    });

    const shapeSel = document.getElementById('room-shape');
    Object.entries(LAYOUTS).forEach(([key, def]) => {
      const opt = document.createElement('option');
      opt.value = key; opt.textContent = def.label;
      shapeSel.appendChild(opt);
    });
    shapeSel.value = this.room.shape;
    shapeSel.addEventListener('change', (e) => {
      this.room.setShape(e.target.value);
      this.afterRoomChange();
    });

    document.getElementById('room-w').addEventListener('input', (e) => {
      this.room.scaleWidthTo(parseFloat(e.target.value));
      this.afterRoomChange(false);
    });
    document.getElementById('room-l').addEventListener('input', (e) => {
      this.room.scaleLengthTo(parseFloat(e.target.value));
      this.afterRoomChange(false);
    });
    document.getElementById('room-h').addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      document.getElementById('rh-val').textContent = v.toFixed(1) + ' m';
      this.room.setHeight(v);
      this.refreshOpenings();
      this.lights.forEach((l) => { l.position.y = this.room.height - 0.02; }); // keep on the ceiling
    });
    document.getElementById('floor-finish').addEventListener('change', (e) => this.room.setFloorFinish(e.target.value));
    document.getElementById('wall-finish').addEventListener('change', (e) => this.room.setWallFinish(e.target.value));

    document.getElementById('sel-rot').addEventListener('input', (e) => {
      if (!this.selected || !this.selected.userData.isFurniture) return;
      this.selected.rotation.y = parseFloat(e.target.value) * Math.PI / 180;
      document.getElementById('sel-rot-val').textContent = e.target.value + '°';
      this.reclamp(this.selected);
    });

    ['w', 'd', 'h'].forEach((dim) => {
      document.getElementById('sel-' + dim).addEventListener('input', (e) =>
        this.resizeSelected(dim, parseFloat(e.target.value)));
    });
    document.getElementById('sel-variant').addEventListener('change', (e) => this.applyVariant(e.target.value));
    document.getElementById('btn-reset-size').addEventListener('click', () => this.resetSelectedSize());
    document.getElementById('light-int').addEventListener('input', (e) => this.setLightIntensity(parseInt(e.target.value, 10)));
    document.getElementById('btn-duplicate-light').addEventListener('click', () => this.duplicateSelected());

    document.getElementById('op-type').addEventListener('change', (e) => this.changeOpeningType(e.target.value));
    document.getElementById('btn-duplicate').addEventListener('click', () => this.duplicateSelected());
    document.getElementById('btn-duplicate-op').addEventListener('click', () => this.duplicateSelected());
    document.getElementById('fab-rotate').addEventListener('click', () => this.rotateSelected());
    document.getElementById('fab-delete').addEventListener('click', () => this.deleteSelected());
    document.getElementById('btn-save').addEventListener('click', () => this.save());
    document.getElementById('btn-load').addEventListener('click', () => this.load());
    document.getElementById('btn-clear').addEventListener('click', () => this.clearAll());

    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (this.view === 'walk') return; // walking uses WASD, not the editor shortcuts
      if (e.key === 'r' || e.key === 'R') this.rotateSelected();
      if (e.key === 'Delete' || e.key === 'Backspace') this.deleteSelected();
      if ((e.key === 'd' || e.key === 'D') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); this.duplicateSelected(); }
      if (e.key === 'Escape') this.select(null);
    });

    // Walk-mode movement keys
    const KEYMAP = { KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r' };
    window.addEventListener('keydown', (e) => { const k = KEYMAP[e.code]; if (k && this.view === 'walk') { this.move[k] = true; e.preventDefault(); } });
    window.addEventListener('keyup', (e) => { const k = KEYMAP[e.code]; if (k) this.move[k] = false; });
  }

  // Called after the room polygon changes (shape/scale/vertex). resetCount=true
  // when the vertex count may have changed (shape switch).
  afterRoomChange(resetCount = true) {
    if (resetCount) this.rebuildHandles(); else this.updateHandlePositions();
    this.refreshOpenings();
    this.furniture.forEach((f) => this.reclamp(f));
    this.updateRoomControls();
  }

  setView(view) {
    const prev = this.view;
    this.view = view;
    if (prev === 'walk' && view !== 'walk' && this.plControls.isLocked) this.plControls.unlock();

    if (view === 'walk') {
      this.controls.enabled = false;
      this.select(null);
      const p = this.interiorPoint();
      this.camera.position.set(p.x, 1.65, p.z);          // eye height
      this.camera.lookAt(p.x, 1.65, p.z - 1);            // face into the room
      document.getElementById('readout').textContent = 'Click to look around · WASD / arrows to move';
      this.handleGroup.visible = false;
      return;
    }

    this.controls.enabled = true;
    if (view === 'top') {
      this.controls.enableRotate = false;
      this.camera.position.set(0, 9, 0.001);
      this.controls.target.set(0, 0, 0);
      document.getElementById('readout').textContent = 'Top-down · drag a wall to move it';
    } else {
      this.controls.enableRotate = true;
      this.camera.position.copy(this.perspectivePos);
      this.controls.target.set(0, 0.5, 0);
      document.getElementById('readout').textContent = 'Drag to orbit · scroll to zoom';
    }
    this.handleGroup.visible = view === 'top';
    this.controls.update();
  }

  // A point guaranteed to be inside the room polygon (for spawning the walker).
  interiorPoint() {
    const ok = (x, z) => this.room.contains(x, z) && !this.collidesFurniture(x, z);
    if (ok(0, 0)) return { x: 0, z: 0 };
    const v = this.room.vertices;
    const minX = Math.min(...v.map((p) => p[0])), maxX = Math.max(...v.map((p) => p[0]));
    const minZ = Math.min(...v.map((p) => p[1])), maxZ = Math.max(...v.map((p) => p[1]));
    for (let i = 1; i < 10; i++) for (let j = 1; j < 10; j++) {
      const x = minX + ((maxX - minX) * i) / 10, z = minZ + ((maxZ - minZ) * j) / 10;
      if (ok(x, z)) return { x, z };
    }
    return { x: 0, z: 0 };
  }

  // Move the first-person camera per frame, sliding along walls (no clipping through).
  updateWalk(dt) {
    const m = this.move;
    if (!(m.f || m.b || m.l || m.r)) return;
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    dir.y = 0;
    if (dir.lengthSq() < 1e-6) return;
    dir.normalize();
    const right = { x: -dir.z, z: dir.x };
    let dx = 0, dz = 0;
    if (m.f) { dx += dir.x; dz += dir.z; }
    if (m.b) { dx -= dir.x; dz -= dir.z; }
    if (m.r) { dx += right.x; dz += right.z; }
    if (m.l) { dx -= right.x; dz -= right.z; }
    const len = Math.hypot(dx, dz);
    if (!len) return;
    const speed = 2.6, margin = 0.15;
    dx = (dx / len) * speed * dt;
    dz = (dz / len) * speed * dt;
    const cam = this.camera.position;
    // per-axis so you slide along a wall / furniture instead of sticking
    const tx = cam.x + dx;
    if (this.room.contains(tx + Math.sign(dx) * margin, cam.z) && !this.collidesFurniture(tx, cam.z)) cam.x = tx;
    const tz = cam.z + dz;
    if (this.room.contains(cam.x, tz + Math.sign(dz) * margin) && !this.collidesFurniture(cam.x, tz)) cam.z = tz;
    cam.y = 1.65;
  }

  // True if a walker point at (x,z) would be inside any furniture footprint
  // (plus a body radius). Flat items like rugs are walkable and ignored.
  collidesFurniture(x, z) {
    const r = 0.22;
    for (const f of this.furniture) {
      if (f.userData.h < 0.2) continue;                 // walk over rugs / flat items
      if (f.position.y > 1.8) continue;                 // walk under high-stacked items
      const offX = x - f.position.x, offZ = z - f.position.z;
      const c = Math.cos(f.rotation.y), s = Math.sin(f.rotation.y);
      const lx = c * offX - s * offZ;                   // into the piece's local frame
      const lz = s * offX + c * offZ;
      if (Math.abs(lx) <= f.userData.w / 2 + r && Math.abs(lz) <= f.userData.d / 2 + r) return true;
    }
    return false;
  }

  // Height of the top surface of the tallest furniture whose footprint sits under
  // (x,z) — i.e. what an item dragged there would rest on. 0 if nothing is under it.
  supportUnder(g, x, z) {
    let top = 0;
    for (const f of this.furniture) {
      if (f === g) continue;
      const offX = x - f.position.x, offZ = z - f.position.z;
      const c = Math.cos(f.rotation.y), s = Math.sin(f.rotation.y);
      const lx = c * offX - s * offZ, lz = s * offX + c * offZ;
      if (Math.abs(lx) <= f.userData.w / 2 && Math.abs(lz) <= f.userData.d / 2) {
        const surface = f.position.y + f.userData.h;
        if (surface > top) top = surface;
      }
    }
    return top;
  }

  updateRoomControls() {
    document.getElementById('area-val').textContent = this.room.area.toFixed(1) + ' m²';
    const w = this.room.bboxWidth, l = this.room.bboxLength;
    const wEl = document.getElementById('room-w'), lEl = document.getElementById('room-l');
    wEl.value = Math.min(Math.max(w, wEl.min), wEl.max);
    lEl.value = Math.min(Math.max(l, lEl.min), lEl.max);
    document.getElementById('rw-val').textContent = w.toFixed(1) + ' m';
    document.getElementById('rl-val').textContent = l.toFixed(1) + ' m';
  }

  /* ---------- Canvas interaction ---------- */
  bindCanvas() {
    const c = this.canvas;
    c.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    c.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup', () => this.onPointerUp());
  }

  setPointer(e) {
    const r = this.canvas.getBoundingClientRect();
    this.pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    this.pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  }

  pickFrom(objects) {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    return this.raycaster.intersectObjects(objects, true);
  }

  pickSelectable() {
    const hits = this.pickFrom([...this.furniture, ...this.openings, ...this.lights]);
    if (!hits.length) return null;
    let o = hits[0].object;
    while (o && !o.userData.isFurniture && !o.userData.isOpening && !o.userData.isLight) o = o.parent;
    return o || null;
  }

  floorPoint() { return this.planePoint(0); }

  // Intersection of the cursor ray with a horizontal plane at height y.
  planePoint(y) {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -y);
    const out = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(plane, out) ? out : null;
  }

  onPointerDown(e) {
    // In walk mode a click captures the mouse for looking around.
    if (this.view === 'walk') { if (!this.plControls.isLocked) this.plControls.lock(); return; }

    this.setPointer(e);

    // Wall handles take priority in top-down view.
    if (this.view === 'top') {
      const h = this.pickFrom(this.handleMeshes);
      if (h.length) {
        const i = h[0].object.userData.edge;
        const fp = this.floorPoint();
        this.dragMode = 'edge';
        this.dragEdge = i;
        this.dragNormal = this.room.edgeOutwardNormal(i);
        this.dragOrigA = this.room.edgeA(i).slice();
        this.dragOrigB = this.room.edgeB(i).slice();
        this.dragStart = fp ? { x: fp.x, z: fp.z } : { x: 0, z: 0 };
        this.controls.enabled = false;
        this.canvas.style.cursor = 'grabbing';
        return;
      }
    }

    const hit = this.pickSelectable();
    if (hit) {
      this.select(hit);
      this.controls.enabled = false;
      this.canvas.style.cursor = 'grabbing';
      if (hit.userData.isOpening) {
        this.dragMode = 'opening';
      } else if (hit.userData.isLight) {
        this.dragMode = 'light';
      } else {
        this.dragMode = 'furniture';
        const fp = this.floorPoint();
        if (fp) this.dragOffset.set(hit.position.x - fp.x, 0, hit.position.z - fp.z);
      }
    } else {
      this.select(null);
    }
  }

  onPointerMove(e) {
    this.setPointer(e);
    if (this.dragMode === 'edge') {
      const fp = this.floorPoint();
      if (fp) {
        const dx = fp.x - this.dragStart.x, dz = fp.z - this.dragStart.z;
        let amount = dx * this.dragNormal.x + dz * this.dragNormal.z; // distance along the wall normal
        amount = Math.round(amount / 0.1) * 0.1;                      // snap to 0.1 m
        const nx = this.dragNormal.x * amount, nz = this.dragNormal.z * amount;
        this.room.setEdgeEndpoints(this.dragEdge,
          this.dragOrigA[0] + nx, this.dragOrigA[1] + nz,
          this.dragOrigB[0] + nx, this.dragOrigB[1] + nz);
        this.afterRoomChange(false);
      }
      return;
    }
    if (this.dragMode === 'furniture' && this.selected) {
      const fp = this.floorPoint();
      if (!fp) return;
      const g = this.selected, { w, d } = g.userData, rot = g.rotation.y;
      const tx = fp.x + this.dragOffset.x, tz = fp.z + this.dragOffset.z;
      if (this.room.footprintInside(tx, tz, rot, w, d)) { g.position.x = tx; g.position.z = tz; }
      else if (this.room.footprintInside(tx, g.position.z, rot, w, d)) g.position.x = tx;
      else if (this.room.footprintInside(g.position.x, tz, rot, w, d)) g.position.z = tz;
      // Rest on top of any furniture underneath; otherwise drop to the floor.
      g.position.y = this.supportUnder(g, g.position.x, g.position.z);
      return;
    }
    if (this.dragMode === 'light' && this.selected) {
      const p = this.planePoint(this.selected.position.y); // drag across the ceiling plane
      if (p && this.room.contains(p.x, p.z)) { this.selected.position.x = p.x; this.selected.position.z = p.z; }
      return;
    }
    if (this.dragMode === 'opening' && this.selected) {
      const fp = this.floorPoint();
      if (!fp) return;
      // Snap the opening to the nearest wall under the cursor, then slide along it.
      const best = this.nearestEdge(fp.x, fp.z);
      this.selected.userData.edgeIndex = best.i;
      this.selected.userData.t = this.room.projectOntoEdge(best.i, fp.x, fp.z);
      this.positionOpening(this.selected);
      return;
    }
    // hover cursor
    if (this.view === 'top' && this.pickFrom(this.handleMeshes).length) this.canvas.style.cursor = 'grab';
    else this.canvas.style.cursor = this.pickSelectable() ? 'grab' : 'default';
  }

  // Index of the wall edge closest to a floor point.
  nearestEdge(x, z) {
    let bi = 0, bd = Infinity;
    for (let i = 0; i < this.room.vertices.length; i++) {
      const t = this.room.projectOntoEdge(i, x, z);
      const p = this.room.pointOnEdge(i, t);
      const d = (p.x - x) ** 2 + (p.z - z) ** 2;
      if (d < bd) { bd = d; bi = i; }
    }
    return { i: bi };
  }

  onPointerUp() {
    if (this.dragMode) {
      this.dragMode = null;
      this.dragVertex = -1;
      this.controls.enabled = true;
      this.canvas.style.cursor = 'default';
    }
  }

  /* ---------- Edge length labels (top-down) ---------- */
  updateEdgeLabels() {
    const box = document.getElementById('edge-labels');
    if (this.view !== 'top') { if (box.childElementCount) box.innerHTML = ''; return; }
    const n = this.room.vertices.length;
    while (box.childElementCount < n) {
      const s = document.createElement('div');
      s.className = 'edge-label';
      box.appendChild(s);
    }
    while (box.childElementCount > n) box.removeChild(box.lastChild);
    const r = this.canvas.getBoundingClientRect();
    const v = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const mid = this.room.edgeMid(i);
      v.set(mid.x, 0, mid.z).project(this.camera);
      const el = box.children[i];
      el.style.left = (v.x * 0.5 + 0.5) * r.width + 'px';
      el.style.top = (-v.y * 0.5 + 0.5) * r.height + 'px';
      el.textContent = this.room.edgeLength(i).toFixed(2) + ' m';
    }
  }

  /* ---------- Persistence ---------- */
  serialize() {
    return {
      room: { shape: this.room.shape, height: this.room.height, vertices: this.room.vertices, floorFinish: this.room.floorFinish, wallFinish: this.room.wallFinish },
      items: this.furniture.map((f) => ({
        type: f.userData.type,
        x: +f.position.x.toFixed(3), y: +f.position.y.toFixed(3), z: +f.position.z.toFixed(3),
        rot: +f.rotation.y.toFixed(4), color: f.userData.color,
        w: +f.userData.w.toFixed(3), d: +f.userData.d.toFixed(3), h: +f.userData.h.toFixed(3),
      })),
      openings: this.openings.map((o) => ({
        type: o.userData.type, edgeIndex: o.userData.edgeIndex, t: +o.userData.t.toFixed(4),
      })),
      lights: this.lights.map((l) => ({
        type: l.userData.type, x: +l.position.x.toFixed(3), z: +l.position.z.toFixed(3),
        intensity: l.userData.intensity, color: l.userData.color,
      })),
    };
  }

  save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.serialize())); this.flash('Saved'); }

  load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { this.flash('No saved layout'); return; }
    this.applyState(JSON.parse(raw));
    this.flash('Loaded');
  }

  applyState(data) {
    this.clearAll(true);
    const r = data.room;
    this.room.shape = r.shape || 'custom';
    if (r.vertices) this.room.vertices = r.vertices.map((p) => [...p]);
    this.room.floorFinish = r.floorFinish || 'plain';
    this.room.wallFinish = r.wallFinish || 'plain';
    this.room.setHeight(r.height);
    document.getElementById('room-shape').value = LAYOUTS[this.room.shape] ? this.room.shape : 'rectangle';
    document.getElementById('floor-finish').value = this.room.floorFinish;
    document.getElementById('wall-finish').value = this.room.wallFinish;
    document.getElementById('room-h').value = r.height;
    document.getElementById('rh-val').textContent = r.height.toFixed(1) + ' m';
    this.rebuildHandles();
    this.updateRoomControls();
    (data.items || []).forEach((it) => {
      const g = createFurniture(it.type, it.color);
      g.rotation.y = it.rot;
      if (it.w != null) { g.userData.w = it.w; g.userData.d = it.d; g.userData.h = it.h; this.applyFurnitureScale(g); }
      g.position.set(it.x, it.y ?? 0, it.z);
      this.scene.add(g);
      this.furniture.push(g);
    });
    (data.openings || []).forEach((op) => {
      if (!getOpeningSpec(op.type)) return; // skip types removed since the save
      const g = createOpening(op.type);
      g.userData.edgeIndex = op.edgeIndex;
      g.userData.t = op.t;
      this.positionOpening(g);
      this.scene.add(g);
      this.openings.push(g);
    });
    (data.lights || []).forEach((lt) => {
      const g = this.makeCeilingLight();
      g.position.set(lt.x, this.room.height - 0.02, lt.z);
      g.userData.intensity = lt.intensity; g.userData.light.intensity = lt.intensity;
      g.userData.color = lt.color; g.userData.light.color.setHex(lt.color);
      this.scene.add(g);
      this.lights.push(g);
    });
    this.select(null);
  }

  clearAll(silent) {
    [...this.furniture, ...this.openings, ...this.lights].forEach((o) => this.scene.remove(o));
    this.furniture = [];
    this.openings = [];
    this.lights = [];
    this.select(null);
    if (!silent) this.flash('Cleared');
  }

  flash(msg) {
    const el = document.getElementById('readout');
    const prev = el.textContent;
    el.textContent = msg;
    clearTimeout(this._flashT);
    this._flashT = setTimeout(() => { el.textContent = prev; }, 1400);
  }

  /* ---------- Loop ---------- */
  animate() {
    requestAnimationFrame(() => this.animate());
    const dt = Math.min(this.clock.getDelta(), 0.1);
    if (this.view === 'walk') {
      if (this.plControls.isLocked) this.updateWalk(dt);
    } else {
      this.controls.update();
    }
    this.updateEdgeLabels();
    this.renderer.render(this.scene, this.camera);
  }
}

window.roomplan = new Editor();
