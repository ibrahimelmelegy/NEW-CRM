<template lang="pug">
el-form.mt-6.mb-24(  autocomplete="off"   @submit.prevent='onSubmit'   ref="myForm" label-position="top"  :validationSchema="formSchema" )
  .card.m-auto.glass-card.p-10.rounded-3xl(class="w-[90%] ")
    InputText.mt-4(:label="$t('operations.projects.materials.margin')" :placeholder="$t('operations.projects.materials.marginPlaceholder')" name="materialMargin" :value="project?.materialMargin" @value="getMaterialMargin" )
    .glass-card.rounded-3xl.mt-3.border.mt-8
      .flex.justify-justify-between.items-center.p-10.pb-0
        .title.font-bold.text-xl.capitalize.flex-1 {{ $t('operations.projects.materials.title') }}
        el-button(class="!rounded-2xl" type='primary' @click='addMaterial = true, material = {}, selectedAddMaterialItem = {}' :icon="Plus" size="large" :loading="loading") {{ $t('common.add') }}
      AppTable(v-slot="{data}" without-filters without-search without-pagination :columns="table.columns" :data="table.data" :key="table.data" class="!py-0")
        .flex.items-center.py-2(@click.stop)
          el-button(class="!rounded-2xl" type='danger' link @click="deleteMaterial(data.id)"): Icon(name="IconDelete" size="20")
          el-button(class="!rounded-2xl" type='primary' link @click="addMaterial = true, material = materials.find((material: Material) => material.id === data.id), selectedAddMaterialItem = { [data.additionalMaterialId]: addMaterialItems[data.additionalMaterialId] }"): Icon(name="IconEdit" size="20")
    .glass-card.rounded-3xl.mt-3.border.mt-8
      .p-10.pb-0.title.font-bold.text-xl.capitalize.flex-1 {{ $t('operations.projects.materials.preview') }}
      AppTable(without-filters without-search without-action without-pagination :columns="preview.columns" :data="preview.data" :key="preview.data" class="!py-0")
  .endBar
      .flex.justify-between.w-full
        el-button(   size='large' plain type="primary" class=" !rounded-2xl" @click="emit('cancel')") {{ $t('common.cancel') }}
        .flex.items-center.gap-x-2
          el-button( type="primary"  size='large' link :loading="loading"  :disabled="loading" class=" !px-5 !rounded-2xl" @click="activeStep--") {{ $t('common.back') }}
          el-button(   size='large' type="primary" native-type="submit" :loading="loading"  :disabled="loading" class=" !px-5 !rounded-2xl") {{ $t('common.next') }}
OperationsProjectsModalMaterial(v-model="addMaterial" :data="material" :allAddMaterialItems="addMaterialItems" :selectedAddMaterialItem="selectedAddMaterialItem" v-if="addMaterial"  @confirm="getMaterial")
</template>

<script lang="ts" setup>
/* eslint-disable no-use-before-define */
import { useForm } from 'vee-validate';
import * as yup from 'yup';
import { ref, computed, onMounted } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';
import logger from '~/utils/logger';

const props = defineProps({
  loading: Boolean,
  label: String,
  // data: Object as () => Record<string, unknown>,
  editMode: Boolean
});

const emit = defineEmits(['submit', 'cancel']);

const activeStep = defineModel<number>({ required: true });
const addMaterial = ref(false);
const materials = ref<Material[]>([]);
const material = ref<Material>();
const selectedAddMaterialItem = ref();
const materialMargin = ref<number>(0);
const addMaterials = ref<Material[]>([]);
const addMaterialItems = ref<Record<number, AdditionalMaterial[]>>({});
const route = useRoute();
const services = ref<Service[]>([]);

const { t } = useI18n();
const formSchema = yup.object({
  materialMargin: yup.string().trim().required().min(1).max(100).label(t('operations.projects.materials.margin'))
});

const { handleSubmit, values } = useForm({
  validationSchema: formSchema
});

