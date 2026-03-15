<template lang="pug">
el-form-item(:label="label" :error="errorMessage" class="!mb-6 w-full")
  el-upload.w-full(
    v-model:file-list="inputValue"
    :limit="limit"
    :name="name"
    action="#"
    :multiple="multiple"
    :before-upload="beforeUpload"
    :on-success="handleUploadSuccess"
    :on-remove="handleRemove"
    :http-request="handleUploadRequest"
    :class="{'upload-disabled-none' : limit === 1 && inputValue.length}"
    v-loading="loading"
  )
    el-icon.el-icon--upload
      upload-filled
    div.text-neutral-900
      | {{ $t('common.dragAndDrop') }}
      p.text-neutral-400.text-xs {{ $t('common.fileTypes') }}
    template(#tip)
      div.el-upload__tip(v-if="tipNote")
        | {{ $t('common.fileSizeLimit', { size: sizeInMb * 1024 / 4 }) }}
</template>

<script lang="ts" setup>
import { ElMessage } from 'element-plus';
import { useField } from 'vee-validate';
import type { UploadFile, UploadProps } from 'element-plus';
import logger from '~/utils/logger';
const { t } = useI18n();

const props = defineProps({
  name: String,
  value: {
    type: Array,
    default: () => []
  },
  label: String,
  sizeInMb: {
    type: Number,
    default: 2 // Max file size in MB
  },
  formats: {
    type: Array,
    default: () => [
      'image/jpg',
      'image/jpeg',
      'image/png',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv',
      'application/x-csv'
    ]
  },
  formatsError: {
    type: String
  },
  tipNote: {
    type: Boolean,
    default: true
  },
  limit: {
    type: Number,
    default: null
  },
  multiple: {
    type: Boolean,
    default: false
  },
  innerClass: {
    type: String,
    default: '!mb-6'
  },
  type: {
    type: String,
    default: ''
  }
});

const icon = computed(() => {
  switch (props.type) {
    case 'file':
      return 'IconAdd';
    case 'image':
      return 'IconImage';
    case 'video':
      return 'IconVideo';
    default:
      return 'IconImageList';
  }
});

const runtimeConfig = useRuntimeConfig();

const dialogImageUrl = ref('');
const dialogVisible = ref(false);
const disabled = ref(false);

const handlePictureCardPreview = (file: UploadFile) => {
  dialogImageUrl.value = file.url!;
  dialogVisible.value = true;
};

const handleUploadSuccess: UploadProps['onSuccess'] = (response, uploadFile) => {};

const { value: inputValue, errorMessage, handleBlur, handleChange, meta } = useField(props.name || '', undefined);

watch(
  () => props.value,
  () => {
    if (props.value) {
      inputValue.value = props.value;
    }
  }
);
if (props.value.length) {
  inputValue.value = props.value;
}

const loading = ref(false);

const beforeUpload: UploadProps['beforeUpload'] = (file: File) => {
  if (!props.formats.includes(file.type)) {
    ElMessage.error(t('common.acceptUpload', { formats: props.formats.map(format => format.split('/').pop()).join(', ') }));
    return false;
  }

  if (file.size / 1024 / 1024 > props.sizeInMb) {
    ElMessage.error(t('common.uploadMaxSize', { size: props.sizeInMb }));
    return false;
  }

  return true;
};

const handleUploadRequest = async (params: unknown) => {
  const { file, filename, data } = params;
  try {
    loading.value = true;
    data.model = 'PROJECT';

    const formData = new FormData();
    const fileToUpload = new File([file], file.name);

    formData.append(filename, fileToUpload);

    Object.entries(data).forEach(([key, value]: unknown) => {
      formData.append(key, value);
    });

    const response = await useApiFetch('upload', 'POST', formData, false, true);
    if (response?.success) {
      return response.body;
    }
  } catch (error) {
    logger.error('Upload failed:', error);
  } finally {
    loading.value = false;
  }
};

const handleRemove = (file: UploadFile) => {
  inputValue.value = (inputValue.value as unknown[])?.filter(f => f.uid !== file.uid);
};
</script>

<style lang="scss">
/* ============================================
   UPLOAD FILES - UNIFIED DARK/LIGHT STYLING
   ============================================ */

/* Hide upload button when limit reached */
.upload-disabled-none {
  .el-upload.el-upload--text {
    display: none;
  }
}

/* Base Upload Container */
.el-upload {
  width: 100% !important;
  min-height: 120px !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 24px !important;
  border-radius: 16px !important;
  transition: all 0.3s ease !important;
  text-align: center !important;
  box-sizing: border-box !important;
  cursor: pointer !important;

  /* Default: Dark Mode */
  background-color: rgba(30, 18, 48, 0.4) !important;
  border: 2px dashed rgba(168, 85, 247, 0.3) !important;

  &:hover {
    background-color: rgba(30, 18, 48, 0.6) !important;
    border-color: #a855f7 !important;
    transform: translateY(-2px);
  }
}

/* Upload Icon */
.el-icon--upload {
  font-size: 48px !important;
  color: #a855f7 !important;
  margin-bottom: 12px !important;
}

/* Text Elements - Force Center */
.el-upload .text-neutral-900 {
  width: 100% !important;
  text-align: center !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  color: #f3e8ff !important;
  font-size: 15px !important;
}

.el-upload .text-neutral-400 {
  width: 100% !important;
  text-align: center !important;
  display: block !important;
  color: #c4b5fd !important;
  margin-top: 6px !important;
  font-size: 12px !important;
}

/* Tip Text */
.el-upload__tip {
  margin: 8px 0 0 0 !important;
  opacity: 0.6;
  color: #c4b5fd !important;
  text-align: center !important;
  width: 100% !important;
}

/* File List Styling */
.el-upload-list {
  &--picture-card {
    .el-upload-list__item {
      border-radius: 12px;
    }
  }
}

/* ============================================
   LIGHT MODE OVERRIDES
   ============================================ */
html.light-mode .el-upload {
  background-color: rgba(255, 255, 255, 0.6) !important;
  border-color: #d8b4fe !important;

  &:hover {
    background-color: rgba(243, 232, 255, 0.7) !important;
    border-color: #a855f7 !important;
  }
}

html.light-mode .el-icon--upload {
  color: #7c3aed !important;
}

html.light-mode .el-upload .text-neutral-900 {
  color: #1f1f1f !important;
}

html.light-mode .el-upload .text-neutral-400 {
  color: #6b7280 !important;
}

html.light-mode .el-upload__tip {
  color: #6b7280 !important;
}
</style>
