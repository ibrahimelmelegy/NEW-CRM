<template lang="pug">
el-form.mt-6.mb-24(  autocomplete="off"   @submit.prevent='onSubmit'   ref="myForm" label-position="top"  :validationSchema="formSchema" )
  .card.m-auto.glass-card.p-10.rounded-3xl(class="w-[90%] ")
    .grid.grid-cols-2.gap-3
      InputText.mt-4(:label="$t('operations.projects.manpower.accommodationCost')"  :placeholder="$t('operations.projects.manpower.placeholders.accommodation')" name="accommodationCost" :value="project?.accommodationCost" )
      InputText.mt-4(:label="$t('operations.projects.manpower.foodCost')"  :placeholder="$t('operations.projects.manpower.placeholders.food')" name="foodCost" :value="project?.foodCostPerDay" )
    InputText.mt-4(:label="$t('operations.projects.manpower.managementAddition')"  :placeholder="$t('operations.projects.manpower.placeholders.management')" name="managementAddition" :value="project?.managementAdditionPercentage" )
    .glass-card.rounded-3xl.mt-3.border.mt-8
      .flex.justify-justify-between.items-center.p-10.pb-0
        .title.font-bold.text-xl.capitalize.flex-1 {{ $t('operations.projects.manpower.title') }}
        el-button(class="!rounded-2xl" type='primary' @click='selectedManpower = {} ,addManpower = true' :icon="Plus" size="large" :loading="loading") {{ $t('common.add') }}
      AppTable(v-slot="{data}" without-filters without-search without-pagination :columns="manpowers.columns" :data="manpowers.data" :key="manpowers.data || values.accommodationCost" class="!py-0")
        .flex.items-center.py-2(@click.stop)
          el-button(class="!rounded-2xl" type='danger' link @click="selectedManpower = data, isDelete = true"): Icon(name="IconDelete" size="20")
          el-button(class="!rounded-2xl" type='primary' link @click="editManpower(data.id)"): Icon(name="IconEdit" size="20")
    .title.font-bold.text-xl.capitalize.flex-1.mt-8 {{ $t('operations.projects.manpower.preview') }}
    .glass-card.rounded-3xl.mt-3.border
      AppTable(without-filters without-search without-action without-pagination :columns="manPowerPreview.columns" :data="manPowerPreview.data" :key="manPowerPreview.data" class="!py-0")
    .glass-card.rounded-3xl.mt-3.border
      AppTable(without-filters without-search without-action without-pagination :columns="manPowertotal.columns" :data="manPowertotal.data" :key="manPowertotal.data" class="!py-0")
  .endBar
      .flex.justify-between.w-full
        el-button(   size='large' plain type="primary" class=" !rounded-2xl" @click="emit('cancel')") {{ $t('common.cancel') }}
        .flex.items-center.gap-x-2
          el-button(type="primary"  size='large' link :loading="loading"  :disabled="loading" class=" !px-5 !rounded-2xl" @click="activeStep--") {{ $t('common.back') }}
          el-button(   size='large' type="primary" native-type="submit" :loading="loading"  :disabled="loading" class=" !px-5 !rounded-2xl") {{ $t('common.next') }}
OperationsProjectsModalManpower(v-model="addManpower" v-if="addManpower" :manpower="selectedManpower"  @confirm="fetchProjectsManpowers")
ActionModel(v-model="isDelete" v-if="isDelete" :loading="loadingAction" @confirm="deleteManpower" :btn-text="$t('common.delete')" :title="$t('operations.projects.manpower.modals.deleteTitle')" :description="$t('operations.projects.manpower.modals.deleteConfirm')" icon="/images/delete-image.png" )
</template>

