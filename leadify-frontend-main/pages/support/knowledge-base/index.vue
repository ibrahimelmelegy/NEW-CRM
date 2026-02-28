<template lang="pug">
div
  ModuleHeader(
    :title="$t('knowledgeBase.title')"
    :subtitle="$t('knowledgeBase.subtitle')"
  )
    template(#actions)
      ExportButton(:data="articles" :columns="exportColumns" :filename="'knowledge-base-export'" :title="$t('knowledgeBase.title')")
      el-button(type="primary" size="large" @click="showEditor = true" class="!rounded-2xl")
        Icon(name="ph:plus-bold" size="14" aria-label="Create")
        span.ml-1 {{ $t('knowledgeBase.createArticle') }}

  StatCards(:stats="summaryStats")

  .glass-card.py-8.animate-entrance
    .px-6.flex.items-center.flex-wrap.gap-2.mb-6.justify-start
      .input.table-search(class="w-full md:w-[250px]")
        el-input(size="large" style="height:50px" v-model="search" :placeholder="$t('common.search') + ' ' + $t('knowledgeBase.title')" clearable @input="debounceLoad")
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="16" aria-hidden="true")
      el-select(v-model="categoryFilter" clearable :placeholder="$t('knowledgeBase.allCategories')" @change="loadArticles" class="w-44" size="large")
        el-option(v-for="cat in categories" :key="cat" :value="cat" :label="cat")
      el-select(v-model="statusFilter" clearable :placeholder="$t('knowledgeBase.allStatuses')" @change="loadArticles" class="w-44" size="large")
        el-option(value="DRAFT" :label="$t('knowledgeBase.draft')")
        el-option(value="PUBLISHED" :label="$t('knowledgeBase.published')")
        el-option(value="ARCHIVED" :label="$t('knowledgeBase.archived')")

    el-table(:data="articles" v-loading="loading" style="width: 100%")
      el-table-column(type="index" width="50")
      el-table-column(:label="$t('knowledgeBase.articleTitle')" min-width="280")
        template(#default="{ row }")
          .flex.flex-col
            span.font-bold(style="color: var(--text-primary)") {{ row.title }}
            span.text-xs(style="color: var(--text-muted)") {{ row.excerpt || '' }}
      el-table-column(:label="$t('knowledgeBase.category')" width="140")
        template(#default="{ row }")
          el-tag(v-if="row.category" size="small" effect="dark" round class="!border-purple-500/30 !text-white !bg-purple-500/20") {{ row.category }}
          span(v-else) —
      el-table-column(:label="$t('knowledgeBase.status')" width="130" align="center")
        template(#default="{ row }")
          span.border.rounded-xl.text-xs.px-2(:class="statusLabelClass(row.status)") {{ row.status }}
      el-table-column(:label="$t('knowledgeBase.views')" width="80" align="center")
        template(#default="{ row }")
          span {{ row.viewCount || 0 }}
      el-table-column(:label="$t('knowledgeBase.author')" width="140")
        template(#default="{ row }")
          span {{ row.author?.name || '—' }}
      el-table-column(:label="$t('common.action')" width="120" fixed="right")
        template(#default="{ row }")
          .flex.items-center(@click.stop)
            el-dropdown(trigger="click")
              span.el-dropdown-link
                .toggle-icon.text-md: Icon(name="IconToggle" size="22")
              template(#dropdown)
                el-dropdown-menu
                  el-dropdown-item(@click="viewArticle(row)")
                    .flex.items-center
                      Icon.text-md.mr-2(name="IconEye")
                      p.text-sm {{ $t('common.view') }}
                  el-dropdown-item(@click="editArticle(row)")
                    .flex.items-center
                      Icon.text-md.mr-2(name="IconEdit")
                      p.text-sm {{ $t('common.edit') }}
                  el-dropdown-item(@click="[deleteId = row.id, deletePopup = true]")
                    .flex.items-center
                      Icon.text-md.mr-2(name="IconDelete")
                      p.text-sm {{ $t('common.delete') }}
      template(#empty)
        el-empty(:description="$t('common.noData')" image="/images/empty.png")

    .pagination.mt-5.flex.items-center.flex-wrap.gap-2.px-6(class="sm:justify-between justify-center" v-if="pagination.totalPages > 1")
      span.text-xs(style="color: var(--text-muted)") {{ pagination.totalItems }} {{ $t('common.entries') }}
      el-pagination(background style="direction:ltr" :pager-count="4" v-model:current-page="currentPage" :page-size="20" layout="prev, pager, next" :total="pagination.totalItems" @current-change="loadArticles")

  //- Article Editor Dialog
  el-dialog(v-model="showEditor" :title="editingId ? $t('knowledgeBase.editArticle') : $t('knowledgeBase.createArticle')" width="800px" @close="resetEditor")
    el-form(ref="formRef" :model="form" :rules="rules" label-position="top" size="large")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('knowledgeBase.articleTitle')" prop="title" class="col-span-2")
          el-input(v-model="form.title" :placeholder="$t('knowledgeBase.titlePlaceholder')")
        el-form-item(:label="$t('knowledgeBase.category')")
          el-select(v-model="form.category" allow-create filterable clearable :placeholder="$t('knowledgeBase.selectCategory')" class="w-full")
            el-option(v-for="cat in categories" :key="cat" :value="cat" :label="cat")
        el-form-item(:label="$t('knowledgeBase.status')")
          el-select(v-model="form.status" class="w-full")
            el-option(value="DRAFT" :label="$t('knowledgeBase.draft')")
            el-option(value="PUBLISHED" :label="$t('knowledgeBase.published')")
            el-option(value="ARCHIVED" :label="$t('knowledgeBase.archived')")
      el-form-item(:label="$t('knowledgeBase.excerpt')")
        el-input(v-model="form.excerpt" type="textarea" :rows="2" :placeholder="$t('knowledgeBase.excerptPlaceholder')")
      el-form-item(:label="$t('knowledgeBase.content')" prop="content")
        el-input(v-model="form.content" type="textarea" :rows="12" :placeholder="$t('knowledgeBase.contentPlaceholder')")
      el-form-item(:label="$t('knowledgeBase.tags')")
        el-select(v-model="form.tags" multiple allow-create filterable :placeholder="$t('knowledgeBase.addTags')" class="w-full")

    template(#footer)
      el-button(@click="showEditor = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="saveArticle" class="!rounded-2xl") {{ $t('common.save') }}

  //- View Article Dialog
  el-dialog(v-model="showViewer" :title="viewingArticle?.title || ''" width="800px")
    .space-y-4(v-if="viewingArticle")
      .flex.items-center.gap-3
        el-tag(v-if="viewingArticle.category" size="small" effect="dark" round class="!border-purple-500/30 !text-white !bg-purple-500/20") {{ viewingArticle.category }}
        span.border.rounded-xl.text-xs.px-2(:class="statusLabelClass(viewingArticle.status)") {{ viewingArticle.status }}
      p(v-if="viewingArticle.excerpt" style="color: var(--text-muted)") {{ viewingArticle.excerpt }}
      .whitespace-pre-wrap(style="color: var(--text-primary)") {{ viewingArticle.content }}
      .flex.items-center.gap-2(v-if="viewingArticle.tags?.length")
        el-tag(v-for="tag in viewingArticle.tags" :key="tag" size="small" effect="plain") {{ tag }}

  ActionModel(v-model="deletePopup" :loading="deleting" :description="$t('common.confirmDelete')" @confirm="confirmDelete")
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import type { KBArticle } from '~/composables/useKnowledgeBase';
import { fetchKBArticles, createKBArticle, updateKBArticle, deleteKBArticle, fetchKBCategories } from '~/composables/useKnowledgeBase';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

// Export columns
const exportColumns = [
  { prop: 'title', label: t('knowledgeBase.articleTitle') },
  { prop: 'category', label: t('knowledgeBase.category') },
  { prop: 'status', label: t('knowledgeBase.status') },
  { prop: 'viewCount', label: t('knowledgeBase.views') }
];

const articles = ref<KBArticle[]>([]);
const categories = ref<string[]>([]);
const loading = ref(true);
const saving = ref(false);
const deleting = ref(false);
const search = ref('');
const categoryFilter = ref('');
const statusFilter = ref('');
const currentPage = ref(1);
const pagination = ref({ page: 1, limit: 20, totalItems: 0, totalPages: 0 });
const showEditor = ref(false);
const showViewer = ref(false);
const editingId = ref<string | null>(null);
const deletePopup = ref(false);
const deleteId = ref<string | null>(null);
const viewingArticle = ref<KBArticle | null>(null);
const formRef = ref();

let debounceTimer: ReturnType<typeof setTimeout>;

const form = reactive({
  title: '',
  content: '',
  excerpt: '',
  category: '',
  status: 'DRAFT' as KBArticle['status'],
  tags: [] as string[]
});

const rules = {
  title: [{ required: true, message: () => t('knowledgeBase.titleRequired'), trigger: 'blur' }],
  content: [{ required: true, message: () => t('knowledgeBase.contentRequired'), trigger: 'blur' }]
};

const summaryStats = computed(() => {
  const total = pagination.value.totalItems;
  const published = articles.value.filter(a => a.status === 'PUBLISHED').length;
  const drafts = articles.value.filter(a => a.status === 'DRAFT').length;
  const totalViews = articles.value.reduce((sum, a) => sum + (a.viewCount || 0), 0);
  return [
    { label: t('knowledgeBase.totalArticles'), value: total, icon: 'ph:article-bold', color: '#7849ff' },
    { label: t('knowledgeBase.published'), value: published, icon: 'ph:check-circle-bold', color: '#22c55e' },
    { label: t('knowledgeBase.draft'), value: drafts, icon: 'ph:pencil-line-bold', color: '#f59e0b' },
    { label: t('knowledgeBase.totalViews'), value: totalViews, icon: 'ph:eye-bold', color: '#3b82f6' }
  ];
});

onMounted(async () => {
  await Promise.all([loadArticles(), loadCategories()]);
});

async function loadArticles() {
  loading.value = true;
  try {
    const params: Record<string, string> = { page: String(currentPage.value), limit: '20' };
    if (search.value) params.search = search.value;
    if (categoryFilter.value) params.category = categoryFilter.value;
    if (statusFilter.value) params.status = statusFilter.value;

    const result = await fetchKBArticles(params);
    articles.value = result.docs;
    pagination.value = result.pagination;
  } finally {
    loading.value = false;
  }
}

async function loadCategories() {
  categories.value = await fetchKBCategories();
}

function debounceLoad() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage.value = 1;
    loadArticles();
  }, 400);
}

function viewArticle(article: KBArticle) {
  viewingArticle.value = article;
  showViewer.value = true;
}

function editArticle(article: KBArticle) {
  editingId.value = article.id;
  form.title = article.title;
  form.content = article.content;
  form.excerpt = article.excerpt || '';
  form.category = article.category || '';
  form.status = article.status;
  form.tags = article.tags || [];
  showEditor.value = true;
}

function resetEditor() {
  editingId.value = null;
  form.title = '';
  form.content = '';
  form.excerpt = '';
  form.category = '';
  form.status = 'DRAFT';
  form.tags = [];
}

async function saveArticle() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  saving.value = true;
  try {
    const payload = { ...form };
    const result = editingId.value ? await updateKBArticle(editingId.value, payload) : await createKBArticle(payload);

    if (result.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
      showEditor.value = false;
      resetEditor();
      await Promise.all([loadArticles(), loadCategories()]);
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: result.message });
    }
  } finally {
    saving.value = false;
  }
}

async function confirmDelete() {
  if (!deleteId.value) return;
  deleting.value = true;
  try {
    const result = await deleteKBArticle(deleteId.value);
    if (result.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
      await loadArticles();
    }
  } finally {
    deleting.value = false;
    deletePopup.value = false;
  }
}

function statusLabelClass(status: string): string {
  const map: Record<string, string> = {
    PUBLISHED: 'label-outline-green',
    DRAFT: 'label-outline-gray',
    ARCHIVED: 'label-outline-orange'
  };
  return map[status] || 'label-outline-gray';
}
</script>
