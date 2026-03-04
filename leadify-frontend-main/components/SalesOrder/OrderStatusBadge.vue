<template lang="pug">
el-tag(:type="tagType" :effect="'light'" class="status-badge") {{ label }}
</template>

<script setup lang="ts">
const props = defineProps<{
  status: string;
}>();

const tagType = computed(() => {
  switch (props.status) {
    case 'DRAFT':
      return 'info';
    case 'CONFIRMED':
      return 'primary';
    case 'PROCESSING':
      return 'warning';
    case 'SHIPPED':
      return '';
    case 'DELIVERED':
      return 'success';
    case 'CANCELLED':
      return 'danger';
    default:
      return 'info';
  }
});

const label = computed(() => {
  switch (props.status) {
    case 'DRAFT':
      return 'Draft';
    case 'CONFIRMED':
      return 'Confirmed';
    case 'PROCESSING':
      return 'Processing';
    case 'SHIPPED':
      return 'Shipped';
    case 'DELIVERED':
      return 'Delivered';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return props.status;
  }
});
</script>

<style scoped lang="scss">
.status-badge {
  border-radius: 8px;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 11px;
  padding: 4px 12px;
  letter-spacing: 0.5px;
}
</style>