<script lang="ts" setup>
import { useForm } from 'vee-validate';
import * as yup from 'yup';
import { Plus } from '@element-plus/icons-vue';
import logger from '~/utils/logger';
const route = useRoute();
const props = defineProps({
  loading: Boolean,
  label: String,
  data: {
    type: Object,
    required: false
  },
  editMode: {
    type: Boolean,
    required: false
  }
});
const activeStep = defineModel<number>({ required: true });
const addManpower = ref(false);
const selectedManpower = ref<ProjectManpower>({});
const isDelete = ref(false);
const emit = defineEmits(['submit', 'cancel']);
const { t } = useI18n();
const loadingAction = ref(false);
const formSchema = yup.object({
  accommodationCost: yup.string().trim().required().min(1).max(100).label(t('operations.projects.manpower.accommodationCost')),
  foodCost: yup.string().trim().required().min(1).max(100).label(t('operations.projects.manpower.foodCost')),
  managementAddition: yup.string().trim().required().min(1).max(100).label(t('operations.projects.manpower.managementAddition'))
});

const { handleSubmit, values } = useForm({
  validationSchema: formSchema
});

const onSubmit = handleSubmit(async (values: unknown, actions: unknown) => {
  const formattedValues = cleanObject({
    accommodationCost: Number(values.accommodationCost),
    foodCostPerDay: Number(values.foodCost),
    managementAdditionPercentage: Number(values.managementAddition)
  });
  try {
    // Attempt to create the project
    await createtAssociatedManPower(formattedValues);
    activeStep.value++;
  } catch (error) {
    // Handle the error and prevent the step from being incremented
    logger.error('Project creation failed', error);
  }
  // emit('submit')
});

const manpowers = ref({
  columns: [
    {
      prop: 'name',
      label: t('operations.projects.manpower.table.manpowerName'),
      component: 'Text',
      // sortable: true,
      type: 'font-bold',
      width: 150
    },
    {
      prop: 'estimatedWorkDays',
      label: t('operations.projects.manpower.table.estimatedDays'),
      component: 'Text',
      // sortable: true,
      type: 'font-bold',
      width: 180
    },
    {
      prop: 'mission',
      label: t('operations.projects.manpower.table.mission'),
      component: 'Text',
      // sortable: true,
      type: 'font-default',
      width: 120
    },
    {
      prop: 'durationCost',
      label: t('operations.projects.manpower.table.durationCost'),
      component: 'Text',
      // sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'foodAllowanceCost',
      label: t('operations.projects.manpower.table.foodAllowance'),
      component: 'Text',
      // sortable: true,
      type: 'font-default',
      width: 200
    },
    {
      prop: 'accommodationCostPerManpower',
      label: t('operations.projects.manpower.table.accommodationPerMan'),
      component: 'Text',
      // sortable: true,
      type: 'font-default',
      width: 270
    },
    {
      prop: 'carRentPerManpower',
      label: t('operations.projects.manpower.table.carRentPerMan'),
      component: 'Text',
      // sortable: true,
      type: 'font-default',
      width: 200
    },
    {
      prop: 'otherCosts',
      label: t('operations.projects.manpower.table.otherCosts'),
      component: 'Text',
      // sortable: true,
      type: 'font-default',
      width: 150
    },
    {
      prop: 'totalCost',
      label: t('operations.projects.manpower.table.totalCost'),
      component: 'Text',
      // sortable: true,
      type: 'font-default',
      width: 150
    }
  ],
  data: [] as ProjectManpower[]
});
const manPowerPreview = ref({
  columns: [
    {
      prop: 'totalCarRent',
      label: t('operations.projects.manpower.previewTable.totalCarRent'),
      component: 'Text',
      // sortable: true,
      type: 'font-bold',
      width: 130
    },
    {
      prop: 'totalCarRentDuration',
      label: t('operations.projects.manpower.previewTable.totalCarRentDuration'),
      component: 'Text',
      // sortable: true,
      type: 'font-bold',
      width: 150
    },
    {
      prop: 'resourceCount',
      label: t('operations.projects.manpower.previewTable.resourceCount'),
      component: 'Text',
      // sortable: true,
      type: 'font-default',
      width: 120
    }
  ],
  data: [] as unknown
});
const manPowertotal = ref({
  columns: [
    {
      prop: 'totalCost',
      label: t('operations.projects.manpower.totalTable.manpowerTotal'),
      component: 'Text',
      // sortable: true,
      type: 'font-bold',
      width: 130
    },
    {
      prop: 'managementAdditionPercentage',
      label: t('operations.projects.manpower.totalTable.managementAddition'),
      component: 'Text',
      // sortable: true,
      type: 'font-bold',
      width: 130
    },
    {
      prop: 'finalManpowerTableTotalCost',
      label: t('operations.projects.manpower.totalTable.finalTotal'),
      component: 'Text',
      // sortable: true,
      type: 'font-bold',
      width: 150
    }
  ],
  data: [] as unknown
});

