<script setup lang="ts">
import { computed } from 'vue';
import { store, getEditor } from '../../store';
import type { FurnitureSelection } from '../../store';
import type { Dim } from '../../editor/types';
import { hexToCss, cssToHex, meters } from '../../format';
import RangeField from './RangeField.vue';

// The inspector for a selected piece of furniture: its size preset, the three
// size sliders, rotation, colour and duplicate. Every value comes from the
// selection snapshot in the store; every control calls the editor, which
// changes the scene and refreshes that snapshot.
//
// The parent mounts this panel only for a furniture selection, so the cast is
// safe; the v-if below still guards the frame in which the selection changes.
const sel = computed(() => store.selection as FurnitureSelection | null);

function onVariant(e: Event) {
  getEditor().applyVariant((e.target as HTMLSelectElement).value);
}

function resize(dim: Dim, v: number) {
  getEditor().resizeSelected(dim, v);
}

function onColor(e: Event) {
  getEditor().recolorSelected(cssToHex((e.target as HTMLInputElement).value));
}
</script>

<template>
  <div v-if="sel && sel.kind === 'furniture'">
    <div class="prop-row"><span>Item</span><strong>{{ sel.label }}</strong></div>
    <label v-if="sel.variant" class="field">
      <span>{{ sel.variant.label }}</span>
      <select class="select" :value="sel.variant.value" @change="onVariant">
        <option v-for="o in sel.variant.options" :key="o.id" :value="o.id">{{ o.label }}</option>
        <!-- Only offered while the current size matches no preset. -->
        <option v-if="sel.variant.value === 'custom'" value="custom">Custom</option>
      </select>
    </label>
    <RangeField
      label="Width"
      :value="sel.w"
      :display="meters(sel.w)"
      :min="0.2"
      :max="4"
      :step="0.05"
      @input="resize('w', $event)"
    />
    <RangeField
      label="Depth"
      :value="sel.d"
      :display="meters(sel.d)"
      :min="0.2"
      :max="4"
      :step="0.05"
      @input="resize('d', $event)"
    />
    <RangeField
      label="Height"
      :value="sel.h"
      :display="meters(sel.h)"
      :min="0.1"
      :max="2.6"
      :step="0.05"
      @input="resize('h', $event)"
    />
    <button class="btn block" style="margin-bottom:14px" @click="getEditor().resetSelectedSize()">
      Reset to default size
    </button>
    <!-- The slider steps by 15°, so its thumb sits on the nearest step below
         the exact rotation while the label shows the exact degrees. -->
    <RangeField
      label="Rotation"
      :value="sel.rotationDeg - (sel.rotationDeg % 15)"
      :display="sel.rotationDeg + '°'"
      :min="0"
      :max="345"
      :step="15"
      @input="getEditor().setSelectedRotation($event)"
    />
    <label class="field color-row">
      <span>Color</span>
      <input type="color" class="color-input" :value="hexToCss(sel.color)" @input="onColor" />
    </label>
    <button class="btn block" @click="getEditor().duplicateSelected()">Duplicate</button>
  </div>
</template>
