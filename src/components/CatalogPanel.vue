<script setup lang="ts">
import { computed, ref } from 'vue';
import Icon from './Icon.vue';
import { CATALOG } from '../editor/furniture';
import type { CatalogEntry } from '../editor/furniture';
import { getEditor } from '../store';

// The left-hand catalog: furniture, kitchen, bathroom, stairs, doors &
// windows, wall fixtures and lighting. Clicking an item drops it into the room.
// The search box at the top filters every section as you type.

interface CatalogItem {
  key: string; // catalog type, unique across sections
  icon: string;
  label: string;
  add: () => void;
}

interface CatalogSection {
  title: string;
  // Words that find every item in the section ("kitchen" lists the whole kitchen).
  keywords: string[];
  items: CatalogItem[];
}

// Other words people use for an item, so "couch" finds the sofa and "closet"
// the wardrobe. Labels, types and section keywords are searched as well.
const SYNONYMS: Record<string, string[]> = {
  bed: ['mattress', 'sleep'],
  sofa: ['couch', 'settee'],
  table: ['dining'],
  desk: ['office', 'workstation'],
  chair: ['seat', 'stool'],
  wardrobe: ['closet', 'cupboard', 'armoire'],
  rug: ['carpet', 'mat'],
  plant: ['flower', 'pot'],
  tv: ['television', 'media'],
  shelf: ['bookcase', 'bookshelf', 'shelving'],
  suitcase: ['luggage', 'bag'],
  monitor: ['screen', 'display', 'computer'],
  counter: ['worktop', 'countertop', 'cabinet'],
  sink: ['tap', 'faucet', 'basin'],
  stove: ['oven', 'cooktop', 'hob', 'range'],
  fridge: ['refrigerator', 'freezer'],
  'dish-rack': ['drying', 'dishes', 'plates'],
  'espresso-machine': ['coffee'],
  'rice-cooker': ['cooker'],
  toilet: ['wc', 'loo'],
  bathtub: ['bath', 'tub'],
  'bathroom-sink': ['basin', 'vanity', 'washbasin'],
  'stairs-up': ['staircase', 'steps'],
  'stairs-down': ['staircase', 'steps'],
  'desk-lamp': ['light'],
  'door-std': ['entrance', 'entry'],
  'door-balcony': ['balcony', 'patio', 'fenstertür', 'glazed'],
  'win-std': ['glass', 'glazing'],
  cabinet: ['cupboard', 'hängeschrank'],
  screen: ['projector', 'cinema'],
  'wall-lamp': ['light', 'sconce'],
  'ceiling-light': ['lamp', 'pendant'],
};

// CATALOG entries sort into sections by their `group`; entries without one are
// plain furniture. Each section keeps the catalog's own order.
const byGroup = (group: NonNullable<CatalogEntry['group']>) => CATALOG.filter((e) => e.group === group);

const furnitureItems = (entries: CatalogEntry[]): CatalogItem[] =>
  entries.map((e) => ({ key: e.type, icon: e.icon, label: e.label, add: () => getEditor().addFurniture(e.type) }));

// Doors, windows, fixtures and the wall lamp are openings: they mount on a wall.
const openingItem = (type: string, icon: string, label: string): CatalogItem => ({
  key: type,
  icon,
  label,
  add: () => getEditor().addOpening(type),
});

const sections: CatalogSection[] = [
  { title: 'Furniture', keywords: [], items: furnitureItems(CATALOG.filter((e) => !e.group)) },
  { title: 'Kitchen', keywords: ['kitchen'], items: furnitureItems(byGroup('kitchen')) },
  { title: 'Bathroom', keywords: ['bathroom'], items: furnitureItems(byGroup('bathroom')) },
  { title: 'Stairs', keywords: ['stairs'], items: furnitureItems(byGroup('structure')) },
  {
    title: 'Doors & windows',
    keywords: [],
    items: [
      openingItem('door-std', 'door', 'Door'),
      openingItem('door-balcony', 'window-door', 'Window door'),
      openingItem('win-std', 'window', 'Window'),
    ],
  },
  {
    title: 'Wall fixtures',
    keywords: ['fixture', 'wall'],
    items: [
      openingItem('cabinet', 'cabinet', 'Wall cabinet'),
      openingItem('screen', 'screen', 'Projector screen'),
    ],
  },
  {
    title: 'Lighting',
    keywords: ['lighting'],
    items: [
      ...furnitureItems(byGroup('lighting')),
      openingItem('wall-lamp', 'wall-lamp', 'Wall lamp'), // wall-mounted opening, not furniture
      { key: 'ceiling-light', icon: 'ceiling-light', label: 'Ceiling light', add: () => getEditor().addCeilingLight() },
    ],
  },
];

// Lower-case and drop accents, so "fenstertur" finds "Fenstertür".
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Everything an item can be found by, folded once up front.
const haystack = new Map<CatalogItem, string>();
for (const section of sections) {
  for (const item of section.items) {
    haystack.set(item, fold([item.label, item.key, ...(SYNONYMS[item.key] ?? []), ...section.keywords].join(' ')));
  }
}

const query = ref('');
const searchInput = ref<HTMLInputElement | null>(null);

// Every word typed must appear somewhere in the item's text, so "wall lamp"
// narrows to the wall lamp rather than everything on a wall or every lamp.
const visibleSections = computed<CatalogSection[]>(() => {
  const words = fold(query.value).split(/\s+/).filter(Boolean);
  if (!words.length) return sections;
  return sections
    .map((s) => ({ ...s, items: s.items.filter((item) => words.every((w) => haystack.get(item)!.includes(w))) }))
    .filter((s) => s.items.length > 0);
});

// Escape clears the search first, then leaves the box on a second press.
function onEscape() {
  if (query.value) query.value = '';
  else searchInput.value?.blur();
}

function clearSearch() {
  query.value = '';
  searchInput.value?.focus();
}
</script>

<template>
  <aside class="panel catalog">
    <div class="catalog-search">
      <div class="search-field">
        <span class="search-icon"><Icon name="search" :size="16" /></span>
        <input
          ref="searchInput"
          v-model="query"
          type="search"
          class="search-input"
          placeholder="Search furniture…"
          aria-label="Search the catalog"
          autocomplete="off"
          spellcheck="false"
          @keydown.esc.prevent="onEscape"
        />
        <button v-if="query" class="search-clear" title="Clear search" aria-label="Clear search" @click="clearSearch">
          <Icon name="close" :size="14" />
        </button>
      </div>
    </div>

    <div class="catalog-list">
      <template v-for="(section, i) in visibleSections" :key="section.title">
        <h2 class="panel-title" :style="i > 0 ? 'margin-top:20px' : undefined">{{ section.title }}</h2>
        <div class="catalog-grid">
          <button v-for="item in section.items" :key="item.key" class="cat-item" @click="item.add()">
            <span class="cat-icon"><Icon :name="item.icon" /></span>
            <span class="cat-label">{{ item.label }}</span>
          </button>
        </div>
      </template>
      <p v-if="visibleSections.length === 0" class="catalog-empty" aria-live="polite">
        Nothing matches “{{ query.trim() }}”. Try another word, like sofa, lamp or sink.
      </p>
      <p class="hint">Click furniture to drop it in. Doors, windows &amp; fixtures mount to the longest wall — drag them along any wall. Ceiling lights drag across the ceiling.</p>
    </div>
  </aside>
</template>
