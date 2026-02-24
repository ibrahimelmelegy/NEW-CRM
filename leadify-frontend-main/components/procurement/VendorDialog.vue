<template lang="pug">
el-dialog(
  v-model="visible", 
  :title="dialogTitle", 
  width="800px", 
  class="glass-dialog !rounded-3xl",
  destroy-on-close,
  append-to-body,
  top="5vh"
)
  .p-6.overflow-y-auto.custom-scrollbar(class="h-[75vh]")
    //- Entity Type Tabs (Unified Selector)
    .flex.justify-center.mb-8
      .p-1.bg-white.bg-opacity-5.rounded-2xl.flex.gap-1.border(style="border-color: var(--color-primary); border-opacity: 0.2")
        .cursor-pointer.px-6.py-2.rounded-xl.transition-all.duration-300.text-sm.font-medium(
          v-for="type in entityTypes"
          :key="type.value"
          :class="[form.type === type.value ? 'text-white shadow-glow' : 'text-gray-400 hover:text-white hover:bg-white hover:bg-opacity-5']"
          :style="form.type === type.value ? 'background-color: var(--color-primary)' : ''"
          @click="form.type = type.value"
        ) {{ type.label }}

    el-form(:model="form", label-position="top", ref="formRef", @submit.prevent)
      
      //- Business Details
      .section-header.flex.items-center.gap-2.mb-4
        Icon(name="ph:briefcase-bold" class="text-blue-400 text-xl")
        span.font-bold.text-lg.text-white {{ $t('vendors.dialog.businessDetails') }}

      .grid.grid-cols-2.gap-4.mb-4
        el-form-item(prop="name", :rules="[{ required: true, message: $t('vendors.dialog.nameRequired') }]", class="col-span-2")
          template(#label)
            span.text-xs.uppercase.tracking-wider.font-semibold.text-muted {{ $t('vendors.dialog.companyName') }}
          el-input(
            v-model="form.name",
            :placeholder="$t('vendors.dialog.companyNamePlaceholder')",
            class="premium-input"
          )
            template(#prefix)
                Icon(name="ph:buildings-bold" style="color: var(--color-primary)")

      .grid.grid-cols-2.gap-4.mb-6
        el-form-item(:label="$t('vendors.dialog.serviceType')")
           template(#label)
             span.text-xs.uppercase.tracking-wider.font-semibold.text-muted {{ $t('vendors.dialog.serviceType') }}
           el-select(v-model="form.serviceType" :placeholder="$t('vendors.dialog.selectType')" class="premium-select w-full")
             el-option(:label="$t('vendors.dialog.hardware')" value="Hardware")
             el-option(:label="$t('vendors.dialog.software')" value="Software")
             el-option(:label="$t('vendors.dialog.both')" value="Both")

        el-form-item(:label="$t('vendors.dialog.brands')")
           template(#label)
             span.text-xs.uppercase.tracking-wider.font-semibold.text-muted {{ $t('vendors.dialog.brands') }}
           el-select(
             v-model="form.brands"
             multiple
             filterable
             allow-create
             default-first-option
             :placeholder="$t('vendors.dialog.addBrands')"
             class="premium-select w-full"
           )

      .grid.grid-cols-2.gap-4.mb-6
        el-form-item(:label="$t('vendors.dialog.taxId')", prop="taxId")
          template(#label)
            span.text-xs.uppercase.tracking-wider.font-semibold.text-muted {{ $t('vendors.dialog.taxId') }}
          el-input(v-model="form.taxId", :placeholder="$t('vendors.dialog.taxIdPlaceholder')", class="premium-input")
            template(#prefix)
               Icon(name="ph:hash-bold" style="color: var(--color-primary)")

        el-form-item(:label="$t('vendors.dialog.crNumber')", prop="commercialRegistration")
          template(#label)
            span.text-xs.uppercase.tracking-wider.font-semibold.text-muted {{ $t('vendors.dialog.crNumber') }}
          el-input(v-model="form.commercialRegistration", :placeholder="$t('vendors.dialog.crPlaceholder')", class="premium-input")

      //- Contact Details
      .section-header.flex.items-center.gap-2.mb-4.mt-8
        Icon(name="ph:phone-bold" class="text-green-400 text-xl")
        span.font-bold.text-lg.text-white {{ $t('vendors.dialog.contactInfo') }}

      .grid.grid-cols-2.gap-4.mb-4
        el-form-item(:label="$t('vendors.dialog.phone')", prop="phone")
          template(#label)
            span.text-xs.uppercase.tracking-wider.font-semibold.text-muted {{ $t('vendors.dialog.phone') }}
          el-input(v-model="form.phone", :placeholder="$t('vendors.dialog.phonePlaceholder')", class="premium-input")
            template(#prefix)
                Icon(name="ph:phone" class="text-green-400")

        el-form-item(:label="$t('vendors.dialog.email')", prop="email")
          template(#label)
            span.text-xs.uppercase.tracking-wider.font-semibold.text-muted {{ $t('vendors.dialog.email') }}
          el-input(v-model="form.email", :placeholder="$t('vendors.dialog.emailPlaceholder')", class="premium-input")
             template(#prefix)
                Icon(name="ph:envelope-simple" class="text-blue-400")

      //- Principal Contact
      .grid.grid-cols-2.gap-4.mb-4
         el-form-item(:label="$t('vendors.dialog.contactFirstName')")
           template(#label)
              span.text-xs.uppercase.tracking-wider.font-semibold.text-muted {{ $t('vendors.dialog.contactFirstName') }}
           el-input(v-model="form.firstName", :placeholder="$t('vendors.dialog.firstNamePlaceholder')", class="premium-input")

         el-form-item(:label="$t('vendors.dialog.contactLastName')")
           template(#label)
              span.text-xs.uppercase.tracking-wider.font-semibold.text-muted {{ $t('vendors.dialog.contactLastName') }}
           el-input(v-model="form.lastName", :placeholder="$t('vendors.dialog.lastNamePlaceholder')", class="premium-input")


      //- Address Section
      .section-header.flex.items-center.gap-2.mb-4.mt-8
        Icon(name="ph:map-pin-bold" class="text-red-400 text-xl")
        span.font-bold.text-lg.text-white {{ $t('vendors.dialog.address') }}

      .grid.grid-cols-1.gap-4.mb-4
        el-form-item(:label="$t('vendors.dialog.street')")
          template(#label)
             span.text-xs.uppercase.tracking-wider.font-semibold.text-muted {{ $t('vendors.dialog.street') }}
          el-input(v-model="form.address.street", :placeholder="$t('vendors.dialog.streetPlaceholder')", class="premium-input")

        el-form-item(:label="$t('vendors.dialog.street2')")
          template(#label)
             span.text-xs.uppercase.tracking-wider.font-semibold.text-muted {{ $t('vendors.dialog.street2') }}
          el-input(v-model="form.address.street2", :placeholder="$t('vendors.dialog.street2Placeholder')", class="premium-input")

      .grid.grid-cols-3.gap-4.mb-4
         el-form-item(:label="$t('vendors.dialog.city')")
           template(#label)
              span.text-xs.uppercase.tracking-wider.font-semibold.text-muted {{ $t('vendors.dialog.city') }}
           el-input(v-model="form.address.city", :placeholder="$t('vendors.dialog.cityPlaceholder')", class="premium-input")

         el-form-item(:label="$t('vendors.dialog.state')")
           template(#label)
              span.text-xs.uppercase.tracking-wider.font-semibold.text-muted {{ $t('vendors.dialog.state') }}
           el-input(v-model="form.address.state", :placeholder="$t('vendors.dialog.statePlaceholder')", class="premium-input")

         el-form-item(:label="$t('vendors.dialog.zip')")
           template(#label)
              span.text-xs.uppercase.tracking-wider.font-semibold.text-muted {{ $t('vendors.dialog.zip') }}
           el-input(v-model="form.address.zip", :placeholder="$t('vendors.dialog.zipPlaceholder')", class="premium-input")

  template(#footer)
    .flex.justify-end.gap-4.pb-4.px-4.border-t.border-white.border-opacity-10.pt-4
      el-button(@click="visible = false", class="premium-btn-outline !rounded-xl px-8") {{ $t('vendors.dialog.cancel') }}
      el-button(
        type="primary",
        :loading="loading",
        @click="submit",
        class="premium-btn !rounded-xl px-12"
      ) {{ vendor ? $t('vendors.dialog.saveChanges') : $t('vendors.dialog.createEntity') }}

</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const props = defineProps({
  modelValue: Boolean,
  vendor: Object,
  type: String,
  title: String
});

const emit = defineEmits(['update:modelValue', 'success']);

const visible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
});

const formRef = ref();
const loading = ref(false);

const entityTypes = computed(() => [
  { label: t('vendors.dialog.entityTypes.vendor'), value: 'Vendor' },
  { label: t('vendors.dialog.entityTypes.distributor'), value: 'Distributor' },
  { label: t('vendors.dialog.entityTypes.localSupplier'), value: 'LocalSupplier' },
  { label: t('vendors.dialog.entityTypes.showroom'), value: 'Showroom' }
]);

const dialogTitle = computed(() => {
  if (props.vendor) return t('vendors.dialog.editTitle');
  return t('vendors.dialog.createTitle');
});

const form = reactive({
  name: '',
  type: 'Vendor',
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  taxId: '',
  commercialRegistration: '',
  serviceType: '',
  brands: [] as string[],
  address: {
    street: '',
    street2: '',
    city: '',
    state: '',
    zip: ''
  },
  defaultPaymentMethod: 'Cash'
});

watch(
  () => props.vendor,
  val => {
    if (val) {
      Object.assign(form, val);
      if (!form.address) {
        form.address = { street: '', street2: '', city: '', state: '', zip: '' };
      }
      // Handle specific fields if they come differently from backend
      if (!form.brands) form.brands = [];
    } else {
      // Reset
      form.name = '';
      form.firstName = '';
      form.lastName = '';
      form.phone = '';
      form.email = '';
      form.taxId = '';
      form.commercialRegistration = '';
      form.serviceType = '';
      form.brands = [];
      form.address = { street: '', street2: '', city: '', state: '', zip: '' };
      form.defaultPaymentMethod = 'Cash';

      if (props.type) form.type = props.type;
    }
  },
  { immediate: true }
);

watch(
  () => props.type,
  newType => {
    if (!props.vendor && newType) {
      form.type = newType;
    }
  }
);

async function submit() {
  await formRef.value.validate();
  loading.value = true;
  try {
    const url = props.vendor ? `vendor/${props.vendor.id}` : 'vendor';
    const method = props.vendor ? 'PUT' : 'POST';

    const res = await useApiFetch(url, method, form);
    if (!res.success) throw new Error(res.message || t('vendors.dialog.saveFailed'));

    // Check if created type matches the current filter context
    if (props.type && form.type && props.type !== form.type) {
      ElNotification({
        title: t('common.success'),
        type: 'warning',
        message: t('vendors.dialog.savedAs', { type: form.type }),
        duration: 5000
      });
    } else {
      ElNotification({ title: t('common.success'), type: 'success', message: t('vendors.dialog.savedSuccess') });
    }

    emit('success');
    visible.value = false;
  } catch (error) {
    ElNotification({ title: t('common.error'), type: 'error', message: t('vendors.dialog.saveFailed') });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
@import "@/assets/styles/tokens/_materials.scss";

.glass-dialog {
  :deep(.el-dialog) {
    @include acrylic-material;
    border-radius: var(--radius-large);
    box-shadow: var(--elevation-shadow-64);
  }

  :deep(.el-dialog__header) {
    border-bottom: 1px solid var(--color-border-default);
    margin-right: 0;
    padding: 20px 25px;
    .el-dialog__title {
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }
  }
}

.custom-scrollbar {
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--color-primary-alpha-20);
    border-radius: 10px;
    &:hover {
      background: var(--color-primary-alpha-40);
    }
  }
}

.premium-input {
  :deep(.el-input__wrapper) {
    background: var(--color-neutral-background-3) !important;
    border: 1px solid var(--color-border-default) !important;
    border-radius: var(--radius-medium) !important;
    box-shadow: none !important;
    height: 44px;
    transition: all var(--duration-normal) var(--curve-standard);

    &.is-focus {
      border-color: var(--color-primary) !important;
      background: var(--color-primary-alpha-05) !important;
      box-shadow: 0 0 0 2px var(--color-primary-alpha-20) !important;
    }
  }

  :deep(input) {
    color: var(--color-text-primary);
    &::placeholder {
      color: var(--color-text-disabled);
    }
  }
}

.premium-select {
  :deep(.el-input__wrapper) {
    background: var(--color-neutral-background-3) !important;
    border: 1px solid var(--color-border-default) !important;
    border-radius: var(--radius-medium) !important;
    height: 44px;
    box-shadow: none !important;
  }
  :deep(.el-select__tags) {
    max-width: 100% !important;
  }
}

.shadow-glow {
  box-shadow: 0 0 15px var(--color-primary-alpha-30);
}
</style>
