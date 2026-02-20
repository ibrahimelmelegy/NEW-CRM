<template lang="pug">
div
  ModuleHeader(
    :title="$t('documentTemplates.title')"
    :subtitle="$t('documentTemplates.subtitle')"
  )
    template(#actions)
      el-button(size="large" @click="handleSeedDefaults" :loading="seeding" class="!rounded-2xl")
        Icon(name="ph:database-bold" size="16" class="mr-1")
        span {{ $t('documentTemplates.seedDefaults') }}
      NuxtLink(to="/settings/document-templates/pro-builder")
        el-button(size="large" class="!rounded-2xl")
          Icon(name="ph:pen-nib-bold" size="16" class="mr-1")
          span {{ $t('documentTemplates.proBuilder.title') || 'Pro Builder' }}
      NuxtLink(to="/settings/document-templates/builder")
        el-button(size="large" type="primary" class="!rounded-2xl")
          Icon(name="ph:plus-bold" size="16" class="mr-1")
          span {{ $t('documentTemplates.createTemplate') }}

  StatCards(:stats="summaryStats")

  .glass-card.py-8.animate-entrance
    .px-6.flex.items-center.flex-wrap.gap-3.mb-6.justify-start
      el-radio-group(v-model="typeFilter" @change="loadTemplates" size="large")
        el-radio-button(value="") {{ $t('common.all') }}
        el-radio-button(value="INVOICE") {{ $t('documentTemplates.invoice') }}
        el-radio-button(value="PURCHASE_ORDER") {{ $t('documentTemplates.purchaseOrder') }}
      .input.table-search(class="w-full md:w-[250px]")
        el-input(size="large" style="height:50px" v-model="searchKey" :placeholder="$t('common.search') + ' ' + $t('documentTemplates.title')" clearable @input="debouncedSearch")
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="16")

    //- Template grid
    .px-6(v-loading="loading")
      .grid.gap-6(v-if="templates.length" class="grid-cols-1 md:grid-cols-2 lg:grid-cols-3")
        .glass-card.p-5.cursor-pointer.transition-all(
          v-for="tpl in templates"
          :key="tpl.id"
          style="border: 1px solid var(--border-default)"
          @click="editTemplate(tpl.id)"
        )
          .flex.items-start.justify-between.mb-3
            div
              .font-bold.text-lg(style="color: var(--text-primary)") {{ tpl.name }}
              .flex.items-center.gap-2.mt-1
                el-tag(size="small" effect="dark" round :class="tpl.type === 'INVOICE' ? '!bg-purple-500/20 !text-white !border-purple-500/30' : '!bg-orange-500/20 !text-white !border-orange-500/30'") {{ tpl.type === 'INVOICE' ? $t('documentTemplates.invoice') : $t('documentTemplates.purchaseOrder') }}
                el-tag(v-if="tpl.isDefault" size="small" effect="plain" round) {{ $t('documentTemplates.default') }}
            .flex.items-center(@click.stop)
              el-dropdown(trigger="click")
                span.el-dropdown-link
                  .toggle-icon.text-md: Icon(name="IconToggle" size="22")
                template(#dropdown)
                  el-dropdown-menu
                    el-dropdown-item(@click="editTemplate(tpl.id)")
                      .flex.items-center
                        Icon.text-md.mr-2(name="IconEdit")
                        p.text-sm {{ $t('common.edit') }}
                    el-dropdown-item(@click="handleClone(tpl.id)")
                      .flex.items-center
                        Icon.text-md.mr-2(name="ph:copy-bold")
                        p.text-sm {{ $t('documentTemplates.clone') }}
                    el-dropdown-item(@click="[deleteId = tpl.id, deletePopup = true]")
                      .flex.items-center
                        Icon.text-md.mr-2(name="IconDelete")
                        p.text-sm {{ $t('common.delete') }}

          //- Mini preview
          .rounded-lg.mb-3.flex.items-center.justify-center.overflow-hidden(
            style="height: 180px; background: var(--bg-input); border: 1px solid var(--border-default)"
          )
            .relative(style="width: 120px; height: 170px; background: white; border-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.1)")
              template(v-for="el in (tpl.layout?.elements || []).slice(0, 6)" :key="el.id")
                .absolute(
                  v-if="el.type === 'shape'"
                  :style="miniElementStyle(el, tpl.layout)"
                )
                .absolute.text-xs.truncate(
                  v-else-if="el.type === 'text'"
                  :style="{ ...miniElementStyle(el, tpl.layout), fontSize: '3px', color: el.props?.color || '#333' }"
                ) {{ el.props?.content?.replace(/\{\{.*?\}\}/g, '---') }}
                .absolute(
                  v-else-if="el.type === 'line'"
                  :style="{ ...miniElementStyle(el, tpl.layout), borderTop: `1px solid ${el.props?.color || '#ccc'}` }"
                )
                .absolute(
                  v-else
                  :style="{ ...miniElementStyle(el, tpl.layout), background: '#f0f0f0', borderRadius: '1px' }"
                )

          .flex.items-center.justify-between
            span.text-xs(style="color: var(--text-muted)") {{ formatDate(tpl.createdAt) }}
            span.text-xs(style="color: var(--text-muted)") {{ tpl.layout?.elements?.length || 0 }} {{ $t('documentTemplates.elements') }}

      //- Empty state
      .text-center.py-16(v-if="!templates.length && !loading")
        Icon(name="ph:file-doc-bold" size="64" style="color: var(--text-muted)")
        p.mt-4.text-lg.font-medium(style="color: var(--text-primary)") {{ $t('documentTemplates.noTemplates') }}
        p.mt-1.text-sm(style="color: var(--text-muted)") {{ $t('documentTemplates.noTemplatesHint') }}
        .flex.justify-center.gap-3.mt-6
          el-button(@click="handleSeedDefaults" :loading="seeding" class="!rounded-2xl") {{ $t('documentTemplates.seedDefaults') }}
          NuxtLink(to="/settings/document-templates/builder")
            el-button(type="primary" class="!rounded-2xl") {{ $t('documentTemplates.createTemplate') }}

    //- Pagination
    .pagination.mt-5.flex.items-center.flex-wrap.gap-2.px-6(class="sm:justify-between justify-center" v-if="pagination.totalPages > 1")
      span.text-xs(style="color: var(--text-muted)") {{ pagination.totalItems }} {{ $t('common.entries') }}
      el-pagination(background style="direction:ltr" :pager-count="4" v-model:current-page="pagination.page" :page-size="pagination.limit" layout="prev, pager, next" :total="pagination.totalItems" @current-change="handlePageChange")

  ActionModel(v-model="deletePopup" :loading="deleting" :description="$t('common.confirmDelete')" @confirm="confirmDelete")
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import type { DocumentTemplate } from '~/composables/useDocumentTemplates';
import {
  fetchDocumentTemplates, deleteDocumentTemplate, cloneDocumentTemplate, seedDefaultTemplates
} from '~/composables/useDocumentTemplates';

definePageMeta({
  middleware: 'permissions',
  permission: 'VIEW_DOCUMENT_TEMPLATES'
});

const { $i18n } = useNuxtApp();
const t = $i18n.t;
const router = useRouter();

const templates = ref<DocumentTemplate[]>([]);
const loading = ref(true);
const seeding = ref(false);
const deleting = ref(false);
const typeFilter = ref('');
const searchKey = ref('');
const deletePopup = ref(false);
const deleteId = ref<string | null>(null);
const pagination = ref({ totalItems: 0, page: 1, limit: 12, totalPages: 0 });

const summaryStats = computed(() => {
  const all = templates.value;
  const invoices = all.filter(t => t.type === 'INVOICE').length;
  const pos = all.filter(t => t.type === 'PURCHASE_ORDER').length;
  return [
    { label: t('documentTemplates.allTemplates') || 'All Templates', value: pagination.value.totalItems || all.length, icon: 'ph:file-doc-bold', color: '#7849ff' },
    { label: t('documentTemplates.invoice'), value: invoices, icon: 'ph:receipt-bold', color: '#3b82f6' },
    { label: t('documentTemplates.purchaseOrder'), value: pos, icon: 'ph:shopping-cart-bold', color: '#f59e0b' }
  ];
});

let searchTimeout: ReturnType<typeof setTimeout>;

onMounted(async () => {
  await loadTemplates();
});

async function loadTemplates() {
  loading.value = true;
  try {
    const query: Record<string, any> = { page: pagination.value.page, limit: pagination.value.limit };
    if (typeFilter.value) query.type = typeFilter.value;
    if (searchKey.value) query.searchKey = searchKey.value;
    const result = await fetchDocumentTemplates(query);
    templates.value = result.docs;
    pagination.value = { ...pagination.value, ...result.pagination };
  } finally { loading.value = false; }
}

function debouncedSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1;
    loadTemplates();
  }, 400);
}

