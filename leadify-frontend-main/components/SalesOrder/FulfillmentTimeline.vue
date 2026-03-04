<template lang="pug">
.fulfillment-timeline
    template(v-if="fulfillments && fulfillments.length > 0")
        el-timeline
            el-timeline-item(
                v-for="item in fulfillments"
                :key="item.id"
                :timestamp="formatDate(item.createdAt)"
                :type="getTimelineType(item.status)"
                :hollow="item.status === 'PENDING'"
                placement="top"
                size="large"
            )
                .glass-card.p-4
                    .flex.items-center.justify-between.mb-3
                        .flex.items-center.gap-3
                            Icon(:name="getStatusIcon(item.status)" class="text-lg" :class="getStatusColor(item.status)")
                            span.font-bold.text-white {{ getStatusLabel(item.status) }}
                        el-tag(:type="getTimelineType(item.status)" size="small" effect="plain") {{ item.status }}

                    .space-y-2.text-sm
                        .flex.items-center.gap-2(v-if="item.trackingNumber")
                            Icon(name="ph:hash-bold" class="text-muted text-xs")
                            span.text-muted Tracking:
                            span.text-white.font-mono {{ item.trackingNumber }}

                        .flex.items-center.gap-2(v-if="item.carrier")
                            Icon(name="ph:truck-bold" class="text-muted text-xs")
                            span.text-muted Carrier:
                            span.text-white {{ item.carrier }}

                        .flex.items-center.gap-2(v-if="item.shippedDate")
                            Icon(name="ph:calendar-check-bold" class="text-muted text-xs")
                            span.text-muted Shipped:
                            span.text-white {{ formatDate(item.shippedDate) }}

                        .flex.items-center.gap-2(v-if="item.deliveredDate")
                            Icon(name="ph:package-bold" class="text-muted text-xs")
                            span.text-muted Delivered:
                            span.text-white {{ formatDate(item.deliveredDate) }}

                        .text-muted.mt-2(v-if="item.notes")
                            span {{ item.notes }}

    .text-center.text-muted.py-8(v-else)
        Icon(name="ph:package-bold" class="text-4xl mb-3 opacity-30")
        p.text-sm No fulfillment records yet
</template>

<script setup lang="ts">
defineProps<{
  fulfillments: Array<any>;
}>();

function formatDate(date: any) {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getTimelineType(status: string) {
  switch (status) {
    case 'PENDING':
      return 'info';
    case 'PACKED':
      return 'warning';
    case 'SHIPPED':
      return 'primary';
    case 'DELIVERED':
      return 'success';
    default:
      return 'info';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'PENDING':
      return 'ph:clock-bold';
    case 'PACKED':
      return 'ph:box-bold';
    case 'SHIPPED':
      return 'ph:truck-bold';
    case 'DELIVERED':
      return 'ph:check-circle-bold';
    default:
      return 'ph:circle-bold';
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'PENDING':
      return 'text-blue-400';
    case 'PACKED':
      return 'text-yellow-400';
    case 'SHIPPED':
      return 'text-purple-400';
    case 'DELIVERED':
      return 'text-green-400';
    default:
      return 'text-gray-400';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'PACKED':
      return 'Packed';
    case 'SHIPPED':
      return 'Shipped';
    case 'DELIVERED':
      return 'Delivered';
    default:
      return status;
  }
}
</script>

<style scoped lang="scss">
.fulfillment-timeline {
  :deep(.el-timeline-item__wrapper) {
    padding-left: 20px;
  }
  :deep(.el-timeline-item__timestamp) {
    color: var(--text-secondary);
    font-size: 12px;
  }
}
</style>
