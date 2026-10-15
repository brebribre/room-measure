<script setup lang="ts">
import TopBar from './components/TopBar.vue';
import FloorBar from './components/FloorBar.vue';
import CatalogPanel from './components/CatalogPanel.vue';
import SceneView from './components/SceneView.vue';
import InspectorPanel from './components/InspectorPanel.vue';
</script>

<template>
  <TopBar />
  <FloorBar />
  <div class="workspace">
    <CatalogPanel />
    <SceneView />
    <InspectorPanel />
  </div>
</template>
