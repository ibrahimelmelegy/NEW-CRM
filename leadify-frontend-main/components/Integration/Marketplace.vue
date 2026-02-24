<template lang="pug">
.integration-marketplace
  //- Header
  .flex.items-center.justify-between.mb-6.flex-wrap.gap-4
    div
      h3.text-xl.font-bold(style="color: var(--text-primary)") {{ $t('integrationHub.marketplace.title') }}
      p.text-sm(style="color: var(--text-muted)") {{ $t('integrationHub.marketplace.subtitle') }}
    .flex.gap-3.items-center
      el-input(
        v-model="search"
        :placeholder="$t('integrationHub.marketplace.search')"
        prefix-icon="Search"
        clearable
        style="width: 260px"
        class="glass-input"
      )

  //- Category filter tabs
  .category-tabs.mb-6.flex.flex-wrap.gap-2
    el-button(
      v-for="cat in categories"
      :key="cat.value"
      :type="activeCategory === cat.value ? 'primary' : 'default'"
      :class="{ 'active-tab': activeCategory === cat.value }"
      size="small"
      round
      @click="activeCategory = cat.value"
    ) {{ cat.label }}

  //- Grid of integration cards
  .grid.grid-cols-1.gap-5(class="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4")
    IntegrationCard(
      v-for="item in filteredIntegrations"
      :key="item.type"
      :integration="item"
      @configure="$emit('configure', $event)"
      @manage="$emit('manage', $event)"
    )

  //- Empty state
  .text-center.py-16(v-if="filteredIntegrations.length === 0")
    Icon(name="ph:plugs-connected-bold" size="48" style="color: var(--text-muted); margin: 0 auto;")
    p.mt-4.text-lg.font-medium(style="color: var(--text-muted)") {{ $t('integrationHub.marketplace.noResults') }}
    p.text-sm(style="color: var(--text-muted)") {{ $t('integrationHub.marketplace.noResultsHint') }}
</template>

<script setup lang="ts">
export interface MarketplaceIntegration {
  type: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  status: 'connected' | 'disconnected' | 'error';
  isConfigured: boolean;
  configFields?: any[];
}

const props = defineProps<{
  integrations: MarketplaceIntegration[];
}>();

defineEmits<{
  (e: 'configure', integration: MarketplaceIntegration): void;
  (e: 'manage', integration: MarketplaceIntegration): void;
}>();

const { t } = useI18n();

const search = ref('');
const activeCategory = ref('all');

const categories = computed(() => [
  { value: 'all', label: t('integrationHub.marketplace.categories.all') },
  { value: 'Communication', label: t('integrationHub.marketplace.categories.communication') },
  { value: 'Storage', label: t('integrationHub.marketplace.categories.storage') },
  { value: 'Payment', label: t('integrationHub.marketplace.categories.payment') },
  { value: 'Marketing', label: t('integrationHub.marketplace.categories.marketing') },
  { value: 'Productivity', label: t('integrationHub.marketplace.categories.productivity') },
  { value: 'Developer', label: t('integrationHub.marketplace.categories.developer') }
]);

const filteredIntegrations = computed(() => {
  let list = props.integrations;

  if (activeCategory.value !== 'all') {
    list = list.filter(i => i.category === activeCategory.value);
  }

  if (search.value.trim()) {
    const q = search.value.toLowerCase();
    list = list.filter(
      i =>
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
    );
  }

  return list;
});
</script>

<style lang="scss" scoped>
.integration-marketplace {
  animation: fadeIn 0.4s ease-out;
}

.category-tabs {
  .el-button {
    transition: all 0.2s ease;
  }
  .active-tab {
    box-shadow: 0 2px 12px rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.3);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