const totalManpowerCost = (data: unknown) => {
  return data?.reduce((sum: number, manpower: unknown) => sum + Number(manpower.totalCost || 0), 0) ?? 0;
};

const finalManpowerTotalCost = (data: unknown) => {
  return (totalManpowerCost(data) + (totalManpowerCost(data) * Number(values.managementAddition)) / 100)?.toFixed(2) || 0;
};

const totalCarRent = (data: unknown) => {
  // return data?.reduce((sum: number, manpower: unknown) => sum + manpower.carRentPerManpower, 0)?.toFixed(2) ?? 0;
  return project.value?.totalCarRent ?? 0;
};

const totalCarRentDuration = (data: unknown) => {
  // const carRent = totalCarRent(data);
  // const projectDuration = project.value?.duration ?? 0;

  // return (carRent > 0 ? (carRent / 30) * projectDuration : 0).toFixed(2);
  return project.value?.totalCarRentPerDuration?.toFixed(2);
};

let filteredData: unknown = [];
const fetchProjectsManpowers = async () => {
  const response = await getProjectManpowers();
  filteredData = response.filter(item => item?.projectId === projectId.value);
  if (response) {
    const accommodationCost =
      typeof Number(values.accommodationCost) === 'number' && !isNaN(Number(values.accommodationCost)) ? Number(values.accommodationCost) : 0;
    const foodCost = typeof Number(values.foodCost) === 'number' && !isNaN(Number(values.foodCost)) ? Number(values.foodCost) : 0;

    // Ensure data is an array and get its length
    const numManpowers = Array.isArray(filteredData) ? filteredData.length : 0;
    manpowers.value.data = filteredData?.map(manpower => {
      const accommodationCostPerManpower = numManpowers ? accommodationCost / numManpowers : 0;
      const estimatedWorkDays =
        typeof Number(manpower?.estimatedWorkDays) === 'number' && !isNaN(Number(manpower?.estimatedWorkDays))
          ? Number(manpower.estimatedWorkDays)
          : 0;
      const foodAllowanceCost = foodCost * estimatedWorkDays;
      const totalCost =
        (Number(manpower?.durationCost) || 0) +
        accommodationCostPerManpower +
        foodAllowanceCost +
        (Number(manpower?.carRentPerManpower) || 0) +
        (Number(manpower?.otherCosts) || 0);

      return {
        ...manpower,
        totalCost: totalCost?.toFixed(2),
        name: manpower?.manpower?.name || '-',
        mission: manpower?.mission?.join(', '),
        accommodationCostPerManpower: values.accommodationCost ? Number(values.accommodationCost) / filteredData?.length : 0,
        foodAllowanceCost: values.foodCost ? Number(values.foodCost) * Number(manpower?.estimatedWorkDays || 0) : 0
      };
    });
    manPowertotal.value.data = [
      {
        totalCost: formatNumber(totalManpowerCost(manpowers.value.data)?.toFixed(2)),
        managementAdditionPercentage: formatNumber((totalManpowerCost(manpowers.value.data) * Number(values.managementAddition)) / 100 || 0),
        finalManpowerTableTotalCost: formatNumber(finalManpowerTotalCost(manpowers.value.data))
      }
    ];
    manPowerPreview.value.data = [
      {
        totalCarRent: formatNumber(totalCarRent(filteredData)),
        totalCarRentDuration: formatNumber(totalCarRentDuration(filteredData)),
        resourceCount: filteredData?.length || 0
      }
    ];
  }
};

