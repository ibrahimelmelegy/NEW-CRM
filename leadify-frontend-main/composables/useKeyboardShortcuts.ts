import { ref, computed } from 'vue';

export interface ShortcutDefinition {
  keys: string; // Display format: "G then D", "Ctrl+K", "?"
  label: string;
  category: string;
  action: () => void;
}

interface ShortcutCategory {
  name: string;
  shortcuts: ShortcutDefinition[];
}

// Global state (shared across all usages)
const shortcuts = ref<ShortcutDefinition[]>([]);
const cheatSheetVisible = ref(false);
const pendingChord = ref<string | null>(null);
let chordTimeout: ReturnType<typeof setTimeout> | null = null;

const CHORD_TIMEOUT_MS = 500;

// Group shortcuts by category
const categories = computed<ShortcutCategory[]>(() => {
  const categoryMap = new Map<string, ShortcutDefinition[]>();

  for (const shortcut of shortcuts.value) {
    const existing = categoryMap.get(shortcut.category);
    if (existing) {
      existing.push(shortcut);
    } else {
      categoryMap.set(shortcut.category, [shortcut]);
    }
  }

  // Define preferred category order
  const order = ['General', 'Navigation', 'Quick Create', 'Actions'];
  const result: ShortcutCategory[] = [];

  for (const name of order) {
    const items = categoryMap.get(name);
    if (items) {
      result.push({ name, shortcuts: items });
      categoryMap.delete(name);
    }
  }

  // Append remaining categories not in the order list
  for (const [name, items] of categoryMap) {
    result.push({ name, shortcuts: items });
  }

  return result;
});

export function useKeyboardShortcuts() {
  function register(shortcut: ShortcutDefinition) {
    // Avoid duplicate registrations
    const exists = shortcuts.value.find(s => s.keys === shortcut.keys);
    if (!exists) {
      shortcuts.value.push(shortcut);
    }
  }

  function unregister(keys: string) {
    shortcuts.value = shortcuts.value.filter(s => s.keys !== keys);
  }

  function toggleCheatSheet() {
    cheatSheetVisible.value = !cheatSheetVisible.value;
  }

  function clearChord() {
    pendingChord.value = null;
    if (chordTimeout) {
      clearTimeout(chordTimeout);
      chordTimeout = null;
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    // Skip if another handler already processed this event
    if (e.defaultPrevented) return;

    const target = e.target as HTMLElement;
    const isInInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;

    // Allow Ctrl+` even from inputs (for terminal toggle)
    if (isInInput && e.ctrlKey && e.key === '`') {
      const backtickMatch = shortcuts.value.find(s => s.keys === 'Ctrl+`');
      if (backtickMatch) {
        e.preventDefault();
        clearChord();
        backtickMatch.action();
        return;
      }
    }

    // Don't trigger other shortcuts when typing in inputs/textareas/selects
    if (isInInput) return;

    // Handle Escape - close cheat sheet if open
    if (e.key === 'Escape') {
      if (cheatSheetVisible.value) {
        e.preventDefault();
        cheatSheetVisible.value = false;
        clearChord();
        return;
      }
      clearChord();
      return;
    }

    // Handle ? for cheat sheet toggle (Shift+/ on most keyboards)
    if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      cheatSheetVisible.value = !cheatSheetVisible.value;
      clearChord();
      return;
    }

    // Don't process shortcuts when cheat sheet is open (except Escape and ? handled above)
    if (cheatSheetVisible.value) return;

    // Handle Ctrl/Cmd combos (e.g. Ctrl+K, Ctrl+`)
    if (e.ctrlKey || e.metaKey) {
      // Special handling for backtick key (Ctrl+`)
      if (e.key === '`') {
        const backtickMatch = shortcuts.value.find(s => s.keys === 'Ctrl+`');
        if (backtickMatch) {
          e.preventDefault();
          clearChord();
          backtickMatch.action();
          return;
        }
      }

      const comboKey = `Ctrl+${e.key.toUpperCase()}`;
      const match = shortcuts.value.find(s => s.keys === comboKey);
      if (match) {
        e.preventDefault();
        clearChord();
        match.action();
        return;
      }
    }

    // Handle chord sequences
    const key = e.key.toUpperCase();

    // If we have a pending chord first key, check for a second key match
    if (pendingChord.value) {
      const chordKeys = `${pendingChord.value} then ${key}`;
      const match = shortcuts.value.find(s => s.keys === chordKeys);
      clearChord();
      if (match) {
        e.preventDefault();
        match.action();
        return;
      }
      // No match for chord - fall through (the chord expired)
      return;
    }

    // Check if this key could be the start of a chord
    const couldBeChordStart = shortcuts.value.some(s => {
      const parts = s.keys.split(' then ');
      return parts.length === 2 && parts[0] === key;
    });

    if (couldBeChordStart) {
      e.preventDefault();
      pendingChord.value = key;
      chordTimeout = setTimeout(() => {
        pendingChord.value = null;
      }, CHORD_TIMEOUT_MS);
    }

    // Handle single key shortcuts (non-modifier, non-chord)
    // Skip single letter keys to avoid interfering with typing
    // Only handle special keys like /, ?, Escape (already handled above)
  }

  return {
    shortcuts,
    cheatSheetVisible,
    pendingChord,
    categories,
    register,
    unregister,
    handleKeyDown,
    toggleCheatSheet
  };
}
