<template lang="pug">
.glass-table-container.glass-card.py-8.animate-entrance
    .flex.justify-end.mx-2
      el-button(v-if="exportButton"  @click="()=> $emit('exportClick')" size='large'   class="premium-btn-secondary")
       Icon(  name="IconExport" size="20")
       p.mx-1 {{ $t('common.export') }}
    .px-6.flex.items-center.flex-wrap.gap-2.mb-6.justify-start(v-if="!isLoading && !loading")
        .input.table-search(class="w-full md:w-[250px]" v-if="!withoutSearch")
            el-input(size="large"
                style="height:50px"
                v-model="search"
                :placeholder="`${$t('common.search')} ${searchPlaceholder}`"
                :prefix-icon="Search"
                clearable
                @input="searchTimeOut"
                @clear="searchTimeOut"
            )
        button.rounded-btn.flex.items-center(class="premium-btn-outline" v-if="!withoutFilters" @click="filterBar = true")
            Icon(  name="IconFilter" size="20")
            span.mr-2 {{ $t('common.filter') }}
            span.font-bold.rounded-full.w-6.h-6.bg-accent-purple.text-white.flex.items-center.justify-center(v-if="numberOfFilters" :aria-label="`${numberOfFilters} active filters`") {{ numberOfFilters }}
    
    div(:class="{ 'mt-4': !withoutSearch || !withoutFilters }")
        SkeletonTable(v-if="isLoading || loading")
        el-table(v-else :data='finalData || []' ref="tableRef" style='width:100%' :row-style="{cursor:'pointer'}" @current-change="(val)=> $emit('handleRowClick' , val)"   @sort-change="handleSortChange" @filter-change="handleFilterChange"  :default-sort="sort" @selection-change="handleSelectionChange")
            el-table-column(type="index", width="50" :index="calculateIndex")
            el-table-column( class-name="wrap-text" :min-width="column?.width" :show-overflow-tooltip="true"   v-for="column in columns"  :filtered-value="filters[column?.prop]"  :prop="column.prop" :label="column.label"  :column-key="column.prop" :sortable="column?.sortable ? 'custom' : undefined" )
                template(#default="scope")
                    .flex.gap-2.items-center
                        div(v-if="column?.component==='AvatarText'" )
                              TableAvatarText(:image="scope.row[column?.prop]?.image" :with-image="scope.row[column?.prop]?.withImage" :title="scope.row[column?.prop]?.title" :text="scope.row[column?.prop]?.text" :type="column?.type"  @showFile='showfile')
                        div( v-else-if="column?.component==='Text'" )
                             TableText(:value="scope.row[column?.prop]" :type="column?.type" )
                        div( v-else-if="column?.type === 'select'" @click.stop)
                             TableLabel(:valueObject = "scope.row" :value="scope.row[column?.prop]" :type="column?.type"  :filters="column?.filters" )
                        div( v-else-if="column?.component==='Label'" )
                             TableLabel(:value="scope.row[column?.prop]" :type="column?.type"  :filters="column?.filters" )
                        div( v-else-if="column?.component==='Tags'" )
                             .flex.flex-wrap.gap-1.items-center
                                el-tag(v-for="(tag, i) in (scope.row[column?.prop] || []).slice(0, 2)" :key="i" size="small" effect="dark" round class="!border-purple-500/30 !text-white !bg-purple-500/20") {{ tag }}
                                el-dropdown(v-if="(scope.row[column?.prop] || []).length > 2" trigger="click" size="small")
                                    el-tag.cursor-pointer(size="small" effect="dark" round class="!border-purple-500/30 !text-white !bg-purple-500/20 hover:!bg-purple-500/40 transition-colors") +{{ (scope.row[column?.prop] || []).length - 2 }}
                                    template(#dropdown)
                                        el-dropdown-menu.glass-dropdown
                                            el-dropdown-item(v-for="(tag, i) in (scope.row[column?.prop] || []).slice(2)" :key="i") {{ tag }}

            el-table-column(:label="$t('common.action')" min-width="150" fixed="right" v-if="!withoutAction")
              template(#default="scope")
                  slot(:data="scope.row")
            template(#empty)
              .text-center.py-8
                Icon(:name="emptyIcon || 'ph:database'" size="48" style="color: var(--text-muted)")
                p.mt-3.text-sm.font-medium(style="color: var(--text-muted)") {{ emptyMessage || $t('common.noData') }}
                p.mt-1.text-xs(v-if="emptyDescription" style="color: var(--text-muted); opacity: 0.7") {{ emptyDescription }}
                .mt-4(v-if="emptyActionHref")
                  NuxtLink(:to="emptyActionHref")
                    el-button(type="primary" size="default" class="!rounded-2xl")
                      Icon(name="ph:plus-bold" size="14" class="mr-1")
                      | {{ emptyActionLabel || 'Create' }}
        el-dialog(v-model='fileShow'   class=" !bg-transparent  !shadow-none xl:!w-1/3 lg:!w-1/3 sm:!w-[90%] !w-full " align-center='' )
                LazyImg.m-auto(:src="srcOverlay" :key="srcOverlay" )

        .pagination.mt-5.flex.items-center.flex-wrap.gap-2.px-6(class=" sm:justify-between justify-center" v-if="!withoutPagination")

            .flex.items-center.gap-3
              span.text-xs.font-bold.text-muted.uppercase.tracking-widest {{ $t('common.showEntries') }}
              el-select(size="default"  v-model="limit" :placeholder="limit"  style="width: 75px" @change="handleSizeChange")
                el-option( v-for="item in [10,25,50]" :key="item" :label="item" :value="item" )
              span.text-xs.font-bold.text-muted.uppercase.tracking-widest {{ $t('common.entries') }}
            el-pagination( background style="direction:ltr"  :pager-count="4"  :page-count="pagintaion?.totalPages" v-model:current-page='currentPage' :page-size='limit'  layout=' prev, pager, next' :total='pagintaion?.totalItems' aria-label="Table pagination" )
    TableFilter(v-model="filterBar" v-if="!withoutFilters" :filterOptions="filterOptions" @filter="handleFilter" @reset="handleReset")
</template>

<script setup lang="ts">
import { Calendar, Search } from '@element-plus/icons-vue';
import type { ElTable } from 'element-plus';
const filterBar = ref(false);
const route = useRoute();
const router = useRouter();
const isLoading = ref(false);

const tableRef = ref<InstanceType<typeof ElTable> | null>(null);
const props = defineProps({
  columns: {
    type: Array,
    required: true
  },
  filterOptions: {
    type: Array,
    required: true
  },
  withoutFilters: {
    type: Boolean,
    required: false,
    default: false
  },
  exportButton: {
    type: Boolean,
    required: false,
    default: false
  },
  withoutPagination: {
    type: Boolean,
    required: false,
    default: false
  },
  withoutSearch: {
    type: Boolean,
    required: false,
    default: false
  },
  withoutAction: {
    type: Boolean,
    required: false,
    default: false
  },
  data: {
    type: Array,
    required: true
  },
  searchPlaceholder: {
    type: String,
    default: ''
  },
  position: {
    type: String,
    default: ''
  },
  pageInfo: {
    type: Object,
    required: false,
    default: { totalCount: 20, totalPages: 2 }
  },
  sortOptions: {
    type: Object,
    required: false
  },
  externalLoading: {
    type: Boolean,
    required: false,
    default: false
  },
  emptyIcon: {
    type: String,
    default: ''
  },
  emptyMessage: {
    type: String,
    default: ''
  },
  emptyDescription: {
    type: String,
    default: ''
  },
  emptyActionHref: {
    type: String,
    default: ''
  },
  emptyActionLabel: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  }
});

watch(
  () => props.externalLoading,
  () => {
    isLoading.value = props.externalLoading;
  }
);

const fileShow = ref(false);
const srcOverlay = ref('');

const limit = ref(10);
const currentPage = ref<number>(1);
const sort = ref<{ prop?: string; order?: string }>({});
const filters = ref<Record<string, unknown>>({});
const search = ref<string>('');
search.value = (route.query.searchKey as string) || '';
const pagintaion = ref<{ totalPages?: number; totalItems?: number }>({});
pagintaion.value = props.pageInfo;
sort.value = {
  prop: route.query.sortBy || '',
  order: route.query.sort === 'ASC' ? 'ascending' : 'descending'
};
function showfile(value: string) {
  fileShow.value = true;
  srcOverlay.value = value;
}

// sort

function handleSortChange({ prop, order }: { prop: string; order: string }) {
  const formatProp =
    prop === 'leadDetails' || prop === 'dealDetails' || prop === 'staffDetails' ? 'name' : prop === 'ClientDetails' ? 'clientName' : prop;
  const formatSort = order === 'ascending' ? 'ASC' : 'DESC';
  filters.value.sortBy = formatProp;
  filters.value.sort = formatSort;
  getData();
}

// search
let timer: ReturnType<typeof setTimeout> | undefined;
function searchTimeOut() {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    filters.value.searchKey = search.value;
    await getData();
  }, 500);
}

const finalData = ref<Record<string, unknown>[]>([]);
finalData.value = props.data || [];
async function getData() {
  isLoading.value = true;
  const data = await useTableFilter(props.position, filters.value);
  finalData.value = data.formattedData;
  pagintaion.value = data.pagination;
  isLoading.value = false;
}
function handleFilterChange(_value: Record<string, unknown>) {
  // filters.value = value;
}

const handleSizeChange = (val: number) => {
  filters.value.limit = val;
  getData();
};

watch(
  () => currentPage.value,
  () => {
    filters.value.page = currentPage.value;
    getData();
  }
);

const handleFilter = async (filteration: Record<string, unknown>) => {
  if (isObjectValid(filteration)) {
    filters.value = { ...filters.value, ...filteration };
  } else {
    filters.value = {};
    tableRef.value?.clearSort();
  }
  await getData();
  filterBar.value = false;
  numberOfFilters.value = filterLength(filteration);
};

const handleReset = async () => {
  filters.value = {};
  await router.push({ path: route.path, query: {} });
  await getData();
  filterBar.value = false;
  numberOfFilters.value = 0;
  tableRef.value?.clearSort();
};

function calculateIndex(index: number) {
  const page: number = Number(route.query.page) || 1;
  const limit: number = Number(route.query.limit) || 10;
  return (page - 1) * limit + index + 1;
}
</script>

<style lang="scss">
.el-table {
  .blocked-row {
    background-color: rgba(247, 96, 129, 0.154);
    opacity: 60%;
  }

  .deleted-row {
    opacity: 40%;
  }

  .el-scrollbar__wrap.el-scrollbar__wrap--hidden-default {
    scrollbar-width: thin !important;
  }
}
@keyframes rowPulse {
  0% {
    background: rgba(168, 85, 247, 0);
  }
  50% {
    background: rgba(168, 85, 247, 0.1);
  }
  100% {
    background: rgba(168, 85, 247, 0);
  }
}

.pulse-row {
  animation: rowPulse 2s ease-out;
}
</style>
