<template lang="pug">
el-drawer(v-model="drawer", direction="rtl", :show-close="true" destroy-on-close size="440px" append-to-body)
  template(#header)
    h4(class="text-xl font-bold") Filter
  template(#default)
    .filter-content
      el-collapse(v-model="activeNames" @change="handleCollapseChange")
        el-collapse-item(v-for="(item, index) in data" :key="index" :title="item.title" :name="(index + 1).toString()")
          TableFilterDateRange(v-if="item.type === 'date'" :key="checkList" :value="checkList" :position="item.value" @value="handleDateChange")
          .grid.grid-cols-2.gap-3(v-else-if="item.type === 'input' && item.value?.length === 2")
            InputText(label="from" type="number" :value="Number(checkList?.[item.value?.[0]]?.[0])" :name="item?.value?.[0]" placeholder="10 $" @value="(value) => handleInputChange(value, item?.value?.[0])")
            InputText(label="to" type="number" :value="Number(checkList?.[item.value?.[1]]?.[0])"  :name="item.value[1]" placeholder="20 $", @value="(value) => handleInputChange(value, item.value?.[1])")
          InputText(v-else-if="item.type === 'input' && typeof item.value === 'string'" :key="checkList" type="number" :value="Number(checkList?.[item.value])"  :name="item.value" placeholder="20 $", @value="(value) => handleInputChange(value, item.value)")
          el-checkbox-group(v-else v-model="checkList[item.value]" class="flex flex-col" @change="handleSelectChange($event, item.value)")
            el-checkbox(v-for="option in item.options" :key="option.value" :label="option.label" :value="option.value")
              | {{ option.label }}
  template(#footer)
    .flex.gap-3
      el-button.flex-1(@click="resetFilters" size="large") Reset
      el-button.flex-1(type="primary" @click="applyFilters" size="large")
        span Apply
        span(v-if="selectedFiltersCount" class="ml-1") ({{ selectedFiltersCount }})
</template>

<script lang="ts" setup>
/* eslint-disable no-use-before-define */
import { ref, computed } from 'vue';
const route = useRoute();
const query = { ...route.query };
const router = useRouter();
const props = defineProps({
  filterOptions: {
    type: Array as PropType<FilterCategory[]>,
    default: () => [],
    required: true
  }
});
const emit = defineEmits(['filter', 'reset']);
// Drawer state
const drawer = defineModel();

// Collapse open state
const activeNames = ref<string[]>([]);

// CheckList: Store selected options for each filter category
const checkList = ref<Record<string, string | string[] | number[]>>({});

if (globalFilterOptions.value) {
  const processedFilterOptions = Object.entries(globalFilterOptions.value).reduce(
    (acc, [key, value]) => {
      if (key === 'userId') {
        acc[key] = Array.isArray(value) ? value.map(e => Number(e)) : typeof value === 'string' ? [Number(value)] : [];
      } else {
        acc[key] = Array.isArray(value) ? value : typeof value === 'string' ? [value] : value;
      }
      return acc;
    },
    {} as Record<string, unknown>
  );

  checkList.value = processedFilterOptions;
} else {
  checkList.value = {};
}

interface FilterOption {
  label: string;
  value: string;
}

interface FilterCategory {
  title: string;
  options?: FilterOption[];
  type?: string;
  value?: string;
}

const data = ref<FilterCategory[]>([]);
data.value = props.filterOptions.length ? props.filterOptions : [];
activeNames.value = data.value.map((_: unknown, index: number) => (index + 1).toString());

const selectedFiltersCount = computed(() => {
  return Object.values(checkList.value).reduce((acc: number, val: unknown) => {
    return acc + (Array.isArray(val) ? val.length : val ? 1 : 0);
  }, 0);
});

const handleInputChange = (value: unknown, type: string) => {
  checkList.value[type] = value ? [Number(value)] : [];
};

const handleSelectChange = (selectedValues: string[], categoryTitle: string) => {
  checkList.value[categoryTitle] = [...selectedValues];
};

const resetFilters = () => {
  checkList.value = {};
  emit('reset', checkList.value);
};

const handleDateChange = (date: unknown, type: string) => {
  // Date range or single date logic
};

const applyFilters = () => {
  emit('filter', checkList.value);
};

onMounted(() => {
  // numberOfFilters.value = filterLength(checkList.value);
});

const handleCollapseChange = (val: unknown) => {
  activeNames.value = val;
};
</script>