const table = ref({
  columns: [
    { prop: 'description', label: t('operations.projects.materials.table.description'), component: 'Text', type: 'font-default', width: 400 },
    { prop: 'quantity', label: t('operations.projects.materials.table.quantity'), component: 'Text', type: 'font-default', width: 150 },
    { prop: 'unitPrice', label: t('operations.projects.materials.table.unitPrice'), component: 'Text', type: 'font-default', width: 120 },
    {
      prop: 'additionalMaterial',
      label: t('operations.projects.materials.table.category'),
      component: 'Text',
      type: 'font-default',
      width: 250
    },
    {
      prop: 'additionalMaterialCost',
      label: t('operations.projects.materials.table.additionalCost'),
      component: 'Text',
      type: 'font-default',
      width: 200
    },
    {
      prop: 'marginCommission',
      label: t('operations.projects.materials.table.marginCommission'),
      component: 'Text',
      type: 'font-default',
      width: 180
    },
    { prop: 'service', label: t('operations.projects.materials.table.service'), component: 'Text', type: 'font-default', width: 120 },
    { prop: 'servicePrice', label: t('operations.projects.materials.table.servicePrice'), component: 'Text', type: 'font-default', width: 120 },
    {
      prop: 'materialCost',
      label: t('operations.projects.materials.table.materialCost'),
      component: 'Text',
      type: 'font-default',
      width: 200
    },
    {
      prop: 'totalMaterialCost',
      label: t('operations.projects.materials.table.totalMaterialCost'),
      component: 'Text',
      type: 'font-default',
      width: 200
    }
  ],
  data: [] as MaterialMappedData[]
});
const preview = ref({
  columns: [
    {
      prop: 'totalMaterialCost',
      label: t('operations.projects.materials.table.totalMaterialCost'),
      component: 'Text',
      type: 'font-default',
      width: 200
    }
    // {
    //   prop: 'totalAdditionalMaterialCost',
    //   label: 'Total Additional Material Cost',
    //   component: 'Text',
    //   type: 'font-default',
    //   width: 300,
    // },
  ],
  data: [] as unknown
});

const response = await useTableFilter('additional-material');
addMaterials.value = response?.formattedData || [];

const serviceResponse = await useTableFilter('service');
services.value = serviceResponse?.formattedData || [];

if (project.value?.materials?.length) {
  materials.value = project.value.materials;
}

materialMargin.value = project.value?.materialMargin || 0;

if (project.value?.additionalMaterialItem?.length) {
  addMaterialItems.value = project.value.additionalMaterialItem?.reduce((acc: unknown, item: unknown) => {
    const materiaId = item.AdditionalMaterialItem.additionalMateria; // Get the value of additionalMateria
    if (!acc[materiaId]) {
      acc[materiaId] = []; // If the key doesn't exist, initialize it as an array
    }
    acc[materiaId].push({
      id: item.AdditionalMaterialItem.id,
      price: item.AdditionalMaterialItem.price,
      quantity: item.quantity
    });

    return acc;
  }, {});
}

const onSubmit = handleSubmit(async (values: unknown) => {
  const formattedValues = {
    materialMargin: Number(values.materialMargin),
    additionalMaterialItems: Object.keys(addMaterialItems.value).length ? addMaterialItems.value : {},
    materialsIds: materials.value.map((material: Material) => material.id) as number[]
  };

  try {
    if (formattedValues?.materialsIds?.length) {
      await createtAssociatedMaterial(formattedValues);
    }
    if (typeof activeStep.value === 'number') activeStep.value++;
  } catch (error) {
    logger.error('Project creation failed', error);
  }
});

function materialMappedData() {
  if (!materials.value.length) return [];

  return materials.value.map((material: Material) => {
    const additionalMaterials = addMaterialItems.value[material.additionalMaterialId || 0] || [];

    const totalAdditionalMaterialCost = additionalMaterials.reduce((sum: number, item: unknown) => {
      return sum + item.quantity * Number(item.price || 0);
    }, 0);

    const totalRelatedQuantity = materials.value
      .filter(m => m.additionalMaterialId === material.additionalMaterialId)
      .reduce((sum: number, item: unknown) => sum + item.quantity, 0);

    const additionalMaterialCost = totalRelatedQuantity > 0 ? totalAdditionalMaterialCost / totalRelatedQuantity : 0;
    const marginCommission = (material.unitPrice + additionalMaterialCost) * (materialMargin.value / 100 || 0);
    const servicePrice = material.serviceId ? services.value.find(s => s.id === material.serviceId)?.price : 0;
    const materialCost = material.unitPrice + additionalMaterialCost + marginCommission + (servicePrice || 0);
    const totalMaterialCost = materialCost * material.quantity;

    return {
      projectId: project.value.id,
      materialId: material.id,
      additionalMaterialId: material.additionalMaterialId,
      additionalMaterial: material.additionalMaterialId ? addMaterials.value.find(item => item.id === material.additionalMaterialId)?.name : '-',
      description: material.description,
      quantity: material.quantity,
      unitPrice: material.unitPrice,
      additionalMaterialCost: +additionalMaterialCost.toFixed(2),
      marginCommission: +marginCommission.toFixed(2),
      materialCost: +materialCost.toFixed(2),
      totalMaterialCost: +totalMaterialCost.toFixed(2),
      service: material.serviceId ? services.value.find(s => s.id === material.serviceId)?.type : '-',
      servicePrice,
      id: material.id
    };
  });
}

