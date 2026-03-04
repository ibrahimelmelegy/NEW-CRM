<template lang="pug">
.widget-feed.glass-card.p-5.h-full
  .flex.items-center.justify-between.mb-3
    h4.text-sm.font-bold(style="color: var(--text-primary)") {{ title }}
    el-tag.text-xs(v-if="items.length" size="small" effect="dark" round) {{ items.length }}
  //- Loading skeleton
  .animate-pulse.space-y-3(v-if="loading")
    .flex.items-start.gap-3(v-for="i in 5" :key="i")
      .w-7.h-7.rounded-full.shrink-0(style="background: rgba(168, 85, 247, 0.12)")
      div.space-y-1.flex-1
        .h-3.rounded(:style="{ width: `${50 + Math.random() * 40}%`, background: 'rgba(168, 85, 247, 0.1)' }")
        .h-2.rounded.w-20(style="background: rgba(168, 85, 247, 0.06)")
  //- Feed items
  .feed-list.space-y-2.overflow-y-auto(v-else :style="{ maxHeight: feedType === 'activities' ? '320px' : '240px' }")
    .flex.items-start.gap-3.p-2.rounded-lg.transition-colors(
      v-for="item in items"
      :key="item.id"
      class="hover:bg-white/[0.03]"
    )
      .w-7.h-7.rounded-full.flex.items-center.justify-center.shrink-0(:style="{ background: item.color + '20' }")
        Icon(:name="item.icon" size="13" :style="{ color: item.color }")
      div.min-w-0.flex-1
        p.text-sm.leading-snug(style="color: var(--text-primary)") {{ item.text }}
        .flex.items-center.gap-2(class="mt-0.5")
          span.text-xs(v-if="item.user" style="color: var(--text-muted)") {{ item.user }}
          span.text-xs(style="color: var(--text-muted)") {{ item.time }}
    .text-center.py-6(v-if="!items.length")
      Icon(:name="feedType === 'activities' ? 'ph:lightning' : 'ph:bell'" size="32" style="color: var(--text-muted)")
      p.text-xs.mt-2(style="color: var(--text-muted)") No items yet
</template>

<script setup lang="ts">
const props = defineProps<{
  feedType: 'activities' | 'notifications';
  title: string;
}>();

interface FeedItem {
  id: string | number;
  text: string;
  user?: string;
  time: string;
  icon: string;
  color: string;
}

const loading = ref(true);
const items = ref<FeedItem[]>([]);

function getActivityIcon(status: string): string {
  const map: Record<string, string> = {
    create: 'ph:plus-circle-bold',
    update: 'ph:pencil-simple-bold',
    delete: 'ph:trash-bold',
    login: 'ph:sign-in-bold'
  };
  return map[status] || 'ph:activity-bold';
}

function getActivityColor(status: string): string {
  const map: Record<string, string> = {
    create: '#10B981',
    update: '#3B82F6',
    delete: '#EF4444',
    login: '#7849FF'
  };
  return map[status] || '#94A3B8';
}

function formatTimeAgo(date: string): string {
  if (!date) return '';
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

async function loadData() {
  loading.value = true;
  try {
    if (props.feedType === 'activities') {
      const { body, success } = await useApiFetch('activity?limit=12');
      if (success && body) {
        const data = body as any;
        const docs = data.docs || data || [];
        items.value = docs.map((a: any) => ({
          id: a.id || a._id,
          text: a.description || `${a.action || a.status || 'Action'} on ${a.entityType || 'record'}`,
          user: a.user?.name || a.userName || undefined,
          time: formatTimeAgo(a.createdAt),
          icon: getActivityIcon(a.status || a.action || ''),
          color: getActivityColor(a.status || a.action || '')
        }));
      }
    } else {
      const { body, success } = await useApiFetch('notifications?limit=10');
      if (success && body) {
        const data = body as any;
        const docs = data.docs || data || [];
        items.value = docs.map((n: any) => ({
          id: n.id || n._id,
          text: n.message || n.title || n.description || 'Notification',
          user: n.from?.name || undefined,
          time: formatTimeAgo(n.createdAt),
          icon: n.read ? 'ph:bell-bold' : 'ph:bell-ringing-bold',
          color: n.read ? '#94A3B8' : '#EF4444'
        }));
      }
    }
  } catch (e) {
    console.error('Feed widget load failed:', e);
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<style lang="scss" scoped>
.widget-feed {
  min-height: 200px;
}

.feed-list {
  scrollbar-width: thin;
  scrollbar-color: rgba(120, 73, 255, 0.2) transparent;

  &::-webkit-scrollbar {
    width: 3px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(120, 73, 255, 0.2);
    border-radius: 2px;
  }
}
</style>
