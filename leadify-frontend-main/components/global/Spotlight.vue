<template lang="pug">
Teleport(to="body")
  //- FAB removed - using navbar button only

  //- Overlay
  Transition(name="spotlight-overlay")
    .spotlight-overlay(v-if="isOpen" @click="close")

  //- Modal
  Transition(name="spotlight-modal")
    .spotlight-container(v-if="isOpen")
      .spotlight-modal
        //- Search Input
        .spotlight-header
          Icon.spotlight-search-icon(name="ph:magnifying-glass-bold")
          input.spotlight-input(
            ref="inputRef"
            v-model="searchQuery"
            :placeholder="$t('spotlight.searchPlaceholder')"
            @keydown.stop
          )
          .spotlight-shortcut
            span.key {{ isMac ? '\u2318' : 'Ctrl' }}+K

        //- Results
        .spotlight-results(ref="resultsRef" v-if="flatItems.length > 0")
          //- Recent Section (only when search is empty)
          template(v-if="groupedItems.recent.length > 0")
            .spotlight-section-title
              Icon(name="ph:clock-counter-clockwise-bold")
              span {{ $t('spotlight.recent') }}
            TransitionGroup(name="spotlight-stagger" tag="div")
              .spotlight-item(
                v-for="(item, index) in groupedItems.recent"
                :key="'recent-' + item.path"
                :class="{ active: flatItems.indexOf(item) === selectedIndex }"
                :ref="el => setItemRef(el, flatItems.indexOf(item))"
                @click="selectItem(item)"
                @mouseenter="selectedIndex = flatItems.indexOf(item)"
              )
                Icon.spotlight-item-icon(:name="item.icon")
                .spotlight-item-content
                  span.spotlight-item-title {{ item.title }}
                .spotlight-item-hint(v-if="item.shortcutHint")
                  span.key-hint(v-for="part in parseShortcutHint(item.shortcutHint)" :key="part") {{ part }}
                Icon.spotlight-item-arrow(name="ph:arrow-right-bold")

          //- Pages Section
          template(v-if="groupedItems.pages.length > 0")
            .spotlight-section-title
              Icon(name="ph:browsers-bold")
              span {{ $t('spotlight.pages') }}
            TransitionGroup(name="spotlight-stagger" tag="div")
              .spotlight-item(
                v-for="(item, index) in groupedItems.pages"
                :key="item.id"
                :class="{ active: flatItems.indexOf(item) === selectedIndex }"
                :ref="el => setItemRef(el, flatItems.indexOf(item))"
                @click="selectItem(item)"
                @mouseenter="selectedIndex = flatItems.indexOf(item)"
              )
                Icon.spotlight-item-icon(:name="item.icon")
                .spotlight-item-content
                  span.spotlight-item-title {{ item.title }}
                .spotlight-item-hint(v-if="item.shortcutHint")
                  span.key-hint(v-for="part in parseShortcutHint(item.shortcutHint)" :key="part") {{ part }}
                Icon.spotlight-item-arrow(name="ph:arrow-right-bold")

          //- Actions Section
          template(v-if="groupedItems.actions.length > 0")
            .spotlight-section-title
              Icon(name="ph:lightning-bold")
              span {{ $t('spotlight.quickActions') }}
            TransitionGroup(name="spotlight-stagger" tag="div")
              .spotlight-item(
                v-for="(item, index) in groupedItems.actions"
                :key="item.id"
                :class="{ active: flatItems.indexOf(item) === selectedIndex }"
                :ref="el => setItemRef(el, flatItems.indexOf(item))"
                @click="selectItem(item)"
                @mouseenter="selectedIndex = flatItems.indexOf(item)"
              )
                Icon.spotlight-item-icon(:name="item.icon")
                .spotlight-item-content
                  span.spotlight-item-title {{ item.title }}
                Icon.spotlight-item-arrow(name="ph:arrow-right-bold")

          //- Commands Section
          template(v-if="groupedItems.commands.length > 0")
            .spotlight-section-title
              Icon(name="ph:terminal-bold")
              span {{ $t('spotlight.commands') }}
            TransitionGroup(name="spotlight-stagger" tag="div")
              .spotlight-item(
                v-for="(item, index) in groupedItems.commands"
                :key="item.id"
                :class="{ active: flatItems.indexOf(item) === selectedIndex }"
                :ref="el => setItemRef(el, flatItems.indexOf(item))"
                @click="selectItem(item)"
                @mouseenter="selectedIndex = flatItems.indexOf(item)"
              )
                Icon.spotlight-item-icon(:name="item.icon")
                .spotlight-item-content
                  span.spotlight-item-title {{ item.title }}
                .spotlight-item-hint(v-if="item.shortcutHint")
                  span.key-hint(v-for="part in parseShortcutHint(item.shortcutHint)" :key="part") {{ part }}
                Icon.spotlight-item-arrow(name="ph:caret-right-bold")

          //- Search Results Section
          template(v-if="searchLoading")
            .spotlight-section-title
              Icon(name="ph:magnifying-glass-bold")
              span {{ $t('spotlight.searchResults') || 'Search Results' }}
            .spotlight-item
              .spotlight-item-content
                span.spotlight-item-title(style="color: var(--text-muted)") {{ $t('common.loading') }}

          template(v-else-if="groupedItems.searches.length > 0")
            .spotlight-section-title
              Icon(name="ph:magnifying-glass-bold")
              span {{ $t('spotlight.searchResults') || 'Search Results' }}
            TransitionGroup(name="spotlight-stagger" tag="div")
              .spotlight-item(
                v-for="(item, index) in groupedItems.searches"
                :key="item.id"
                :class="{ active: flatItems.indexOf(item) === selectedIndex }"
                :ref="el => setItemRef(el, flatItems.indexOf(item))"
                @click="selectItem(item)"
                @mouseenter="selectedIndex = flatItems.indexOf(item)"
              )
                Icon.spotlight-item-icon(:name="item.icon")
                .spotlight-item-content
                  span.spotlight-item-title {{ item.title }}
                  span.spotlight-item-subtitle(v-if="item.subtitle") {{ item.subtitle }}
                Icon.spotlight-item-arrow(name="ph:arrow-right-bold")

        //- Empty State
        .spotlight-empty(v-else)
          Icon.spotlight-empty-icon(name="ph:magnifying-glass-bold")
          p {{ $t('spotlight.noResults') }} "{{ searchQuery }}"
          span {{ $t('spotlight.trySearching') }}

        //- Footer
        .spotlight-footer
          .spotlight-footer-item
            span.key ↑
            span.key ↓
            span {{ $t('spotlight.toNavigate') }}
          .spotlight-footer-item
            span.key ↵
            span {{ $t('spotlight.toSelect') }}
          .spotlight-footer-item
            span.key esc
            span {{ $t('spotlight.toClose') }}
