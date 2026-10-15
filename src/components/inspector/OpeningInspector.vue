<script setup lang="ts">
import { computed } from 'vue';
import { store, getEditor } from '../../store';
import type { OpeningSelection } from '../../store';
import type { OpeningKind } from '../../editor/types';
import { DOOR_TYPES, WINDOW_TYPES } from '../../editor/openings';
import { LIGHT_COLORS } from '../../editor/useLights';
import { meters } from '../../format';
import RangeField from './RangeField.vue';
import Swatches from './Swatches.vue';

// The inspector block for a selected door, window or wall fixture (cabinet,
// projector screen, wall lamp). Everything shown comes from the opening
// snapshot in store.selection; every control calls back into the openings
// module, which rebuilds the piece and refreshes the snapshot.
const sel = computed<OpeningSelection | null>(() => {
  const s = store.selection;
  return s && s.kind === 'opening' ? s : null;
});

const kind = computed(() => sel.value?.openingKind);
const isDoor = computed(() => kind.value === 'door');
const isWindow = computed(() => kind.value === 'window');
const isLamp = computed(() => kind.value === 'lamp');
const isGlazedDoor = computed(() => isDoor.value && !!sel.value?.glazed);
const hasSizes = computed(() => isDoor.value || isWindow.value);
const showW = computed(() => isWindow.value || kind.value === 'cabinet' || isLamp.value);
const showH = computed(() => isWindow.value || kind.value === 'cabinet' || isGlazedDoor.value || isLamp.value);
const showSillSlider = computed(() => isWindow.value || isLamp.value); // windows & lamps slide vertically

const NAMES: Partial<Record<OpeningKind, string>> = { cabinet: 'Wall cabinet', screen: 'Projector screen', lamp: 'Wall lamp' };

const name = computed(() => {
  const s = sel.value;
  if (!s) return '';
  return s.glazed ? 'Window door' : (NAMES[s.openingKind] || (s.openingKind === 'door' ? 'Door' : 'Window'));
});

const sizeText = computed(() => {
  const s = sel.value;
  return s ? `${Math.round(s.w * 1000)} × ${Math.round(s.h * 1000)} mm` : '';
});

const sillLabel = computed(() => (isWindow.value ? 'Sill height' : 'Mounting height'));
const sillText = computed(() => (sel.value ? `${Math.round(sel.value.sill * 1000)} mm` : ''));
const brightnessText = computed(() => (sel.value ? String(+sel.value.intensity.toFixed(1)) : ''));

const typeOptions = computed(() => (isDoor.value ? DOOR_TYPES : WINDOW_TYPES));

const note = computed(() => {
  const s = sel.value;
  if (!s) return '';
  return s.glazed ? 'Fenstertür — a full-height glazed balcony/patio door that doubles as a window.'
    : s.openingKind === 'door' ? 'DIN 18101 standard door sizes.'
    : s.openingKind === 'window' ? 'Sill at 0.90 m — the German Brüstungshöhe (below it needs fall protection).'
    : s.openingKind === 'cabinet' ? 'Wall-mounted upper cabinet (Hängeschrank), bottom edge at 1.45 m.'
    : isLamp.value ? 'A glowing light panel — drag it along or up/down the wall, resize it, and set its brightness.'
    : 'Pull-down projector screen mounted on the wall; drag it along any wall.';
});

const toggleText = computed(() => {
  const word = isLamp.value ? 'light' : 'sunlight';
  return sel.value?.lightOn ? 'Turn ' + word + ' off' : 'Turn ' + word + ' on';
});

function onTypeChange(e: Event) {
  getEditor().changeOpeningType((e.target as HTMLSelectElement).value);
}
</script>

<template>
  <div v-if="sel">
    <div class="prop-row"><span>Type</span><strong>{{ name }}</strong></div>
    <div v-if="!(showW || showH)" class="prop-row"><span>Size (W×H)</span><strong>{{ sizeText }}</strong></div>
    <RangeField
      v-if="showW"
      label="Width"
      :value="sel.w"
      :display="meters(sel.w)"
      :min="0.4"
      :max="3"
      :step="0.05"
      @input="getEditor().resizeOpening('w', $event)"
    />
    <RangeField
      v-if="showH"
      label="Height"
      :value="sel.h"
      :display="meters(sel.h)"
      :min="0.4"
      :max="2.4"
      :step="0.05"
      @input="getEditor().resizeOpening('h', $event)"
    />
    <div v-if="!(isDoor || showSillSlider)" class="prop-row"><span>{{ sillLabel }}</span><strong>{{ sillText }}</strong></div>
    <RangeField
      v-if="showSillSlider"
      label="Sill height"
      :value="sel.sill"
      :display="meters(sel.sill)"
      :min="0"
      :max="2"
      :step="0.05"
      @input="getEditor().resizeOpening('sill', $event)"
    />
    <RangeField
      v-if="isLamp"
      label="Brightness"
      :value="sel.intensity"
      :display="brightnessText"
      :min="0"
      :max="20"
      :step="0.1"
      @input="getEditor().setOpeningBrightness($event)"
    />
    <label v-if="isLamp" class="field color-field">
      <span>Light color</span>
      <Swatches :colors="LIGHT_COLORS" :value="sel.lightColor" @pick="getEditor().setOpeningLightColor($event)" />
    </label>
    <label v-if="hasSizes" class="field">
      <span>Standard size</span>
      <select class="select" :value="sel.type" @change="onTypeChange">
        <option v-for="o in typeOptions" :key="o.type" :value="o.type">{{ o.label }}</option>
      </select>
    </label>
    <p class="hint">{{ note }}</p>
    <button v-if="sel.hasEmitter" class="btn block" :class="{ 'btn-off': !sel.lightOn }" @click="getEditor().toggleOpeningLight()">
      {{ toggleText }}
    </button>
    <button class="btn block" @click="getEditor().duplicateSelected()">Duplicate</button>
  </div>
</template>
