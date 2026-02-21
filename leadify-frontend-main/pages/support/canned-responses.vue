<template lang="pug">
div
  //- Header
  .flex.items-center.justify-between.mb-8
    .title.font-bold.text-2xl.mb-1.capitalize Canned Responses
    el-button(size="large" type="primary" @click="openDialog()" class="!rounded-2xl")
      el-icon
        Plus
      span New Response

  .glass-card.py-8.animate-entrance
    //- Filters
    .px-6.flex.items-center.flex-wrap.gap-3.mb-6
      .input.table-search(class="w-full md:w-[250px]")
        el-input(size="large" style="height:50px" v-model="search" placeholder="Search responses..." clearable @input="debounceLoad")
          template(#prefix)
            el-icon
              Search
      el-select(v-model="categoryFilter" clearable placeholder="All Categories" @change="loadResponses" class="w-44" size="large")
        el-option(v-for="cat in uniqueCategories" :key="cat" :value="cat" :label="cat")

    //- Table
    .px-6
      el-table(:data="filteredResponses" v-loading="loading" style="width: 100%" stripe)
        el-table-column(label="Title" min-width="200")
          template(#default="{ row }")
            span.font-bold {{ row.title }}
        el-table-column(label="Category" width="160")
          template(#default="{ row }")
            el-tag(v-if="row.category" size="small" round) {{ row.category }}
            span.text-gray-400(v-else) --
        el-table-column(label="Preview" min-width="300")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-muted)") {{ row.body.substring(0, 120) }}{{ row.body.length > 120 ? '...' : '' }}
        el-table-column(label="Actions" width="140" align="center")
          template(#default="{ row }")
            .flex.items-center.justify-center.gap-2
              el-button(size="small" text type="primary" @click.stop="openDialog(row)") Edit
              el-popconfirm(title="Delete this response?" @confirm="handleDelete(row.id)")
                template(#reference)
                  el-button(size="small" text type="danger" @click.stop) Delete

  //- Add/Edit Dialog
  el-dialog(v-model="dialogVisible" :title="isEditing ? 'Edit Canned Response' : 'New Canned Response'" width="600px")
    el-form(ref="formRef" :model="form" label-position="top" size="large")
      el-form-item(label="Title" prop="title" :rules="[{ required: true, message: 'Title is required' }]")
        el-input(v-model="form.title" placeholder="e.g. Greeting, Closing, Follow-up")

      el-form-item(label="Category" prop="category")
        el-select(v-model="form.category" clearable filterable allow-create placeholder="Select or create category" class="w-full")
          el-option(v-for="cat in uniqueCategories" :key="cat" :value="cat" :label="cat")

      el-form-item(label="Body" prop="body" :rules="[{ required: true, message: 'Body is required' }]")
        el-input(v-model="form.body" type="textarea" :rows="8" placeholder="Write the canned response body here. You can use placeholders like {{clientName}}, {{ticketNumber}}...")

    template(#footer)
      el-button(@click="dialogVisible = false") Cancel
      el-button(type="primary" @click="handleSave" :loading="saving") {{ isEditing ? 'Update' : 'Create' }}
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import { Plus, Search } from '@element-plus/icons-vue';
import { ElNotification } from 'element-plus';
import type { FormInstance } from 'element-plus';
import { fetchCannedResponses, createCannedResponse, updateCannedResponse, deleteCannedResponse } from '@/composables/useSupport';
import type { CannedResponse } from '@/composables/useSupport';

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
    const payload: Record<string, any> = {
      title: form.title,
      body: form.body,
      category: form.category || undefined
    };

    if (isEditing.value) {
      const { success } = await updateCannedResponse(editingId.value, payload);
      if (success) {
        ElNotification({ type: 'success', title: 'Updated', message: 'Canned response updated' });
      }
    } else {
      const { success } = await createCannedResponse(payload);
      if (success) {
        ElNotification({ type: 'success', title: 'Created', message: 'Canned response created' });
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
    ElNotification({ type: 'success', title: 'Deleted', message: 'Canned response deleted' });
    await loadResponses();
  }
}

onMounted(() => {
  loadResponses();
});
</script>
