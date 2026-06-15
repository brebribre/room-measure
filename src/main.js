import * as THREE from 'three';
import { Room } from './room.js';
import { useScene } from './useScene.js';
import { useCatalog } from './useCatalog.js';
import { useFurniture } from './useFurniture.js';
import { useInteriorWalls } from './useInteriorWalls.js';
import { useOpenings } from './useOpenings.js';
import { useLights } from './useLights.js';
import { useSelection } from './useSelection.js';
import { useRoomHandles } from './useRoomHandles.js';
import { useViewMode } from './useViewMode.js';
import { useWalkMode } from './useWalkMode.js';
import { useCanvasInteraction } from './useCanvasInteraction.js';
import { useEdgeLabels } from './useEdgeLabels.js';
import { usePersistence } from './usePersistence.js';
import { useUIBindings } from './useUIBindings.js';

class Editor {
  constructor() {
    this.canvas = document.getElementById('scene');
    this.furniture = [];
    this.openings = [];
    this.lights = [];
    this.walls = [];
    this.handleMeshes = [];
    this.wallHandleMeshes = [];
    this.LIGHT_COLORS = [0xfff0d0, 0xffffff, 0xdfeaff]; // warm, neutral, cool
    this.selected = null;
    this.view = 'perspective';
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.dragMode = null;            // 'furniture' | 'opening' | 'vertex' | null
    this.dragVertex = -1;
    this.dragOffset = new THREE.Vector3();
    this.animatingOpenings = new Set(); // doors/cabinets currently swinging open or closed

    // Mix in all the editor's logic modules — each contributes methods that
    // operate on `this` (shared scene/state below).
    Object.assign(this,
      useScene(),
      useCatalog(),
      useFurniture(),
      useInteriorWalls(),
      useOpenings(),
      useLights(),
      useSelection(),
      useRoomHandles(),
      useViewMode(),
      useWalkMode(),
      useCanvasInteraction(),
      useEdgeLabels(),
      usePersistence(),
      useUIBindings(),
    );

    this.initScene();
    this.room = new Room(this.scene);
    this.handleGroup = new THREE.Group();
    this.scene.add(this.handleGroup);
    this.wallHandleGroup = new THREE.Group();
    this.scene.add(this.wallHandleGroup);
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

  /* ---------- Loop ---------- */
  animate() {
    requestAnimationFrame(() => this.animate());
    const dt = Math.min(this.clock.getDelta(), 0.1);
    if (this.view === 'walk') {
      if (this.plControls.isLocked) this.updateWalk(dt);
    } else {
      this.controls.update();
    }
    this.updateOpeningAnimations(dt);
    this.updateEdgeLabels();
    this.renderer.render(this.scene, this.camera);
  }
}

window.roomplan = new Editor();
