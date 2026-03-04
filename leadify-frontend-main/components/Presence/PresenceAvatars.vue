<template lang="pug">
.presence-avatars(v-if="viewers.length > 0")
  .presence-label
    .pulse-dot
    span {{ viewers.length }} {{ viewers.length === 1 ? 'person' : 'people' }} viewing
  .avatar-stack
    .presence-avatar(
      v-for="u in viewers.slice(0, 5)"
      :key="u.userId"
      :title="u.name + ' - ' + u.currentPage"
    )
      img.avatar-img(v-if="u.profilePicture" :src="u.profilePicture" :alt="u.name")
      .avatar-fallback(v-else) {{ u.name?.charAt(0)?.toUpperCase() }}
      .status-dot(:class="u.status")
    .avatar-overflow(v-if="viewers.length > 5") +{{ viewers.length - 5 }}
</template>

<script setup lang="ts">
import type { UserPresence } from '~/composables/usePresence';

defineProps<{
  viewers: UserPresence[];
}>();
</script>

<style lang="scss" scoped>
.presence-avatars {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.presence-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
  }
}

.avatar-stack {
  display: flex;
  align-items: center;
}

.presence-avatar {
  position: relative;
  width: 28px;
  height: 28px;
  margin-left: -8px;
  border-radius: 50%;
  border: 2px solid rgba(15, 15, 30, 0.8);
  flex-shrink: 0;

  &:first-child {
    margin-left: 0;
  }
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--accent-color, #7849ff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: white;
}

.status-dot {
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid rgba(15, 15, 30, 0.8);

  &.online {
    background: #10b981;
  }
  &.away {
    background: #f59e0b;
  }
  &.busy {
    background: #ef4444;
  }
}

.avatar-overflow {
  width: 28px;
  height: 28px;
  margin-left: -8px;
  border-radius: 50%;
  border: 2px solid rgba(15, 15, 30, 0.8);
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  flex-shrink: 0;
}
</style>
