<template lang="pug">
Teleport(to="body")
  //- Floating Action Button (Bottom Right)
  .spotlight-fab(@click="open" title="Search (Alt+K or /)")
    .spotlight-fab-icon ⌘
  
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
            placeholder="Search pages, actions, or type a command..."
            @keydown.stop
          )
          .spotlight-shortcut
            span.key Alt+K
        
        //- Results
        .spotlight-results(v-if="flatItems.length > 0")
          //- Pages Section
          template(v-if="groupedItems.pages.length > 0")
            .spotlight-section-title
              Icon(name="ph:browsers-bold")
              span Pages
            .spotlight-item(
              v-for="(item, index) in groupedItems.pages"
              :key="item.id"
              :class="{ active: flatItems.indexOf(item) === selectedIndex }"
              @click="selectItem(item)"
              @mouseenter="selectedIndex = flatItems.indexOf(item)"
            )
              Icon.spotlight-item-icon(:name="item.icon")
              .spotlight-item-content
                span.spotlight-item-title {{ item.title }}
              Icon.spotlight-item-arrow(name="ph:arrow-right-bold")
          
          //- Actions Section
          template(v-if="groupedItems.actions.length > 0")
            .spotlight-section-title
              Icon(name="ph:lightning-bold")
              span Quick Actions
            .spotlight-item(
              v-for="(item, index) in groupedItems.actions"
              :key="item.id"
              :class="{ active: flatItems.indexOf(item) === selectedIndex }"
              @click="selectItem(item)"
              @mouseenter="selectedIndex = flatItems.indexOf(item)"
            )
              Icon.spotlight-item-icon(:name="item.icon")
              .spotlight-item-content
                span.spotlight-item-title {{ item.title }}
              Icon.spotlight-item-arrow(name="ph:arrow-right-bold")
        
        //- Empty State
        .spotlight-empty(v-else)
          Icon.spotlight-empty-icon(name="ph:magnifying-glass-bold")
          p No results found for "{{ searchQuery }}"
          span Try searching for pages or actions
        
        //- Footer
        .spotlight-footer
          .spotlight-footer-item
            span.key ↑
            span.key ↓
            span to navigate
          .spotlight-footer-item
            span.key Enter
            span to select
          .spotlight-footer-item
            span.key /
            span to open
</template>

<script setup lang="ts">
import { useSpotlight } from '~/composables/useSpotlight';

const {
  isOpen,
  searchQuery,
  selectedIndex,
  groupedItems,
  flatItems,
  open,
  close,
  selectItem,
} = useSpotlight();

const inputRef = ref<HTMLInputElement | null>(null);

// Focus input when modal opens
watch(isOpen, (value) => {
  if (value) {
    nextTick(() => {
      inputRef.value?.focus();
    });
  }
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
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
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
    box-shadow: 0 12px 32px rgba(124, 58, 237, 0.5);
  }
  
  &:active {
    transform: translateY(0);
  }
}

.spotlight-fab-icon {
  font-size: 24px;
  color: white;
  font-weight: 300;
}

// Overlay
.spotlight-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
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
  max-width: 600px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  pointer-events: auto;
  margin: 0 16px;
}

.spotlight-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  gap: 12px;
}

.spotlight-search-icon {
  font-size: 20px;
  color: #9ca3af;
  flex-shrink: 0;
}

.spotlight-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  color: #1f2937;
  background: transparent;
  
  &::placeholder {
    color: #9ca3af;
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
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
}

.spotlight-results {
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
}

.spotlight-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.spotlight-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  gap: 12px;
  
  &:hover,
  &.active {
    background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
    
    .spotlight-item-icon,
    .spotlight-item-title,
    .spotlight-item-arrow {
      color: white;
    }
  }
}

.spotlight-item-icon {
  font-size: 20px;
  color: #7c3aed;
  flex-shrink: 0;
}

.spotlight-item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.spotlight-item-title {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.spotlight-item-arrow {
  font-size: 16px;
  color: #9ca3af;
  opacity: 0;
  transition: opacity 0.15s ease;
  
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
  color: #d1d5db;
  margin-bottom: 16px;
}

.spotlight-empty p {
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  margin: 0 0 4px 0;
}

.spotlight-empty span {
  font-size: 12px;
  color: #9ca3af;
}

.spotlight-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 12px 20px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

.spotlight-footer-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
  
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
  transition: all 0.2s ease;
}

.spotlight-modal-enter-from,
.spotlight-modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
