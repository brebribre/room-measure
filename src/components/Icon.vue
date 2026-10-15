<script setup lang="ts">
import { computed } from 'vue';
import { ICON_PATHS } from '../editor/icons';

// One glyph from the inline icon set, drawn in currentColor.
const props = withDefaults(defineProps<{ name: string; size?: number; stroke?: number }>(), {
  size: 24,
  stroke: 1.6,
});

const body = computed(() => ICON_PATHS[props.name] ?? ICON_PATHS._missing);
</script>

<template>
  <svg
    class="icon"
    viewBox="0 0 24 24"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    :stroke-width="stroke"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="body"
  />
</template>
