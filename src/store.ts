import { reactive, shallowRef } from 'vue';
import type { Editor } from './editor/Editor';
import type { Finish, OpeningKind, ViewMode } from './editor/types';

// Plain-data mirror of the editor state the panels render. The editor is the
// source of truth and writes here (see editor/useStoreSync.ts); components read
// it and call editor methods to change things. Nothing from Three.js lives in
// here: keeping meshes out of Vue's reactivity is what keeps the scene fast.

export interface FurnitureSelection {
  kind: 'furniture';
  type: string;
  label: string;
  w: number;
  d: number;
  h: number;
  rotationDeg: number; // exact rotation, 0..359
  color: number;
  // Size presets for this type (beds), or null. `value` is the matching
  // preset id, or 'custom' when the current size matches none of them.
  variant: { label: string; options: { id: string; label: string }[]; value: string } | null;
}

export interface OpeningSelection {
  kind: 'opening';
  openingKind: OpeningKind;
  type: string;
  glazed: boolean;
  w: number;
  h: number;
  sill: number;
  hasEmitter: boolean; // a sun shaft (window / glazed door) or a lamp light
  lightOn: boolean;
  intensity: number;
  lightColor: number;
}

export interface WallSelection {
  kind: 'wall';
  length: number;
  thickness: number;
}

export interface LightSelection {
  kind: 'light';
  intensity: number;
  color: number;
  on: boolean;
}

export type Selection = FurnitureSelection | OpeningSelection | WallSelection | LightSelection;

export interface RoomState {
  shape: string;
  width: number; // bounding box, meters
  length: number;
  height: number;
  area: number;
  floorFinish: Finish;
  wallFinish: Finish;
  floorColor: number;
  wallColor: number;
}

export const store = reactive({
  view: 'perspective' as ViewMode,
  readout: 'Drag to orbit · scroll to zoom', // base hint shown over the canvas
  flash: null as string | null, // short-lived message that overrides the readout
  room: {
    shape: 'rectangle',
    width: 4.2,
    length: 3.6,
    height: 2.6,
    area: 15.1,
    floorFinish: 'plain',
    wallFinish: 'plain',
    floorColor: 0xffffff,
    wallColor: 0xf1ede4,
  } as RoomState,
  selection: null as Selection | null,
  floors: [] as string[], // floor names, in order
  activeFloor: 0,
  layouts: [] as string[], // saved layout names, sorted
  layoutPick: '', // the layout dropdown's value; '' means "New layout…"
});

// The live editor, set by SceneView once its canvas exists. Components call
// getEditor() inside event handlers, never during setup, because the panels
// render before the scene mounts.
export const editorRef = shallowRef<Editor | null>(null);

export function getEditor(): Editor {
  const e = editorRef.value;
  if (!e) throw new Error('The editor is not mounted yet');
  return e;
}
