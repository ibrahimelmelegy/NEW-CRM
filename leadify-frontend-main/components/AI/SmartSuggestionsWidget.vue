<template lang="pug">
.smart-suggestions-widget
  //- Loading
  template(v-if="isSuggestionsLoading")
    .suggestions-skeleton
      .skeleton-pill
      .skeleton-items
        .skeleton-item(v-for="n in 3" :key="n")
          .skeleton-icon-box
          .skeleton-text-group
            .skeleton-line.w-40
            .skeleton-line.w-64

  //- Suggestions Content
  template(v-else-if="smartSuggestions && smartSuggestions.suggestions.length > 0")
    .suggestions-header
      .flex.items-center.gap-2
        .suggestions-icon
          Icon(name="ph:magic-wand-bold" size="18" class="text-white")
        h3.suggestions-title {{ $t('aiAssistantExpanded.smartSuggestions') }}
      .suggestions-meta
        el-tag(size="small" effect="plain" round) {{ smartSuggestions.suggestions.length }} {{ $t('aiAssistantExpanded.suggestions') }}

    .suggestions-list
      .suggestion-card(
        v-for="suggestion in smartSuggestions.suggestions"
        :key="suggestion.id"
        :class="'type-' + suggestion.type"
      )
        .suggestion-icon-wrapper(:class="'icon-' + suggestion.type")
          Icon(:name="getSuggestionIcon(suggestion.type)" size="18")

        .suggestion-content
          .suggestion-title-row
            h4.suggestion-title {{ suggestion.title }}
            .suggestion-badges
              el-tag(
                :type="suggestion.priority === 'high' ? 'danger' : suggestion.priority === 'medium' ? 'warning' : 'info'"
                size="small"
                effect="plain"
                round
              ) {{ $t('aiAssistantExpanded.priority_' + suggestion.priority) }}
              .confidence-badge
                Icon(name="ph:sparkle-bold" size="10")
                span {{ suggestion.confidence }}%
          p.suggestion-description {{ suggestion.description }}

        .suggestion-action(v-if="suggestion.actionLabel && suggestion.actionRoute")
          el-button(
            size="small"
            @click="handleAction(suggestion.actionRoute)"
          )
            | {{ suggestion.actionLabel }}
            Icon(name="ph:arrow-right-bold" size="12")

  //- Empty
  template(v-else-if="!isSuggestionsLoading")
    .suggestions-empty
      .suggestions-header
        .flex.items-center.gap-2
          .suggestions-icon
            Icon(name="ph:magic-wand-bold" size="18" class="text-white")
          h3.suggestions-title {{ $t('aiAssistantExpanded.smartSuggestions') }}
      p.empty-text {{ $t('aiAssistantExpanded.noSuggestions') }}
</template>

<script setup lang="ts">
import { useAiAssistant } from '~/composables/useAiAssistant';

const props = defineProps<{
  entityType: 'lead' | 'deal' | 'client';
  entityId: string;
}>();

const router = useRouter();
const { smartSuggestions, isSuggestionsLoading, getSmartSuggestions } = useAiAssistant();

function getSuggestionIcon(type: string): string {
  const icons: Record<string, string> = {
    action: 'ph:play-bold',
    insight: 'ph:info-bold',
    warning: 'ph:warning-bold',
    opportunity: 'ph:rocket-bold'
  };
  return icons[type] || 'ph:lightbulb-bold';
}

function handleAction(route: string) {
  if (route) router.push(route);
}

onMounted(() => {
  if (props.entityType && props.entityId) {
    getSmartSuggestions(props.entityType, props.entityId);
  }
});

watch(
  () => [props.entityType, props.entityId],
  ([type, id]) => {
    if (type && id) getSmartSuggestions(type as 'lead' | 'deal' | 'client', id as string);
  }
);
</script>

<style lang="scss" scoped>
.smart-suggestions-widget {
  border-radius: 16px;
  background: var(--glass-bg, var(--bg-elevated));
  backdrop-filter: var(--glass-blur, blur(12px));
  border: 1px solid var(--glass-border-color, var(--border-default));
  padding: 16px 20px;
  overflow: hidden;
}

.suggestions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;

  .suggestions-icon {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: linear-gradient(135deg, #7c3aed, #6d28d9);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .suggestions-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.suggestion-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid transparent;
  transition: all 0.25s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  &.type-warning { border-color: rgba(245, 158, 11, 0.15); }
  &.type-action { border-color: rgba(59, 130, 246, 0.15); }
  &.type-insight { border-color: rgba(124, 58, 237, 0.15); }
  &.type-opportunity { border-color: rgba(16, 185, 129, 0.15); }
}

.suggestion-icon-wrapper {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.icon-warning { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
  &.icon-action { background: rgba(59, 130, 246, 0.12); color: #3b82f6; }
  &.icon-insight { background: rgba(124, 58, 237, 0.12); color: #7c3aed; }
  &.icon-opportunity { background: rgba(16, 185, 129, 0.12); color: #10b981; }
}

.suggestion-content {
  flex: 1;
  min-width: 0;
}

.suggestion-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.suggestion-title {
  font-size: 13px;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
}

.suggestion-badges {
  display: flex;
  align-items: center;
  gap: 6px;
}

.confidence-badge {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 600;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
}

.suggestion-description {
  font-size: 12px;
  color: var(--text-primary);
  opacity: 0.7;
  margin: 4px 0 0;
  line-height: 1.4;
}

.suggestion-action {
  display: flex;
  align-items: flex-start;
  margin-top: 4px;

  .el-button {
    border-radius: 8px;
    font-size: 11px;
    display: flex;
    align-items: center;
    gap: 4px;
    border-color: rgba(120, 73, 255, 0.3);
    color: #7c3aed;
    padding: 4px 10px;
    height: auto;

    &:hover {
      border-color: #7c3aed;
      background: rgba(120, 73, 255, 0.06);
    }
  }
}

.suggestions-empty {
  text-align: center;

  .empty-text {
    font-size: 13px;
    color: var(--text-primary);
    opacity: 0.5;
    margin: 0;
  }
}

// Skeleton
.suggestions-skeleton { animation: skeleton-pulse 1.5s ease-in-out infinite; }
.skeleton-pill { height: 24px; width: 160px; border-radius: 8px; background: rgba(120, 73, 255, 0.08); margin-bottom: 14px; }
.skeleton-items { display: flex; flex-direction: column; gap: 10px; }
.skeleton-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 12px; background: rgba(0, 0, 0, 0.02); }
.skeleton-icon-box { width: 36px; height: 36px; border-radius: 10px; background: rgba(120, 73, 255, 0.06); }
.skeleton-text-group { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.skeleton-line {
  height: 10px; border-radius: 4px; background: rgba(120, 73, 255, 0.06);
  &.w-40 { width: 100px; }
  &.w-64 { width: 200px; }
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
