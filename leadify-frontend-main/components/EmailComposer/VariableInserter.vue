<template lang="pug">
.variable-inserter
  el-dropdown(trigger="click" @command="handleInsert")
    el-button(size="small" type="info" plain)
      Icon(name="ph:code-bold" size="14")
      span(class="ml-1") {{ $t('emailComposer.variables') }}
    template(#dropdown)
      el-dropdown-menu
        el-dropdown-item(
          v-for="v in variables"
          :key="v"
          :command="v"
        )
          .flex.items-center.justify-between.gap-4(class="min-w-[200px]")
            .flex.items-center.gap-2
              el-tag(size="small" effect="plain" class="font-mono") {{ '{{' + v + '}}' }}
            span(
              v-if="context[v]"
              class="text-xs text-[var(--text-secondary)] truncate max-w-[120px]"
            ) {{ context[v] }}
            span(
              v-else
              class="text-xs text-[var(--text-muted)] italic"
            ) --
</template>

<script setup lang="ts">
defineProps<{
  variables: string[];
  context: Record<string, string>;
}>();

const emit = defineEmits<{
  (e: 'insert', variable: string): void;
}>();

function handleInsert(variable: string) {
  emit('insert', variable);
}
</script>

<style scoped>
.variable-inserter {
  display: inline-flex;
}
</style>
