<template lang="pug">
div
  //- Header
  .flex.items-center.justify-between.mb-6
    div
      h1.text-2xl.font-bold(style="color: var(--text-primary)") Departments
      p.text-sm.mt-1(style="color: var(--text-muted)") Manage your organization's departments
    el-button(type="primary" size="large" class="!rounded-2xl" @click="openAddDialog")
      Icon(name="ph:plus-bold" size="16" class="mr-1")
      span Add Department

  //- Loading
  .flex.justify-center.py-12(v-if="loading")
    el-skeleton(:rows="5" animated)

  //- Department List
  template(v-else)
    //- Tree View
    .glass-card.p-6.rounded-2xl.mb-6(v-if="flatTree.length")
      h3.font-semibold.mb-4(style="color: var(--text-primary)")
        Icon(name="ph:tree-structure-bold" size="20" class="mr-2")
        | Department Hierarchy
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
            el-tag.ml-2(size="small" round :type="item.employeeCount > 0 ? 'success' : 'info'") {{ item.employeeCount || 0 }} employees
          .flex.items-center.gap-2
            el-button(type="primary" size="small" circle @click.stop="openEditDialogById(item.id)")
              Icon(name="ph:pencil-bold" size="14")
            el-button(type="danger" size="small" circle @click.stop="confirmDeleteById(item.id)")
              Icon(name="ph:trash-bold" size="14")

    //- Flat Table
    .glass-card.rounded-2xl.overflow-hidden
      el-table(:data="departments" style="width: 100%")
        el-table-column(prop="name" label="Department Name" min-width="200")
          template(#default="{ row }")
            .flex.items-center.gap-2
              Icon(name="ph:buildings-bold" size="18" style="color: #7849ff")
              span.font-semibold(style="color: var(--text-primary)") {{ row.name }}

        el-table-column(prop="code" label="Code" width="120")
          template(#default="{ row }")
            el-tag(size="small" type="info") {{ row.code }}

        el-table-column(label="Parent" width="160")
          template(#default="{ row }")
            span(style="color: var(--text-primary)") {{ row.parent?.name || '---' }}

        el-table-column(label="Employees" width="120" align="center")
          template(#default="{ row }")
            el-tag(round size="small" :type="row.employeeCount > 0 ? 'success' : 'info'") {{ row.employeeCount || 0 }}

        el-table-column(label="Description" min-width="200")
          template(#default="{ row }")
            span.text-sm(style="color: var(--text-muted)") {{ row.description || '---' }}

        el-table-column(label="Actions" width="120" align="center")
          template(#default="{ row }")
            .flex.items-center.justify-center.gap-2
              el-button(type="primary" size="small" circle @click.stop="openEditDialog(row)")
                Icon(name="ph:pencil-bold" size="14")
              el-button(type="danger" size="small" circle @click.stop="confirmDelete(row)")
                Icon(name="ph:trash-bold" size="14")

  //- Add/Edit Dialog
  el-dialog(v-model="dialogVisible" :title="isEditing ? 'Edit Department' : 'Add Department'" width="500px")
    el-form(ref="formRef" :model="form" :rules="rules" label-position="top" size="large")
      el-form-item(label="Department Name" prop="name")
        el-input(v-model="form.name" placeholder="Enter department name")

      el-form-item(label="Code" prop="code")
        el-input(v-model="form.code" placeholder="e.g., ENG, HR, FIN")

      el-form-item(label="Parent Department")
        el-select(v-model="form.parentId" class="w-full" placeholder="None (Top Level)" clearable)
          el-option(
            v-for="dept in availableParents"
            :key="dept.id"
            :label="dept.name"
            :value="dept.id"
          )

      el-form-item(label="Description")
        el-input(v-model="form.description" type="textarea" :rows="3" placeholder="Department description")

    template(#footer)
      el-button(@click="dialogVisible = false") Cancel
      el-button(type="primary" :loading="saving" @click="handleSave" class="!rounded-2xl") {{ isEditing ? 'Update' : 'Create' }}

  //- Delete Confirm
  el-dialog(v-model="deleteDialogVisible" title="Delete Department" width="400px")
    p(style="color: var(--text-primary)") Are you sure you want to delete "{{ deletingDept?.name }}"?
    p.text-sm.mt-2(style="color: var(--text-muted)") This action cannot be undone. Departments with employees or sub-departments cannot be deleted.
    template(#footer)
      el-button(@click="deleteDialogVisible = false") Cancel
      el-button(type="danger" :loading="deleting" @click="handleDelete" class="!rounded-2xl") Delete
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
  name: [{ required: true, message: 'Department name is required', trigger: 'blur' }],
  code: [{ required: true, message: 'Department code is required', trigger: 'blur' }]
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
    const payload: Record<string, any> = {
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
        title: 'Success',
        message: isEditing.value ? 'Department updated' : 'Department created'
      });
      dialogVisible.value = false;
      await loadData();
    } else {
      ElNotification({ type: 'error', title: 'Error', message: res.message });
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
      ElNotification({ type: 'success', title: 'Success', message: 'Department deleted' });
      deleteDialogVisible.value = false;
      await loadData();
    } else {
      ElNotification({ type: 'error', title: 'Error', message: res.message });
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
