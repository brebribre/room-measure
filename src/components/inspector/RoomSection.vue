<script setup lang="ts">
import { computed } from 'vue';
import { store, getEditor } from '../../store';
import { LAYOUTS } from '../../editor/room';
import { hexToCss, cssToHex, meters } from '../../format';
import type { Finish } from '../../editor/types';
import RangeField from './RangeField.vue';

// The Room block of the inspector: layout preset, bounding size, wall height,
// floor area, finishes and colours. Every control shows the store's value and
// hands its new value to the editor, which rebuilds the room and syncs back.

// A room whose corners were dragged is 'custom', which has no preset entry;
// the dropdown then shows Rectangle, as the old panel did.
const shapeValue = computed(() => (LAYOUTS[store.room.shape] ? store.room.shape : 'rectangle'));

function onShape(e: Event) {
  getEditor().setRoomShape((e.target as HTMLSelectElement).value);
}

function onWidth(v: number) {
  getEditor().setRoomWidth(v);
}

function onLength(v: number) {
  getEditor().setRoomLength(v);
}

function onHeight(v: number) {
  getEditor().setRoomHeight(v);
}

function onFloorFinish(e: Event) {
  getEditor().setFloorFinish((e.target as HTMLSelectElement).value as Finish);
}

function onWallFinish(e: Event) {
  getEditor().setWallFinish((e.target as HTMLSelectElement).value as Finish);
}

function onFloorColor(e: Event) {
  getEditor().setFloorColor(cssToHex((e.target as HTMLInputElement).value));
}

function onWallColor(e: Event) {
  getEditor().setWallColor(cssToHex((e.target as HTMLInputElement).value));
}
</script>

<template>
  <h2 class="panel-title">Room</h2>
  <label class="field">
    <span>Layout</span>
    <select class="select" :value="shapeValue" @change="onShape">
      <option v-for="(def, key) in LAYOUTS" :key="key" :value="key">{{ def.label }}</option>
    </select>
  </label>
  <RangeField
    label="Width"
    :value="store.room.width"
    :display="meters(store.room.width, 1)"
    :min="2"
    :max="8"
    :step="0.1"
    @input="onWidth"
  />
  <RangeField
    label="Length"
    :value="store.room.length"
    :display="meters(store.room.length, 1)"
    :min="2"
    :max="8"
    :step="0.1"
    @input="onLength"
  />
  <RangeField
    label="Wall height"
    :value="store.room.height"
    :display="meters(store.room.height, 1)"
    :min="2.2"
    :max="3.5"
    :step="0.1"
    @input="onHeight"
  />
  <div class="area-readout">Floor area <strong>{{ store.room.area.toFixed(1) }} m²</strong></div>
  <label class="field" style="margin-top:14px">
    <span>Floor finish</span>
    <select class="select" :value="store.room.floorFinish" @change="onFloorFinish">
      <option value="plain">Plain</option>
      <option value="wood">Light wood</option>
    </select>
  </label>
  <label class="field color-row">
    <span>Floor color</span>
    <input type="color" class="color-input" :value="hexToCss(store.room.floorColor)" @input="onFloorColor" />
  </label>
  <label class="field">
    <span>Wall finish</span>
    <select class="select" :value="store.room.wallFinish" @change="onWallFinish">
      <option value="plain">Plain</option>
      <option value="wood">Light wood</option>
    </select>
  </label>
  <label class="field color-row">
    <span>Wall color</span>
    <input type="color" class="color-input" :value="hexToCss(store.room.wallColor)" @input="onWallColor" />
  </label>
  <p class="hint">Switch to <strong>Top-down</strong> and drag a wall to slide it in or out — resizing that side of the room.</p>
</template>
