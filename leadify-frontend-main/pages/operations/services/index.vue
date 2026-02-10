<template lang="pug">
.p-6.animate-entrance
  //- Header
  .flex.items-center.justify-between.mb-10
    .header-content
      .title.font-bold.text-3xl.mb-2.text-gradient {{ $t('navigation.services') }}
      .subtitle.text-muted.text-sm.tracking-wide Configure and manage service offerings
    .flex.items-center.gap-x-3
      NuxtLink(to="/operations/services/add-service")
        el-button(   size='large' :loading="loading" v-if="hasPermission('CREATE_SERVICES')" native-type="submit" type="primary" :icon="Plus" class="premium-btn !rounded-2xl px-8 glow-purple glass-button-press")  {{ $t('operations.services.new') }}
      //- el-dropdown(trigger="click")
      //-     span.el-dropdown-link
      //-         button.rounded-btn(class="!px-4"): Icon(  name="IconToggle" size="24")
      //-     template(#dropdown)
      //-         el-dropdown-menu
      //-           el-dropdown-item
      //-             NuxtLink.flex.items-center(:to="`/leads/1`")
      //-               Icon.text-md.mr-2(size="20" name="IconImport" )
      //-               p.text-sm Import
      //-           NuxtLink(:to="`/leads/1`")
      //-             el-dropdown-item
      //-               NuxtLink.flex.items-center(:to="`/leads/1`")
      //-                 Icon.text-md.mr-2(size="20" name="IconExport" )
      //-                 p.text-sm Export
      //-           el-dropdown-item
      //-               NuxtLink.flex.items-center(:to="`/leads/1`")
      //-                 Icon.text-md.mr-2(size="20" name="IconArchived" )
      //-                 p.text-sm Archived
  .glass-card.p-4(class="!rounded-3xl")
    AppTable(v-slot="{data}" without-filters :columns="table.columns" position="service" :pageInfo="response.pagination" :data="table.data" :sortOptions="table.sort" @handleRowClick="handleRowClick" :searchPlaceholder="$t('navigation.services')" class="premium-table")
      .flex.items-center.py-2(@click.stop)
          //- NuxtLink.toggle-icon(:to="`/leads/1`")
          //-     Icon.text-md(name="IconEye" )

          el-dropdown(class="outline-0" trigger="click")
              span(class="el-dropdown-link")
                .toggle-icon.text-md.hover-scale
                    Icon(name="ph:dots-three-outline-vertical-fill" size="20" class="text-purple-400")
              template(#dropdown='')
                  el-dropdown-menu(class="glass-dropdown")
                      el-dropdown-item
                        NuxtLink.flex.items-center(:to="`/operations/services/${data?.id}`")
                          Icon.text-md.mr-2(name="IconEye" )
                          p.text-sm {{ $t('common.view') }}
                      el-dropdown-item(v-if="hasPermission('EDIT_SERVICES')")
                        NuxtLink.flex.items-center(:to="`/operations/services/edit/${data?.id}`")
                          Icon.text-md.mr-2(name="IconEdit" )
                          p.text-sm {{ $t('common.edit') }}
                      //- el-dropdown-item(@click="[deleteLeadPopup=true, userActionId = data?.id]" )
                      //-     .flex.items-center
                      //-       Icon.text-md.mr-2(name="IconDelete" )
                      //-       p.text-sm Delete
  ActionModel(v-model="deleteLeadPopup" :loading="loadingAction" :btn-text="$t('common.moveToArchive')" :description-one="$t('common.archiveConfirmation')" icon="/images/delete-image.png" :description-two="$t('common.archiveDescription')" )
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';
const router = useRouter();
const { hasPermission } = await usePermissions();
const loadingAction = ref(false);
const deleteLeadPopup = ref(false);

const table = reactive({
  columns: [
    {
      prop: 'type',
      label: useI18n().t('operations.services.table.type'),
      component: 'Text',
      // sortable: true,
      type: 'font-default',
      width: 500
    },
    {
      prop: 'price',
      label: useI18n().t('operations.services.table.price'),
      component: 'Text',
      // sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'action',
      label: useI18n().t('common.action'),
      component: 'Action'
    }
  ],
  data: [] as Service[]
});

const response = await useTableFilter('service');
table.data = response.formattedData;

function handleRowClick(val: any) {
  router.push(`/operations/services/${val.id}`);
}
</script>
