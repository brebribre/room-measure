<script setup lang="ts">
import { computed } from 'vue';

// A labelled slider with the current value shown on the right, e.g.
// "Width  1.20 m". The parent formats `display`; the slider only emits numbers.
const props = defineProps<{
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
}>();

const emit = defineEmits<{ input: [value: number] }>();

// The real value may sit outside the slider's range (a loaded layout, say);
// the thumb pins to the nearest end while the label still shows the truth.
const clamped = computed(() => Math.min(Math.max(props.value, props.min), props.max));

function onInput(e: Event) {
  emit('input', parseFloat((e.target as HTMLInputElement).value));
}
</script>

<template>
  <label class="field">
    <span>{{ label }} <em>{{ display }}</em></span>
    <input type="range" :min="min" :max="max" :step="step" :value="clamped" @input="onInput" />
  </label>
</template>
