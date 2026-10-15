import * as THREE from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { Room } from './room';
import { useScene } from './useScene';
import { useStoreSync } from './useStoreSync';
import { useFurniture } from './useFurniture';
import { useInteriorWalls } from './useInteriorWalls';
import { useOpenings } from './useOpenings';
import { useLights } from './useLights';
import { useSelection } from './useSelection';
import { useRoomHandles } from './useRoomHandles';
import { useRoomEdits } from './useRoomEdits';
import { useViewMode } from './useViewMode';
import { useWalkMode } from './useWalkMode';
import { useCanvasInteraction } from './useCanvasInteraction';
import { useEdgeLabels } from './useEdgeLabels';
import { useFloors } from './useFloors';
import { usePersistence } from './usePersistence';
import { useKeyboard } from './useKeyboard';
import type {
  BuildingData,
  Dim,
  DragMode,
  EdgeHandleMesh,
  Finish,
  FloorContent,
  FloorData,
  FurnitureGroup,
  LayoutsMap,
  LightGroup,
  MoveKeys,
  NearestEdge,
  OpeningData,
  OpeningGroup,
  OpeningOverrides,
  SceneObject,
  Vec2,
  ViewMode,
  WallGap,
  WallGeometry,
  WallGroup,
  WallHandleMesh,
  XZ,
} from './types';

/*
 * The editor is one object assembled from mixins: every use*.ts module returns
 * a bag of methods that run with `this` bound to the Editor, and the
 * constructor Object.assign()s them all onto the instance. The interfaces
 * below are the contract between those modules. `interface Editor` merges
 * them with the class, so inside any mixin `this.<anything>` is fully typed.
 *
 * Each mixin factory is declared as `(): XMixin & ThisType<Editor>`, which is
 * what gives its methods a typed `this`.
 *
 * The editor never touches the panels' DOM. Everything the panels show comes
 * from the store (see useStoreSync.ts); everything they change goes through
 * the methods here.
 */

// Scene, camera, renderer, lighting rigs, controls and canvas resizing.
export interface SceneMixin {
  initScene(): void;
  resize(): void;
  // Re-arm the static shadow maps to refresh over the next few frames.
  invalidateShadows(frames?: number): void;
}

// Mirrors editor state into the reactive store the panels render from.
export interface StoreSyncMixin {
  // Room shape, bounding size, height, area, finishes and colours.
  syncRoom(): void;
  // Snapshot of the selected object (or null) for the inspector.
  syncSelection(): void;
  // Floor names and the active index for the floor tabs.
  syncFloors(): void;
  // Saved layout names and the dropdown's current pick.
  syncLayouts(): void;
  // The hint shown over the canvas ("Drag to orbit · scroll to zoom").
  setReadout(text: string): void;
  // Briefly replace the readout with a message ("Saved \"Layout 1\"").
  flash(msg: string): void;
}

// Furniture placement, sizing presets, recolouring and floor-collision helpers.
export interface FurnitureMixin {
  addFurniture(type: string, pos?: XZ): FurnitureGroup;
  // Snap a piece back to a valid placement after a resize/rotate.
  reclamp(group: FurnitureGroup): void;
  applyFurnitureScale(g: FurnitureGroup): void;
  // Apply a size preset (bed sizes) to the selected piece.
  applyVariant(id: string): void;
  resizeSelected(dim: Dim, value: number): void;
  resetSelectedSize(): void;
  recolorSelected(hex: number): void;
  recolor(group: FurnitureGroup, hex: number): void;
  hasWorktop(group: FurnitureGroup): boolean;
  setWorktopFinish(group: FurnitureGroup, finish: Finish): void;
  // Top surface height of whatever furniture sits under (x,z); 0 if nothing.
  supportUnder(g: FurnitureGroup, x: number, z: number): number;
}

// Interior partition walls: creation, resizing, rotation, endpoint handles,
// collision against them, and cutting door gaps into them.
export interface InteriorWallsMixin {
  resizeWall(g: WallGroup, len: number): void;
  rotateWall(g: WallGroup): void;
  // Thickness of the selected wall (inspector slider).
  setWallThickness(v: number): void;
  wallsBlock(cx: number, cz: number, rot: number, w: number, d: number): boolean;
  collidesWalls(x: number, z: number, r?: number): boolean;
  wallGapOpenAt(wall: WallGroup, wallIndex: number, x: number, z: number): boolean;
  placementOk(cx: number, cz: number, rot: number, w: number, d: number): boolean;
  addWall(a?: Vec2, b?: Vec2, thickness?: number): WallGroup;
  rebuildWallHandles(): void;
  updateWallHandlePositions(): void;
  doorGapsForWall(wallIndex: number): WallGap[];
  refreshWallOpenings(): void;
}

