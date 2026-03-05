<template lang="pug">
el-form.mt-6(  autocomplete="off"   @submit.prevent='onSubmit'   ref="myForm" label-position="top"  :validationSchema="formSchema" )
  .glass-card.m-auto.p-10.mb-3(class="w-[90%] ")
      .grid.gap-4(class="md:grid-cols-3 grid-cols-1")
        div
          .text-neutral-400.font-medium.mb-2.flex.items-center
            Icon(name="tabler:category-2" size="20" class="mr-2")
            p {{ $t('operations.projects.table.projectName') }}
          p.text-neutral-800.mb-2 {{project?.name || '-'}}
        div
          .text-neutral-400.font-medium.mb-2.flex.items-center
            Icon(name="IconAssign" size="20" class="mr-2")
            p {{ $t('operations.projects.table.clientName') }}
          p.text-neutral-800.mb-2  {{project?.client?.clientName || '-'}}
        div
          .text-neutral-400.font-medium.mb-2.flex.items-center
            Icon(name="IconCalendar" size="20" class="mr-2")
            p {{ $t('operations.projects.table.duration') }}
          p.text-neutral-800.mb-2  {{project?.duration || 0}} {{ $t('common.days') }}
  .card.m-auto.glass-card.p-10.rounded-3xl.mb-24(class="w-[90%] ")
    .title.font-bold.text-xl.capitalize.flex-1.mt-8 {{ $t('operations.projects.preview.finalCosts') }}
    .rounded-3xl.mt-3.border.mt-8
      AppTable(without-filters without-search without-action without-pagination :columns="finalCost.columns" :data="finalCost.data" class="!py-0")
    .flex.items-center.gap-3(class="md:flex-row flex-col")
      .flex-1.bg-neutral-50.p-4.rounded-3xl.mt-4
        el-checkbox(:label="$t('operations.projects.preview.haveDiscount')" v-model="haveDiscount")
        InputText(:placeholder="$t('operations.projects.preview.discountPlaceholder')" name="discount" :value="data?.discount" v-if="haveDiscount")
      .flex-1.bg-neutral-50.p-4.rounded-3xl.mt-4
        el-checkbox(:label="$t('operations.projects.preview.haveMargin')" v-model="haveMargin")
        InputText(:placeholder="$t('operations.projects.preview.marginPlaceholder')" name="margin" :value="data?.margin" v-if="haveMargin")
    .flex.justify-end.mt-12
      div
        p.text-lg.font-semibold.text-neutral-900.mb-3 {{ $t('common.summary') }}
        .flex.justify-between.items-center.gap-12.mb-4
          p.text-base.text-neutral-400 {{ $t('operations.projects.preview.grandTotal') }} :
          p.text-base.text-neutral-900 {{formatNumber((project?.grandTotal || 0)?.toFixed(2))}} {{ $t('common.sar') }}
        .flex.justify-between.items-center.gap-12.mb-4
          p.text-base.text-neutral-400 {{ $t('operations.projects.preview.vat') }} :
          p.text-base.text-neutral-900 {{formatNumber((project?.vat || 0)?.toFixed(2))}} {{ $t('common.sar') }}
        .flex.justify-between.items-center.gap-12.mb-4
          p.text-base.text-neutral-400 {{ $t('operations.projects.preview.discount') }} :
          p.text-base.text-neutral-900 {{formatNumber(Number(values.discount) || 0)}} {{ $t('common.sar') }}
        .flex.justify-between.items-center.gap-12.mb-4.border-b.pb-4
          p.text-base.text-neutral-400 {{ $t('operations.projects.preview.margin') }} ({{Number(values.margin) || 0}}%) :
          p.text-base.text-neutral-900 {{formatNumber(projectMargin?.toFixed(2))}} {{ $t('common.sar') }}
        .flex.justify-between.items-center.gap-12.mb-4
          p.text-base.text-neutral-900 {{ $t('operations.projects.preview.totalPrice') }} :
          p.text-base.text-neutral-900 {{formatNumber((((project?.grandTotal || 0) + (project?.grandTotal * 15 / 100 || 0)) + projectMargin - ((Number(values.discount) || 0)))?.toFixed(2))}} {{ $t('common.sar') }}
  .endBar
      .flex.justify-between.w-full
        el-button(   size='large' plain type="primary" class=" !rounded-2xl" @click="emit('cancel')") {{ $t('common.cancel') }}
        .flex.items-center.gap-x-2
          el-button( type="primary"  size='large' link :loading="loading"  :disabled="loading" class=" !px-5 !rounded-2xl" @click="activeStep--") {{ $t('common.back') }}
          el-button(   size='large' type="primary" native-type="submit" :loading="loading"  :disabled="loading" class=" !px-5 !rounded-2xl") {{ $t('common.finish') }}
