<template lang="pug">
.template-selector
  //- Search/filter input
  .mb-4
    el-input(
      v-model="search"
      :placeholder="$t('emailComposer.selectTemplate')"
      clearable
      size="default"
    )
      template(#prefix)
        Icon(name="ph:magnifying-glass" size="16")

  //- Category filter chips
  .flex.flex-wrap.gap-2.mb-4
    el-tag(
      v-for="cat in categories"
      :key="cat.value"
      :type="activeCategory === cat.value ? '' : 'info'"
      :effect="activeCategory === cat.value ? 'dark' : 'plain'"
      class="cursor-pointer select-none"
      @click="toggleCategory(cat.value)"
    ) {{ cat.label }}

  //- Template grid
  .template-grid(v-if="filteredTemplates.length > 0")
    .template-card(
      v-for="tmpl in filteredTemplates"
      :key="tmpl.id"
      :class="{ 'template-card--selected': selected?.id === tmpl.id }"
      @click="$emit('select', tmpl)"
    )
      .flex.items-center.justify-between.mb-2
        span(class="font-medium text-sm text-[var(--text-primary)]") {{ tmpl.name }}
        el-tag(size="small" :type="getCategoryType(tmpl.category)") {{ getCategoryLabel(tmpl.category) }}
      p(class="text-xs text-[var(--text-secondary)] line-clamp-3") {{ stripHtml(tmpl.body) }}

  //- Empty state
  .text-center.py-8(v-else)
    Icon(name="ph:envelope-simple" size="40" class="text-[var(--text-muted)] mb-2")
    p(class="text-sm text-[var(--text-muted)]") {{ $t('emailComposer.noTemplates') }}
</template>

<script setup lang="ts">
const { t } = useI18n();

const props = defineProps<{
  templates: Record<string, unknown>[];
  selected: unknown;
}>();

defineEmits<{
  (e: 'select', template: unknown): void;
}>();

const search = ref('');
const activeCategory = ref('');

const categories = computed(() => [
  { value: '', label: t('common.all') || 'All' },
  { value: 'follow-up', label: t('emailComposer.followUp') },
  { value: 'introduction', label: t('emailComposer.introduction') },
  { value: 'proposal', label: t('emailComposer.proposal') },
  { value: 'thank-you', label: t('emailComposer.thankYou') },
  { value: 'win-back', label: t('emailComposer.winBack') }
]);

function toggleCategory(cat: string) {
  activeCategory.value = activeCategory.value === cat ? '' : cat;
}

const filteredTemplates = computed(() => {
  let result = props.templates;
  if (activeCategory.value) {
    result = result.filter((t) => t.category === activeCategory.value);
  }
  if (search.value) {
    const q = search.value.toLowerCase();
    result = result.filter((t) => t.name.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) || t.body.toLowerCase().includes(q));
  }
  return result;
});

function getCategoryType(category: string): string {
  const map: Record<string, string> = {
    'follow-up': 'warning',
    introduction: '',
    proposal: 'success',
    'thank-you': 'info',
    'win-back': 'danger'
  };
  return map[category] || 'info';
}

function getCategoryLabel(category: string): string {
  const map: Record<string, string> = {
    'follow-up': t('emailComposer.followUp'),
    introduction: t('emailComposer.introduction'),
    proposal: t('emailComposer.proposal'),
    'thank-you': t('emailComposer.thankYou'),
    'win-back': t('emailComposer.winBack')
  };
  return map[category] || category;
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').substring(0, 120);
}
</script>

<style scoped>
.template-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 0.75rem;
  max-height: 320px;
  overflow-y: auto;
  padding-right: 4px;
}

@media (min-width: 640px) {
  .template-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .template-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.template-card {
  padding: 0.75rem;
  border-radius: 8px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  cursor: pointer;
  transition: all 0.2s ease;
}

.template-card:hover {
  border-color: var(--brand-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.template-card--selected {
  border-color: var(--brand-primary);
  background: color-mix(in srgb, var(--brand-primary) 8%, var(--glass-bg));
  box-shadow: 0 0 0 1px var(--brand-primary);
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
