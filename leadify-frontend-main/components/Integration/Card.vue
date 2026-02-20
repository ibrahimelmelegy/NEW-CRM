<template lang="pug">
.integration-card-wrapper(@click="handleClick")
  .glass-card.p-5.integration-card(:class="{ 'card-connected': integration.isConfigured, 'card-error': integration.status === 'error' }")
    //- Top row: icon + status
    .flex.items-start.justify-between.mb-4
      .icon-box(:class="iconBgClass")
        Icon(:name="integration.icon" size="32")
      el-tag(
        :type="statusTagType"
        size="small"
        effect="dark"
        round
      ) {{ statusLabel }}

    //- Name & description
    h4.text-base.font-bold.mb-1(style="color: var(--text-primary)") {{ integration.name }}
    p.text-xs.mb-4(style="color: var(--text-muted); line-height: 1.5; min-height: 36px;") {{ integration.description }}

    //- Footer: category + action button
    .flex.items-center.justify-between
      el-tag(type="info" size="small" effect="plain" round) {{ integration.category }}
      el-button(
        v-if="integration.isConfigured"
        type="primary"
        size="small"
        plain
        @click.stop="$emit('manage', integration)"
      ) {{ $t('integrationHub.card.manage') }}
      el-button(
        v-else
        type="primary"
        size="small"
        @click.stop="$emit('configure', integration)"
      ) {{ $t('integrationHub.card.configure') }}
</template>

<script setup lang="ts">
import type { MarketplaceIntegration } from './Marketplace.vue';

const props = defineProps<{
  integration: MarketplaceIntegration;
}>();

const emit = defineEmits<{
  (e: 'configure', integration: MarketplaceIntegration): void;
  (e: 'manage', integration: MarketplaceIntegration): void;
}>();

const { t } = useI18n();

const statusTagType = computed(() => {
  switch (props.integration.status) {
    case 'connected':
      return 'success';
    case 'error':
      return 'danger';
    default:
      return 'info';
  }
});

const statusLabel = computed(() => {
  switch (props.integration.status) {
    case 'connected':
      return t('integrationHub.card.connected');
    case 'error':
      return t('integrationHub.card.error');
    default:
      return t('integrationHub.card.notConnected');
  }
});

const iconBgClass = computed(() => {
  const cat = props.integration.category;
  switch (cat) {
    case 'Communication':
      return 'bg-purple';
    case 'Storage':
      return 'bg-blue';
    case 'Payment':
      return 'bg-green';
    case 'Marketing':
      return 'bg-orange';
    case 'Productivity':
      return 'bg-cyan';
    case 'Developer':
      return 'bg-pink';
    default:
      return 'bg-default';
  }
});

function handleClick() {
  if (props.integration.isConfigured) {
    emit('manage', props.integration);
  } else {
    emit('configure', props.integration);
  }
}
</script>

<style lang="scss" scoped>
.integration-card-wrapper {
  cursor: pointer;
}

.integration-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid var(--glass-border-color);
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border-radius: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.15);
  }

  &.card-connected {
    border-color: rgba(16, 185, 129, 0.3);
  }

  &.card-error {
    border-color: rgba(239, 68, 68, 0.3);
  }
}

.icon-box {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  flex-shrink: 0;

  &.bg-purple {
    background: rgba(147, 51, 234, 0.1);
  }
  &.bg-blue {
    background: rgba(59, 130, 246, 0.1);
  }
  &.bg-green {
    background: rgba(16, 185, 129, 0.1);
  }
  &.bg-orange {
    background: rgba(245, 158, 11, 0.1);
  }
  &.bg-cyan {
    background: rgba(6, 182, 212, 0.1);
  }
  &.bg-pink {
    background: rgba(236, 72, 153, 0.1);
  }
  &.bg-default {
    background: rgba(107, 114, 128, 0.1);
  }
}
</style>