</template>

<script setup lang="ts">
import { useSpotlight } from '~/composables/useSpotlight';

const { isOpen, searchQuery, selectedIndex, groupedItems, flatItems, searchLoading, open, close, selectItem } = useSpotlight();

const inputRef = ref<HTMLInputElement | null>(null);
const resultsRef = ref<HTMLElement | null>(null);

// Detect Mac for shortcut display
const isMac = ref(false);
onMounted(() => {
  isMac.value = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
});

// Track item refs for scroll-into-view
const itemRefs = ref<Record<number, HTMLElement | null>>({});

function setItemRef(el: any, index: number) {
  if (el?.$el) {
    itemRefs.value[index] = el.$el;
  } else {
    itemRefs.value[index] = el;
  }
}

// Parse shortcut hint into parts (e.g. "G then D" => ["G", "then", "D"])
function parseShortcutHint(hint: string): string[] {
  if (hint.includes(' then ')) {
    const parts = hint.split(' then ');
    const result: string[] = [];
    parts.forEach((p, i) => {
      result.push(p.trim());
      if (i < parts.length - 1) result.push('then');
    });
    return result;
  }
  return [hint];
}

// Focus input when modal opens
watch(isOpen, value => {
  if (value) {
    nextTick(() => {
      inputRef.value?.focus();
    });
    // Reset item refs
    itemRefs.value = {};
  }
});

// Scroll selected item into view
watch(selectedIndex, idx => {
  nextTick(() => {
    const el = itemRefs.value[idx];
    if (el && resultsRef.value) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });
});
</script>

<style lang="scss" scoped>
// Floating Action Button
.spotlight-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  background: var(--gradient-primary);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(124, 58, 237, 0.4);
  z-index: 9990;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-active);
  }

  &:active {
    transform: translateY(0);
  }
}

.spotlight-fab-icon {
  font-size: 24px;
  color: white !important;
  font-weight: 300;
}

// Overlay
.spotlight-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7); // Darker overlay
  backdrop-filter: blur(4px);
  z-index: 9998;
}

.spotlight-container {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  z-index: 9999;
  pointer-events: none;
}

