<template lang="pug">
el-tag(
  :type="tagType"
  size="small"
  effect="light"
  round
) {{ label }}
</template>

<script setup lang="ts">
const props = defineProps<{
  status: string;
}>();

const statusMap: Record<string, { type: string; label: string }> = {
  DRAFT: { type: 'info', label: 'Draft' },
  SENT: { type: '', label: 'Sent' },
  PARTIALLY_PAID: { type: 'warning', label: 'Partially Paid' },
  PAID: { type: 'success', label: 'Paid' },
  OVERDUE: { type: 'danger', label: 'Overdue' },
  VOID: { type: 'info', label: 'Void' },
  COLLECTED: { type: 'success', label: 'Collected' },
  PENDING: { type: 'warning', label: 'Pending' }
};

const tagType = computed(() => statusMap[props.status]?.type || 'info');
const label = computed(() => statusMap[props.status]?.label || props.status);
</script>
