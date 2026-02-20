<template lang="pug">
div
  el-tree(
    v-if="treeData.length > 0"
    :data="treeData"
    :props="treeProps"
    node-key="id"
    default-expand-all
    :expand-on-click-node="false"
    @node-click="handleNodeClick"
    class="accounting-tree"
  )
    template(#default="{ node, data }")
      .flex.items-center.justify-between.w-full.py-1.px-2.cursor-pointer(class="hover:bg-gray-50 rounded")
        .flex.items-center.gap-3
          span.font-mono.text-sm.text-gray-500 {{ data.code }}
          span.font-medium(:class="{ 'font-bold': data.isGroup }") {{ data.name }}
          el-tag(
            :type="getTagType(data.type)"
            size="small"
            effect="plain"
          ) {{ data.type }}
        .flex.items-center.gap-3
          span.text-sm.font-medium(:style="{ color: getTypeColor(data.type) }") {{ formatBalance(data.balance) }}
          el-tag(v-if="data.isGroup" size="small" type="info" effect="light") Group

  el-empty(v-else description="No accounts found. Click 'Seed Defaults' to create a default chart of accounts.")
</template>

<script setup lang="ts">
import { AccountType, accountTypeColors, accountTypeTagType } from '~/composables/useAccounting';
import type { ChartOfAccountsItem } from '~/composables/useAccounting';

interface Props {
  accounts: ChartOfAccountsItem[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'node-click', account: ChartOfAccountsItem): void;
}>();

const treeProps = {
  children: 'children',
  label: 'name'
};

const treeData = computed(() => props.accounts);

function getTagType(type: AccountType): string {
  return accountTypeTagType[type] || 'info';
}

function getTypeColor(type: AccountType): string {
  return accountTypeColors[type] || '#909399';
}

function formatBalance(balance: number): string {
  return new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(balance || 0);
}

function handleNodeClick(data: ChartOfAccountsItem) {
  emit('node-click', data);
}
</script>

<style scoped>
.accounting-tree :deep(.el-tree-node__content) {
  height: auto;
  padding: 4px 0;
}
</style>
