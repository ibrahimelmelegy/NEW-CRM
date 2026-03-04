<template lang="pug">
.team-pulse
  .section-header.flex.items-center.gap-2.mb-4
    Icon(name="ph:users-bold" size="18" :style="{ color: 'var(--accent-color)' }")
    span.text-sm.font-bold.text-primary TEAM PULSE
    .active-count {{ activeCount }}/{{ members.length }} online
  .members-grid
    .member-item(v-for="member in members" :key="member.id")
      .member-avatar(:class="{ online: member.isActive }")
        Avatar(:src="member.profilePicture" small)
        .status-dot(:class="{ online: member.isActive }")
      .member-name {{ member.name }}
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  members: { id: number; name: string; profilePicture?: string; isActive: boolean }[];
}>();

const activeCount = computed(() => props.members.filter(m => m.isActive).length);
</script>

<style lang="scss" scoped>
.text-primary {
  color: var(--text-primary);
}

.active-count {
  margin-left: auto;
  font-size: 12px;
  color: #22c55e;
  font-weight: 600;
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 12px;
}

.member-item {
  text-align: center;
}

.member-avatar {
  position: relative;
  display: inline-block;
  margin-bottom: 4px;

  &.online {
    &::after {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      border: 2px solid #22c55e;
      animation: glow 2s infinite;
    }
  }
}

.status-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #6b7280;
  border: 2px solid var(--bg-primary, #0a0a1a);

  &.online {
    background: #22c55e;
  }
}

.member-name {
  font-size: 11px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@keyframes glow {
  0%,
  100% {
    box-shadow: 0 0 4px rgba(34, 197, 94, 0.3);
  }
  50% {
    box-shadow: 0 0 12px rgba(34, 197, 94, 0.6);
  }
}
</style>
