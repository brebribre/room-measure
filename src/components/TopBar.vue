<script setup lang="ts">
import { store, getEditor } from '../store';
import type { ViewMode } from '../editor/types';
import Icon from './Icon.vue';

// The top bar: brand, the three view tabs and the saved-layout actions. The
// active tab follows store.view, which the view-mode module keeps current. The
// layout dropdown is the one control that v-models the store, because the
// editor reads that pick when it saves, loads or deletes a layout.
const VIEW_TABS: { view: ViewMode; icon: string; label: string; title: string }[] = [
  { view: 'perspective', icon: 'cube', label: '3D view', title: '3D view' },
  { view: 'top', icon: 'grid', label: 'Top-down', title: 'Top-down floor plan' },
  { view: 'walk', icon: 'walk', label: 'Walk', title: 'Walk through the room' },
];
</script>

<template>
  <header class="topbar">
    <div class="brand">
      <span class="logo"><Icon name="cube" :size="22" /></span>
      <span class="brand-name">RoomPlan</span>
    </div>
    <div class="view-tabs">
      <button
        v-for="tab in VIEW_TABS"
        :key="tab.view"
        class="tab"
        :class="{ active: store.view === tab.view }"
        :title="tab.title"
        @click="getEditor().setView(tab.view)"
      >
        <span class="tab-icon"><Icon :name="tab.icon" :size="16" /></span><span>{{ tab.label }}</span>
      </button>
    </div>
    <div class="top-actions">
      <select v-model="store.layoutPick" class="select layout-select" title="Saved layouts">
        <option value="">{{ store.layouts.length ? 'New layout…' : 'No saved layouts' }}</option>
        <option v-for="name in store.layouts" :key="name" :value="name">{{ name }}</option>
      </select>
      <button class="btn btn-icon" title="Save layout (stored in your browser)" @click="getEditor().save()">
        <Icon name="save" :size="18" />
      </button>
      <button class="btn btn-icon" title="Load selected layout" @click="getEditor().load()">
        <Icon name="load" :size="18" />
      </button>
      <button
        class="btn btn-icon"
        id="btn-delete-layout"
        title="Delete selected layout"
        @click="getEditor().deleteLayout()"
      >
        <Icon name="trash" :size="18" />
      </button>
      <button class="btn btn-icon" title="Copy a link that loads this layout" @click="getEditor().shareLink()">
        <Icon name="share" :size="18" />
      </button>
      <button class="btn btn-icon" id="btn-clear" title="Remove all furniture" @click="getEditor().clearAll()">
        <Icon name="eraser" :size="18" />
      </button>
    </div>
  </header>
</template>