const deleteManpower = async () => {
  loadingAction.value = true;
  if (await deleteProjectManPower(selectedManpower.value?.id)) {
    await fetchProjectsManpowers();
  }
  selectedManpower.value = {};
  isDelete.value = false;
  loadingAction.value = false;
};
const editManpower = async (id: string) => {
  selectedManpower.value = await getProjectManpower(id);
  addManpower.value = true;
};
await fetchProjectsManpowers();

watch(
  () => [values.accommodationCost, values.foodCost, values.managementAddition],
  () => {
    // Validate accommodationCost and foodCost
    const accommodationCost =
      typeof Number(values.accommodationCost) === 'number' && !isNaN(Number(values.accommodationCost)) ? Number(values.accommodationCost) : 0;
    const foodCost = typeof Number(values.foodCost) === 'number' && !isNaN(Number(values.foodCost)) ? Number(values.foodCost) : 0;

    // Ensure data is an array and get its length
    const numManpowers = Array.isArray(filteredData) ? filteredData.length : 0;
    // Map each manpower entry with extra numeric checks
    manpowers.value.data = filteredData?.map(manpower => {
      const estimatedWorkDays =
        typeof Number(manpower?.estimatedWorkDays) === 'number' && !isNaN(Number(manpower?.estimatedWorkDays))
          ? Number(manpower.estimatedWorkDays)
          : 0;
      const manpowerTotalCost =
        typeof Number(manpower?.totalCost) === 'number' && !isNaN(Number(manpower?.totalCost)) ? Number(manpower.totalCost) : 0;

      const accommodationCostPerManpower = numManpowers ? accommodationCost / numManpowers : 0;
      const foodAllowanceCost = foodCost * estimatedWorkDays;
      const totalCost =
        (Number(manpower?.durationCost) || 0) +
        accommodationCostPerManpower +
        foodAllowanceCost +
        (Number(manpower?.carRentPerManpower) || 0) +
        (Number(manpower?.otherCosts) || 0);

      return {
        ...manpower,
        accommodationCostPerManpower: accommodationCostPerManpower?.toFixed(2),
        foodAllowanceCost: foodAllowanceCost?.toFixed(2),
        totalCost: totalCost?.toFixed(2),
        name: manpower?.manpower?.name || '-',
        mission: manpower?.mission?.join(', ')
      };
    });
    // Validate managementAddition
    const managementAddition =
      typeof Number(values.managementAddition) === 'number' && !isNaN(Number(values.managementAddition)) ? Number(values.managementAddition) : 0;
    const totalManpower = totalManpowerCost(manpowers.value.data);
    const finalManpowerTableTotalCost = (
      (Number(totalManpower) || 0) +
      ((Number(totalManpower) || 0) * (Number(managementAddition) || 0)) / 100
    ).toFixed(2);

    manPowertotal.value.data = [
      {
        totalCost: formatNumber(totalManpower?.toFixed(2)),
        managementAdditionPercentage: formatNumber(
          ((totalManpowerCost(manpowers.value.data) * Number(values.managementAddition)) / 100)?.toFixed(2) || 0
        ),
        finalManpowerTableTotalCost: formatNumber(finalManpowerTableTotalCost)
      }
    ];
  }
);
// watch(
//   () => values.managementAddition,
//   () => {
//     // Validate managementAddition
//     const managementAddition =
//       typeof Number(values.managementAddition) === 'number' && !isNaN(Number(values.managementAddition))
//         ? Number(values.managementAddition)
//         : 0;
//     const totalManpower = totalManpowerCost(manpowers.value.data);
//     const finalManpowerTableTotalCost = (totalManpower + (totalManpower * managementAddition) / 100).toFixed(2);
//     manPowertotal.value.data = [
//       {
//         totalCost: totalManpower,
//         finalManpowerTableTotalCost,
//       },
//     ];
//   }
// );
</script>
