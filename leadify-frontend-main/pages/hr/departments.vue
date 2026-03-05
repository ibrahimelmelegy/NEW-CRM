<template lang="pug">
div
  //- Header
  .flex.items-center.justify-between.mb-6
    div
      h1.text-2xl.font-bold(style="color: var(--text-primary)") {{ $t('hr.departments.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('hr.departments.subtitle') }}
    el-button(type="primary" size="large" class="!rounded-2xl" @click="openAddDialog")
      Icon(name="ph:plus-bold" size="16" class="mr-1")
      span {{ $t('hr.departments.addDepartment') }}

  //- Loading
  .flex.justify-center.py-12(v-if="loading")
    el-skeleton(:rows="5" animated)

  //- Department List
  template(v-else)
    //- Tree View
    .glass-card.p-6.rounded-2xl.mb-6(v-if="flatTree.length")
      h3.font-semibold.mb-4(style="color: var(--text-primary)")
        Icon(name="ph:tree-structure-bold" size="20" class="mr-2")
        | {{ $t('hr.departments.hierarchy') }}
      .space-y-2
        .flex.items-center.gap-3.p-3.rounded-xl.transition-all(
          v-for="item in flatTree"
          :key="item.id"
          :style="{ paddingLeft: (item.level * 24 + 12) + 'px' }"
          class="hover:bg-gray-50 dark:hover:bg-gray-800"
        )
          Icon(name="ph:buildings-bold" size="18" style="color: #7849ff")
          .flex-1
            span.font-medium(style="color: var(--text-primary)") {{ item.name }}
            el-tag.ml-2(size="small" type="info") {{ item.code }}
            el-tag.ml-2(size="small" round :type="item.employeeCount > 0 ? 'success' : 'info'") {{ item.employeeCount || 0 }} {{ $t('hr.departments.employees') }}
          .flex.items-center.gap-2
            el-button(type="primary" size="small" circle @click.stop="openEditDialogById(item.id)")
              Icon(name="ph:pencil-bold" size="14")
            el-button(type="danger" size="small" circle @click.stop="confirmDeleteById(item.id)")
              Icon(name="ph:trash-bold" size="14")

    //- Flat Table
    .glass-card.rounded-2xl.overflow-hidden
      el-table(:data="departments" style="width: 100%")
        el-table-column(prop="name" :label="$t('hr.departments.name')" min-width="200")
          template(#default="{ row }")
            .flex.items-center.gap-2
              Icon(name="ph:buildings-bold" size="18" style="color: #7849ff")
              span.font-semibold(style="color: var(--text-primary)") {{ row.name }}

        el-table-column(prop="code" :label="$t('hr.departments.code')" width="120")
          template(#default="{ row }")
            el-tag(size="small" type="info") {{ row.code }}

        el-table-column(:label="$t('hr.departments.parent')" width="160")
          template(#default="{ row }")
            span(style="color: var(--text-primary)") {{ row.parent?.name || '---' }}

        el-table-column(:label="$t('hr.departments.employees')" width="120" align="center")
          template(#default="{ row }")
            el-tag(round size="small" :type="row.employeeCount > 0 ? 'success' : 'info'") {{ row.employeeCount || 0 }}

        el-table-column(:label="$t('hr.departments.description')" min-width="200")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-muted)") {{ row.description || '---' }}

        el-table-column(:label="$t('hr.departments.actions')" width="120" align="center")
          template(#default="{ row }")
            .flex.items-center.justify-center.gap-2
              el-button(type="primary" size="small" circle @click.stop="openEditDialog(row)")
                Icon(name="ph:pencil-bold" size="14")
              el-button(type="danger" size="small" circle @click.stop="confirmDelete(row)")
                Icon(name="ph:trash-bold" size="14")

  //- Add/Edit Dialog
  el-dialog(v-model="dialogVisible" :title="isEditing ? $t('hr.departments.editDepartment') : $t('hr.departments.addDepartment')" width="500px")
    el-form(ref="formRef" :model="form" :rules="rules" label-position="top" size="large")
      el-form-item(:label="$t('hr.departments.name')" prop="name")
        el-input(v-model="form.name" :placeholder="$t('hr.departments.namePlaceholder')")

      el-form-item(:label="$t('hr.departments.code')" prop="code")
        el-input(v-model="form.code" :placeholder="$t('hr.departments.codePlaceholder')")

      el-form-item(:label="$t('hr.departments.parentDepartment')")
        el-select(v-model="form.parentId" class="w-full" :placeholder="$t('hr.departments.parentNone')" clearable)
          el-option(
            v-for="dept in availableParents"
            :key="dept.id"
            :label="dept.name"
            :value="dept.id"
          )

      el-form-item(:label="$t('hr.departments.description')")
        el-input(v-model="form.description" type="textarea" :rows="3" :placeholder="$t('hr.departments.descriptionPlaceholder')")

    template(#footer)
      el-button(@click="dialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="handleSave" class="!rounded-2xl") {{ isEditing ? $t('common.update') : $t('common.create') }}

  //- Delete Confirm
  el-dialog(v-model="deleteDialogVisible" :title="$t('hr.departments.deleteDepartment')" width="400px")
    p(style="color: var(--text-primary)") {{ $t('hr.departments.confirmDelete', { name: deletingDept?.name }) }}
    p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('hr.departments.deleteWarning') }}
    template(#footer)
      el-button(@click="deleteDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="danger" :loading="deleting" @click="handleDelete" class="!rounded-2xl") {{ $t('common.delete') }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import {
  fetchDepartments,
  fetchDepartmentTree,
  createDepartment,
  updateDepartment,
  deleteDepartment as deleteDepartmentApi
} from '~/composables/useEmployees';
import type { DepartmentItem } from '~/composables/useEmployees';

definePageMeta({ middleware: 'permissions' });

const { t } = useI18n();
const loading = ref(true);
const saving = ref(false);
const deleting = ref(false);
const dialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const isEditing = ref(false);
const editingId = ref('');
const deletingDept = ref<DepartmentItem | null>(null);
const formRef = ref();

const departments = ref<DepartmentItem[]>([]);
const departmentTree = ref<DepartmentItem[]>([]);

interface FlatTreeItem {
  id: string;
  name: string;
  code: string;
  level: number;
  employeeCount: number;
}

const flatTree = computed<FlatTreeItem[]>(() => {
  const result: FlatTreeItem[] = [];
  function flatten(nodes: DepartmentItem[], level: number) {
    for (const node of nodes) {
      result.push({
        id: node.id,
        name: node.name,
        code: node.code,
        level,
        employeeCount: node.employeeCount || 0
      });
      if (node.children && node.children.length) {
        flatten(node.children, level + 1);
      }
    }
  }
  flatten(departmentTree.value, 0);
  return result;
});

const form = reactive({
  name: '',
  code: '',
  parentId: '',
  description: ''
});

const rules = {
  name: [{ required: true, message: () => t('hr.departments.nameRequired'), trigger: 'blur' }],
  code: [{ required: true, message: () => t('hr.departments.codeRequired'), trigger: 'blur' }]
};

const availableParents = computed(() => {
  if (!isEditing.value) return departments.value;
  return departments.value.filter(d => d.id !== editingId.value);
});

function openAddDialog() {
  isEditing.value = false;
  editingId.value = '';
  form.name = '';
  form.code = '';
  form.parentId = '';
  form.description = '';
  dialogVisible.value = true;
}

function openEditDialog(dept: DepartmentItem) {
  isEditing.value = true;
  editingId.value = dept.id;
  form.name = dept.name;
  form.code = dept.code;
  form.parentId = dept.parentId || '';
  form.description = dept.description || '';
  dialogVisible.value = true;
}

function openEditDialogById(id: string) {
  const dept = departments.value.find(d => d.id === id);
  if (dept) openEditDialog(dept);
}

function confirmDelete(dept: DepartmentItem) {
  deletingDept.value = dept;
  deleteDialogVisible.value = true;
}

function confirmDeleteById(id: string) {
  const dept = departments.value.find(d => d.id === id);
  if (dept) confirmDelete(dept);
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  saving.value = true;
  try {
    const payload: Record<string, unknown> = {
      name: form.name,
      code: form.code,
      description: form.description || undefined
    };
    if (form.parentId) payload.parentId = form.parentId;

    let res;
    if (isEditing.value) {
      res = await updateDepartment(editingId.value, payload);
    } else {
      res = await createDepartment(payload);
    }

    if (res.success) {
      ElNotification({
        type: 'success',
        title: t('common.success'),
        message: isEditing.value ? t('hr.departments.updated') : t('hr.departments.created')
      });
      dialogVisible.value = false;
      await loadData();
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: res.message });
    }
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  if (!deletingDept.value) return;
  deleting.value = true;
  try {
    const res = await deleteDepartmentApi(deletingDept.value.id);
    if (res.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('hr.departments.deleted') });
      deleteDialogVisible.value = false;
      await loadData();
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: res.message });
    }
  } finally {
    deleting.value = false;
  }
}

async function loadData() {
  loading.value = true;
  try {
    departments.value = await fetchDepartments();
    departmentTree.value = await fetchDepartmentTree();
  } finally {
    loading.value = false;
  }
}

// Initial load
await loadData();
</script>
