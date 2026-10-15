<script setup lang="ts">
import { getEditor } from '../store';
import RoomSection from './inspector/RoomSection.vue';

// The right-hand panel: room settings and the interior-wall button. The
// inspector for a selected object lives in its own floating box over the 3D
// view (SelectionCard.vue).

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
  </aside>
</template>
