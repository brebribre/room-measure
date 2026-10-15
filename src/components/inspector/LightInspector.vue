<script setup lang="ts">
import { computed } from 'vue';
import { store, getEditor } from '../../store';
import type { LightSelection } from '../../store';
import { LIGHT_COLORS } from '../../editor/useLights';
import RangeField from './RangeField.vue';
import Swatches from './Swatches.vue';

// The inspector for a selected ceiling light: brightness, colour swatches, the
// on/off toggle and duplicate. Values come from the selection snapshot in the
// store; every control calls the editor, which refreshes that snapshot.
//
// The parent mounts this panel only for a light selection, so the cast is
// safe; the v-if below still guards the frame in which the selection changes.
const sel = computed(() => store.selection as LightSelection | null);

// One decimal, without a trailing ".0" (12 → "12", 12.5 → "12.5").
function brightness(v: number): string {
  return String(+v.toFixed(1));
}
</script>

<template>
  <div v-if="sel && sel.kind === 'light'">
    <div class="prop-row"><span>Type</span><strong>Ceiling light</strong></div>
    <RangeField
      label="Brightness"
      :value="sel.intensity"
      :display="brightness(sel.intensity)"
      :min="0"
      :max="30"
      :step="0.1"
      @input="getEditor().setLightIntensity($event)"
    />
    <label class="field color-field">
      <span>Color</span>
      <Swatches :colors="LIGHT_COLORS" :value="sel.color" @pick="(hex) => getEditor().setLightColor(hex)" />
    </label>
    <button class="btn block" :class="{ 'btn-off': !sel.on }" @click="getEditor().toggleLight()">
      {{ sel.on ? 'Turn light off' : 'Turn light on' }}
    </button>
    <button class="btn block" @click="getEditor().duplicateSelected()">Duplicate</button>
  </div>
</template>
