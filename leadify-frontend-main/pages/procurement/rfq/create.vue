<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.gap-6.mb-8
    el-button(@click="router.back()", circle, :icon="ArrowLeft", class="premium-btn-outline !w-12 !h-12 !text-lg")
    .header-content
      .title.font-bold.text-3xl.text-gradient Create RFQ
      .subtitle.text-muted.text-sm Request for Quotation Wizard
  
  //- Wizard Steps
  .max-w-4xl.mx-auto.mb-10
    el-steps(:active="activeStep" finish-status="success" simple class="!bg-transparent !border-white_10")
      el-step(title="Request Details" :icon="Edit")
      el-step(title="Items Needed" :icon="List")
      el-step(title="Invite Vendors" :icon="UserFilled")

  .max-w-5xl.mx-auto
    //- STEP 1: Details
    .glass-card.p-8.step-content(v-show="activeStep === 0")
        .flex.items-center.gap-4.mb-8
             Icon(name="ph:file-text-bold" class="text-purple-400 text-2xl")
             span.text-xl.font-bold.text-gradient Basic Information

        el-form(:model="form", label-position="top", ref="step1Ref")
            .grid.grid-cols-1.md.grid-cols-2.gap-6
                el-form-item(prop="title", label="RFQ Title", :rules="[{ required: true, message: 'Title is required' }]")
                    el-input(v-model="form.title", placeholder="e.g. Q1 Office Supplies", class="premium-input")
                
                el-form-item(prop="projectId", label="Project")
                     el-select(v-model="form.projectId", placeholder="Select Project (Optional)", class="w-full premium-select", filterable, clearable)
                        el-option(v-for="p in projects" :key="p.id" :label="p.name" :value="p.id")

            .grid.grid-cols-1.md.grid-cols-2.gap-6.mt-4
                el-form-item(prop="deadLine", label="Response Deadline", :rules="[{ required: true, message: 'Deadline is required' }]")
                     el-date-picker(v-model="form.deadLine", type="date", placeholder="Select Date", class="!w-full premium-datepicker")

        .flex.justify-end.mt-8
            el-button(type="primary" @click="nextStep" class="premium-btn px-8") Next: Items

    //- STEP 2: Items
    .glass-card.p-8.step-content(v-show="activeStep === 1")
        .flex.items-center.justify-between.mb-8
          .flex.items-center.gap-4
             Icon(name="ph:shopping-cart-bold" class="text-orange-400 text-2xl")
             span.text-xl.font-bold.text-gradient Items List
          el-button(type="primary", :icon="Plus", size="small", @click="addItem", class="premium-btn-outline px-6 !rounded-xl") Add Item

        el-table(:data="form.items", style="width: 100%", class="premium-table mb-6")
          el-table-column(label="Item Name", min-width="200")
            template(#default="{row}")
              el-input(v-model="row.name", placeholder="Item Name", class="premium-input-small")
          el-table-column(label="Description", min-width="250")
            template(#default="{row}")
              el-input(v-model="row.description", placeholder="Specs / Details", class="premium-input-small")
          el-table-column(label="Qty", width="120")
            template(#default="{row}")
              el-input-number(v-model="row.quantity", :min="1", class="premium-number-input !w-full", :controls="false")
          el-table-column(label="UOM", width="120")
            template(#default="{row}")
               el-select(v-model="row.uom", class="premium-select-small")
                  el-option(label="PCS", value="PCS")
                  el-option(label="BOX", value="BOX")
                  el-option(label="KG", value="KG")
                  el-option(label="METER", value="METER")
          el-table-column(width="60", align="center")
            template(#default="{$index}")
              el-button(type="danger", :icon="Delete", circle, size="small", @click="form.items.splice($index, 1)", class="hover-glow-red")

        .flex.justify-between.mt-8
            el-button(@click="activeStep--", class="premium-btn-outline px-8") Back
            el-button(type="primary" @click="nextStep" class="premium-btn px-8") Next: Select Vendors

    //- STEP 3: Vendors
    .glass-card.p-8.step-content(v-show="activeStep === 2")
        .flex.items-center.justify-between.mb-8
             .flex.items-center.gap-4
                Icon(name="ph:users-three-bold" class="text-pink-400 text-2xl")
                span.text-xl.font-bold.text-gradient Invite Vendors
             
             .w-72
                el-input(v-model="searchQuery" placeholder="Search vendors..." prefix-icon="Search" class="premium-input-small" clearable)
        
        //- Data Table for Vendors
        .bg-white_5.rounded-2xl.border.border-white_10.p-4.mb-4
            el-table(:data="paginatedVendors" style="width: 100%" class="premium-table" @selection-change="handleSelectionChange" ref="vendorTableRef" row-key="id")
                el-table-column(type="selection" width="55" reserve-selection)
                el-table-column(label="Vendor Name" min-width="200" prop="name")
                    template(#default="{row}")
                        .font-bold.text-white {{ row.name }}
                        .text-xs.text-muted {{ row.email }}
                el-table-column(label="Type" width="150" prop="type")
                    template(#default="{row}")
                        el-tag(size="small" type="info" effect="dark" class="!bg-white_10 !border-none") {{ row.type }}
                el-table-column(label="Service" width="150")
                    template(#default="{row}")
                        el-tag(v-if="row.serviceType" size="small" type="primary" effect="dark" class="!bg-purple-500_20 !border-none !text-purple-300") {{ row.serviceType }}
                        span.text-muted(v-else) -
                el-table-column(label="Phone" width="150" prop="phone")
                    template(#default="{row}")
                        .text-sm {{ row.phone || '-' }}

            //- Empty State
            .flex.flex-col.items-center.justify-center.py-12.text-muted(v-if="filteredVendors.length === 0")
                 Icon(name="ph:users-three-thin" class="text-4xl mb-2 opacity-50")
                 span No Vendors Found
        
        //- Pagination
        .flex.justify-center.mt-4
            el-pagination(
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :total="filteredVendors.length"
                layout="prev, pager, next"
                background
                class="premium-pagination" 
                hide-on-single-page
            )

        .flex.justify-between.mt-8
            el-button(@click="activeStep--", class="premium-btn-outline px-8") Back
            el-button(type="success", :loading="loading", @click="submitRFQ", class="premium-btn px-8 !bg-green-600 hover:!bg-green-500 !border-none") Send RFQ

</template>

<script setup lang="ts">
import { ArrowLeft, Edit, List, UserFilled, Plus, Delete, Search } from '@element-plus/icons-vue'; // Added Search
import { ElNotification } from 'element-plus';

const router = useRouter();
const step1Ref = ref();
const activeStep = ref(0);
const loading = ref(false);

const vendors = ref<any[]>([]);
const projects = ref<any[]>([]);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const vendorTableRef = ref(); // Ref for table to handle selection

const form = reactive({
  title: '',
  projectId: null,
  deadLine: null,
  items: [{ name: '', description: '', quantity: 1, uom: 'PCS' }],
  vendorIds: [] as number[]
});

// Computed for Search + Pagination
const filteredVendors = computed(() => {
  if (!searchQuery.value) return vendors.value;
  const q = searchQuery.value.toLowerCase();
  return vendors.value.filter(
    v =>
      v.name?.toLowerCase().includes(q) ||
      v.email?.toLowerCase().includes(q) ||
      v.type?.toLowerCase().includes(q) ||
      v.serviceType?.toLowerCase().includes(q)
  );
});

const paginatedVendors = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredVendors.value.slice(start, end);
});

function handleSelectionChange(selection: any[]) {
  form.vendorIds = selection.map(v => v.id);
}

onMounted(async () => {
  try {
    const [vRes, pRes] = await Promise.all([
      // Fetch ALL vendors with limit=1000 to get full details for client-side search
      // Fetch ALL vendors with limit=1000 to get full details for client-side search
      useApiFetch('vendor?limit=1000'),
      useApiFetch('project/all')
    ]);
    console.log('RFQ Initial Data Fetch:', { vendors: vRes, projects: pRes });

    // Handle paginated response structure { docs: [], pagination: {} }
    const vendorData = (vRes as any).body || (vRes as any).data || vRes;
    if (vendorData && vendorData.docs) {
      vendors.value = vendorData.docs;
    } else if (Array.isArray(vendorData)) {
      vendors.value = vendorData;
    } else {
      vendors.value = [];
    }

    if (pRes) projects.value = (pRes as any).body || (pRes as any).data || pRes || [];
  } catch (e) {
    console.error('Failed to fetch initial data', e);
  }
});

function addItem() {
  form.items.push({ name: '', description: '', quantity: 1, uom: 'PCS' });
}
// Removed toggleVendor as table handles it via selection-change

async function nextStep() {
  if (activeStep.value === 0) {
    const valid = await step1Ref.value?.validate().catch(() => false);
    if (!valid) return;
  }
  if (activeStep.value === 1) {
    if (form.items.length === 0) {
      return ElNotification({ title: 'Validation', message: 'Please add at least one item', type: 'warning' });
    }
    const invalidItem = form.items.find(i => !i.name || !i.quantity);
    if (invalidItem) {
      return ElNotification({ title: 'Validation', message: 'All items must have a name and quantity', type: 'warning' });
    }
  }
  activeStep.value++;
}

async function submitRFQ() {
  if (form.vendorIds.length === 0) {
    return ElNotification({ title: 'Validation', message: 'Please select at least one vendor', type: 'warning' });
  }

  loading.value = true;
  try {
    const payload = {
      title: form.title,
      projectId: form.projectId,
      deadLine: form.deadLine,
      items: form.items
    };
    console.log('Submitting RFQ Payload:', JSON.parse(JSON.stringify(payload)));

    // 1. Create RFQ
    const rfqRes = await useApiFetch('rfq', 'POST', payload);
    console.log('RFQ Creation Response:', rfqRes);

    if (rfqRes && rfqRes.success && rfqRes.body) {
      const rfqId = rfqRes.body.id;
      console.log('Sending to vendors:', form.vendorIds);

      // 2. Send to Vendors
      const sendRes = await useApiFetch(`rfq/${rfqId}/send`, 'POST', {
        vendorIds: form.vendorIds
      });
      console.log('Send to Vendors Response:', sendRes);

      if (!sendRes || !sendRes.success) throw new Error(sendRes?.message || 'Failed to send to vendors');

      ElNotification({ title: 'Success', message: 'RFQ Created and Sent to Vendors!', type: 'success' });
      router.push('/procurement/rfq'); // Needs List page
    } else {
      throw new Error(rfqRes?.message || 'Failed to create RFQ');
    }
  } catch (error) {
    ElNotification({ title: 'Error', message: 'Failed to create RFQ', type: 'error' });
    console.error('Submit RFQ Error:', error);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.text-gradient {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.bg-white_5 {
  background: rgba(255, 255, 255, 0.05);
}
.bg-white_10 {
  background: rgba(255, 255, 255, 0.1);
}
.border-white_10 {
  border-color: rgba(255, 255, 255, 0.1);
}
.bg-purple-500_20 {
  background: rgba(168, 85, 247, 0.2);
}
.bg-purple-500_10 {
  background: rgba(168, 85, 247, 0.1);
}

.premium-input,
.premium-select,
.premium-datepicker {
  :deep(.el-input__wrapper) {
    background: rgba(255, 255, 255, 0.03) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 14px !important;
    box-shadow: none !important;
    height: 48px;
    color: white;
    &.is-focus {
      border-color: var(--purple-500) !important;
      background: rgba(168, 85, 247, 0.05) !important;
    }
  }
}

.premium-table {
  background: transparent !important;
  :deep(.el-table) {
    background: transparent !important;
    --el-table-bg-color: transparent;
    --el-table-header-bg-color: rgba(255, 255, 255, 0.03);
  }
  :deep(th.el-table__cell) {
    color: var(--text-secondary);
    background: rgba(255, 255, 255, 0.03) !important;
  }
}
.premium-pagination {
  :deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
    background-color: var(--purple-500) !important;
    color: white;
  }
  :deep(.el-pagination.is-background .el-pager li) {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--text-secondary);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  :deep(.el-pagination.is-background .btn-prev),
  :deep(.el-pagination.is-background .btn-next) {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--text-secondary);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
}
</style>