function handlePageChange(page: number) {
  pagination.value.page = page;
  loadTemplates();
}

function editTemplate(id: string) {
  router.push(`/settings/document-templates/builder?id=${id}`);
}

async function handleClone(id: string) {
  const { success } = await cloneDocumentTemplate(id);
  if (success) {
    ElNotification({ type: 'success', title: t('common.success'), message: t('documentTemplates.cloned') || 'Template cloned' });
    await loadTemplates();
  }
}

async function confirmDelete() {
  if (!deleteId.value) return;
  deleting.value = true;
  try {
    const { success } = await deleteDocumentTemplate(deleteId.value);
    if (success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
      await loadTemplates();
    }
  } finally {
    deleting.value = false;
    deletePopup.value = false;
  }
}

async function handleSeedDefaults() {
  seeding.value = true;
  try {
    const { success } = await seedDefaultTemplates();
    if (success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('documentTemplates.seeded') || 'Default templates seeded' });
      await loadTemplates();
    }
  } finally { seeding.value = false; }
}

function miniElementStyle(el: any, layout: any) {
  const scaleX = 120 / 210;
  const scaleY = 170 / 297;
  return {
    left: `${el.x * scaleX}px`,
    top: `${el.y * scaleY}px`,
    width: `${el.width * scaleX}px`,
    height: `${el.height * scaleY}px`,
    background: el.props?.fill || 'transparent',
    borderRadius: el.props?.borderRadius ? `${el.props.borderRadius * scaleX}px` : undefined
  };
}

function formatDate(d?: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString();
}
</script>
