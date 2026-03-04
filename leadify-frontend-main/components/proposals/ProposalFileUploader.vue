<template>
  <div class="space-y-4">
    <!-- Label -->
    <label class="block text-sm font-semibold text-gray-700">Attachments</label>

    <!-- Drop Zone -->
    <div
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
      @click="triggerFileInput"
      :class="[
        'relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200',
        isDragging ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50/50',
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      ]"
    >
      <input
        ref="fileInputRef"
        type="file"
        :accept="acceptedTypes.join(',')"
        :multiple="multiple"
        @change="handleFileSelect"
        :disabled="disabled"
        class="hidden"
      />

      <div class="flex flex-col items-center gap-3">
        <div :class="['p-4 rounded-2xl', isDragging ? 'bg-violet-100' : 'bg-gray-100']">
          <Upload :size="32" :class="isDragging ? 'text-violet-600' : 'text-gray-400'" />
        </div>
        <div>
          <p class="font-medium text-gray-700">
            {{ isDragging ? 'Drop files here' : 'Drag & drop files here' }}
          </p>
          <p class="text-sm text-gray-500 mt-1">
            or
            <span class="text-violet-600 font-medium">browse</span>
            to upload
          </p>
        </div>
        <p class="text-xs text-gray-400">PDF, DOC, XLS, PPT, Images up to {{ maxSizeMB }}MB</p>
      </div>
    </div>

    <!-- File List -->
    <div v-if="modelValue.length > 0" class="space-y-2">
      <div
        v-for="file in modelValue"
        :key="file.id"
        :class="['flex items-center gap-4 p-4 rounded-xl border', file.status === 'error' ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-white']"
      >
        <!-- Icon -->
        <div class="p-2 rounded-lg bg-gray-100">
          <Loader2 v-if="file.status === 'uploading'" :size="20" class="animate-spin text-violet-500" />
          <component v-else :is="getFileIcon(file.type).component" :size="20" :class="getFileIcon(file.type).class" />
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-900 truncate">{{ file.name }}</p>
          <p class="text-xs text-gray-500">
            {{ formatFileSize(file.size) }}
            <span v-if="file.status === 'error' && file.errorMessage" class="text-red-500 ml-2">{{ file.errorMessage }}</span>
          </p>
          <div v-if="file.status === 'uploading' && file.uploadProgress !== undefined" class="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div class="h-full bg-violet-500 transition-all duration-300" :style="{ width: `${file.uploadProgress}%` }"></div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <button
            v-if="file.status === 'complete' && file.url"
            @click="handleDownload(file)"
            class="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
            title="Download"
          >
            <Download :size="18" />
          </button>
          <button
            v-if="!disabled"
            @click="handleRemove(file.id)"
            class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Remove"
          >
            <X :size="18" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, markRaw, type Component } from 'vue';
import { Upload, File as FileIcon, X, Loader2, FileText, Image as ImageIcon, FileSpreadsheet, Presentation, Download } from 'lucide-vue-next';

// ---- Types ----
interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadProgress?: number;
  status?: 'uploading' | 'complete' | 'error';
  errorMessage?: string;
}

// ---- Props ----
interface Props {
  modelValue: UploadedFile[];
  maxSize?: number; // in bytes, default 10MB
  acceptedTypes?: string[];
  multiple?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  maxSize: 10 * 1024 * 1024, // 10MB in bytes
  acceptedTypes: () => ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
  multiple: true,
  disabled: false
});

// ---- Emits ----
const emit = defineEmits<{
  'update:modelValue': [files: UploadedFile[]];
}>();

// ---- State ----
const isDragging = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

// ---- Computed ----
const maxSizeMB = computed(() => Math.round(props.maxSize / (1024 * 1024)));

// ---- Methods ----
const getFileIcon = (type: string): { component: Component; class: string } => {
  if (type.startsWith('image/')) return { component: markRaw(ImageIcon), class: 'text-blue-500' };
  if (type.includes('pdf')) return { component: markRaw(FileText), class: 'text-red-500' };
  if (type.includes('sheet') || type.includes('excel') || type.includes('xls'))
    return { component: markRaw(FileSpreadsheet), class: 'text-green-500' };
  if (type.includes('presentation') || type.includes('powerpoint') || type.includes('ppt'))
    return { component: markRaw(Presentation), class: 'text-orange-500' };
  return { component: markRaw(FileIcon), class: 'text-gray-500' };
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const onDragOver = () => {
  if (!props.disabled) isDragging.value = true;
};

const onDragLeave = () => {
  isDragging.value = false;
};

const onDrop = (e: DragEvent) => {
  isDragging.value = false;
  processFiles(e.dataTransfer?.files || null);
};

const triggerFileInput = () => {
  if (!props.disabled && fileInputRef.value) {
    fileInputRef.value.click();
  }
};

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  processFiles(target.files);
  if (fileInputRef.value) fileInputRef.value.value = '';
};

const processFiles = async (fileList: FileList | null) => {
  if (!fileList || props.disabled) return;

  const newFiles: UploadedFile[] = [];

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    if (!file) continue;

    // Check file size
    if (file.size > props.maxSize) {
      newFiles.push({
        id: `file-${Date.now()}-${i}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: '',
        status: 'error',
        errorMessage: `File too large (max ${maxSizeMB.value}MB)`
      });
      continue;
    }

    // Create file entry with uploading status
    const fileEntry: UploadedFile = {
      id: `file-${Date.now()}-${i}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: '',
      uploadProgress: 0,
      status: 'uploading'
    };
    newFiles.push(fileEntry);

    // Upload via API
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', 'PROPOSAL');

      const response = await useApiFetch('upload', 'POST', formData as any, false, true);

      if (response.success && response.body) {
        const fileName = response.body as string;
        const config = useRuntimeConfig();
        fileEntry.url = `${config.public.API_BASE_URL}assets/${fileName}`;
        fileEntry.id = fileName;
        fileEntry.status = 'complete';
        fileEntry.uploadProgress = 100;
      } else {
        fileEntry.status = 'error';
        fileEntry.errorMessage = response.message || 'Upload failed';
      }
    } catch (error: any) {
      fileEntry.status = 'error';
      fileEntry.errorMessage = error.message || 'Upload failed';
    }
  }

  emit('update:modelValue', [...props.modelValue, ...newFiles]);
};

const handleRemove = (id: string) => {
  emit(
    'update:modelValue',
    props.modelValue.filter(f => f.id !== id)
  );
};

const handleDownload = (file: UploadedFile) => {
  if (file.url) {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
</script>
