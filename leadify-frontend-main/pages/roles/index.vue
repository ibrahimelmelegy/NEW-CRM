<template lang="pug">
div
  //- Header
  .flex.items-center.justify-between.mb-8
    .title.font-bold.text-2xl.mb-1.capitalize {{ $t('roles.title') }}
    .flex.items-center.gap-x-3
      NuxtLink(to="/roles/add-role")
        el-button(   size='large' :loading="loading" v-if="hasPermission('CREATE_ROLES')" native-type="submit" type="primary" :icon="Plus" class="w-full !my-4 !rounded-2xl")  {{ $t('roles.newRole') }}
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
  ActionModel(v-model="deleteRolePopup" :loading="loadingAction" :btn-text="$t('roles.moveToArchive')" :description="$t('roles.deleteConfirm')" icon="/images/delete-image.png" )
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';
const { t } = useI18n();
const router = useRouter();
const { hasPermission } = await usePermissions();
const loadingAction = ref(false);
const deleteRolePopup = ref(false);

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
