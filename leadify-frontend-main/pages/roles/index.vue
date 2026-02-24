<template lang="pug">
.p-6.animate-entrance
  //- Header
  .flex.items-center.justify-between.mb-10
    .header-content
      .title.font-bold.text-3xl.mb-2.text-gradient {{ $t('roles.title') }}
      .subtitle.text-muted.text-sm.tracking-wide Manage roles and access control
    .flex.items-center.gap-x-3
      ExportButton(:data="table.data" :columns="exportColumns" :filename="'roles-export'" :title="$t('roles.title')")
      NuxtLink(to="/roles/add-role")
        el-button(   size='large' :loading="loading" v-if="hasPermission('CREATE_ROLES')" native-type="submit" type="primary" :icon="Plus" class="premium-btn !rounded-2xl px-8 glow-purple glass-button-press")  {{ $t('roles.newRole') }}
  .glass-card.p-4(class="!rounded-3xl")
    AppTable(v-slot="{data}" without-filters without-search :filterOptions="filterOptions" :columns="table.columns" position="role" :pageInfo="response.pagination" :data="table.data" :sortOptions="table.sort" @handleRowClick="handleRowClick" searchPlaceholder="roles" class="premium-table")
      .flex.items-center.py-2(@click.stop)
        el-dropdown(class="outline-0" trigger="click")
          span(class="el-dropdown-link")
            .toggle-icon.text-md.hover-scale
              Icon(name="ph:dots-three-outline-vertical-fill" size="20" class="text-purple-400")
          template(#dropdown='')
            el-dropdown-menu(class="glass-dropdown")
              el-dropdown-item
                NuxtLink.flex.items-center(:to="`/roles/${data?.id}`")
                  Icon.text-md.mr-2(name="IconEye" )
                  p.text-sm {{ $t('common.view') }}
              el-dropdown-item(v-if="hasPermission('EDIT_ROLES')")
                NuxtLink.flex.items-center(:to="`/roles/edit/${data?.id}`")
                  Icon.text-md.mr-2(name="IconEdit" )
                  p.text-sm {{ $t('common.edit') }}
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
// const response = await getRoles();

const response = await useTableFilter('role');
table.data = response.formattedData;

function handleRowClick(val: any) {
  router.push(`/roles/${val.id}`);
}
</script>