function removeDuplicatesKeepLast(arr: unknown) {
  // Create a map to store the last occurrence of each object based on its id
  const map = new Map();

  // Iterate through the array
  for (const item of arr) {
    // Use the id as the key in the map
    map.set(item.id, item);
  }

  // Convert the map values back to an array
  return Array.from(map.values());
}

function handleAdditionalMaterialItem(newItem: unknown) {
  // Iterate over each key in the new item
  for (const key in newItem) {
    const numKey = Number(key);
    // Check if the key already exists in the existing data
    if (Object.hasOwn(addMaterialItems.value ?? {}, key)) {
      // If the key exists, override the existing array with the new array (no addition, only replacement)
      addMaterialItems.value[numKey] = newItem[key];
    } else {
      // If the key does not exist, add the new key-value pair
      addMaterialItems.value[numKey] = newItem[key];
    }
  }
}

async function getMaterial(addedMaterial?: Material, finalMaterialsItems?: unknown) {
  const response = await useTableFilter('additional-material');
  addMaterials.value = response?.formattedData || [];
  const serviceResponse = await useTableFilter('service');
  services.value = serviceResponse?.formattedData || [];
  if (addedMaterial) {
    const index = materials.value?.findIndex((material: Material) => material.id === addedMaterial.id);
    if (index !== -1) {
      materials.value[index] = { ...addedMaterial };
    } else {
      materials.value.push(addedMaterial);
    }
  }
  if (finalMaterialsItems) handleAdditionalMaterialItem(finalMaterialsItems);
  table.value.data = materialMappedData();
  preview.value.data = [
    {
      totalMaterialCost: formatNumber(
        materialMappedData()
          ?.reduce((sum: number, item: unknown) => sum + item.totalMaterialCost, 0)
          ?.toFixed(2)
      ),
      totalAdditionalMaterialCost: formatNumber(
        materialMappedData()
          ?.reduce((sum: number, item: unknown) => sum + item.additionalMaterialCost, 0)
          .toFixed(2)
      )
    }
  ];
}
function excludeNameProperty(data: unknown) {
  if (!data || typeof data !== 'object') return {};
  return Object.entries(data).reduce(
    (acc, [key, value]: unknown) => {
      acc[key] = value.map(({ name, ...rest }: unknown) => rest);
      return acc;
    },
    {} as Record<string, unknown>
  );
}

function convertArrayToObject(inputArray: unknown) {
  if (!Array.isArray(inputArray)) return {};
  return inputArray.reduce(
    (acc: unknown, current: unknown) => {
      Object.keys(current).forEach(key => (acc[key] = current[key]));
      return acc;
    },
    {} as Record<string, unknown>
  );
}

interface Material {
  id: number;
  additionalMaterialId?: number;
  unitPrice: number;
  quantity: number;
  description: string;
  serviceId?: string;
  service?: { price?: number };
  name?: string;
}

interface AdditionalMaterial {
  quantity: number;
  price: number;
}

interface MaterialMappedData {
  description: string;
  quantity: number;
  unitPrice: number;
  projectId: number;
  materialId: number;
  additionalMaterialCost: number;
  additionalMaterial?: string;
  marginCommission: number;
  materialCost: number;
  totalMaterialCost: number;
  service?: string;
  id?: number;
}

interface Service {
  id: string;
  name: string;
  price?: number;
  type?: string;
}

function getMaterialMargin(val: unknown) {
  materialMargin.value = Number(val);
  getMaterial();
}

getMaterial();

async function deleteMaterial(id: number) {
  try {
    await ElMessageBox.confirm(t('common.deleteConfirm'), t('common.warning'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    });
    materials.value = materials.value.filter((material: Material) => material.id !== id);
    getMaterial();
  } catch {
    // User cancelled
  }
}
</script>
