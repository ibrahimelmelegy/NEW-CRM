<template lang="pug">
div
  ModuleHeader(
    :title="$t('documents.title')"
    :subtitle="$t('documents.subtitle')"
  )
    template(#actions)
      el-button(size="large" type="primary" @click="showFolderDialog = true" class="!rounded-2xl")
        Icon(name="ph:folder-plus-bold" size="16")
        span.ml-1 {{ $t('documents.newFolder') }}
      el-button(size="large" type="primary" @click="triggerFileUpload" class="!rounded-2xl")
        Icon(name="ph:upload-bold" size="16")
        span.ml-1 {{ $t('common.upload') }}

  input(type="file" ref="fileInputRef" style="display: none" multiple @change="handleFileUpload")

  .flex.gap-6.animate-entrance(style="min-height: 70vh")
    //- Left Sidebar: Folder Tree
    .w-64.flex-shrink-0
      .glass-card.p-4
        .flex.items-center.justify-between.mb-3
          h4.font-bold(style="color: var(--text-primary)") {{ $t('documents.folders') }}
        //- Root folder
        .flex.items-center.gap-2.p-2.rounded-lg.cursor-pointer.mb-1.folder-tree-item(
          :class="{ 'active-folder': selectedFolderId === null }"
          @click="selectFolder(null)"
        )
          Icon(name="ph:house-bold" size="16" style="color: var(--accent-color, #7849ff)")
          span.text-sm(style="color: var(--text-primary)") {{ $t('documents.rootFolder') }}

        //- Folder tree
        template(v-if="folderTree.length")
          DocumentsFolderTreeNode(
            v-for="folder in folderTree"
            :key="folder.id"
            :folder="folder"
            :selected-id="selectedFolderId"
            :depth="0"
            @select="selectFolder"
            @edit="editFolder"
            @delete="confirmDeleteFolder"
          )
        .text-center.py-4(v-else-if="!foldersLoading")
          p.text-sm(style="color: var(--text-muted)") {{ $t('documents.noFolders') }}

    //- Main Content Area
    .flex-1
      //- Top Bar: Search, View Toggle, Breadcrumbs
      .flex.items-center.justify-between.mb-4.gap-4.flex-wrap
        //- Breadcrumbs
        .flex.items-center.gap-1.flex-wrap
          span.text-sm.cursor-pointer(
            style="color: var(--accent-color, #7849ff)"
            @click="selectFolder(null)"
          ) {{ $t('documents.rootFolder') }}
          template(v-for="crumb in breadcrumbs" :key="crumb.id")
            Icon(name="ph:caret-right" size="12" style="color: var(--text-muted)")
            span.text-sm.cursor-pointer(
              style="color: var(--accent-color, #7849ff)"
              @click="selectFolder(crumb.id)"
            ) {{ crumb.name }}

        .flex.items-center.gap-3
          el-input(
            v-model="searchQuery"
            :placeholder="$t('documents.search')"
            clearable
            class="w-56"
            @input="debounceSearch"
          )
            template(#prefix)
              Icon(name="ph:magnifying-glass" size="16" aria-hidden="true")
          el-button-group
            el-button(
              :type="viewMode === 'grid' ? 'primary' : 'default'"
              @click="viewMode = 'grid'"
              class="!rounded-l-xl"
            )
              Icon(name="ph:squares-four-bold" size="16" :aria-label="$t('documents.gridView')")
            el-button(
              :type="viewMode === 'list' ? 'primary' : 'default'"
              @click="viewMode = 'list'"
              class="!rounded-r-xl"
            )
              Icon(name="ph:list-bold" size="16" :aria-label="$t('documents.listView')")

      //- Subfolders in current view
      template(v-if="currentSubfolders.length && !searchQuery")
        h4.font-semibold.mb-3(style="color: var(--text-primary)") {{ $t('documents.folders') }}
        .grid.gap-3.mb-6(:class="viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'")
          .glass-card.p-4.cursor-pointer.flex.items-center.gap-3(
            v-for="folder in currentSubfolders"
            :key="folder.id"
            style="transition: transform 0.2s ease, box-shadow 0.2s ease"
            @click="selectFolder(folder.id)"
          )
            .w-10.h-10.rounded-xl.flex.items-center.justify-center(:style="{ backgroundColor: (folder.color || '#7849ff') + '20' }")
              Icon(name="ph:folder-bold" size="24" :style="{ color: folder.color || '#7849ff' }")
            .flex-1.min-w-0
              p.font-semibold.truncate(style="color: var(--text-primary)") {{ folder.name }}
              p.text-xs(style="color: var(--text-muted)") {{ folder.children?.length || 0 }} {{ $t('documents.folders').toLowerCase() }}

      //- Files
      h4.font-semibold.mb-3(style="color: var(--text-primary)") {{ $t('documents.files') }}

      //- Grid View
      template(v-if="viewMode === 'grid'")
        .grid.grid-cols-2.gap-3(v-if="files.length" v-loading="filesLoading" class="md:grid-cols-3 lg:grid-cols-4")
          .glass-card.p-4.cursor-pointer(
            v-for="file in files"
            :key="file.id"
            style="transition: transform 0.2s ease, box-shadow 0.2s ease"
            @click="openFileDetail(file)"
          )
            .flex.justify-center.mb-3
              .w-12.h-12.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.1)")
                Icon(:name="getFileIcon(file.mimeType)" size="28" style="color: var(--accent-color, #7849ff)")
            p.font-semibold.text-sm.truncate.text-center.mb-1(style="color: var(--text-primary)") {{ file.name }}
            p.text-xs.text-center.mb-2(style="color: var(--text-muted)") {{ formatFileSize(file.size) }}
            .flex.flex-wrap.gap-1.justify-center
              el-tag(v-for="tag in (file.tags || []).slice(0, 3)" :key="tag" size="small" effect="plain" class="!rounded-lg") {{ tag }}

      //- List View
      template(v-else)
        .glass-card.py-8.animate-entrance(v-loading="filesLoading")
          el-table(:data="files" style="width: 100%")
            el-table-column(:label="$t('documents.fileName')" min-width="250")
              template(#default="{ row }")
                .flex.items-center.gap-3
                  Icon(:name="getFileIcon(row.mimeType)" size="22" style="color: var(--accent-color, #7849ff)")
                  .flex.flex-col
                    span.font-semibold(style="color: var(--text-primary)") {{ row.name }}
                    span.text-xs(style="color: var(--text-muted)") {{ row.originalName }}
            el-table-column(:label="$t('documents.fileSize')" width="120")
              template(#default="{ row }")
                span {{ formatFileSize(row.size) }}
            el-table-column(:label="$t('documents.fileType')" width="120")
              template(#default="{ row }")
                el-tag(size="small" effect="plain") {{ getFileExtension(row.mimeType) }}
            el-table-column(:label="$t('documents.tags')" min-width="180")
              template(#default="{ row }")
                .flex.flex-wrap.gap-1
                  el-tag(v-for="tag in (row.tags || [])" :key="tag" size="small" effect="plain" class="!rounded-lg") {{ tag }}
                  span(v-if="!row.tags?.length") —
            el-table-column(:label="$t('documents.uploadedBy')" width="140")
              template(#default="{ row }")
                span {{ row.uploader?.name || '—' }}
            el-table-column(:label="$t('documents.uploadDate')" width="140")
              template(#default="{ row }")
                span {{ formatDate(row.createdAt) }}
            el-table-column(:label="$t('common.actions')" width="120" fixed="right")
              template(#default="{ row }")
                .flex.items-center(@click.stop)
                  el-dropdown(trigger="click")
                    span.el-dropdown-link
                      .toggle-icon.text-md: Icon(name="IconToggle" size="22")
                    template(#dropdown)
                      el-dropdown-menu
                        el-dropdown-item(@click="openFileDetail(row)")
                          .flex.items-center
                            Icon.text-md.mr-2(name="IconEdit")
                            p.text-sm {{ $t('common.edit') }}
                        el-dropdown-item(@click="downloadFile(row)")
                          .flex.items-center
                            Icon.text-md.mr-2(name="ph:download-bold")
                            p.text-sm {{ $t('documents.download') }}
                        el-dropdown-item(@click="confirmDeleteFile(row.id)")
                          .flex.items-center
                            Icon.text-md.mr-2(name="IconDelete")
                            p.text-sm {{ $t('common.delete') }}
            template(#empty)
              el-empty(:description="$t('documents.noFiles')" image="/images/empty.png")

      //- Empty State (grid view only)
      .text-center.py-16(v-if="!files.length && !filesLoading && viewMode === 'grid'")
        Icon(name="ph:file-dashed-bold" size="64" style="color: var(--text-muted)")
        p.mt-4(style="color: var(--text-muted)") {{ $t('documents.noFiles') }}

      //- Pagination
      .pagination.mt-5.flex.items-center.flex-wrap.gap-2(class="sm:justify-between justify-center" v-if="pagination.totalPages > 1")
        span.text-xs(style="color: var(--text-muted)") {{ pagination.totalItems }} {{ $t('common.entries') }}
        el-pagination(background style="direction:ltr" :pager-count="4" v-model:current-page="currentPage" :page-size="pagination.limit" layout="prev, pager, next" :total="pagination.totalItems" @current-change="loadFiles")

  //- Create/Edit Folder Dialog
  el-dialog(v-model="showFolderDialog" :title="editingFolderId ? $t('documents.editFolder') : $t('documents.createFolder')" width="480px" @close="resetFolderForm")
    el-form(ref="folderFormRef" :model="folderForm" :rules="folderRules" label-position="top" size="large")
      el-form-item(:label="$t('documents.folderName')" prop="name")
        el-input(v-model="folderForm.name" :placeholder="$t('documents.folderName')")
      el-form-item(:label="$t('documents.parentFolder')")
        el-select(v-model="folderForm.parentId" clearable :placeholder="$t('documents.rootFolder')" class="w-full")
          el-option(:value="null" :label="$t('documents.rootFolder')")
          el-option(
            v-for="folder in allFoldersList"
            :key="folder.id"
            :value="folder.id"
            :label="folder.name"
            :disabled="folder.id === editingFolderId"
          )
      el-form-item(:label="$t('documents.color')")
        el-color-picker(v-model="folderForm.color" :predefine="presetColors")

    template(#footer)
      el-button(@click="showFolderDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="folderSaving" @click="saveFolder" class="!rounded-2xl") {{ $t('common.save') }}

  //- File Detail/Edit Dialog
  el-dialog(v-model="showFileDialog" :title="$t('documents.editFile')" width="560px" @close="resetFileForm")
    el-form(ref="fileFormRef" :model="fileForm" label-position="top" size="large" v-if="selectedFile")
      .flex.items-center.gap-4.mb-6
        .w-14.h-14.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.1)")
          Icon(:name="getFileIcon(selectedFile.mimeType)" size="32" style="color: var(--accent-color, #7849ff)")
        div
          p.font-bold(style="color: var(--text-primary)") {{ selectedFile.originalName }}
          p.text-sm(style="color: var(--text-muted)") {{ formatFileSize(selectedFile.size) }} &middot; {{ getFileExtension(selectedFile.mimeType) }}

      el-form-item(:label="$t('documents.fileName')")
        el-input(v-model="fileForm.name")

      el-form-item(:label="$t('documents.tags')")
        el-select(v-model="fileForm.tags" multiple allow-create filterable :placeholder="$t('documents.addTag')" class="w-full")

      el-form-item(:label="$t('documents.moveTo')")
        el-select(v-model="fileForm.folderId" clearable :placeholder="$t('documents.rootFolder')" class="w-full")
          el-option(:value="null" :label="$t('documents.rootFolder')")
          el-option(
            v-for="folder in allFoldersList"
            :key="folder.id"
            :value="folder.id"
            :label="folder.name"
          )

    template(#footer)
      .flex.justify-between.w-full
        el-button(@click="downloadFile(selectedFile)" v-if="selectedFile")
          Icon(name="ph:download-bold" size="14" class="mr-1")
          span {{ $t('documents.download') }}
        .flex.gap-2
          el-button(@click="showFileDialog = false") {{ $t('common.cancel') }}
          el-button(type="primary" :loading="fileSaving" @click="saveFile" class="!rounded-2xl") {{ $t('common.save') }}

  //- Delete Confirmation Dialog
  el-dialog(v-model="deletePopup" :title="$t('common.confirm')" width="400px")
    p(style="color: var(--text-primary)") {{ $t('common.confirmDelete') }}
    template(#footer)
      el-button(@click="deletePopup = false") {{ $t('common.cancel') }}
      el-button(type="danger" :loading="deleting" @click="executeDeleteFile" class="!rounded-2xl") {{ $t('common.delete') }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { useDocuments } from '~/composables/useDocuments';
import type { DocumentFolder, DocumentFile } from '~/composables/useDocuments';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;
const config = useRuntimeConfig();

const {
  fetchFolders,
  fetchFolderTree,
  createFolder,
  updateFolder,
  deleteFolder: deleteFolderApi,
  fetchFiles,
  updateFile,
  deleteFile: deleteFileApi
} = useDocuments();

// State
const folderTree = ref<DocumentFolder[]>([]);
const allFoldersList = ref<DocumentFolder[]>([]);
const currentSubfolders = ref<DocumentFolder[]>([]);
const files = ref<DocumentFile[]>([]);
const selectedFolderId = ref<number | null>(null);
const breadcrumbs = ref<{ id: number; name: string }[]>([]);
const foldersLoading = ref(true);
const filesLoading = ref(true);
const viewMode = ref<'grid' | 'list'>('grid');
const searchQuery = ref('');
const currentPage = ref(1);
const pagination = ref({ page: 1, limit: 50, totalItems: 0, totalPages: 0 });

// File upload
const fileInputRef = ref<HTMLInputElement | null>(null);

// Folder dialog
const showFolderDialog = ref(false);
const editingFolderId = ref<number | null>(null);
const folderSaving = ref(false);
const folderFormRef = ref();
const folderForm = reactive({
  name: '',
  parentId: null as number | null,
  color: '#7849ff'
});
const folderRules = {
  name: [{ required: true, message: () => t('validation.required', { field: t('documents.folderName') }), trigger: 'blur' }]
};

// File dialog
const showFileDialog = ref(false);
const selectedFile = ref<DocumentFile | null>(null);
const fileSaving = ref(false);
const fileFormRef = ref();
const fileForm = reactive({
  name: '',
  tags: [] as string[],
  folderId: null as number | null
});

// Delete confirmation
const deletePopup = ref(false);
const deleteTargetId = ref<number | null>(null);
const deleting = ref(false);

const presetColors = ['#7849ff', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316'];

let debounceTimer: ReturnType<typeof setTimeout>;

// Lifecycle
onMounted(async () => {
  await Promise.all([loadFolderTree(), loadCurrentSubfolders(), loadFiles()]);
});

// Methods
async function loadFolderTree() {
  foldersLoading.value = true;
  const result = await fetchFolderTree();
  if (result.success && result.body) {
    folderTree.value = result.body as DocumentFolder[];
    const list: DocumentFolder[] = [];
    buildFlatList(folderTree.value, list);
    allFoldersList.value = list;
  }
  foldersLoading.value = false;
}

function buildFlatList(folders: DocumentFolder[], list: DocumentFolder[]) {
  for (const folder of folders) {
    list.push(folder);
    if (folder.children?.length) {
      buildFlatList(folder.children, list);
    }
  }
}

async function loadFiles() {
  filesLoading.value = true;
  const params: Record<string, string> = { page: String(currentPage.value), limit: '50' };
  if (selectedFolderId.value !== null) params.folderId = String(selectedFolderId.value);
  if (searchQuery.value) params.search = searchQuery.value;

  const result = await fetchFiles(params);
  if (result.success && result.body) {
    const data = result.body as unknown;
    files.value = data.docs || (Array.isArray(data) ? data : []);
    if (data.pagination) pagination.value = data.pagination;
  } else {
    files.value = [];
  }
  filesLoading.value = false;
}

async function loadCurrentSubfolders() {
  const result = await fetchFolders(selectedFolderId.value ?? undefined);
  if (result.success && result.body) {
    currentSubfolders.value = (Array.isArray(result.body) ? result.body : []) as DocumentFolder[];
  } else {
    currentSubfolders.value = [];
  }
}

function selectFolder(folderId: number | null) {
  selectedFolderId.value = folderId;
  currentPage.value = 1;
  buildBreadcrumbs(folderId);
  loadCurrentSubfolders();
  loadFiles();
}

function buildBreadcrumbs(folderId: number | null) {
  const crumbs: { id: number; name: string }[] = [];
  if (folderId === null) {
    breadcrumbs.value = crumbs;
    return;
  }

  let current = allFoldersList.value.find(f => f.id === folderId);
  while (current) {
    crumbs.unshift({ id: current.id, name: current.name });
    current = current.parentId ? allFoldersList.value.find(f => f.id === current!.parentId) : undefined;
  }
  breadcrumbs.value = crumbs;
}

function debounceSearch() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage.value = 1;
    loadFiles();
  }, 400);
}

// File upload
function triggerFileUpload() {
  fileInputRef.value?.click();
}

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const formData = new FormData();
  for (const file of input.files) {
    formData.append('files', file);
  }
  if (selectedFolderId.value !== null) {
    formData.append('folderId', String(selectedFolderId.value));
  }

  try {
    const baseUrl = config.public.API_BASE_URL || '';
    const response = await $fetch<<unknown>(`${baseUrl}documents/files/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (response?.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.created') });
      await loadFiles();
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: response?.message || 'Upload failed' });
    }
  } catch (err: unknown) {
    ElNotification({ type: 'error', title: t('common.error'), message: err?.message || 'Upload failed' });
  }

  // Reset so the same file can be uploaded again
  input.value = '';
}

// Folder CRUD
function editFolder(folder: DocumentFolder) {
  editingFolderId.value = folder.id;
  folderForm.name = folder.name;
  folderForm.parentId = folder.parentId;
  folderForm.color = folder.color || '#7849ff';
  showFolderDialog.value = true;
}

function resetFolderForm() {
  editingFolderId.value = null;
  folderForm.name = '';
  folderForm.parentId = null;
  folderForm.color = '#7849ff';
}

async function saveFolder() {
  const valid = await folderFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  folderSaving.value = true;
  try {
    const payload = {
      name: folderForm.name,
      parentId: folderForm.parentId ?? undefined,
      color: folderForm.color
    };

    const result = editingFolderId.value ? await updateFolder(editingFolderId.value, payload) : await createFolder(payload);

    if (result.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.created') });
      showFolderDialog.value = false;
      resetFolderForm();
      await loadFolderTree();
      await loadCurrentSubfolders();
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: result.message });
    }
  } finally {
    folderSaving.value = false;
  }
}

async function confirmDeleteFolder(folder: DocumentFolder) {
  const result = await deleteFolderApi(folder.id);
  if (result.success) {
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
    if (selectedFolderId.value === folder.id) {
      selectFolder(null);
    }
    await loadFolderTree();
    await loadCurrentSubfolders();
  } else {
    ElNotification({ type: 'error', title: t('common.error'), message: result.message });
  }
}

// File CRUD
function openFileDetail(file: DocumentFile) {
  selectedFile.value = file;
  fileForm.name = file.name;
  fileForm.tags = [...(file.tags || [])];
  fileForm.folderId = file.folderId;
  showFileDialog.value = true;
}

function resetFileForm() {
  selectedFile.value = null;
  fileForm.name = '';
  fileForm.tags = [];
  fileForm.folderId = null;
}

async function saveFile() {
  if (!selectedFile.value) return;

  fileSaving.value = true;
  try {
    const result = await updateFile(selectedFile.value.id, {
      name: fileForm.name,
      tags: fileForm.tags,
      folderId: fileForm.folderId ?? undefined
    });

    if (result.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.created') });
      showFileDialog.value = false;
      resetFileForm();
      await loadFiles();
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: result.message });
    }
  } finally {
    fileSaving.value = false;
  }
}

function confirmDeleteFile(id: number) {
  deleteTargetId.value = id;
  deletePopup.value = true;
}

async function executeDeleteFile() {
  if (!deleteTargetId.value) return;
  deleting.value = true;
  try {
    const result = await deleteFileApi(deleteTargetId.value);
    if (result.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
      deletePopup.value = false;
      deleteTargetId.value = null;
      await loadFiles();
    }
  } finally {
    deleting.value = false;
  }
}

async function handleDeleteFile(id: number) {
  const result = await deleteFileApi(id);
  if (result.success) {
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
    await loadFiles();
  }
}

function downloadFile(file: DocumentFile | null) {
  if (!file) return;
  const baseUrl = config.public.API_BASE_URL?.replace('/api/', '') || '';
  const url = `${baseUrl}/assets/${file.path}`;
  window.open(url, '_blank');
}

// Helpers
function getFileIcon(mimeType: string): string {
  if (!mimeType) return 'ph:file-bold';
  if (mimeType.startsWith('image/')) return 'ph:image-bold';
  if (mimeType === 'application/pdf') return 'ph:file-pdf-bold';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'ph:file-doc-bold';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'ph:file-xls-bold';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'ph:file-ppt-bold';
  if (mimeType.startsWith('video/')) return 'ph:file-video-bold';
  if (mimeType.startsWith('audio/')) return 'ph:file-audio-bold';
  if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('compressed')) return 'ph:file-zip-bold';
  if (mimeType.startsWith('text/')) return 'ph:file-text-bold';
  return 'ph:file-bold';
}

function getFileExtension(mimeType: string): string {
  if (!mimeType) return 'FILE';
  const map: Record<string, string> = {
    'image/png': 'PNG',
    'image/jpeg': 'JPG',
    'image/gif': 'GIF',
    'image/webp': 'WEBP',
    'application/pdf': 'PDF',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.ms-excel': 'XLS',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'text/csv': 'CSV',
    'text/plain': 'TXT',
    'application/vnd.ms-powerpoint': 'PPT',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX'
  };
  return map[mimeType] || mimeType.split('/').pop()?.toUpperCase() || 'FILE';
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 ' + t('documents.bytes');
  if (bytes < 1024) return bytes + ' ' + t('documents.bytes');
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' ' + t('documents.kb');
  return (bytes / (1024 * 1024)).toFixed(1) + ' ' + t('documents.mb');
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '---';
  return new Date(dateStr).toLocaleDateString();
}
</script>

<style scoped>
.folder-tree-item:hover {
  background: rgba(120, 73, 255, 0.05);
}

.active-folder {
  background: rgba(120, 73, 255, 0.1) !important;
}
</style>
