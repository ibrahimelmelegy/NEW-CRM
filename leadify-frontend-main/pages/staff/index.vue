<template lang="pug">
  div
    //- Header
    .flex.items-center.justify-between.mb-8
      .title.font-bold.text-2xl.mb-1.capitalize {{ $t('staff.title') }}
      .flex.items-center.gap-x-3
        ExportButton(:data="exportData" :columns="exportColumns" :filename="'staff-export'" :title="$t('staff.title')")
        NuxtLink(to="/staff/add-staff")
          el-button(size='large' :loading="loading" v-if="hasPermission('CREATE_STAFF')" native-type="submit" type="primary" :icon="Plus" class="w-full !my-4 !rounded-2xl") {{ $t('staff.newStaff') }}

    SavedViews(:entityType="'staff'" :currentFilters="{}" @apply-view="handleApplyView")
    AdvancedSearch(:entityType="'staff'" :fields="advancedSearchFields" @apply="handleAdvancedFilter" @clear="handleClearAdvancedFilter")

    AppTable(v-slot="{data}" :filterOptions="filterOptions" :columns="table.columns" position="users" :pageInfo="response.pagination" :data="table.data" :sortOptions="table.sort" @handleRowClick="handleRowClick" searchPlaceholder="staff" :loading="loadingAction" )
      .flex.items-center.py-2(@click.stop)
          el-dropdown(class="outline-0" trigger="click")
              span(class="el-dropdown-link")
                .toggle-icon.text-md
                    Icon(name="IconToggle"  size="22")
              template(#dropdown='')
                  el-dropdown-menu
                      el-dropdown-item
                        NuxtLink.flex.items-center(:to="`/staff/${data?.id}`")
                          Icon.text-md.mr-2(name="IconEye" )
                          p.text-sm {{ $t('common.view') }}
                      el-dropdown-item(v-if="hasPermission('EDIT_STAFF') && data?.id !== 1" )
                        NuxtLink.flex.items-center(:to="`/staff/edit/${data?.id}`")
                          Icon.text-md.mr-2(name="IconEdit" )
                          p.text-sm {{ $t('common.edit') }}

    ActionModel(v-model="deleteStaffPopup" :loading="loadingAction" @confirm="deleteStaffAction()" :btn-text="$t('staff.actions.moveToArchive')" :description-one="$t('staff.actions.deleteConfirm')" icon="/images/delete-image.png" :description-two="$t('staff.actions.deleteDescription')" )
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';
const { hasPermission } = await usePermissions();
const { t } = useI18n();
const router = useRouter();
const loadingAction = ref(false);
const deleteStaffPopup = ref(false);
const staffActionId = ref();

// Export columns & data
const exportColumns = [
  { prop: 'staffDetails', label: t('staff.table.staffName') },
  { prop: 'email', label: t('staff.table.email') },
  { prop: 'phone', label: t('staff.table.phone') },
  { prop: 'roleDetails', label: t('staff.table.role') },
  { prop: 'status', label: t('staff.table.status') },
  { prop: 'updatedAt', label: t('staff.table.lastActivity') }
];
const exportData = computed(() => table.data);

const table = reactive({
  columns: [
    {
      prop: 'staffDetails',
      label: t('staff.table.staffName'),
      component: 'AvatarText',
      sortable: true,
      type: 'font-bold',
      width: 170
    },
    {
      prop: 'email',
      label: t('staff.table.email'),
      component: 'Text',
      sortable: true,
      type: 'font-default',
      width: 220
    },
    {
      prop: 'phone',
      label: t('staff.table.phone'),
      component: 'Text',
      sortable: false,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'roleDetails',
      label: t('staff.table.role'),
      component: 'Text',
      sortable: false,
      type: 'font-default',
      width: 200
    },
    {
      prop: 'status',
      label: t('staff.table.status'),
      component: 'Label',
      sortable: true,
      type: 'outline',
      filters: [
        { text: 'Active', value: 'ACTIVE' },
        { text: 'Inactive', value: 'INACTIVE' }
      ],
      width: 150
    },
    {
      prop: 'updatedAt',
      label: t('staff.table.lastActivity'),
      component: 'Text',
      sortable: false,
      type: 'font-default',
      width: 200
    }
  ],
  data: [] as Staff[]
});

// Call API to Get the staff
const response = await useTableFilter('users');
table.data = response.formattedData;

function handleRowClick(val: any) {
  router.push(`/staff/${val.id}`);
}

// Call API to delete the staff
async function deleteStaffAction() {
  loadingAction.value = true;

  await deleteStaff(staffActionId.value);
  deleteStaffPopup.value = false;

  // Call API to Get the staff
  const response = await useTableFilter('users');
  table.data = response.formattedData;

  loadingAction.value = false;
}

const mappedRoles = ref<{ label: string; value: any }[]>();
//  Get roles
const repsonse = await useApiFetch('role');
// Map clients to Select Options
mappedRoles.value = repsonse.body?.docs?.map((e: any) => ({
  label: e.name,
  value: e.id
}));

const filterOptions = [
  {
    title: t('staff.table.status'),
    value: 'status',
    options: [...staffStatuses]
  },
  {
    title: t('staff.table.role'),
    value: 'roleId',
    options: mappedRoles.value
  }
];

// SavedViews & AdvancedSearch
const advancedSearchFields = [
  { key: 'name', label: t('staff.table.name'), type: 'string' },
  { key: 'email', label: t('staff.table.email'), type: 'string' },
  { key: 'phone', label: t('staff.table.phone'), type: 'string' },
  { key: 'status', label: t('staff.table.status'), type: 'select', options: staffStatuses.map((s: any) => ({ value: s.value, label: s.label })) },
  { key: 'roleId', label: t('staff.table.role'), type: 'select', options: mappedRoles.value || [] },
  { key: 'createdAt', label: t('common.created') || 'Created', type: 'date' }
];

async function handleApplyView(view: any) {
  if (view?.filters) {
    const res = await useTableFilter('users', view.filters);
    table.data = res.formattedData;
  }
}

async function handleAdvancedFilter(filterPayload: any) {
  try {
    const res = await useApiFetch('search/advanced/staff', 'POST', filterPayload);
    if (res?.success && res?.body) {
      const data = res.body as any;
      table.data = data.docs || data || [];
    }
  } catch {}
}

async function handleClearAdvancedFilter() {
  const res = await useTableFilter('users');
  table.data = res.formattedData;
}
</script>
