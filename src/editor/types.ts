import type * as THREE from 'three';

// Shared types for the editor. Scene objects are THREE.Groups whose userData
// carries the editor's metadata; the Typed* helpers below give that userData a
// known shape so `group.userData.w` is a number, not `any`.

export type Vec2 = [number, number]; // [x, z] in meters
export interface XZ {
  x: number;
  z: number;
}
export type Finish = 'plain' | 'wood';
export type ViewMode = 'perspective' | 'top' | 'walk';
export type OpeningKind = 'door' | 'window' | 'cabinet' | 'screen' | 'lamp';
export type Dim = 'w' | 'd' | 'h';
export type StandardMesh = THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;

// A group / mesh with typed userData. Objects are created as plain THREE
// groups and cast once, at the place their userData is assigned.
export interface TypedGroup<U extends Record<string, any>> extends THREE.Group {
  userData: U;
}
export interface TypedMesh<U extends Record<string, any>> extends THREE.Mesh {
  userData: U;
}

/* ---------- Scene object metadata ---------- */

// The is* flags are the discriminant: exactly one is true per object.
export interface FurnitureData {
  isFurniture: true;
  isOpening?: false;
  isLight?: false;
  isWall?: false;
  type: string;
  label: string;
  // current footprint / height in meters (mutable: resized by scaling the group)
  w: number;
  d: number;
  h: number;
  // dimensions the mesh was built at; scale = current / base
  baseW: number;
  baseD: number;
  baseH: number;
  color: number;
  worktopFinish?: Finish;
}

export interface OpeningData {
  isOpening: true;
  isFurniture?: false;
  isLight?: false;
  isWall?: false;
  kind: OpeningKind;
  type: string;
  label: string;
  glazed: boolean;
  w: number;
  h: number;
  sill: number; // mounting height of the bottom edge
  edgeIndex: number; // room edge it sits on (when wallIndex is null)
  wallIndex: number | null; // interior wall it sits on, if any
  // Which face of an interior wall it mounts on: 1 is the side wallNormal()
  // points to, -1 the other. Room edges have one usable face and ignore it.
  side: 1 | -1;
  t: number; // position along the wall, 0..1
  color: number;
  leaves: THREE.Group[]; // hinged pivots that swing open
  isOpen: boolean;
  sun: THREE.SpotLight | null; // sun shaft through glazing
  light: THREE.PointLight | null; // wall-lamp emitter
  panel: StandardMesh | null; // wall-lamp glowing face
  intensity: number;
  lightColor: number;
  lightOn: boolean;
}

export interface LightData {
  isLight: true;
  isFurniture?: false;
  isOpening?: false;
  isWall?: false;
  type: 'ceiling-light';
  label: string;
  intensity: number;
  color: number;
  light: THREE.PointLight;
  shade: StandardMesh;
  bulb: StandardMesh;
  on: boolean;
}

export interface WallData {
  isWall: true;
  isFurniture?: false;
  isOpening?: false;
  isLight?: false;
  label: string;
  a: Vec2;
  b: Vec2;
  thickness: number;
  height: number;
}

export type FurnitureGroup = TypedGroup<FurnitureData>;
export type OpeningGroup = TypedGroup<OpeningData>;
export type LightGroup = TypedGroup<LightData>;
export type WallGroup = TypedGroup<WallData>;
export type SceneObject = FurnitureGroup | OpeningGroup | LightGroup | WallGroup;

// Top-down drag grips.
export interface EdgeHandleData {
  isHandle: true;
  edge: number;
}
export interface WallHandleData {
  isWallHandle: true;
  wall: number;
  end: 'a' | 'b';
}
export type EdgeHandleMesh = TypedMesh<EdgeHandleData>;
export type WallHandleMesh = TypedMesh<WallHandleData>;

/* ---------- Type guards ---------- */

export function isMesh(o: THREE.Object3D): o is THREE.Mesh {
  return (o as THREE.Mesh).isMesh === true;
}

// A mesh with a single MeshStandardMaterial (the only kind with `emissive`).
export function isStandardMesh(o: THREE.Object3D): o is StandardMesh {
  return isMesh(o) && !Array.isArray(o.material) && (o.material as THREE.MeshStandardMaterial).isMeshStandardMaterial === true;
}

export function isFurnitureGroup(o: THREE.Object3D): o is FurnitureGroup {
  return (o.userData as FurnitureData).isFurniture === true;
}
export function isOpeningGroup(o: THREE.Object3D): o is OpeningGroup {
  return (o.userData as OpeningData).isOpening === true;
}
export function isLightGroup(o: THREE.Object3D): o is LightGroup {
  return (o.userData as LightData).isLight === true;
}
export function isWallGroup(o: THREE.Object3D): o is WallGroup {
  return (o.userData as WallData).isWall === true;
}
export function isSceneObject(o: THREE.Object3D): o is SceneObject {
  return isFurnitureGroup(o) || isOpeningGroup(o) || isLightGroup(o) || isWallGroup(o);
}

/* ---------- Small value types used across mixins ---------- */

export interface OpeningOverrides {
  w?: number;
  h?: number;
  sill?: number;
  lightOn?: boolean;
  intensity?: number;
  lightColor?: number;
}

// A doorway cut into an interior wall: fraction along the wall, width, door height.
export interface WallGap {
  t: number;
  w: number;
  h: number;
}

// The wall an opening is mounted on: endpoints, length and the unit normal it faces.
export interface WallGeometry {
  a: Vec2;
  b: Vec2;
  len: number;
  normal: XZ;
  thickness: number; // 0 for a room edge, whose surface is the edge line itself
}

export interface NearestEdge {
  kind: 'room' | 'wall';
  i: number;
  a: Vec2;
  b: Vec2;
}

export type DragMode = 'furniture' | 'opening' | 'light' | 'wall' | 'wall-vertex' | 'edge' | null;

export interface MoveKeys {
  f: boolean;
  b: boolean;
  l: boolean;
  r: boolean;
}

/* ---------- Saved data (localStorage + share links) ---------- */
// Optional fields are ones older saves may lack; loading code fills defaults.

export interface RoomData {
  shape: string;
  height: number;
  vertices?: Vec2[]; // missing in the oldest saves; the room then keeps its current corners
  floorFinish?: Finish;
  wallFinish?: Finish;
  floorColor?: number;
  wallColor?: number;
}

export interface FurnitureItemData {
  type: string;
  x: number;
  y?: number;
  z: number;
  rot: number;
  color: number;
  w?: number;
  d?: number;
  h?: number;
}

export interface OpeningItemData {
  type: string;
  edgeIndex: number;
  wallIndex: number | null;
  side?: 1 | -1; // missing in saves from before openings could use both faces of a wall
  t: number;
  w?: number;
  h?: number;
  sill?: number;
  lightOn?: boolean;
  intensity?: number;
  lightColor?: number;
}

export interface LightItemData {
  type: string;
  x: number;
  z: number;
  intensity: number;
  color: number;
  on?: boolean;
}

export interface WallItemData {
  a: Vec2;
  b: Vec2;
  thickness: number;
}

// Everything that belongs to one floor.
export interface FloorContent {
  room: RoomData;
  items: FurnitureItemData[];
  openings: OpeningItemData[];
  lights: LightItemData[];
  walls: WallItemData[];
}

export interface FloorData extends FloorContent {
  name: string;
}

// A whole building: the current save format.
export interface BuildingData {
  floors: FloorData[];
  activeFloor: number;
}

export type LayoutsMap = Record<string, BuildingData>;
