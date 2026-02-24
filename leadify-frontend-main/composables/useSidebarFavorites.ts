import { ref, computed } from 'vue';

interface FavoriteItem {
  link: string;
  name: string;
  icon: string;
}

const STORAGE_KEY = 'crm_sidebar_favorites';
const favorites = ref<FavoriteItem[]>([]);

// Load from localStorage on init (client-side only)
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) favorites.value = JSON.parse(saved);
  } catch { /* ignore parse errors */ }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites.value));
  } catch { /* ignore storage errors */ }
}

export function useSidebarFavorites() {
  function isFavorite(link: string): boolean {
    return favorites.value.some(f => f.link === link);
  }

  function toggleFavorite(item: FavoriteItem) {
    const idx = favorites.value.findIndex(f => f.link === item.link);
    if (idx >= 0) {
      favorites.value.splice(idx, 1);
    } else {
      favorites.value.push({ link: item.link, name: item.name, icon: item.icon });
    }
    persist();
  }

  function removeFavorite(link: string) {
    favorites.value = favorites.value.filter(f => f.link !== link);
    persist();
  }

  return {
    favorites: computed(() => favorites.value),
    isFavorite,
    toggleFavorite,
    removeFavorite
  };
}
