<template lang="pug">
Teleport(to="body")
  Transition(name="terminal-slide")
    .command-terminal-overlay(
      v-if="isOpen"
      @keydown.esc.stop="toggle"
    )
      .terminal-container(@click.stop)
        .terminal-header
          .terminal-header-left
            .terminal-dot.dot-red
            .terminal-dot.dot-yellow
            .terminal-dot.dot-green
            span.terminal-title {{ $t('commandTerminal.title') }}
          .terminal-header-right
            span.terminal-shortcut Ctrl+`
            button.terminal-close(@click="toggle")
              Icon(name="ph:x-bold")
        .terminal-body(ref="outputAreaRef")
          TerminalOutput(:lines="output")
        .terminal-suggestions-area(v-if="suggestions.length")
          span.suggestion(
            v-for="s in suggestions"
            :key="s"
            @click="selectSuggestion(s)"
          ) {{ s }}
        .terminal-input-area
          span.prompt &gt;_
          input.terminal-input(
            ref="inputRef"
            v-model="input"
            @keydown.enter="handleEnter"
            @keydown.up.prevent="navigateHistory('up')"
            @keydown.down.prevent="navigateHistory('down')"
            @keydown.tab.prevent="autocomplete"
            :placeholder="$t('commandTerminal.placeholder')"
            autofocus
            spellcheck="false"
            autocomplete="off"
          )
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

const { isOpen, input, output, suggestions, toggle, execute, navigateHistory, autocomplete } = useCommandTerminal();

const inputRef = ref<HTMLInputElement | null>(null);
const outputAreaRef = ref<HTMLElement | null>(null);

function handleEnter() {
  if (input.value.trim()) {
    execute(input.value);
  }
}

function selectSuggestion(s: string) {
  const parts = input.value.trim().split(/\s+/);
  if (parts.length <= 1) {
    input.value = s + ' ';
  } else {
    parts[parts.length - 1] = s;
    input.value = parts.join(' ') + ' ';
  }
  suggestions.value = [];
  inputRef.value?.focus();
}

// Auto-focus input when terminal opens
watch(isOpen, async val => {
  if (val) {
    await nextTick();
    inputRef.value?.focus();
  }
});

// Auto-scroll output area when new lines are added
watch(
  () => output.value.length,
  async () => {
    await nextTick();
    if (outputAreaRef.value) {
      outputAreaRef.value.scrollTop = outputAreaRef.value.scrollHeight;
    }
  }
);
</script>

<style lang="scss" scoped>
.command-terminal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.terminal-container {
  width: 90%;
  max-width: 860px;
  height: 70vh;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  background: rgba(10, 10, 15, 0.97);
  border: 1px solid rgba(0, 255, 136, 0.15);
  border-radius: 12px;
  box-shadow:
    0 0 60px rgba(0, 255, 136, 0.08),
    0 25px 50px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
}

.terminal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 1px solid rgba(0, 255, 136, 0.1);
  user-select: none;
  flex-shrink: 0;
}

.terminal-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.terminal-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;

  &.dot-red {
    background: #ff5f57;
  }
  &.dot-yellow {
    background: #febc2e;
  }
  &.dot-green {
    background: #28c840;
  }
}

.terminal-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  margin-left: 8px;
  letter-spacing: 0.5px;
}

.terminal-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.terminal-shortcut {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  padding: 2px 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.03);
}

.terminal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.5);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 14px;

  &:hover {
    background: rgba(255, 68, 68, 0.2);
    color: #ff4444;
  }
}

.terminal-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 136, 0.15);
    border-radius: 3px;

    &:hover {
      background: rgba(0, 255, 136, 0.3);
    }
  }
}

.terminal-suggestions-area {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 16px;
  border-top: 1px solid rgba(0, 255, 136, 0.08);
  background: rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.suggestion {
  display: inline-block;
  padding: 3px 10px;
  font-size: 12px;
  color: #00ff88;
  background: rgba(0, 255, 136, 0.08);
  border: 1px solid rgba(0, 255, 136, 0.15);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;

  &:hover {
    background: rgba(0, 255, 136, 0.18);
    border-color: rgba(0, 255, 136, 0.35);
  }
}

.terminal-input-area {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid rgba(0, 255, 136, 0.1);
  background: rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.prompt {
  color: #00ff88;
  font-size: 14px;
  font-weight: 700;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  user-select: none;
  flex-shrink: 0;
}

.terminal-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #e0e0e0;
  font-size: 14px;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  caret-color: #00ff88;

  &::placeholder {
    color: rgba(255, 255, 255, 0.2);
  }
}

// Slide-down animation
.terminal-slide-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.terminal-slide-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}

.terminal-slide-enter-from {
  opacity: 0;

  .terminal-container {
    transform: translateY(-30px) scale(0.96);
    opacity: 0;
  }
}

.terminal-slide-leave-to {
  opacity: 0;

  .terminal-container {
    transform: translateY(-20px) scale(0.98);
    opacity: 0;
  }
}

.terminal-slide-enter-active .terminal-container,
.terminal-slide-leave-active .terminal-container {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
