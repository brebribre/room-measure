<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { Editor } from '../editor/Editor';
import { editorRef, store } from '../store';
import SelectionCard from './SelectionCard.vue';

// Center: the 3D canvas. This component owns the canvas and the edge-label
// overlay, and the editor's lifecycle with them: the editor is created once
// the elements exist and disposed when they go away. The readout renders from
// the store, and the selection box (with its rotate and delete buttons) floats
// over the canvas.

const canvas = ref<HTMLCanvasElement | null>(null);
const labels = ref<HTMLDivElement | null>(null);
let editor: Editor | null = null;

// A flash message briefly replaces the base hint.
const readout = computed(() => store.flash ?? store.readout);

onMounted(() => {
  if (!canvas.value || !labels.value) throw new Error('SceneView: the canvas or edge-labels element is missing');
  // The constructor does all the setup and starts the render loop.
  editor = new Editor(canvas.value, labels.value);
  editorRef.value = editor;
  window.roomplan = editor; // for poking at from the devtools console
});

onBeforeUnmount(() => {
  editor?.dispose();
  editor = null;
  editorRef.value = null;
});
</script>

<template>
  <main class="stage">
    <canvas id="scene" ref="canvas"></canvas>
    <div class="edge-labels" ref="labels"></div>
    <div class="stage-overlay">
      <div class="readout">{{ readout }}</div>
    </div>
    <SelectionCard />
  </main>
</template>
