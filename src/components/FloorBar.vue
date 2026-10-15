<script setup lang="ts">
import { store, getEditor } from '../store';
import Icon from './Icon.vue';

// The floor tabs above the workspace. They render from store.floors, which the
// floors module refreshes through syncFloors() after every change; a click,
// double-click or × calls straight back into that module.
</script>

<template>
  <div class="floorbar">
    <span class="floorbar-label">Floors</span>
    <div class="floor-tabs">
      <button
        v-for="(name, i) in store.floors"
        :key="i"
        class="floor-tab"
        :class="{ active: i === store.activeFloor }"
        title="Double-click to rename"
        @click="getEditor().switchFloor(i)"
        @dblclick="getEditor().renameFloor(i)"
      >
        <span>{{ name }}</span>
        <span
          v-if="store.floors.length > 1"
          class="floor-tab-remove"
          title="Delete floor"
          @click.stop="getEditor().removeFloor(i)"
        >×</span>
      </button>
    </div>
    <button class="btn floor-add" title="Add another floor" @click="getEditor().addFloor()">
      <span class="floor-add-icon"><Icon name="plus" :size="15" /></span>Add floor
    </button>
  </div>
</template>
