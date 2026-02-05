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
      .p-1.bg-white.bg-opacity-5.rounded-2xl.flex.gap-1.border.border-purple-500.border-opacity-20
        .cursor-pointer.px-6.py-2.rounded-xl.transition-all.duration-300.text-sm.font-medium(
          v-for="type in entityTypes"
          :key="type.value"
          :class="[form.type === type.value ? 'bg-purple-500 text-white shadow-glow' : 'text-gray-400 hover:text-white hover:bg-white hover:bg-opacity-5']"
          @click="form.type = type.value"
        ) {{ type.label }}

    el-form(:model="form", label-position="top", ref="formRef", @submit.prevent)
      
      //- Business Details
      .section-header.flex.items-center.gap-2.mb-4
        Icon(name="ph:briefcase-bold" class="text-blue-400 text-xl")
        span.font-bold.text-lg.text-white Business Details

      .grid.grid-cols-2.gap-4.mb-4
        el-form-item(prop="name", :rules="[{ required: true, message: 'Name is required' }]", class="col-span-2")
          template(#label)
            span.text-xs.uppercase.tracking-wider.font-semibold.text-muted Company Name
          el-input(
            v-model="form.name", 
            placeholder="Official Company Name",
            class="premium-input"
          )
            template(#prefix)
                Icon(name="ph:buildings-bold" class="text-purple-400")
      
      .grid.grid-cols-2.gap-4.mb-6
        el-form-item(label="Service Type")
           template(#label)
             span.text-xs.uppercase.tracking-wider.font-semibold.text-muted Service Type
           el-select(v-model="form.serviceType" placeholder="Select Type" class="premium-select w-full")
             el-option(label="Hardware" value="Hardware")
             el-option(label="Software" value="Software")
             el-option(label="Both (Hardware & Software)" value="Both")

        el-form-item(label="Brands")
           template(#label)
             span.text-xs.uppercase.tracking-wider.font-semibold.text-muted Brands
           el-select(
             v-model="form.brands" 
             multiple 
             filterable 
             allow-create 
             default-first-option
             placeholder="Add Brands..." 
             class="premium-select w-full"
           )

      .grid.grid-cols-2.gap-4.mb-6
        el-form-item(label="Tax ID Number", prop="taxId")
          template(#label)
            span.text-xs.uppercase.tracking-wider.font-semibold.text-muted Tax ID Number
          el-input(v-model="form.taxId", placeholder="e.g. 123-456-789", class="premium-input")
            template(#prefix)
               Icon(name="ph:hash-bold" class="text-purple-400")
        
        el-form-item(label="C.R. Number", prop="commercialRegistration")
          template(#label)
            span.text-xs.uppercase.tracking-wider.font-semibold.text-muted C.R. Number
          el-input(v-model="form.commercialRegistration", placeholder="Registration #", class="premium-input")

      //- Contact Details
      .section-header.flex.items-center.gap-2.mb-4.mt-8
        Icon(name="ph:phone-bold" class="text-green-400 text-xl")
        span.font-bold.text-lg.text-white Contact Information

      .grid.grid-cols-2.gap-4.mb-4
        el-form-item(label="Phone Number", prop="phone")
          template(#label)
            span.text-xs.uppercase.tracking-wider.font-semibold.text-muted Phone Number
          el-input(v-model="form.phone", placeholder="+966 50 000 0000", class="premium-input")
            template(#prefix)
                Icon(name="ph:phone" class="text-green-400")

        el-form-item(label="Email", prop="email")
          template(#label)
            span.text-xs.uppercase.tracking-wider.font-semibold.text-muted Email
          el-input(v-model="form.email", placeholder="example@domain.com", class="premium-input")
             template(#prefix)
                Icon(name="ph:envelope-simple" class="text-blue-400")

      //- Principal Contact
      .grid.grid-cols-2.gap-4.mb-4
         el-form-item(label="Contact First Name")
           template(#label)
              span.text-xs.uppercase.tracking-wider.font-semibold.text-muted Contact First Name
           el-input(v-model="form.firstName", placeholder="First Name", class="premium-input")

         el-form-item(label="Contact Last Name")
           template(#label)
              span.text-xs.uppercase.tracking-wider.font-semibold.text-muted Contact Last Name
           el-input(v-model="form.lastName", placeholder="Last Name", class="premium-input")


      //- Address Section
      .section-header.flex.items-center.gap-2.mb-4.mt-8
        Icon(name="ph:map-pin-bold" class="text-red-400 text-xl")
        span.font-bold.text-lg.text-white Address

      .grid.grid-cols-1.gap-4.mb-4
        el-form-item(label="Street Address")
          template(#label)
             span.text-xs.uppercase.tracking-wider.font-semibold.text-muted Street Address
          el-input(v-model="form.address.street", placeholder="Street name", class="premium-input")

        el-form-item(label="Street Address Line 2")
          template(#label)
             span.text-xs.uppercase.tracking-wider.font-semibold.text-muted Street Address Line 2
          el-input(v-model="form.address.street2", placeholder="Appt, Suite, etc.", class="premium-input")

      .grid.grid-cols-3.gap-4.mb-4
         el-form-item(label="City")
           template(#label)
              span.text-xs.uppercase.tracking-wider.font-semibold.text-muted City
           el-input(v-model="form.address.city", placeholder="City", class="premium-input")
         
         el-form-item(label="State / Province")
           template(#label)
              span.text-xs.uppercase.tracking-wider.font-semibold.text-muted State / Province
           el-input(v-model="form.address.state", placeholder="State", class="premium-input")

         el-form-item(label="Postal / Zip Code")
           template(#label)
              span.text-xs.uppercase.tracking-wider.font-semibold.text-muted Postal / Zip Code
           el-input(v-model="form.address.zip", placeholder="Zip Code", class="premium-input")

  template(#footer)
    .flex.justify-end.gap-4.pb-4.px-4.border-t.border-white.border-opacity-10.pt-4
      el-button(@click="visible = false", class="premium-btn-outline !rounded-xl px-8") Cancel
      el-button(
        type="primary", 
        :loading="loading", 
        @click="submit", 
        class="premium-btn !rounded-xl px-12 glow-purple"
      ) {{ vendor ? 'Save Changes' : 'Create Entity' }}

</template>

<style scoped lang="scss">
.glass-dialog {
  :deep(.el-dialog) {
    background: rgba(30, 18, 48, 0.95) !important; 
    backdrop-filter: blur(25px) !important;
    border: 1px solid rgba(168, 85, 247, 0.2) !important;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
  }
  
  :deep(.el-dialog__header) {
    border-bottom: 1px solid rgba(168, 85, 247, 0.1);
    margin-right: 0;
    padding: 20px 25px;
    .el-dialog__title {
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 700;
        background: var(--gradient-primary);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
    }
  }
}

.custom-scrollbar {
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.02);
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(168, 85, 247, 0.2);
    border-radius: 10px;
    &:hover {
      background: rgba(168, 85, 247, 0.4);
    }
  }
}

.premium-input {
  :deep(.el-input__wrapper) {
    background: rgba(255, 255, 255, 0.03) !important;
    border: 1px solid rgba(168, 85, 247, 0.1) !important;
    border-radius: 12px !important;
    box-shadow: none !important;
    height: 44px;
    transition: all 0.3s ease;
    
    &.is-focus {
      border-color: var(--purple-500) !important;
      background: rgba(168, 85, 247, 0.05) !important;
      box-shadow: 0 0 15px rgba(168, 85, 247, 0.1) !important;
    }
  }
  
  :deep(input) {
     color: white;
     &::placeholder {
        color: rgba(255, 255, 255, 0.3);
     }
  }
}

.premium-select {
    :deep(.el-input__wrapper) {
        background: rgba(255, 255, 255, 0.03) !important;
        border: 1px solid rgba(168, 85, 247, 0.1) !important;
        border-radius: 12px !important;
        height: 44px;
        box-shadow: none !important;
    }
    :deep(.el-select__tags) {
       max-width: 100% !important;
    }
}

.shadow-glow {
    box-shadow: 0 0 15px rgba(168, 85, 247, 0.3);
}
</style>

<script setup lang="ts">
import { ElNotification } from "element-plus";

const props = defineProps({
  modelValue: Boolean,
  vendor: Object,
  type: String, 
  title: String,
});

const emit = defineEmits(["update:modelValue", "success"]);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const formRef = ref();
const loading = ref(false);

const entityTypes = [
  { label: 'Vendor', value: 'Vendor' },
  { label: 'Distributor', value: 'Distributor' },
  { label: 'Local Supplier', value: 'LocalSupplier' },
  { label: 'Showroom', value: 'Showroom' },
];

const dialogTitle = computed(() => {
    if (props.vendor) return "Edit Entity Details";
    return "Create New Entity";
});

const form = reactive({
  name: "",
  type: "Vendor",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  taxId: "",
  commercialRegistration: "",
  serviceType: "",
  brands: [] as string[],
  address: {
    street: "",
    street2: "",
    city: "",
    state: "",
    zip: ""
  },
  defaultPaymentMethod: "Cash",
});

watch(() => props.vendor, (val) => {
  if (val) {
    Object.assign(form, val);
    if (!form.address) {
        form.address = { street: "", street2: "", city: "", state: "", zip: "" };
    }
    // Handle specific fields if they come differently from backend
    if (!form.brands) form.brands = [];
  } else {
    // Reset
    form.name = "";
    form.firstName = "";
    form.lastName = "";
    form.phone = "";
    form.email = "";
    form.taxId = "";
    form.commercialRegistration = "";
    form.serviceType = "";
    form.brands = [];
    form.address = { street: "", street2: "", city: "", state: "", zip: "" };
    form.defaultPaymentMethod = "Cash";
    
    if (props.type) form.type = props.type;
  }
}, { immediate: true });

watch(() => props.type, (newType) => {
    if (!props.vendor && newType) {
        form.type = newType;
    }
});

async function submit() {
  await formRef.value.validate();
  loading.value = true;
  try {
    const url = props.vendor ? `vendor/${props.vendor.id}` : "vendor";
    const method = props.vendor ? "PUT" : "POST";
    
    const res = await useApiFetch(url, method, form);
    if (!res.success) throw new Error(res.message || "Failed to save");
    
    // Check if created type matches the current filter context
    if (props.type && form.type && props.type !== form.type) {
         ElNotification({ 
             title: "Saved", 
             type: "warning", 
             message: `Entity saved as ${form.type}. Switch tab to view it.`,
             duration: 5000
         });
    } else {
         ElNotification({ title: "Success", type: "success", message: "Saved successfully" });
    }
    
    emit("success");
    visible.value = false;
  } catch (error) {
    ElNotification({ title: "Error", type: "error", message: "Failed to save" });
  } finally {
    loading.value = false;
  }
}
</script>
