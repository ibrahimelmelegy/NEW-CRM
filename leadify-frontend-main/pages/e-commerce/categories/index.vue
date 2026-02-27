<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") {{ $t('ecommerce.categories.title') || 'Categories' }}
      p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('ecommerce.categories.subtitle') || 'Organize your products into categories and subcategories' }}
    el-button(type="primary" size="default" @click="openCreateDialog" style="background: var(--bg-obsidian); border: none; border-radius: 12px;")
      Icon(name="ph:plus" size="16" style="margin-right: 4px;")
      | {{ $t('ecommerce.categories.addCategory') || 'Add Category' }}

  //- Two-column layout
  .grid.grid-cols-1.gap-6(class="lg_grid-cols-3")
    //- Left Column: Category Tree
    .col-span-1(class="lg_col-span-1")
      .rounded-2xl.border.p-5(style="border-color: var(--border-default); background: var(--bg-elevated);" v-loading="loading")
        .flex.items-center.justify-between.mb-4
          h3.text-sm.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('ecommerce.categories.categoryTree') || 'Category Tree' }}
          el-tag(size="small" round effect="plain") {{ flatCount }} {{ $t('ecommerce.categories.total') || 'total' }}

        el-tree(
          v-if="treeData.length"
          :data="treeData"
          node-key="id"
          :props="treeProps"
          highlight-current
          default-expand-all
          draggable
          :allow-drop="allowDrop"
          @node-click="onNodeClick"
          @node-drop="onNodeDrop"
        )
          template(#default="{ node, data }")
            .flex.items-center.justify-between.w-full.py-1
              .flex.items-center.gap-2
                Icon(name="ph:folder-simple" size="16" :style="{ color: data.isActive ? '#7c3aed' : '#9ca3af' }")
                span.text-sm.font-medium(:style="{ color: data.isActive ? 'var(--text-primary)' : 'var(--text-muted)' }") {{ data.name }}
              .flex.items-center.gap-2
                el-tag(v-if="data.productCount" size="small" round effect="plain") {{ data.productCount }}
                .w-2.h-2.rounded-full(:style="{ backgroundColor: data.isActive !== false ? '#22c55e' : '#ef4444' }")

        //- Empty tree
        .text-center.py-10(v-if="!loading && treeData.length === 0" style="color: var(--text-muted);")
          Icon(name="ph:tree-structure" size="48")
          p.text-sm.mt-3 {{ $t('ecommerce.categories.noCategories') || 'No categories yet. Create your first one.' }}

    //- Right Column: Category Detail / Edit Form
    .col-span-1(class="lg_col-span-2")
      .rounded-2xl.border.p-6(style="border-color: var(--border-default); background: var(--bg-elevated);")
        //- When a category is selected
        template(v-if="selectedCategory")
          .flex.items-center.justify-between.mb-6
            h3.text-lg.font-bold(style="color: var(--text-primary);") {{ $t('ecommerce.categories.editCategory') || 'Edit Category' }}
            .flex.items-center.gap-2
              el-tag(:type="selectedCategory.isActive !== false ? 'success' : 'info'" size="small" round effect="dark") {{ selectedCategory.isActive !== false ? ($t('common.active') || 'Active') : ($t('common.inactive') || 'Inactive') }}

          el-form(label-position="top" size="large")
            .grid.grid-cols-1.gap-4(class="md_grid-cols-2")
              el-form-item(:label="$t('ecommerce.categories.name') || 'Name'" required)
                el-input(v-model="editForm.name" :placeholder="$t('ecommerce.categories.namePlaceholder') || 'Category name'" @input="autoGenerateSlug")
              el-form-item(:label="$t('ecommerce.categories.slug') || 'Slug'")
                el-input(v-model="editForm.slug" :placeholder="$t('ecommerce.categories.slugPlaceholder') || 'category-slug'")

            el-form-item(:label="$t('ecommerce.categories.description') || 'Description'")
              el-input(v-model="editForm.description" type="textarea" :rows="3" :placeholder="$t('ecommerce.categories.descriptionPlaceholder') || 'Brief description of this category'")

            .grid.grid-cols-1.gap-4(class="md_grid-cols-2")
              el-form-item(:label="$t('ecommerce.categories.parentCategory') || 'Parent Category'")
                el-select(v-model="editForm.parentId" class="w-full" clearable :placeholder="$t('ecommerce.categories.rootCategory') || 'None (Root Category)'")
                  el-option(
                    v-for="cat in flatCategories.filter(c => c.id !== selectedCategory.id)"
                    :key="cat.id"
                    :label="cat.name"
                    :value="cat.id"
                  )
              el-form-item(:label="$t('ecommerce.categories.sortOrder') || 'Sort Order'")
                el-input-number(v-model="editForm.sortOrder" :min="0" class="!w-full")

            el-form-item
              el-switch(v-model="editForm.isActive" :active-text="$t('common.active') || 'Active'" :inactive-text="$t('common.inactive') || 'Inactive'")

            .flex.items-center.justify-between.mt-4
              el-button(type="danger" plain @click="handleDelete(selectedCategory)" :loading="deleting")
                Icon(name="ph:trash" size="16" style="margin-right: 4px;")
                | {{ $t('common.delete') || 'Delete' }}
              el-button(type="primary" :loading="saving" @click="handleUpdate" style="border-radius: 12px;")
                Icon(name="ph:check" size="16" style="margin-right: 4px;")
                | {{ $t('common.save') || 'Save Changes' }}

        //- When no category is selected
        .text-center.py-16(v-else style="color: var(--text-muted);")
          Icon(name="ph:cursor-click" size="56")
          p.text-sm.mt-4.font-medium {{ $t('ecommerce.categories.selectCategory') || 'Select a category or create a new one' }}
          el-button.mt-4(type="primary" plain @click="openCreateDialog" style="border-radius: 12px;")
            Icon(name="ph:plus" size="16" style="margin-right: 4px;")
            | {{ $t('ecommerce.categories.addCategory') || 'Add Category' }}

  //- Create Dialog
  el-dialog(v-model="showCreateDialog" :title="$t('ecommerce.categories.createCategory') || 'Create Category'" width="520px")
    el-form(label-position="top" size="large")
      el-form-item(:label="$t('ecommerce.categories.name') || 'Name'" required)
        el-input(v-model="createForm.name" :placeholder="$t('ecommerce.categories.namePlaceholder') || 'Category name'" @input="autoGenerateCreateSlug")
      el-form-item(:label="$t('ecommerce.categories.slug') || 'Slug'")
        el-input(v-model="createForm.slug" :placeholder="$t('ecommerce.categories.slugPlaceholder') || 'category-slug'")
      el-form-item(:label="$t('ecommerce.categories.description') || 'Description'")
        el-input(v-model="createForm.description" type="textarea" :rows="3" :placeholder="$t('ecommerce.categories.descriptionPlaceholder') || 'Brief description of this category'")
      .grid.grid-cols-1.gap-4(class="md_grid-cols-2")
        el-form-item(:label="$t('ecommerce.categories.parentCategory') || 'Parent Category'")
          el-select(v-model="createForm.parentId" class="w-full" clearable :placeholder="$t('ecommerce.categories.rootCategory') || 'None (Root Category)'")
            el-option(
              v-for="cat in flatCategories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            )
        el-form-item(:label="$t('ecommerce.categories.sortOrder') || 'Sort Order'")
          el-input-number(v-model="createForm.sortOrder" :min="0" class="!w-full")
      el-form-item
        el-switch(v-model="createForm.isActive" :active-text="$t('common.active') || 'Active'" :inactive-text="$t('common.inactive') || 'Inactive'")
    template(#footer)
      el-button(@click="showCreateDialog = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="primary" :loading="saving" @click="handleCreate" style="border-radius: 12px;") {{ $t('common.save') || 'Save' }}

  //- Delete Confirmation Dialog
  el-dialog(v-model="showDeleteDialog" :title="$t('ecommerce.categories.deleteCategory') || 'Delete Category'" width="440px")
    .text-center.py-4
      Icon(name="ph:warning-circle" size="48" style="color: #ef4444;")
      p.text-sm.mt-4(v-if="deleteTarget?.children?.length" style="color: var(--text-primary);")
        | {{ $t('ecommerce.categories.hasChildren') || 'This category has' }}
        strong.mx-1 {{ deleteTarget.children.length }}
        | {{ $t('ecommerce.categories.subcategories') || 'subcategories. Delete children first.' }}
      p.text-sm.mt-4(v-else style="color: var(--text-muted);") {{ $t('ecommerce.categories.confirmDelete') || 'Are you sure you want to delete this category? This action cannot be undone.' }}
    template(#footer)
      el-button(@click="showDeleteDialog = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="danger" :loading="deleting" :disabled="!!deleteTarget?.children?.length" @click="confirmDelete") {{ $t('common.delete') || 'Delete' }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  fetchEcCategoryTree,
  createEcCategory,
  updateEcCategory,
  deleteEcCategory
} from '~/composables/useEcommerce'

definePageMeta({ middleware: 'permissions' })

const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const treeData = ref<any[]>([])
const selectedCategory = ref<any>(null)
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const deleteTarget = ref<any>(null)

const treeProps = {
  label: 'name',
  children: 'children'
}

const editForm = reactive({
  name: '',
  slug: '',
  description: '',
  parentId: null as string | null,
  sortOrder: 0,
  isActive: true
})

const createForm = reactive({
  name: '',
  slug: '',
  description: '',
  parentId: null as string | null,
  sortOrder: 0,
  isActive: true
})

// Flatten tree for parent select options
const flatCategories = computed(() => {
  const result: any[] = []
  function flatten(nodes: any[]) {
    for (const node of nodes) {
      result.push(node)
      if (node.children?.length) flatten(node.children)
    }
  }
  flatten(treeData.value)
  return result
})

const flatCount = computed(() => flatCategories.value.length)

onMounted(() => {
  loadTree()
})

async function loadTree() {
  loading.value = true
  try {
    const res = await fetchEcCategoryTree()
    treeData.value = res?.body?.docs || res?.body || res?.docs || []
  } finally {
    loading.value = false
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
}

function autoGenerateSlug() {
  editForm.slug = slugify(editForm.name)
}

function autoGenerateCreateSlug() {
  createForm.slug = slugify(createForm.name)
}

function onNodeClick(data: any) {
  selectedCategory.value = data
  Object.assign(editForm, {
    name: data.name || '',
    slug: data.slug || '',
    description: data.description || '',
    parentId: data.parentId || null,
    sortOrder: data.sortOrder || 0,
    isActive: data.isActive !== false
  })
}

function allowDrop(draggingNode: any, dropNode: any, type: string) {
  return type !== 'inner' || true
}

async function onNodeDrop(draggingNode: any, dropNode: any, type: string) {
  try {
    const data: any = { sortOrder: dropNode.data.sortOrder || 0 }
    if (type === 'inner') {
      data.parentId = dropNode.data.id
    } else if (type === 'before' || type === 'after') {
      data.parentId = dropNode.data.parentId || null
    }
    await updateEcCategory(draggingNode.data.id, data)
    await loadTree()
  } catch {
    ElMessage.error('Failed to reorder category')
    await loadTree()
  }
}

function openCreateDialog() {
  Object.assign(createForm, {
    name: '',
    slug: '',
    description: '',
    parentId: null,
    sortOrder: 0,
    isActive: true
  })
  showCreateDialog.value = true
}

async function handleCreate() {
  if (!createForm.name.trim()) {
    ElMessage.warning('Category name is required')
    return
  }
  saving.value = true
  try {
    const res = await createEcCategory({ ...createForm })
    if (res?.success !== false) {
      showCreateDialog.value = false
      await loadTree()
      ElMessage.success('Category created')
    }
  } finally {
    saving.value = false
  }
}

async function handleUpdate() {
  if (!editForm.name.trim()) {
    ElMessage.warning('Category name is required')
    return
  }
  saving.value = true
  try {
    const res = await updateEcCategory(selectedCategory.value.id, { ...editForm })
    if (res?.success !== false) {
      await loadTree()
      // Re-select the updated category
      const updated = flatCategories.value.find((c: any) => c.id === selectedCategory.value.id)
      if (updated) onNodeClick(updated)
      ElMessage.success('Category updated')
    }
  } finally {
    saving.value = false
  }
}

function handleDelete(category: any) {
  deleteTarget.value = category
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    const res = await deleteEcCategory(deleteTarget.value.id)
    if (res?.success !== false) {
      showDeleteDialog.value = false
      selectedCategory.value = null
      deleteTarget.value = null
      await loadTree()
      ElMessage.success('Category deleted')
    }
  } finally {
    deleting.value = false
  }
}
</script>