</template>

<script lang="ts" setup>
import { useForm } from 'vee-validate';
import * as yup from 'yup';
import { Plus } from '@element-plus/icons-vue';
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
const emit = defineEmits(['submit', 'onFinish', 'cancel']);
const haveDiscount = ref(true);
const haveMargin = ref(true);

const { t } = useI18n();
const formSchema = computed(() => {
  const schema = {
    discount: yup.string().when([], {
      is: () => haveDiscount.value,
      then: () =>
        yup
          .string()
          .required()
          .test('is-valid-number', t('validation.phoneInvalid'), (value: unknown) => {
            return /^\d+$/.test(value || '');
          })
          .test('is-valid-discount', t('validation.invalidFormat'), (value: unknown) => {
            return value <= (project.value?.grandTotal || 0);
          })
          .max(999999999.99)
          .label(t('operations.projects.preview.discount'))
    }),
    margin: yup.string().when([], {
      is: () => haveMargin.value,
      then: () =>
        yup
          .string()
          .required()
          .test('is-valid-number', t('validation.phoneInvalid'), (value: unknown) => {
            return /^\d+$/.test(value || '');
          })
          .max(9999)
          .label(t('operations.projects.preview.margin'))
    })
  };
  return yup.object(schema);
});

const { handleSubmit, errors, values } = useForm({
  validationSchema: formSchema
});

const onSubmit = handleSubmit((values: unknown, actions: unknown) => {
  const formatedValues = cleanObject({
    discount: Number(values.discount),
    marginPercentage: Number(values.margin)
  });
  emit('onFinish', formatedValues);
  // emit('submit', values);
});

const finalCost = ref({
  columns: [
    {
      prop: 'finalManpowerTableTotalCost',
      label: t('operations.projects.manpower.totalTable.finalTotal'),
      component: 'Text',
      // sortable: true,
      type: 'font-default',
      width: 270
    },
    {
      prop: 'finalMaterialsTableCost',
      label: t('operations.projects.preview.finalMaterialsCost'),
      component: 'Text',
      // sortable: true,
      type: 'font-default',
      width: 250
    },
    {
      prop: 'finalAssetsTableCost',
      label: t('operations.projects.preview.finalAssetsCost'),
      component: 'Text',
      // sortable: true,
      type: 'font-default',
      width: 250
    }
    // {
    //   prop: 'grandTotal',
    //   label: 'Grand Total',
    //   component: 'Text',
    //   // sortable: true,
    //   type: 'font-default',
    //   width: 150,
    // },
    // {
    //   prop: 'vat',
    //   label: 'VAT',
    //   component: 'Text',
    //   // sortable: true,
    //   type: 'font-default',
    //   width: 150,
    // },
  ],
  data: [] as unknown
});

if (projectId.value) {
  finalCost.value.data = [
    {
      finalManpowerTableTotalCost: project.value?.finalManpowerTotalCost?.toFixed(2),
      finalMaterialsTableCost: project.value?.totalMaterialCost?.toFixed(2),
      finalAssetsTableCost: project.value?.totalAssetsCost?.toFixed(2),
      grandTotal: project.value?.grandTotal?.toFixed(2),
      vat: project.value?.vat?.toFixed(2)
    }
  ];
}

const projectMargin = computed(() => {
  if (project.value?.grandTotal) {
    return (project.value?.grandTotal * values.margin) / 100 || 0;
  }
  return 0;
});
</script>
