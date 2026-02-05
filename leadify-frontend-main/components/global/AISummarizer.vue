<template lang="pug">
el-dialog(v-model="visible" title="AI Meeting Summarizer" width="600" class="glass-dialog")
  .summarizer-container
    .input-section.mb-6
      p.text-sm.text-neutral-500.mb-2 Raw Meeting Notes
      el-input(
        v-model="rawText"
        type="textarea"
        :rows="6"
        placeholder="Paste your meeting notes here..."
        class="glass-input"
      )
    
    .action-section.flex.justify-end.mb-6
      el-button(type="primary" :loading="loading" @click="generateSummary" class="premium-btn")
        Icon(name="ph:magic-wand" size="18" class="mr-2")
        | Generate Summary

    .result-section(v-if="summaryData")
      .glass-card.p-6.mb-4(class="!bg-white !bg-opacity-5")
        h4.font-bold.mb-2.text-primary Summary
        p.text-sm.text-neutral-700 {{ summaryData.summary }}
      
      .grid.grid-cols-2.gap-4
        .glass-card.p-4(class="!bg-emerald-500 !bg-opacity-5")
          h4.font-bold.mb-2.text-emerald-700.flex.items-center
            Icon(name="ph:check-circle" size="18" class="mr-1")
            | Action Items
          ul.list-disc.pl-4.text-xs.text-neutral-600
            li(v-for="item in summaryData.actionItems" :key="item") {{ item }}
        
        .glass-card.p-4(class="!bg-indigo-500 !bg-opacity-5")
          h4.font-bold.mb-2.text-indigo-700.flex.items-center
            Icon(name="ph:info" size="18" class="mr-1")
            | Decisions
          ul.list-disc.pl-4.text-xs.text-neutral-600
            li(v-for="item in summaryData.decisions" :key="item") {{ item }}
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElNotification } from 'element-plus';

const props = defineProps<{
  modelValue: boolean;
  initialText?: string;
}>();

const emit = defineEmits(['update:modelValue']);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const rawText = ref(props.initialText || '');
const loading = ref(false);
const summaryData = ref<any>(null);

const generateSummary = async () => {
  if (!rawText.value) return ElNotification.warning('Please enter some text');
  
  loading.value = true;
  try {
    const response: any = await useApiFetch('ai/summarize-meeting', 'POST', {
      text: rawText.value
    });
    
    if (response.success) {
      summaryData.value = response.data;
      ElNotification.success('Summary generated successfully');
    }
  } catch (error) {
    ElNotification.error('Failed to generate summary');
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.glass-dialog {
  :deep(.el-dialog) {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 24px;
  }
}
</style>
