<template lang="pug">
div
  //- Header
  .flex.items-center.justify-between.mb-8
    .title.font-bold.text-2xl.mb-1.capitalize {{ $t('roles.title') }}
    .flex.items-center.gap-x-3
      ExportButton(:data="table.data" :columns="exportColumns" :filename="'roles-export'" :title="$t('roles.title')")
      NuxtLink(to="/roles/add-role")
        el-button(   size='large' :loading="loading" v-if="hasPermission('CREATE_ROLES')" native-type="submit" type="primary" :icon="Plus" class="w-full !my-4 !rounded-2xl")  {{ $t('roles.newRole') }}

  //- Desktop Table
  .roles-desktop-view
    AppTable(v-slot="{data}" without-filters without-search :filterOptions="filterOptions" :columns="table.columns" position="role" :pageInfo="response.pagination" :data="table.data" :sortOptions="table.sort" @handleRowClick="handleRowClick" searchPlaceholder="roles" )
      .flex.items-center.py-2(@click.stop)

          el-dropdown(class="outline-0" trigger="click")
              span(class="el-dropdown-link")
                .toggle-icon.text-md
                    Icon(name="IconToggle"  size="22")
              template(#dropdown='')
                  el-dropdown-menu
                      el-dropdown-item
                        NuxtLink.flex.items-center(:to="`/roles/${data?.id}`")
                          Icon.text-md.mr-2(name="IconEye" )
                          p.text-sm {{ $t('common.view') }}
                      el-dropdown-item(v-if="hasPermission('EDIT_ROLES')")
                        NuxtLink.flex.items-center(:to="`/roles/edit/${data?.id}`")
                          Icon.text-md.mr-2(name="IconEdit" )
                          p.text-sm {{ $t('common.edit') }}

  //- Mobile Card View
  .roles-mobile-view
    PullToRefresh(:loading="mobileRefreshing" @refresh="handleMobileRefresh")
      .mb-3
        el-input(v-model="mobileSearch" size="large" :placeholder="`${$t('common.search')} ${$t('roles.title')}`" clearable class="!rounded-xl")
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")

      .space-y-3(v-if="mobileFilteredData.length")
        SwipeCard(
          v-for="role in mobileFilteredData"
          :key="role.id"
          :leftActions="getSwipeLeftActions(role)"
          @action="(name) => handleSwipeAction(name, role)"
        )
          .entity-card.p-4(@click="handleRowClick(role)")
            .flex.items-start.justify-between.mb-3
              .flex.items-center.gap-3.min-w-0.flex-1
                .w-10.h-10.rounded-xl.flex.items-center.justify-center.shrink-0.text-sm.font-bold(
                  :style="{ background: '#8b5cf620', color: '#8b5cf6' }"
                )
                  Icon(name="ph:shield-check" size="18")
                .min-w-0.flex-1
                  p.text-sm.font-bold.truncate(style="color: var(--text-primary)") {{ role.name || '--' }}
                  p.text-xs.truncate(style="color: var(--text-muted)") {{ role.description || '' }}

            .grid.grid-cols-2.gap-2
              .flex.items-center.gap-2(v-if="role.totalAssignedUsers != null")
                Icon(name="ph:users" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ role.totalAssignedUsers }} {{ $t('staff.title').toLowerCase() }}
              .flex.items-center.gap-2(v-if="role.updatedAt")
                Icon(name="ph:calendar" size="14" style="color: var(--text-muted)")
                span.text-xs.truncate(style="color: var(--text-secondary)") {{ role.updatedAt }}

      .text-center.py-12(v-if="!mobileFilteredData.length")
        Icon(name="ph:shield-check" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('common.noData') }}

      .text-center.mt-4.pb-20(v-if="mobileFilteredData.length")
        span.text-xs(style="color: var(--text-muted)") {{ mobileFilteredData.length }} {{ $t('roles.title').toLowerCase() }}

    .mobile-fab(v-if="hasPermission('CREATE_ROLES')" @click="navigateTo('/roles/add-role')")
      Icon(name="ph:plus-bold" size="24")

  ActionModel(v-model="deleteRolePopup" :loading="loadingAction" :btn-text="$t('roles.moveToArchive')" :description="$t('roles.deleteConfirm')" icon="/images/delete-image.png" )
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';

interface Role {
  id: string;
  name: string;
  description?: string;
  totalAssignedUsers?: number;
  updatedAt?: string;
}

const { t } = useI18n();
const router = useRouter();
const { hasPermission } = await usePermissions();
const loadingAction = ref(false);
const loading = ref(false);
const deleteRolePopup = ref(false);

// Export columns
const exportColumns = [
  { prop: 'name', label: t('roles.columns.name') },
  { prop: 'description', label: t('roles.columns.description') },
  { prop: 'totalAssignedUsers', label: t('roles.columns.totalStaff') },
  { prop: 'updatedAt', label: t('roles.columns.lastModified') }
];

const table = reactive({
  columns: [
    {
      prop: 'name',
      label: t('roles.columns.name'),
      component: 'Text',
      sortable: true,
      type: 'font-bold',
      width: 170
    },
    {
      prop: 'description',
      label: t('roles.columns.description'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'totalAssignedUsers',
      label: t('roles.columns.totalStaff'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'updatedAt',
      label: t('roles.columns.lastModified'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 150
    }
  ],
  data: [] as Role[]
});

// Call API to Get the role
const response = await useTableFilter('role');
table.data = response.formattedData;

function handleRowClick(val: any) {
  router.push(`/roles/${val.id}`);
}

// Mobile
const { vibrate } = useMobile();
const mobileSearch = ref('');
const mobileRefreshing = ref(false);

const mobileFilteredData = computed(() => {
  const data = table.data || [];
  if (!mobileSearch.value) return data;
  const q = mobileSearch.value.toLowerCase();
  return data.filter((r: any) => {
    const name = (r.name || '').toLowerCase();
    const desc = (r.description || '').toLowerCase();
    return name.includes(q) || desc.includes(q);
  });
});

async function handleMobileRefresh() {
  mobileRefreshing.value = true;
  try {
    const res = await useTableFilter('role');
    table.data = res.formattedData;
    vibrate([10, 30, 10]);
  } finally {
    mobileRefreshing.value = false;
  }
}

function getSwipeLeftActions(_role: any) {
  const actions = [{ name: 'view', label: t('common.view'), icon: 'ph:eye-bold', color: '#8b5cf6' }];
  if (hasPermission('EDIT_ROLES')) actions.push({ name: 'edit', label: t('common.edit'), icon: 'ph:pencil-simple-bold', color: '#F59E0B' });
  return actions;
}

function handleSwipeAction(name: string, role: any) {
  vibrate();
  switch (name) {
    case 'view':
      navigateTo(`/roles/${role.id}`);
      break;
    case 'edit':
      navigateTo(`/roles/edit/${role.id}`);
      break;
  }
}
</script>

<style lang="scss" scoped>
@include mobile-list-page('roles', #8b5cf6);
</style>
