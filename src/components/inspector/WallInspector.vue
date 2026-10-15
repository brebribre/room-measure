<script setup lang="ts">
import { computed } from 'vue';
import { store, getEditor } from '../../store';
import type { WallSelection } from '../../store';
import { isWallGroup } from '../../editor/types';
import { meters } from '../../format';
import RangeField from './RangeField.vue';

// The inspector for a selected interior wall: length, thickness and duplicate.
// Values come from the selection snapshot in the store; the sliders call the
// editor, which rebuilds the wall and refreshes that snapshot.
//
// The parent mounts this panel only for a wall selection, so the cast is
// safe; the v-if below still guards the frame in which the selection changes.
const sel = computed(() => store.selection as WallSelection | null);

// resizeWall takes the wall group itself, so look it up on the editor the way
// the old slider handler did.
function resizeWall(v: number) {
  const e = getEditor();
  if (e.selected && isWallGroup(e.selected)) e.resizeWall(e.selected, v);
}

function cm(v: number): string {
  return Math.round(v * 100) + ' cm';
}
</script>

<template>
  <div v-if="sel && sel.kind === 'wall'">
    <div class="prop-row"><span>Item</span><strong>Interior wall</strong></div>
    <RangeField
      label="Length"
      :value="sel.length"
      :display="meters(sel.length)"
      :min="0.3"
      :max="8"
      :step="0.05"
      @input="resizeWall"
    />
    <RangeField
      label="Thickness"
      :value="sel.thickness"
      :display="cm(sel.thickness)"
      :min="0.05"
      :max="0.3"
      :step="0.01"
      @input="getEditor().setWallThickness($event)"
    />
    <p class="hint">Drag the orange end-points (Top-down) to resize, or drag the wall to move it.</p>
    <button class="btn block" @click="getEditor().duplicateSelected()">Duplicate</button>
  </div>
</template>
