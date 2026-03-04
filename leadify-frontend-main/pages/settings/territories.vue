<template lang="pug">
.territories-page.p-8
  .header.mb-8
    .flex.items-center.justify-between
      div
        h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") {{ $t('navigation.territories') }}
        p(style="color: var(--text-muted)") {{ $t('territories.subtitle') }}
      el-button(type="primary" @click="openDialog()" class="!rounded-xl")
        Icon.mr-1(name="ph:plus-bold" size="16")
        | {{ $t('territories.addTerritory') }}

  .max-w-4xl
    //- Loading
    .flex.items-center.justify-center.py-20(v-if="loading")
      el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

    template(v-else)
      //- Territory Tree
      .space-y-3(v-if="territories.length")
        template(v-for="territory in territories" :key="territory.id")
          TerritoryNode(:territory="territory" :depth="0" @edit="openDialog" @delete="handleDelete")

      .text-center.py-12(v-else)
        Icon(name="ph:map-pin-bold" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-3(style="color: var(--text-muted)") {{ $t('territories.noTerritories') }}

  //- Edit Dialog
  el-dialog(v-model="dialogVisible" :title="editingTerritory ? $t('territories.editTerritory') : $t('territories.addTerritory')" width="600px")
    el-form(:model="form" label-position="top")
      el-form-item(:label="$t('common.name')" required)
        el-input(v-model="form.name" :placeholder="$t('territories.namePlaceholder')")
      el-form-item(:label="$t('common.description')")
        el-input(v-model="form.description" type="textarea" :rows="3")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('territories.type')")
          el-select(v-model="form.type" style="width: 100%")
            el-option(:label="$t('territories.types.region')" value="region")
            el-option(:label="$t('territories.types.city')" value="city")
            el-option(:label="$t('territories.types.area')" value="area")
            el-option(:label="$t('territories.types.custom')" value="custom")
        el-form-item(:label="$t('territories.parentTerritory')")
          el-select(v-model="form.parentId" clearable style="width: 100%" :placeholder="$t('territories.topLevel')")
            el-option(v-for="t in flatTerritories" :key="t.id" :label="t.name" :value="t.id" :disabled="t.id === editingTerritory?.id")
      el-form-item(:label="$t('territories.assignedUser')")
        el-select(v-model="form.assignedUserId" clearable filterable style="width: 100%" :placeholder="$t('territories.selectUser')")
          el-option(v-for="u in users" :key="u.value" :label="u.label" :value="u.value")
      el-form-item
        el-checkbox(v-model="form.isActive") {{ $t('common.active') }}
    template(#footer)
      el-button(@click="dialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleSave" :loading="saving") {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, defineComponent, h } from 'vue';
import { ElNotification, ElMessageBox, ElMessage } from 'element-plus';
import { fetchTerritoryTree, createTerritory, updateTerritory, deleteTerritory } from '~/composables/useTerritories';
import type { Territory } from '~/composables/useTerritories';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({ title: 'Territories' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

const loading = ref(true);
const saving = ref(false);
const dialogVisible = ref(false);
const editingTerritory = ref<Territory | null>(null);
const territories = ref<Territory[]>([]);
const users = ref<{ label: string; value: string }[]>([]);

const form = reactive({
  name: '',
  description: '',
  type: 'region',
  parentId: undefined as string | undefined,
  assignedUserId: undefined as string | undefined,
  isActive: true
});

// Flatten territories for parent selection
const flatTerritories = computed(() => {
  const flat: Territory[] = [];
  function flatten(items: Territory[]) {
    for (const item of items) {
      flat.push(item);
      if (item.children?.length) flatten(item.children);
    }
  }
  flatten(territories.value);
  return flat;
});

// Load data
try {
  const [treeData, usersRes]: any[] = await Promise.all([fetchTerritoryTree(), useApiFetch('users')]);
  territories.value = treeData;
  if (usersRes?.body?.docs) {
    users.value = usersRes.body.docs.map((u: any) => ({ label: u.name, value: u.id }));
  }
} catch (e) {
  console.error('Failed to load territories', e);
} finally {
  loading.value = false;
}

function openDialog(territory?: Territory) {
  if (territory) {
    editingTerritory.value = territory;
    form.name = territory.name;
    form.description = territory.description || '';
    form.type = territory.type;
    form.parentId = territory.parentId || undefined;
    form.assignedUserId = territory.assignedUserId || undefined;
    form.isActive = territory.isActive;
  } else {
    editingTerritory.value = null;
    form.name = '';
    form.description = '';
    form.type = 'region';
    form.parentId = undefined;
    form.assignedUserId = undefined;
    form.isActive = true;
  }
  dialogVisible.value = true;
}

async function handleSave() {
  if (!form.name.trim()) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('common.fillRequired') });
    return;
  }
  saving.value = true;
  try {
    if (editingTerritory.value) {
      await updateTerritory(editingTerritory.value.id, { ...form });
    } else {
      await createTerritory({ ...form });
    }
    territories.value = await fetchTerritoryTree();
    dialogVisible.value = false;
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    saving.value = false;
  }
}

async function handleDelete(territory: Territory) {
  try {
    await ElMessageBox.confirm(t('common.confirmAction'), t('common.warning'), { type: 'warning' });
    await deleteTerritory(territory.id);
    territories.value = await fetchTerritoryTree();
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
  } catch (e: any) { ElMessage.error(t('common.error')); }
}

// Territory tree node component
const TerritoryNode: ReturnType<typeof defineComponent> = defineComponent({
  name: 'TerritoryNode',
  props: {
    territory: { type: Object as () => Territory, required: true },
    depth: { type: Number, default: 0 }
  },
  emits: ['edit', 'delete'],
  setup(props, { emit }) {
    const expanded = ref(true);

    return () =>
      h('div', { style: { paddingLeft: props.depth * 24 + 'px' } }, [
        h(
          'div',
          {
            class: 'glass-card p-4 mb-2 flex items-center justify-between',
            style: { borderLeft: '3px solid ' + (props.territory.isActive ? '#7849ff' : '#a1a1aa') }
          },
          [
            h('div', { class: 'flex items-center gap-3 flex-1' }, [
              props.territory.children?.length
                ? h(
                    'div',
                    {
                      class: 'cursor-pointer',
                      onClick: () => {
                        expanded.value = !expanded.value;
                      }
                    },
                    [
                      h(resolveComponent('Icon'), {
                        name: expanded.value ? 'ph:caret-down-bold' : 'ph:caret-right-bold',
                        size: '16',
                        style: 'color: var(--text-muted)'
                      })
                    ]
                  )
                : h('div', { style: 'width: 16px' }),
              h('div', [
                h('p', { class: 'text-sm font-semibold', style: 'color: var(--text-primary)' }, props.territory.name),
                h('div', { class: 'flex items-center gap-2 mt-1' }, [
                  h(resolveComponent('el-tag'), { size: 'small', type: 'info' }, () => props.territory.type),
                  props.territory.assignedUser
                    ? h('span', { class: 'text-xs', style: 'color: var(--text-muted)' }, props.territory.assignedUser.name)
                    : null,
                  !props.territory.isActive ? h(resolveComponent('el-tag'), { size: 'small', type: 'danger' }, () => t('territories.inactive')) : null
                ])
              ])
            ]),
            h('div', { class: 'flex items-center gap-2' }, [
              h(resolveComponent('el-button'), { size: 'small', class: '!rounded-lg', onClick: () => emit('edit', props.territory) }, () =>
                h(resolveComponent('Icon'), { name: 'ph:pencil-bold', size: '14' })
              ),
              h(
                resolveComponent('el-button'),
                { size: 'small', type: 'danger', plain: true, class: '!rounded-lg', onClick: () => emit('delete', props.territory) },
                () => h(resolveComponent('Icon'), { name: 'ph:trash-bold', size: '14' })
              )
            ])
          ]
        ),
        expanded.value && props.territory.children?.length
          ? props.territory.children.map(child =>
              h(TerritoryNode, {
                territory: child,
                depth: props.depth + 1,
                onEdit: (t: Territory) => emit('edit', t),
                onDelete: (t: Territory) => emit('delete', t)
              })
            )
          : null
      ]);
  }
});
</script>

<style lang="scss" scoped>
.territories-page {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
