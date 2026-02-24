<template lang="pug">
.org-chart-node
  .node-card.glass-card.p-4.rounded-2xl.cursor-pointer.inline-block(class="min-w-[200px]"
    @click="toggleExpand"
    :class="{ 'border-2 border-purple-400': isExpanded && hasChildren }"
  )
    .flex.items-center.gap-3
      .avatar-sm
        span.text-white.font-bold.text-xs {{ initials }}
      div(class="min-w-0 flex-1")
        h4.font-semibold.text-sm.truncate(style="color: var(--text-primary)") {{ fullName }}
        p.text-xs.truncate(style="color: var(--text-muted)") {{ data.jobTitle || 'No Title' }}
        p.text-xs.truncate(v-if="data.department" style="color: var(--text-muted)") {{ data.department?.name }}
      .expand-btn.flex-shrink-0(v-if="hasChildren")
        Icon(
          :name="isExpanded ? 'ph:caret-up-bold' : 'ph:caret-down-bold'"
          size="16"
          style="color: var(--text-muted)"
        )
    .mt-2.flex.items-center.gap-2(v-if="hasChildren")
      Icon(name="ph:users-bold" size="12" style="color: var(--text-muted)")
      span.text-xs(style="color: var(--text-muted)") {{ data.children.length }} direct report{{ data.children.length !== 1 ? 's' : '' }}

  .children-container(v-if="isExpanded && hasChildren")
    .connector-line
    .children-wrapper.flex.flex-wrap.gap-4.mt-4(class="pl-8")
      HROrgChartTree(
        v-for="child in data.children"
        :key="child.id"
        :data="child"
      )
</template>

<script setup lang="ts">
import type { OrgChartNode } from '~/composables/useEmployees';

const props = defineProps<{
  data: OrgChartNode;
}>();

const isExpanded = ref(false);

const hasChildren = computed(() => props.data.children && props.data.children.length > 0);

const fullName = computed(() => `${props.data.firstName} ${props.data.lastName}`);

const initials = computed(() => {
  const first = props.data.firstName?.charAt(0) || '';
  const last = props.data.lastName?.charAt(0) || '';
  return `${first}${last}`.toUpperCase();
});

function toggleExpand() {
  if (hasChildren.value) {
    isExpanded.value = !isExpanded.value;
  }
}
</script>

<style scoped>
.avatar-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7849ff, #a78bfa);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.node-card {
  transition: all 0.2s ease;
}

.node-card:hover {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.connector-line {
  width: 2px;
  height: 16px;
  background: var(--el-border-color);
  margin-left: 24px;
}

.children-container {
  position: relative;
}

.children-wrapper {
  border-left: 2px solid var(--el-border-color);
}
</style>
