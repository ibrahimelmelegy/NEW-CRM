<template lang="pug">
.p-8.animate-entrance.w-full.mx-auto(class="max-w-[1800px]")
  .flex.items-center.justify-between.mb-10
    .flex.items-center.gap-6
      el-button(@click="router.back()", circle, :icon="ArrowLeft", class="premium-btn-outline !w-12 !h-12 !text-lg")
      .header-content
        .title.font-black.text-4xl.text-gradient Create Purchase Order
        .subtitle.text-muted.text-base.mt-1 AI-Assisted Procurement Request

  .grid.grid-cols-12.gap-8
    //- Left Column: Main Form (8 cols)
    .col-span-12.xl.col-span-8.space-y-8
      //- SECTION 1: Supplier & Details
      .glass-card.p-10.relative.overflow-hidden
        .absolute.top-0.right-0.p-10.opacity-5
             Icon(name="ph:buildings-duotone" class="text-9xl text-purple-500")
        
        .flex.items-center.gap-4.mb-8
             .p-3.rounded-xl.bg-purple-500_10.border.border-purple-500_20
                Icon(name="ph:identification-badge-bold" class="text-purple-400 text-2xl")
             span.text-2xl.font-bold.text-white Supplier & Terms
        
        el-form(:model="form", label-position="top", ref="formRef")
          .grid.grid-cols-1.md.grid-cols-2.gap-8
            el-form-item(prop="vendorId", :rules="[{ required: true, message: 'Vendor is required' }]")
              template(#label)
                span.text-xs.uppercase.font-bold.tracking-widest.text-muted Vendor Selection
              el-select(v-model="form.vendorId", placeholder="Search and select supplier...", class="w-full premium-select-large", filterable, remote)
                el-option(v-for="v in vendors", :key="v.id", :label="v.name", :value="v.id")
                  .flex.items-center.justify-between.w-full
                    .flex.items-center.gap-3
                        el-avatar(:size="24" :src="v.logo" shape="circle" class="bg-white_10") {{ v.name?.charAt(0) }}
                        .flex.flex-col
                            span.font-bold.text-white {{ v.name }}
                            span.text-xs.text-muted {{ v.email }}
                    el-tag(size="small" type="info" class="!bg-white_5 !border-none") {{ v.type }}
            
            el-form-item(prop="projectId")
              template(#label)
                span.text-xs.uppercase.font-bold.tracking-widest.text-muted Project Allocation
              el-select(v-model="form.projectId", placeholder="Assign to project...", class="w-full premium-select-large", filterable, clearable)
                el-option(v-for="p in projects", :key="p.id", :label="p.name", :value="p.id")
                  .flex.items-center.gap-3
                    Icon(name="ph:projector-screen-duotone" class="text-orange-400")
                    span.font-medium {{ p.name }}
          
          .grid.grid-cols-1.md.grid-cols-3.gap-8.mt-6
            el-form-item(label="Payment Terms", prop="paymentTerms")
               el-select(v-model="form.paymentTerms", class="w-full premium-select", placeholder="Select terms")
                 template(#prefix) <Icon name="ph:credit-card" class="mr-2"/>
                 el-option(label="Immediate Payment" value="Immediate")
                 el-option(label="Net 15 Days" value="Net 15")
                 el-option(label="Net 30 Days" value="Net 30")
                 el-option(label="Net 60 Days" value="Net 60")
                 el-option(label="50/50 Split" value="50-50")
            
            el-form-item(label="Expected Delivery", prop="dueDate")
               el-date-picker(v-model="form.dueDate", type="date", placeholder="Select date", class="!w-full premium-datepicker")
            
            el-form-item(label="Reference / Note", prop="attachments")
               el-input(v-model="form.attachments", placeholder="#REF-001", class="premium-input")

      //- SECTION 2: Items List
      .glass-card.p-10
        .flex.items-center.justify-between.mb-8
          .flex.items-center.gap-4
             .p-3.rounded-xl.bg-pink-500_10.border.border-pink-500_20
                Icon(name="ph:shopping-cart-bold" class="text-pink-400 text-2xl")
             span.text-2xl.font-bold.text-white Order Items
          
          el-button(type="primary", :icon="Plus", @click="addItem", class="premium-btn-outline px-8 !h-12 !rounded-xl text-base") Add Product
        
        el-table(:data="form.items", style="width: 100%; height: auto !important;", class="premium-table mb-8 table-auto-height")
          el-table-column(label="#" width="50" align="center")
            template(#default="{$index}")
                span.text-muted.font-mono {{ $index + 1 }}
          el-table-column(label="Item Details" min-width="300")
            template(#default="{row}")
              el-input(v-model="row.description", placeholder="Item name, specs, or SKU...", class="premium-input-transparent font-medium")
          el-table-column(label="Quantity" width="120")
            template(#default="{row}")
              el-input-number(v-model="row.quantity", :min="1", class="premium-number-input !w-full", :controls="false")
          el-table-column(label="Unit Price" width="160")
            template(#default="{row}")
              el-input-number(v-model="row.unitPrice", :min="0", :precision="2", class="premium-number-input !w-full", :controls="false")
                template(#prefix) <span class="text-xs text-muted mr-1">$</span>
          el-table-column(label="Tax %" width="100")
            template(#default="{row}")
              el-input-number(v-model="row.tax", :min="0", :max="100", class="premium-number-input !w-full", :controls="false")
          el-table-column(label="Total" width="150" align="right")
            template(#default="{row}")
              span.font-bold.text-lg.text-white {{ ((row.quantity * row.unitPrice) * (1 + row.tax / 100)).toFixed(2) }}
          el-table-column(width="60" align="center")
            template(#default="{$index}")
              el-button(type="danger", :icon="Delete", circle, plain, class="!border-none !bg-transparent hover:!bg-red-500_20 text-red-400", @click="form.items.splice($index, 1)")

        //- Totals Section
        .flex.flex-col.items-end.gap-2.pt-8.border-t.border-white_10
            .flex.items-center.justify-between.w-full.max-w-xs.py-2
                span.text-muted Subtotal
                span.text-white {{ subTotal.toFixed(2) }}
            .flex.items-center.justify-between.w-full.max-w-xs.py-2
                span.text-muted Tax Amount
                span.text-white {{ taxTotal.toFixed(2) }}
            
            .flex.items-center.justify-between.w-full.max-w-md.mt-4.p-4.rounded-2xl.bg-white_5.border.border-white_10
                span.text-lg.font-bold.text-gradient Grand Total
                span.text-4xl.font-black.text-white {{ grandTotal.toFixed(2) }}
            
            .flex.gap-4.mt-8
                 el-button(size="large" class="premium-btn-ghost w-32 !h-14") Cancel
                 el-button(
                    type="primary", 
                    size="large", 
                    :loading="loading", 
                    @click="submit", 
                    class="premium-btn !rounded-xl w-64 !h-14 text-lg shadow-lg shadow-purple-900/50"
                  ) 
                    Icon(name="ph:paper-plane-right-bold" class="mr-2")
                    | Issue PO

    //- Right Column: AI & Summary (4 cols)
    .col-span-12.xl.col-span-4.space-y-8
      //- AI Magic Box
      .glass-card.p-8.overflow-hidden.relative.group
        .absolute.inset-0.bg-gradient-to-br.from-purple-600_20.to-orange-500_20.opacity-50
        .relative.z-10
          .flex.items-center.gap-3.mb-6
            .p-2.bg-orange-500_20.rounded-lg.text-orange-400
                Icon(name="ph:sparkles-fill" class="text-xl animate-pulse")
            span.text-lg.font-bold.text-white AI Auto-Fill
          
          p.text-sm.text-gray-300.mb-6.leading-relaxed 
            | Drag & drop a PDF invoice or quotation here. Leadify AI will extract line items, prices, and vendor details automatically.
          
          .border-2.border-dashed.border-white_20.rounded-2xl.p-8.text-center.transition-all.hover_border-purple-400.hover_bg-white_5.cursor-pointer(@click="triggerUpload")
             Icon(name="ph:file-pdf-duotone" class="text-5xl text-white_40 mb-3 group-hover:text-purple-400 transition-colors")
             .text-sm.font-bold.text-white Drop file or Browse
          
          .mt-6.flex.items-center.justify-between.text-xs.text-muted
             span Supported: PDF, PNG, JPG
             span.flex.items-center.gap-1 
                Icon(name="ph:lightning-fill" class="text-yellow-400")
                | Instant Process

</template>

<style scoped lang="scss">
.text-gradient {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.bg-white_5 { background: rgba(255, 255, 255, 0.05); }
.bg-white_10 { background: rgba(255, 255, 255, 0.1); }
.bg-purple-500_10 { background: rgba(168, 85, 247, 0.1); }
.bg-purple-500_20 { background: rgba(168, 85, 247, 0.2); }
.bg-pink-500_10 { background: rgba(236, 72, 153, 0.1); }
.border-purple-500_20 { border-color: rgba(168, 85, 247, 0.2); }
.border-pink-500_20 { border-color: rgba(236, 72, 153, 0.2); }
.text-white_40 { color: rgba(255, 255, 255, 0.4); }

.premium-input, .premium-select, .premium-datepicker {
  :deep(.el-input__wrapper) {
    background: rgba(255, 255, 255, 0.03) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 14px !important;
    box-shadow: none !important;
    height: 52px; /* Taller inputs */
    color: white;
    font-size: 15px;
    transition: all 0.3s ease;
    &.is-focus, &:hover {
        border-color: var(--purple-500) !important;
        background: rgba(168, 85, 247, 0.05) !important;
        transform: translateY(-1px);
    }
  }
}

.premium-select-large {
    @extend .premium-input;
    :deep(.el-input__wrapper) {
        height: 60px; /* Even taller for main selects */
        font-size: 16px;
        font-weight: 600;
    }
}

.premium-input-transparent {
    :deep(.el-input__wrapper) {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        padding-left: 0;
        font-size: 15px;
    }
}

.premium-number-input {
    :deep(.el-input__wrapper) {
        background: rgba(255, 255, 255, 0.03) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        border-radius: 12px !important;
        box-shadow: none !important;
        height: 42px;
    }
}

.premium-table {
    background: transparent !important;
    --el-table-bg-color: transparent;
    --el-table-tr-bg-color: transparent;
    --el-table-header-bg-color: rgba(255, 255, 255, 0.02);
    --el-table-border-color: rgba(255, 255, 255, 0.05);
    
    :deep(th.el-table__cell) {
        text-transform: uppercase;
        font-size: 11px;
        letter-spacing: 1px;
        color: var(--text-secondary);
        padding: 16px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
    }
    :deep(td.el-table__cell) {
        border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
        padding: 16px 0;
    }
}

.table-auto-height {
    :deep(.el-table__inner-wrapper) {
        height: auto !important;
    }
    :deep(.el-table__body-wrapper) {
        height: auto !important;
        overflow-y: hidden !important; /* Disable scroll */
    }
}

.premium-btn-ghost {
    background: rgba(255, 255, 255, 0.05);
    border: none;
    color: var(--text-secondary);
    &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
    }
}

</style>

<script setup lang="ts">
import { ArrowLeft, Plus, Delete, MagicStick } from "@element-plus/icons-vue";
import { ElNotification } from "element-plus";
import { useApiFetch } from "@/composables/useApiFetch";

const router = useRouter();
const formRef = ref();
const loading = ref(false);

const form = reactive({
  vendorId: null,
  projectId: null,
  paymentMethod: "Cash",
  paymentTerms: "Net 30",
  dueDate: null,
  attachments: "",
  items: [
    { description: "", quantity: 1, unitPrice: 0, tax: 15 }
  ]
});

const vendors = ref<any[]>([]);
const projects = ref<any[]>([]);

// Fetch initial data
onMounted(async () => {
  const vRes = await useApiFetch("vendor/all");
  vendors.value = vRes?.body || [];
  
  const pRes = await useApiFetch("project/all"); // Assuming this endpoint exists
  projects.value = pRes?.body || [];
});

function addItem() {
  form.items.push({ description: "", quantity: 1, unitPrice: 0, tax: 15 });
}

const subTotal = computed(() => {
  return form.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
});

const taxTotal = computed(() => {
  return form.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice * (item.tax / 100)), 0);
});

const grandTotal = computed(() => {
  return subTotal.value + taxTotal.value;
});

function triggerUpload() {
    // Trigger hidden file input logic
    console.log("Trigger upload");
}

async function handleOCR(file: any) {
  ElNotification({ title: "AI OCR", message: "Processing file...", type: "info" });
  try {
    // In a real app, we would send this to the OCR endpoint
    // await useApiFetch("ocr/extract", "POST", { file });
    
    // Simulating OCR result
    setTimeout(() => {
       form.items = [
         { description: "Material X", quantity: 50, unitPrice: 120, tax: 15 },
         { description: "Service Y", quantity: 1, unitPrice: 500, tax: 15 }
       ];
       ElNotification({ title: "OCR Success", message: "Data extracted successfully", type: "success" });
    }, 1500);
  } catch (error) {
    ElNotification({ title: "OCR Error", message: "Failed to extract data", type: "error" });
  }
}

async function submit() {
  await formRef.value.validate();
  if (form.items.length === 0) {
     return ElNotification({ title: "Error", message: "Add at least one item", type: "warning" });
  }
  
  loading.value = true;
  try {
    const payload = { ...form, totalAmount: grandTotal.value };
    console.log("DEBUG: Sending PO Payload:", JSON.parse(JSON.stringify(payload)));
    const res = await useApiFetch("procurement", "POST", payload);
    console.log("DEBUG: PO Creation Response:", res);
    
    if (!res || !res.status) {
        throw new Error(res?.message || "Unknown error during creation");
    }

    ElNotification({ title: "Success", type: "success", message: "Purchase Order created successfully" });
    router.push("/procurement/purchase-orders");
  } catch (error) {
    console.error("DEBUG: Frontend PO Submit Error:", error);
    ElNotification({ title: "Error", type: "error", message: "Failed to create PO" });
  } finally {
    loading.value = false;
  }
}
</script>
