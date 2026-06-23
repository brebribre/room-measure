import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// Scene/camera/renderer setup, lighting rigs, controls (orbit + pointer-lock
// walk) and canvas resizing.
export function useScene() {
  return {
    initScene() {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x0b0d11);

      this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
      this.perspectivePos = new THREE.Vector3(5, 5, 6);
      this.camera.position.copy(this.perspectivePos);

      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      // Filmic tone mapping rolls off bright highlights instead of clipping them
      // to a harsh white blob, so lamps read as soft glows rather than hotspots.
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.15;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFShadowMap;
      // Shadow maps are static: re-rendered only when occluders actually move,
      // not every frame. `shadowDirty` counts down the frames over which the
      // maps refresh after a change; `invalidateShadows()` re-arms it.
      this.renderer.shadowMap.autoUpdate = false;
      this.shadowDirty = 3;
      const invalidate = () => { if (this.view !== 'walk') this.invalidateShadows(); };
      ['click', 'input', 'change', 'keydown'].forEach((ev) => document.addEventListener(ev, invalidate));

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
        if (this.view === 'walk') document.getElementById('readout').textContent = 'WASD / arrows to move · E to open/close · Esc to release the mouse';
      });

      this.scene.add(new THREE.HemisphereLight(0xffffff, 0x444a55, 0.9));
      const key = new THREE.DirectionalLight(0xffffff, 1.1);
      key.position.set(4, 8, 5);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.left = -8; key.shadow.camera.right = 8;
      key.shadow.camera.top = 8; key.shadow.camera.bottom = -8;
      key.shadow.bias = -0.0005;
      this.scene.add(key);
      const fill = new THREE.DirectionalLight(0xffffff, 0.3);
      fill.position.set(-5, 4, -3);
      this.scene.add(fill);

      this.resize();
      window.addEventListener('resize', () => this.resize());
    },

    resize() {
      const r = this.canvas.parentElement.getBoundingClientRect();
      this.renderer.setSize(r.width, r.height, false);
      this.camera.aspect = r.width / r.height;
      this.camera.updateProjectionMatrix();
    },

    // Re-arm static shadow maps to refresh over the next few frames. Called on
    // any edit (via the document interaction listeners) and while dragging or
    // animating openings — but not while merely orbiting/walking the camera,
    // since camera motion doesn't change where shadows fall.
    invalidateShadows(frames = 2) {
      this.shadowDirty = Math.max(this.shadowDirty || 0, frames);
    },
  };
}
