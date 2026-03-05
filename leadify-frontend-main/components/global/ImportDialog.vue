<template lang="pug">
el-dialog(v-model="visible" :title="$t('common.import') || 'Import'" width="600px" @close="reset")
  .space-y-6
    //- Upload area
    .border-2.border-dashed.rounded-2xl.p-8.text-center.cursor-pointer.transition-colors(
      :class="dragOver ? 'border-purple-500 bg-purple-500/5' : 'border-gray-300'"
      @click="triggerUpload"
      @dragover.prevent="dragOver = true"
      @dragleave="dragOver = false"
      @drop.prevent="handleDrop"
    )
      Icon(name="ph:upload-simple-bold" size="40" style="color: var(--text-muted)")
      p.mt-2.font-medium(style="color: var(--text-primary)") {{ $t('common.dragAndDrop') || 'Drag and drop file here or' }}
      el-button.mt-2(size="small" type="primary" class="!rounded-xl") {{ $t('common.chooseFile') || 'Choose File' }}
      p.mt-2.text-xs(style="color: var(--text-muted)") {{ acceptLabel }}
    input(ref="fileInput" type="file" :accept="accept" style="display: none" @change="handleFileSelect")

    //- File info
    .glass-card.p-4.flex.items-center.gap-3(v-if="selectedFile")
      Icon(name="ph:file-bold" size="24" style="color: #7849ff")
      div.flex-1
        p.font-medium.text-sm(style="color: var(--text-primary)") {{ selectedFile.name }}
        p.text-xs(style="color: var(--text-muted)") {{ formatFileSize(selectedFile.size) }}
      el-button(text circle @click="selectedFile = null")
        Icon(name="ph:x-bold" size="16")

    //- Preview (first 5 rows)
    .glass-card.p-4(v-if="preview.length > 0")
      p.font-medium.text-sm.mb-2(style="color: var(--text-primary)") {{ $t('common.preview') || 'Preview' }} ({{ preview.length }} {{ $t('common.rows') || 'rows' }})
      el-table(:data="preview.slice(0, 5)" size="small" max-height="200" style="width: 100%")
        el-table-column(v-for="(col, i) in previewColumns" :key="i" :label="col" :prop="String(i)" min-width="120")

  template(#footer)
    el-button(@click="visible = false") {{ $t('common.cancel') }}
    el-button(type="primary" :loading="uploading" :disabled="!selectedFile" @click="handleUpload" class="!rounded-2xl") {{ $t('common.import') || 'Import' }}
</template>

<script setup lang="ts">
const props = defineProps<{
  endpoint: string;
  accept?: string;
  acceptLabel?: string;
}>();

const emit = defineEmits<{
  success: [data: unknown];
}>();

const visible = defineModel<boolean>({ default: false });

const fileInput = ref<HTMLInputElement>();
const selectedFile = ref<File | null>(null);
const preview = ref<Record<string, unknown>[]>([]);
const previewColumns = ref<string[]>([]);
const uploading = ref(false);
const dragOver = ref(false);

const accept = computed(() => props.accept || '.csv,.xls,.xlsx');
const acceptLabel = computed(() => props.acceptLabel || 'CSV, XLS, XLSX');

function triggerUpload() {
  fileInput.value?.click();
}

function handleFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) selectFile(file);
}

function handleDrop(e: DragEvent) {
  dragOver.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) selectFile(file);
}

function selectFile(file: File) {
  selectedFile.value = file;
  parsePreview(file);
}

async function parsePreview(file: File) {
  if (file.name.endsWith('.csv')) {
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length > 0) {
      previewColumns.value = lines[0]!.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      preview.value = lines.slice(1, 6).map(line => {
        const vals = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        const row: Record<string, string> = {};
        vals.forEach((v, i) => {
          row[String(i)] = v;
        });
        return row;
      });
    }
  }
}

async function handleUpload() {
  if (!selectedFile.value) return;
  uploading.value = true;
  try {
    const formData = new FormData();
    formData.append('file', selectedFile.value);
    const res = await useApiFetch(props.endpoint, 'POST', formData, false, true);
    if (res.success) {
      emit('success', res.body);
      visible.value = false;
    } else {
      ElNotification({ type: 'error', title: 'Error', message: res.message || 'Import failed' });
    }
  } finally {
    uploading.value = false;
  }
}

function reset() {
  selectedFile.value = null;
  preview.value = [];
  previewColumns.value = [];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}
</script>
