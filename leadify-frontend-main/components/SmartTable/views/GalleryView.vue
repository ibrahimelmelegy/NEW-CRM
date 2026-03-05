<template lang="pug">
.gallery-view
  .gallery-grid
    .gallery-card.glass-card.interactive(
      v-for="(row, index) in data"
      :key="index"
      @click="$emit('row-click', row)"
    )
      //- Image section
      .gallery-card-image(v-if="imageColumn")
        img.gallery-img(
          v-if="row[imageColumn.prop]"
          :src="row[imageColumn.prop]"
          :alt="getCardTitle(row)"
          loading="lazy"
        )
        .gallery-img-placeholder(v-else)
          el-icon(:size="32")
            Picture

      //- Card content
      .gallery-card-content
        //- Title (first text column)
        h4.gallery-card-title {{ getCardTitle(row) }}

        //- Key fields
        .gallery-card-fields
          .gallery-card-field(v-for="col in displayFields" :key="col.prop")
            span.gallery-field-label {{ col.label }}
            .gallery-field-value
              el-tag(
                v-if="col.type === 'select'"
                size="small"
                effect="dark"
                round
                :type="getStatusType(row[col.prop])"
              ) {{ row[col.prop] || '-' }}
              span.gallery-field-date(v-else-if="col.type === 'date'") {{ formatDate(row[col.prop]) }}
              span.gallery-field-number(v-else-if="col.type === 'number'") {{ formatNumber(row[col.prop]) }}
              span(v-else) {{ row[col.prop] ?? '-' }}

      //- Card footer accent line
      .gallery-card-accent(:style="{ background: getAccentGradient(index) }")

  //- Empty state
  .gallery-empty(v-if="data.length === 0")
    el-empty(:description="$t('common.noData')")
</template>

<script setup lang="ts">
import { Picture } from '@element-plus/icons-vue';
import type { SmartTableColumn } from '~/composables/useSmartTable';

const props = defineProps({
  data: {
    type: Array as PropType<any[]>,
    required: true
  },
  columns: {
    type: Array as PropType<SmartTableColumn[]>,
    required: true
  }
});

const emit = defineEmits<{
  'row-click': [row: unknown];
}>();

// Find image column (if any)
const imageColumn = computed(() => props.columns.find(c => c.type === 'image' && c.visible !== false));

// First text column for title
const titleColumn = computed(() => props.columns.find(c => c.visible !== false && c.type !== 'image' && c.prop !== 'id'));

// Key fields to show (up to 4, excluding image and title columns)
const displayFields = computed(() =>
  props.columns
    .filter(c => {
      if (c.visible === false) return false;
      if (c.type === 'image') return false;
      if (titleColumn.value && c.prop === titleColumn.value.prop) return false;
      return true;
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .slice(0, 4)
);

const getCardTitle = (row: unknown) => {
  if (!titleColumn.value) return 'Record';
  const val = row[titleColumn.value.prop];
  if (val && typeof val === 'object' && val.title) return val.title;
  return val || 'Record';
};

const getStatusType = (status: string): string => {
  const lc = String(status || '').toLowerCase();
  if (['active', 'won', 'completed', 'approved'].includes(lc)) return 'success';
  if (['inactive', 'lost', 'rejected', 'cancelled'].includes(lc)) return 'danger';
  if (['pending', 'in_progress', 'review'].includes(lc)) return 'warning';
  if (['new', 'open', 'draft'].includes(lc)) return 'info';
  return '';
};

const formatDate = (val: unknown) => {
  if (!val) return '-';
  try {
    return new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return val;
  }
};

const formatNumber = (val: unknown) => {
  if (val == null || val === '') return '-';
  const num = Number(val);
  return isNaN(num) ? val : num.toLocaleString();
};

const accentGradients = [
  'linear-gradient(90deg, #7c3aed, #a855f7)',
  'linear-gradient(90deg, #3b82f6, #60a5fa)',
  'linear-gradient(90deg, #10b981, #34d399)',
  'linear-gradient(90deg, #f59e0b, #fbbf24)',
  'linear-gradient(90deg, #ef4444, #f87171)',
  'linear-gradient(90deg, #ec4899, #f472b6)',
  'linear-gradient(90deg, #06b6d4, #22d3ee)',
  'linear-gradient(90deg, #8b5cf6, #a78bfa)'
];

const getAccentGradient = (index: number) => {
  return accentGradients[index % accentGradients.length];
};
</script>

<style lang="scss" scoped>
.gallery-view {
  width: 100%;
  padding: 4px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 16px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (min-width: 1440px) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.gallery-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  cursor: pointer;
  border-radius: var(--radius-lg, 14px) !important;
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  &:hover {
    transform: translateY(-6px) !important;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3) !important;
  }
}

.gallery-card-image {
  width: 100%;
  height: 160px;
  overflow: hidden;
  background: var(--bg-tertiary);
}

.gallery-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;

  .gallery-card:hover & {
    transform: scale(1.05);
  }
}

.gallery-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-disabled);
  background: var(--bg-tertiary);
}

.gallery-card-content {
  padding: 16px;
  flex: 1;
}

.gallery-card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gallery-card-fields {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.gallery-card-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.gallery-field-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  flex-shrink: 0;
}

.gallery-field-value {
  font-size: 13px;
  color: var(--text-primary);
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gallery-field-date {
  color: var(--text-secondary);
}

.gallery-field-number {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-weight: 600;
}

.gallery-card-accent {
  height: 3px;
  width: 100%;
  flex-shrink: 0;
}

.gallery-empty {
  padding: 40px 20px;
  text-align: center;
}
</style>
