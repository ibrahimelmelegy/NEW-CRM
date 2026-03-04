<template lang="pug">
Teleport(to="body")
  Transition(name="shortcuts-fade")
    .shortcuts-overlay(v-if="visible" @click.self="$emit('close')")
      .shortcuts-modal(@click.stop)
        .shortcuts-header
          .flex.items-center.gap-3
            Icon.text-xl(name="ph:keyboard-bold")
            h2 Keyboard Shortcuts
          button.btn-close(@click="$emit('close')")
            Icon(name="ph:x-bold")

        .shortcuts-body
          .shortcuts-grid
            .shortcut-category(v-for="category in categories" :key="category.name")
              h3.category-title {{ category.name }}
              .shortcut-list
                .shortcut-item(v-for="shortcut in category.shortcuts" :key="shortcut.keys")
                  span.shortcut-label {{ shortcut.label }}
                  .shortcut-keys
                    template(v-for="(part, idx) in parseKeys(shortcut.keys)" :key="idx")
                      kbd {{ part.key }}
                      span.key-separator(v-if="part.separator") {{ part.separator }}

        .shortcuts-footer
          span Press #[kbd ?] to toggle this overlay
</template>

<script setup lang="ts">
import type { ShortcutDefinition } from '~/composables/useKeyboardShortcuts';

interface ShortcutCategory {
  name: string;
  shortcuts: ShortcutDefinition[];
}

interface KeyPart {
  key: string;
  separator?: string;
}

defineProps<{
  visible: boolean;
  categories: ShortcutCategory[];
}>();

defineEmits<{
  close: [];
}>();

function parseKeys(keys: string): KeyPart[] {
  const parts: KeyPart[] = [];

  // Handle chord notation: "G then D"
  if (keys.includes(' then ')) {
    const segments = keys.split(' then ');
    segments.forEach((seg, idx) => {
      parts.push({
        key: seg.trim(),
        separator: idx < segments.length - 1 ? 'then' : undefined
      });
    });
    return parts;
  }

  // Handle modifier combos: "Ctrl+K"
  if (keys.includes('+')) {
    const segments = keys.split('+');
    segments.forEach((seg, idx) => {
      parts.push({
        key: seg.trim(),
        separator: idx < segments.length - 1 ? '+' : undefined
      });
    });
    return parts;
  }

  // Single key
  parts.push({ key: keys });
  return parts;
}
</script>

<style lang="scss" scoped>
.shortcuts-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.shortcuts-modal {
  width: 100%;
  max-width: 800px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border: 1px solid var(--border-glass);
  border-radius: 16px;
  box-shadow:
    0 25px 60px -12px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(168, 85, 247, 0.1);
  overflow: hidden;
}

.shortcuts-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-stroke);
  flex-shrink: 0;

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.btn-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    color: var(--text-primary);
  }
}

.shortcuts-body {
  overflow-y: auto;
  padding: 24px;
  flex: 1;
  min-height: 0;
}

.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 28px;
}

.shortcut-category {
  min-width: 0;
}

.category-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--accent-color);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-stroke);
}

.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 8px;
  transition: background 0.15s ease;
  gap: 12px;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
  }
}

.shortcut-label {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 400;
  flex: 1;
  min-width: 0;
}

.shortcut-keys {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 26px;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-bottom-width: 2px;
  border-radius: 6px;
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1;
  white-space: nowrap;
}

.key-separator {
  font-size: 10px;
  color: var(--text-muted);
  padding: 0 2px;
  font-weight: 500;
}

.shortcuts-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px 24px;
  border-top: 1px solid var(--border-stroke);
  background: var(--bg-sidebar);
  flex-shrink: 0;

  span {
    font-size: 12px;
    color: var(--text-muted);
  }

  kbd {
    min-width: 20px;
    height: 20px;
    padding: 1px 6px;
    font-size: 10px;
    margin: 0 4px;
    border-bottom-width: 1px;
  }
}

// Transition
.shortcuts-fade-enter-active,
.shortcuts-fade-leave-active {
  transition: opacity 0.2s ease;

  .shortcuts-modal {
    transition:
      transform 0.2s ease,
      opacity 0.2s ease;
  }
}

.shortcuts-fade-enter-from,
.shortcuts-fade-leave-to {
  opacity: 0;

  .shortcuts-modal {
    opacity: 0;
    transform: scale(0.95);
  }
}

// Light theme adjustments
:global(body.light-theme),
:global(html.light-mode) {
  .btn-close {
    background: rgba(0, 0, 0, 0.04);

    &:hover {
      background: rgba(0, 0, 0, 0.08);
    }
  }

  .shortcut-item:hover {
    background: rgba(0, 0, 0, 0.03);
  }

  kbd {
    background: rgba(0, 0, 0, 0.05);
    border-color: rgba(0, 0, 0, 0.12);
  }
}

// Responsive
@media (max-width: 680px) {
  .shortcuts-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .shortcuts-modal {
    max-height: 90vh;
  }
}
</style>
