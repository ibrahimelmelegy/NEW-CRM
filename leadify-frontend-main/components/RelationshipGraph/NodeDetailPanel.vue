<template lang="pug">
Transition(name="slide")
  .node-detail-panel(v-if="node")
    .panel-header.flex.items-center.justify-between.mb-4
      .flex.items-center.gap-3
        .node-type-badge(:class="`type-${node.type}`")
          Icon(:name="getIcon(node.type)" size="18")
        div
          .node-name {{ node.label }}
          .node-type {{ node.type }}
      el-button(circle size="small" @click="$emit('close')")
        Icon(name="ph:x-bold" size="14")
    .panel-body
      .detail-row(v-if="node.value")
        .detail-label Value
        .detail-value ${{ node.value.toLocaleString() }}
      .detail-row
        .detail-label ID
        .detail-value.text-xs.font-mono {{ node.id }}
      el-button.mt-4.w-full(@click="navigateTo" type="primary" plain size="small")
        Icon.mr-1(name="ph:arrow-right-bold" size="14")
        | View Details
</template>

<script setup lang="ts">
import type { GraphNode } from '~/composables/useRelationshipGraph';

const props = defineProps<{
  node: GraphNode | null;
}>();

defineEmits(['close']);
const router = useRouter();

function getIcon(type: string): string {
  const icons: Record<string, string> = {
    lead: 'ph:user-plus-bold',
    deal: 'ph:handshake-bold',
    client: 'ph:briefcase-bold',
    user: 'ph:user-bold'
  };
  return icons[type] || 'ph:circle-bold';
}

function navigateTo() {
  if (!props.node) return;
  const [type, id] = props.node.id.split('-') as [string, string];
  const routes: Record<string, string> = {
    lead: `/sales/leads/${id}`,
    deal: `/sales/deals/${id}`,
    client: `/sales/clients/${id}`,
    user: `/staff`
  };
  router.push(routes[type] || '/');
}
</script>

<style lang="scss" scoped>
.node-detail-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 280px;
  background: rgba(15, 15, 30, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 16px;
  z-index: 10;
}

.node-type-badge {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.type-lead { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
  &.type-deal { background: rgba(139, 92, 246, 0.2); color: #8b5cf6; }
  &.type-client { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
  &.type-user { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
}

.node-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.node-type {
  font-size: 11px;
  color: var(--text-secondary);
  text-transform: capitalize;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.detail-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.detail-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.slide-enter-active { animation: slideIn 0.3s ease; }
.slide-leave-active { animation: slideIn 0.3s ease reverse; }

@keyframes slideIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
</style>
