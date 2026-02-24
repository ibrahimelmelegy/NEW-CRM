<template lang="pug">
.online-indicator(:class="[statusClass, size]" :title="statusLabel")
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  userId: number;
  size?: 'sm' | 'md';
}>(), {
  size: 'sm'
});

const { getUserStatus } = usePresence();

const status = computed(() => getUserStatus(props.userId));

const statusClass = computed(() => {
  switch (status.value) {
    case 'online': return 'is-online';
    case 'away': return 'is-away';
    case 'busy': return 'is-busy';
    default: return 'is-offline';
  }
});

const statusLabel = computed(() => {
  switch (status.value) {
    case 'online': return 'Online';
    case 'away': return 'Away';
    case 'busy': return 'Busy';
    default: return 'Offline';
  }
});
</script>

<style lang="scss" scoped>
.online-indicator {
  border-radius: 50%;
  flex-shrink: 0;
  border: 2px solid rgba(15, 15, 30, 0.8);

  &.sm {
    width: 10px;
    height: 10px;
  }

  &.md {
    width: 14px;
    height: 14px;
  }

  &.is-online {
    background: #10B981;
    box-shadow: 0 0 4px rgba(16, 185, 129, 0.5);
  }

  &.is-away {
    background: #F59E0B;
    box-shadow: 0 0 4px rgba(245, 158, 11, 0.5);
  }

  &.is-busy {
    background: #EF4444;
    box-shadow: 0 0 4px rgba(239, 68, 68, 0.5);
  }

  &.is-offline {
    background: rgba(255, 255, 255, 0.2);
  }
}
</style>
