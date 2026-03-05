<template lang="pug">
div
  //- Header
  .flex.items-center.justify-between.mb-8
    .title.font-bold.text-2xl.mb-1.capitalize {{ $t('support.cannedTitle') }}
    el-button(size="large" type="primary" @click="openDialog()" class="!rounded-2xl")
      el-icon
        Plus
      span {{ $t('support.newResponse') }}

  .glass-card.py-8.animate-entrance
    //- Filters
    .px-6.flex.items-center.flex-wrap.gap-3.mb-6
      .input.table-search(class="w-full md:w-[250px]")
        el-input(size="large" style="height:50px" v-model="search" :placeholder="$t('support.searchResponses')" clearable @input="debounceLoad")
          template(#prefix)
            el-icon
              Search
      el-select(v-model="categoryFilter" clearable :placeholder="$t('support.allCategories')" @change="loadResponses" class="w-44" size="large")
        el-option(v-for="cat in uniqueCategories" :key="cat" :value="cat" :label="cat")

    //- Table
    .px-6
      el-table(:data="filteredResponses" v-loading="loading" style="width: 100%" stripe)
        el-table-column(:label="$t('support.colTitle')" min-width="200")
          template(#default="{ row }")
            span.font-bold {{ row.title }}
        el-table-column(:label="$t('support.colCategory')" width="160")
          template(#default="{ row }")
            el-tag(v-if="row.category" size="small" round) {{ row.category }}
            span.text-gray-400(v-else) --
        el-table-column(:label="$t('support.colPreview')" min-width="300")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-muted)") {{ row.body.substring(0, 120) }}{{ row.body.length > 120 ? '...' : '' }}
        el-table-column(:label="$t('support.colActions')" width="140" align="center")
          template(#default="{ row }")
            .flex.items-center.justify-center.gap-2
              el-button(size="small" text type="primary" @click.stop="openDialog(row)") {{ $t('support.editResponse') }}
              el-popconfirm(:title="$t('support.deleteResponseConfirm')" @confirm="handleDelete(row.id)")
                template(#reference)
                  el-button(size="small" text type="danger" @click.stop) {{ $t('support.deleteResponse') }}

  //- Add/Edit Dialog
  el-dialog(v-model="dialogVisible" :title="isEditing ? $t('support.editCannedResponse') : $t('support.newCannedResponse')" width="600px")
    el-form(ref="formRef" :model="form" label-position="top" size="large")
      el-form-item(:label="$t('support.responseTitle')" prop="title" :rules="[{ required: true, message: $t('support.responseTitleRequired') }]")
        el-input(v-model="form.title" :placeholder="$t('support.responseTitlePlaceholder')")

      el-form-item(:label="$t('support.colCategory')" prop="category")
        el-select(v-model="form.category" clearable filterable allow-create :placeholder="$t('support.allCategories')" class="w-full")
          el-option(v-for="cat in uniqueCategories" :key="cat" :value="cat" :label="cat")

      el-form-item(:label="$t('support.responseBody')" prop="body" :rules="[{ required: true, message: $t('support.responseBodyRequired') }]")
        el-input(v-model="form.body" type="textarea" :rows="8" :placeholder="$t('support.responseBodyPlaceholder')")

    template(#footer)
      el-button(@click="dialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleSave" :loading="saving") {{ isEditing ? $t('common.update') : $t('common.create') }}
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import { Plus, Search } from '@element-plus/icons-vue';
import { ElNotification } from 'element-plus';
import type { FormInstance } from 'element-plus';
import { fetchCannedResponses, createCannedResponse, updateCannedResponse, deleteCannedResponse } from '@/composables/useSupport';
import type { CannedResponse } from '@/composables/useSupport';

const { t } = useI18n();

const loading = ref(false);
const saving = ref(false);
const responses = ref<CannedResponse[]>([]);
const search = ref('');
const categoryFilter = ref('');
const dialogVisible = ref(false);
const isEditing = ref(false);
const editingId = ref('');
const formRef = ref<FormInstance>();

const form = reactive({
  title: '',
  body: '',
  category: ''
});

let debounceTimer: ReturnType<typeof setTimeout>;

function debounceLoad() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => loadResponses(), 400);
}

const uniqueCategories = computed(() => {
  const cats = new Set<string>();
  responses.value.forEach(r => {
    if (r.category) cats.add(r.category);
  });
  return Array.from(cats).sort();
});

const filteredResponses = computed(() => {
  let result = responses.value;
  if (categoryFilter.value) {
    result = result.filter(r => r.category === categoryFilter.value);
  }
  if (search.value) {
    const q = search.value.toLowerCase();
    result = result.filter(r => r.title.toLowerCase().includes(q) || r.body.toLowerCase().includes(q));
  }
  return result;
});

async function loadResponses() {
  loading.value = true;
  try {
    const { body, success } = await fetchCannedResponses();
    if (success && body) {
      responses.value = Array.isArray(body) ? body : [];
    }
  } finally {
    loading.value = false;
  }
}

function openDialog(item?: CannedResponse) {
  if (item) {
    isEditing.value = true;
    editingId.value = item.id;
    form.title = item.title;
    form.body = item.body;
    form.category = item.category || '';
  } else {
    isEditing.value = false;
    editingId.value = '';
    form.title = '';
    form.body = '';
    form.category = '';
  }
  dialogVisible.value = true;
}

async function handleSave() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  saving.value = true;
  try {
    const payload: Record<string, unknown> = {
      title: form.title,
      body: form.body,
      category: form.category || undefined
    };

    if (isEditing.value) {
      const { success } = await updateCannedResponse(editingId.value, payload);
      if (success) {
        ElNotification({ type: 'success', title: t('common.success'), message: t('support.responseUpdated') });
      }
    } else {
      const { success } = await createCannedResponse(payload);
      if (success) {
        ElNotification({ type: 'success', title: t('common.success'), message: t('support.responseCreated') });
      }
    }

    dialogVisible.value = false;
    await loadResponses();
  } finally {
    saving.value = false;
  }
}

async function handleDelete(id: string) {
  const { success } = await deleteCannedResponse(id);
  if (success) {
    ElNotification({ type: 'success', title: t('common.success'), message: t('support.responseDeleted') });
    await loadResponses();
  }
}

onMounted(() => {
  loadResponses();
});
</script>
