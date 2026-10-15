<script setup lang="ts">
import Icon from './Icon.vue';
import { CATALOG } from '../editor/furniture';
import type { CatalogEntry } from '../editor/furniture';
import { getEditor } from '../store';

// The left-hand catalog: furniture, kitchen, bathroom, stairs, doors &
// windows, wall fixtures and lighting. Clicking an item drops it into the room.

interface CatalogItem {
  icon: string;
  label: string;
  add: () => void;
}

interface CatalogSection {
  title: string;
  items: CatalogItem[];
}

// CATALOG entries sort into sections by their `group`; entries without one are
// plain furniture. Each section keeps the catalog's own order.
const byGroup = (group: NonNullable<CatalogEntry['group']>) => CATALOG.filter((e) => e.group === group);

const furnitureItems = (entries: CatalogEntry[]): CatalogItem[] =>
  entries.map((e) => ({ icon: e.icon, label: e.label, add: () => getEditor().addFurniture(e.type) }));

// Doors, windows, fixtures and the wall lamp are openings: they mount on a wall.
const openingItem = (type: string, icon: string, label: string): CatalogItem => ({
  icon,
  label,
  add: () => getEditor().addOpening(type),
});

const sections: CatalogSection[] = [
  { title: 'Furniture', items: furnitureItems(CATALOG.filter((e) => !e.group)) },
  { title: 'Kitchen', items: furnitureItems(byGroup('kitchen')) },
  { title: 'Bathroom', items: furnitureItems(byGroup('bathroom')) },
  { title: 'Stairs', items: furnitureItems(byGroup('structure')) },
  {
    title: 'Doors & windows',
    items: [
      openingItem('door-std', 'door', 'Door'),
      openingItem('door-balcony', 'window-door', 'Window door'),
      openingItem('win-std', 'window', 'Window'),
    ],
  },
  {
    title: 'Wall fixtures',
    items: [
      openingItem('cabinet', 'cabinet', 'Wall cabinet'),
      openingItem('screen', 'screen', 'Projector screen'),
    ],
  },
  {
    title: 'Lighting',
    items: [
      ...furnitureItems(byGroup('lighting')),
      openingItem('wall-lamp', 'wall-lamp', 'Wall lamp'), // wall-mounted opening, not furniture
      { icon: 'ceiling-light', label: 'Ceiling light', add: () => getEditor().addCeilingLight() },
    ],
  },
];
</script>

<template>
  <aside class="panel catalog">
    <template v-for="(section, i) in sections" :key="section.title">
      <h2 class="panel-title" :style="i > 0 ? 'margin-top:20px' : undefined">{{ section.title }}</h2>
      <div class="catalog-grid">
        <button v-for="item in section.items" :key="item.label" class="cat-item" @click="item.add()">
          <span class="cat-icon"><Icon :name="item.icon" /></span>
          <span class="cat-label">{{ item.label }}</span>
        </button>
      </div>
    </template>
    <p class="hint">Click furniture to drop it in. Doors, windows &amp; fixtures mount to the longest wall — drag them along any wall. Ceiling lights drag across the ceiling.</p>
  </aside>
</template>
