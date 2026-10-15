<script setup lang="ts">
import { store, getEditor } from '../store';
import Icon from './Icon.vue';
import FurnitureInspector from './inspector/FurnitureInspector.vue';
import OpeningInspector from './inspector/OpeningInspector.vue';
import WallInspector from './inspector/WallInspector.vue';
import LightInspector from './inspector/LightInspector.vue';

// The inspector for whatever is selected, as its own box floating over the
// top-right of the 3D view. It pops up when something is clicked and goes away
// when the selection clears: clicking empty floor, Escape, or the close button.
// Which inspector shows is decided by the kind of the store's selection
// snapshot, so the editor never has to toggle panels itself.
</script>

<template>
  <Transition name="pop">
    <section v-if="store.selection" class="selection-card" aria-label="Selection">
      <header class="selection-card-head">
        <h2 class="panel-title">Selection</h2>
        <button class="card-close" title="Close (Esc)" aria-label="Close" @click="getEditor().select(null)">
          <Icon name="close" :size="16" />
        </button>
      </header>
      <div class="selection-card-body">
        <FurnitureInspector v-if="store.selection.kind === 'furniture'" />
        <OpeningInspector v-else-if="store.selection.kind === 'opening'" />
        <WallInspector v-else-if="store.selection.kind === 'wall'" />
        <LightInspector v-else-if="store.selection.kind === 'light'" />
      </div>
    </section>
  </Transition>
</template>
