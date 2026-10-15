<script setup lang="ts">
import { store, getEditor } from '../store';
import RoomSection from './inspector/RoomSection.vue';
import FurnitureInspector from './inspector/FurnitureInspector.vue';
import OpeningInspector from './inspector/OpeningInspector.vue';
import WallInspector from './inspector/WallInspector.vue';
import LightInspector from './inspector/LightInspector.vue';

// The right-hand panel: room settings, the interior-wall button and the
// inspector for whatever is selected. Which selection inspector shows is
// decided by the kind of the store's selection snapshot, so the editor never
// has to toggle panels itself.

function addWall() {
  getEditor().addWall();
}
</script>

<template>
  <aside class="panel inspector">
    <section class="inspector-block">
      <RoomSection />
    </section>

    <section class="inspector-block">
      <h2 class="panel-title">Interior walls</h2>
      <button class="btn block" @click="addWall">Add wall</button>
      <p class="hint">Splits the room — e.g. to separate a bathroom from the main room. In <strong>Top-down</strong>, drag the orange end-points to resize, or drag the wall to move it. Add a door from the catalog and drag it onto the new wall to connect the two spaces.</p>
    </section>

    <section class="inspector-block">
      <h2 class="panel-title">Selection</h2>
      <div v-if="!store.selection" class="empty-state">Nothing selected.<br/>Click furniture in the room.</div>
      <FurnitureInspector v-else-if="store.selection.kind === 'furniture'" />
      <OpeningInspector v-else-if="store.selection.kind === 'opening'" />
      <WallInspector v-else-if="store.selection.kind === 'wall'" />
      <LightInspector v-else-if="store.selection.kind === 'light'" />
    </section>
  </aside>
</template>