.spotlight-modal {
  width: 100%;
  max-width: 640px;
  background: var(--bg-card);
  border: 1px solid transparent;
  border-radius: 16px;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.06);
  overflow: hidden;
  pointer-events: auto;
  margin: 0 16px;
  // Gradient border effect
  background-clip: padding-box;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: 17px;
    padding: 1px;
    background: linear-gradient(
      135deg,
      rgba(120, 73, 255, 0.4),
      rgba(168, 85, 247, 0.15),
      rgba(255, 255, 255, 0.05),
      rgba(168, 85, 247, 0.15),
      rgba(120, 73, 255, 0.4)
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    z-index: 1;
  }
}

.spotlight-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-stroke);
  gap: 12px;
}

.spotlight-search-icon {
  font-size: 20px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.spotlight-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  color: var(--text-primary);
  background: transparent;

  &::placeholder {
    color: var(--text-muted);
  }
}

.spotlight-shortcut {
  display: flex;
  gap: 4px;
}

.key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  background: var(--border-stroke);
  border: 1px solid var(--border-stroke);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.spotlight-results {
  max-height: 420px;
  overflow-y: auto;
  padding: 8px;
  scroll-behavior: smooth;

  // Custom scrollbar
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
}

.spotlight-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.spotlight-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  gap: 12px;

  &:hover,
  &.active {
    background: var(--gradient-primary);

    .spotlight-item-icon,
    .spotlight-item-title,
    .spotlight-item-arrow {
      color: white !important;
    }

    .spotlight-item-subtitle {
      color: rgba(255, 255, 255, 0.7) !important;
    }

    .key-hint {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.3);
      color: rgba(255, 255, 255, 0.9);
    }
  }
}

.spotlight-item-icon {
  font-size: 20px;
  color: var(--accent-purple);
  flex-shrink: 0;
}

.spotlight-item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.spotlight-item-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.spotlight-item-subtitle {
  font-size: 12px;
  color: var(--text-muted);
}

// Shortcut hint badges next to items
.spotlight-item-hint {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
}

.key-hint {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 10px;
  font-weight: 500;
  color: var(--text-muted);
  transition: all 0.15s ease;

  // "then" text between chord keys
  &:nth-child(even) {
    background: transparent;
    border: none;
    padding: 0 1px;
    min-width: auto;
    font-family: inherit;
    font-size: 9px;
    opacity: 0.6;
  }
}

.spotlight-item-arrow {
  font-size: 16px;
  color: var(--text-muted);
  opacity: 0;
  transition: opacity 0.15s ease;
  flex-shrink: 0;

  .spotlight-item:hover &,
  .spotlight-item.active & {
    opacity: 1;
  }
}

.spotlight-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.spotlight-empty-icon {
  font-size: 48px;
  color: var(--border-stroke);
  margin-bottom: 16px;
}

.spotlight-empty p {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0 0 4px 0;
}

.spotlight-empty span {
  font-size: 12px;
  color: var(--text-muted);
}

.spotlight-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 12px 20px;
  background: var(--bg-sidebar);
  border-top: 1px solid var(--border-stroke);
}

.spotlight-footer-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);

  .key {
    min-width: 20px;
    height: 20px;
    font-size: 10px;
  }
}

// Transitions
.spotlight-overlay-enter-active,
.spotlight-overlay-leave-active {
  transition: opacity 0.2s ease;
}

.spotlight-overlay-enter-from,
.spotlight-overlay-leave-to {
  opacity: 0;
}

.spotlight-modal-enter-active,
.spotlight-modal-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.spotlight-modal-enter-from,
.spotlight-modal-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-8px);
}

// Stagger animation for items
.spotlight-stagger-enter-active {
  transition: all 0.2s ease;
}

.spotlight-stagger-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.spotlight-stagger-leave-active {
  transition: all 0.15s ease;
}

.spotlight-stagger-leave-to {
  opacity: 0;
}

// Light mode adjustments
:global(html.light-mode) {
  .spotlight-modal::before {
    background: linear-gradient(
      135deg,
      rgba(120, 73, 255, 0.3),
      rgba(168, 85, 247, 0.1),
      rgba(0, 0, 0, 0.03),
      rgba(168, 85, 247, 0.1),
      rgba(120, 73, 255, 0.3)
    );
  }

  .key-hint {
    background: rgba(0, 0, 0, 0.04);
    border-color: rgba(0, 0, 0, 0.08);
    color: var(--text-secondary);
  }

  .spotlight-results {
    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.1);
    }
  }
}
</style>