// Doors, windows and wall fixtures: placement on a room edge or interior wall,
// swing animation, and the walk-mode "press E" interaction.
export interface OpeningsMixin {
  addOpening(type: string, edgeIndex?: number, overrides?: OpeningOverrides): OpeningGroup;
  resizeOpening(dim: 'w' | 'h' | 'sill', value: number): void;
  openingWallGeometry(u: OpeningData): WallGeometry;
  positionOpening(g: OpeningGroup): void;
  refreshOpenings(): void;
  toggleOpening(g: OpeningGroup): boolean;
  updateOpeningAnimations(dt: number): void;
  interactNearestOpening(): void;
  changeOpeningType(type: string): void;
  toggleOpeningLight(): void;
  setOpeningBrightness(v: number): void;
  setOpeningLightColor(hex: number): void;
}

// Ceiling lights.
export interface LightsMixin {
  makeCeilingLight(): LightGroup;
  addCeilingLight(pos?: XZ): LightGroup;
  setLightIntensity(v: number): void;
  setLightColor(hex: number): void;
  toggleLight(): void;
}

// Selection state and selection-scoped actions.
export interface SelectionMixin {
  select(obj: SceneObject | null): void;
  setHighlight(group: SceneObject, on: boolean): void;
  // Rotation slider: degrees, furniture only.
  setSelectedRotation(deg: number): void;
  rotateSelected(): void;
  duplicateSelected(): void;
  deleteSelected(): void;
}

// Room-edge drag grips (top-down view) and the shared "room changed" refresh.
export interface RoomHandlesMixin {
  rebuildHandles(): void;
  updateHandlePositions(): void;
  // resetCount=true when the vertex count may have changed (shape switch).
  afterRoomChange(resetCount?: boolean): void;
}

// Room settings from the inspector: shape, size, height, finishes, colours.
export interface RoomEditsMixin {
  setRoomShape(shape: string): void;
  setRoomWidth(target: number): void;
  setRoomLength(target: number): void;
  setRoomHeight(v: number): void;
  setFloorFinish(f: Finish): void;
  setWallFinish(f: Finish): void;
  setFloorColor(hex: number): void;
  setWallColor(hex: number): void;
}

// Switching between the perspective, top-down and first-person views.
export interface ViewModeMixin {
  setView(view: ViewMode): void;
}

// First-person walking: spawn point, per-frame movement, furniture collision.
export interface WalkModeMixin {
  interiorPoint(): XZ;
  updateWalk(dt: number): void;
  collidesFurniture(x: number, z: number): boolean;
}

// Pointer / raycast interaction with the canvas: picking and dragging.
export interface CanvasInteractionMixin {
  bindCanvas(): void;
  setPointer(e: PointerEvent): void;
  pickFrom(objects: THREE.Object3D[]): THREE.Intersection[];
  pickSelectable(): SceneObject | null;
  floorPoint(): THREE.Vector3 | null;
  wallHeightAtCursor(a: Vec2, b: Vec2): number | null;
  planePoint(y: number): THREE.Vector3 | null;
  onPointerDown(e: PointerEvent): void;
  onPointerMove(e: PointerEvent): void;
  nearestEdge(x: number, z: number): NearestEdge;
  onPointerUp(): void;
}

// Floating length labels over each wall in the top-down view.
export interface EdgeLabelsMixin {
  updateEdgeLabels(): void;
}

// Multiple floors: only the active one is live in the scene.
export interface FloorsMixin {
  serializeFloor(): FloorContent;
  applyFloor(data: FloorContent): void;
  initFloors(): void;
  suggestFloorName(index: number): string;
  captureActiveFloor(): void;
  switchFloor(index: number): void;
  addFloor(): void;
  removeFloor(index: number): void;
  renameFloor(index: number): void;
}

// Named layouts in localStorage, share links, and clearing the scene.
export interface PersistenceMixin {
  initLayoutStorage(): void;
  loadLayoutsMap(): LayoutsMap;
  saveLayoutsMap(map: LayoutsMap): void;
  suggestLayoutName(map: LayoutsMap): string;
  serialize(): BuildingData;
  save(): void;
  load(): void;
  deleteLayout(): void;
  encodeLayoutForShare(data: BuildingData): string;
  decodeSharedLayout(encoded: string): unknown;
  shareLink(): void;
  loadSharedLayoutFromURL(): boolean;
  // Accepts the current multi-floor format or an old single-floor save.
  applyState(data: unknown): void;
  clearAll(silent?: boolean): void;
}

