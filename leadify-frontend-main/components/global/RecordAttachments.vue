<template lang="pug">
.space-y-4
  //- Upload button
  .flex.justify-end
    el-button(size="small" @click="triggerUpload" class="!rounded-xl")
      Icon(name="ph:paperclip-bold" size="14")
      span.ml-1 {{ $t('common.upload') || 'Upload' }}
    input(ref="fileInput" type="file" multiple style="display: none" @change="handleFiles")

  //- Attachments list
  .space-y-2(v-if="attachments.length > 0")
    .glass-card.p-3.flex.items-center.gap-3(v-for="file in attachments" :key="file.id")
      .w-10.h-10.rounded-xl.flex.items-center.justify-center(:style="{ background: getFileColor(file.fileName) + '15' }")
        Icon(:name="getFileIcon(file.fileName)" size="20" :style="{ color: getFileColor(file.fileName) }")
      .flex-1.min-w-0
        p.font-medium.text-sm.truncate(style="color: var(--text-primary)") {{ file.fileName }}
        p.text-xs(style="color: var(--text-muted)") {{ formatFileSize(file.fileSize) }} · {{ formatDate(file.createdAt) }}
      .flex.items-center.gap-1
        el-button(text circle size="small" @click="downloadFile(file)")
          Icon(name="ph:download-simple-bold" size="16" style="color: var(--text-muted)")
        el-popconfirm(:title="$t('common.confirmDelete') || 'Delete this file?'" @confirm="removeFile(file.id)")
          template(#reference)
            el-button(text circle size="small")
              Icon(name="ph:trash-bold" size="16" style="color: var(--text-muted)")

  //- Empty
  .text-center.py-6(v-else-if="!loading")
    Icon(name="ph:paperclip" size="32" style="color: var(--text-muted)")
    p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noAttachments') || 'No attachments' }}

  //- Uploading indicator
  .glass-card.p-3.flex.items-center.gap-3(v-if="uploading")
    el-progress(:percentage="uploadProgress" :stroke-width="4" style="flex: 1")
</template>

<script setup lang="ts">
const props = defineProps<{
  entityType: string;
  entityId: string | number;
}>();

const fileInput = ref<HTMLInputElement>();
const attachments = ref<Record<string, unknown>[]>([]);
const loading = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);

async function fetchAttachments() {
  loading.value = true;
  try {
    const { body, success } = (await useApiFetch(`attachments?entityType=${props.entityType}&entityId=${props.entityId}`)) as unknown;
    if (success && body) {
      attachments.value = body.docs || body || [];
    }
  } finally {
    loading.value = false;
  }
}

function triggerUpload() {
  fileInput.value?.click();
}

async function handleFiles(e: Event) {
  const files = (e.target as HTMLInputElement).files;
  if (!files) return;
  uploading.value = true;
  uploadProgress.value = 0;
  try {
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append('file', files[i]!);
      formData.append('entityType', props.entityType);
      formData.append('entityId', String(props.entityId));
      await useApiFetch('attachments', 'POST', formData, false, true);
      uploadProgress.value = Math.round(((i + 1) / files.length) * 100);
    }
    await fetchAttachments();
  } finally {
    uploading.value = false;
    if (fileInput.value) fileInput.value.value = '';
  }
}

function downloadFile(file: unknown) {
  window.open(file.fileUrl, '_blank');
}

async function removeFile(id: number) {
  const { success } = await useApiFetch(`attachments/${id}`, 'DELETE');
  if (success) await fetchAttachments();
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString();
}

function getFileIcon(name: string): string {
  if (!name) return 'ph:file-bold';
  const ext = name.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: 'ph:file-pdf-bold',
    doc: 'ph:file-doc-bold',
    docx: 'ph:file-doc-bold',
    xls: 'ph:file-xls-bold',
    xlsx: 'ph:file-xls-bold',
    csv: 'ph:file-csv-bold',
    png: 'ph:file-image-bold',
    jpg: 'ph:file-image-bold',
    jpeg: 'ph:file-image-bold',
    zip: 'ph:file-zip-bold',
    rar: 'ph:file-zip-bold'
  };
  return map[ext || ''] || 'ph:file-bold';
}

function getFileColor(name: string): string {
  if (!name) return '#7849ff';
  const ext = name.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: '#ef4444',
    doc: '#3b82f6',
    docx: '#3b82f6',
    xls: '#22c55e',
    xlsx: '#22c55e',
    csv: '#22c55e',
    png: '#f59e0b',
    jpg: '#f59e0b',
    jpeg: '#f59e0b'
  };
  return map[ext || ''] || '#7849ff';
}

onMounted(() => fetchAttachments());
watch(
  () => [props.entityType, props.entityId],
  () => fetchAttachments()
);
</script>
