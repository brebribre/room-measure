<script setup lang="ts">
import { hexToCss } from '../../format';

// A row of round colour swatches; the one matching `value` is outlined.
defineProps<{ colors: number[]; value: number }>();
const emit = defineEmits<{ pick: [hex: number] }>();
</script>

<template>
  <span class="swatches">
    <span
      v-for="hex in colors"
      :key="hex"
      class="swatch"
      :class="{ active: hex === value }"
      :style="{ background: hexToCss(hex) }"
      @click="emit('pick', hex)"
    />
  </span>
</template>