// Global keyboard shortcuts and walk-mode movement keys.
export interface KeyboardMixin {
  bindKeys(): void;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface Editor
  extends SceneMixin,
    StoreSyncMixin,
    FurnitureMixin,
    InteriorWallsMixin,
    OpeningsMixin,
    LightsMixin,
    SelectionMixin,
    RoomHandlesMixin,
    RoomEditsMixin,
    ViewModeMixin,
    WalkModeMixin,
    CanvasInteractionMixin,
    EdgeLabelsMixin,
    FloorsMixin,
    PersistenceMixin,
    KeyboardMixin {}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class Editor {
  canvas: HTMLCanvasElement;
  // Overlay the top-down wall-length labels are positioned in.
  labelsEl: HTMLElement;

  /* ---------- Scene objects ---------- */
  furniture: FurnitureGroup[] = [];
  openings: OpeningGroup[] = [];
  lights: LightGroup[] = [];
  walls: WallGroup[] = [];
  handleMeshes: EdgeHandleMesh[] = [];
  wallHandleMeshes: WallHandleMesh[] = [];
  selected: SceneObject | null = null;
  room!: Room;
  handleGroup: THREE.Group;
  wallHandleGroup: THREE.Group;
  // Doors / cabinets currently swinging open or closed.
  animatingOpenings = new Set<OpeningGroup>();

  /* ---------- Rendering (set up in initScene) ---------- */
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  renderer!: THREE.WebGLRenderer;
  controls!: OrbitControls;
  plControls!: PointerLockControls;
  clock!: THREE.Clock;
  perspectivePos!: THREE.Vector3;
  // Frames left over which the static shadow maps refresh.
  shadowDirty = 0;
  view: ViewMode = 'perspective';
  move: MoveKeys = { f: false, b: false, l: false, r: false };

  /* ---------- Pointer interaction ---------- */
  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
  dragMode: DragMode = null;
  dragVertex = -1;
  dragOffset = new THREE.Vector3();
  dragWall: number | null = null;
  dragEnd: 'a' | 'b' = 'a';
  dragEdge = 0;
  dragNormal: XZ = { x: 0, z: 0 };
  dragOrigA: Vec2 = [0, 0];
  dragOrigB: Vec2 = [0, 0];
  dragStart: XZ = { x: 0, z: 0 };
  dragWallStart: { a: Vec2; b: Vec2; x: number; z: number } | null = null;

  /* ---------- Floors and saving ---------- */
  floors: FloorData[] = [];
  activeFloor = 0;
  currentLayoutName: string | null = null;
  flashTimer: ReturnType<typeof setTimeout> | undefined;

  /* ---------- Lifecycle ---------- */
  // Every window/document listener the mixins add is registered with this
  // signal, so dispose() can drop them all at once.
  private abort = new AbortController();
  listenerSignal: AbortSignal = this.abort.signal;
  private rafId = 0;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement, labelsEl: HTMLElement) {
    this.canvas = canvas;
    this.labelsEl = labelsEl;

    Object.assign(
      this,
      useScene(),
      useStoreSync(),
      useFurniture(),
      useInteriorWalls(),
      useOpenings(),
      useLights(),
      useSelection(),
      useRoomHandles(),
      useRoomEdits(),
      useViewMode(),
      useWalkMode(),
      useCanvasInteraction(),
      useEdgeLabels(),
      useFloors(),
      usePersistence(),
      useKeyboard(),
    );

    this.initScene();
    this.room = new Room(this.scene);
    this.handleGroup = new THREE.Group();
    this.scene.add(this.handleGroup);
    this.wallHandleGroup = new THREE.Group();
    this.scene.add(this.wallHandleGroup);
    this.bindKeys();
    this.initLayoutStorage();
    this.bindCanvas();
    this.animate();

    if (!this.loadSharedLayoutFromURL()) {
      this.syncRoom();
      this.rebuildHandles();
      this.addFurniture('bed', { x: -0.7, z: -0.6 });
      this.addFurniture('sofa', { x: 0.6, z: 0.8 });
      this.addOpening('door-std');
      this.select(null);
      this.initFloors();
    }
  }

  /* ---------- Loop ---------- */
  animate(): void {
    if (this.disposed) return;
    this.rafId = requestAnimationFrame(() => this.animate());
    const dt = Math.min(this.clock.getDelta(), 0.1);
    if (this.view === 'walk') {
      if (this.plControls.isLocked) this.updateWalk(dt);
    } else {
      this.controls.update();
    }
    this.updateOpeningAnimations(dt);
    this.updateEdgeLabels();
    // Refresh shadow maps only when something that casts a shadow is moving or
    // was just edited; otherwise reuse last frame's maps (the big idle win).
    this.renderer.shadowMap.needsUpdate =
      this.shadowDirty > 0 || this.dragMode != null || this.animatingOpenings.size > 0;
    if (this.shadowDirty > 0) this.shadowDirty--;
    this.renderer.render(this.scene, this.camera);
  }

  // Stop rendering and release everything; called when the scene component unmounts.
  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    this.abort.abort();
    clearTimeout(this.flashTimer);
    this.controls.dispose();
    this.plControls.dispose();
    this.renderer.dispose();
  }
}
