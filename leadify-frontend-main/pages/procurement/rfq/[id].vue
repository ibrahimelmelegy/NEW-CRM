<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.gap-6.mb-8
    el-button(@click="router.back()", circle, :icon="ArrowLeft", class="premium-btn-outline !w-12 !h-12 !text-lg")
    .header-content
      .title.font-bold.text-3xl.text-gradient {{ $t('procurement.rfq.quoteComparison') }}
      .subtitle.text-muted.text-sm {{ rfq?.rfqNumber }} - {{ rfq?.title }}

  .grid.grid-cols-1.gap-8(v-if="rfq")
    //- Status Card
    .glass-card.p-6
        .flex.items-center.justify-between
            div
                .text-xs.uppercase.tracking-widest.text-muted.mb-1 {{ $t('procurement.rfq.deadline') }}
                .font-bold.text-white {{ new Date(rfq.deadLine).toLocaleDateString() }}
            div
                .text-xs.uppercase.tracking-widest.text-muted.mb-1 {{ $t('procurement.rfq.status') }}
                el-tag(:type="getStatusType(rfq.status)" effect="dark") {{ rfq.status }}

            el-button(type="primary" @click="openAddOffer" class="premium-btn") {{ $t('procurement.rfq.addVendorOffer') }}

    //- Comparison Table
    .glass-card.p-0.overflow-hidden
        table.w-full.text-left.border-collapse
            thead
                tr.bg-white_5
                     th.p-4.text-xs.uppercase.tracking-widest.text-muted {{ $t('procurement.rfq.item') }}
                     th.p-4.text-xs.uppercase.tracking-widest.text-muted.text-center {{ $t('procurement.rfq.qty') }}
                     th.p-4.text-xs.uppercase.tracking-widest.text-white.text-center(v-for="vendor in rfq.vendors" :key="vendor.id" :class="{'bg-purple-500_20': isWinner(vendor)}")
                        .flex.flex-col.items-center
                            span {{ vendor.vendor?.name }}
                            el-tag(size="small" class="mt-1" :type="getVendorStatus(vendor.status)") {{ vendor.status }}
            tbody
                tr(v-for="item in rfq.items" :key="item.id" class="border-t border-white_10 hover:bg-white_5 transition-colors")
                    td.p-4
                        .font-bold.text-white {{ item.name }}
                        .text-xs.text-muted {{ item.description }}
                    td.p-4.text-center.font-mono {{ item.quantity }} {{ item.uom }}
                    td.p-4.text-center(v-for="vendor in rfq.vendors" :key="vendor.id" :class="{'bg-purple-500_10': isWinner(vendor)}")
                        .font-mono.text-white(v-if="getItemPrice(vendor, item.id)") {{ formatCurrency(getItemPrice(vendor, item.id)) }}
                        .text-xs.text-muted(v-else) -

                //- Totals Row
                tr.bg-white_5.font-bold
                    td.p-4.text-right(colspan="2") {{ $t('procurement.rfq.totalOffer') }}
                    td.p-4.text-center.text-lg(v-for="vendor in rfq.vendors" :key="vendor.id")
                        div(:class="{'text-green-400': isLowestPrice(vendor)}") {{ formatCurrency(vendor.totalOfferAmount) }}
                        el-button(v-if="vendor.status === 'Responded'" size="small" type="success" class="mt-2" @click="awardVendor(vendor)") {{ $t('procurement.rfq.awardPo') }}

  //- Record Tabs
  el-tabs.mt-6(v-model="activeRecordTab")
    el-tab-pane(:label="$t('common.timeline')" name="timeline")
      RecordTimeline(:entityType="'rfq'" :entityId="route.params.id as string")
    el-tab-pane(:label="$t('common.comments')" name="comments")
      RecordComments(:entityType="'rfq'" :entityId="route.params.id as string")
    el-tab-pane(:label="$t('common.attachments')" name="attachments")
      RecordAttachments(:entityType="'rfq'" :entityId="route.params.id as string")

  //- Add Offer Dialog (Mocked for now)
  el-dialog(v-model="offerDialogVisible" :title="$t('procurement.rfq.recordVendorResponse')" width="600px" class="glass-dialog")
     .p-4
        el-form
            el-form-item(:label="$t('procurement.rfq.selectVendor')")
                el-select(v-model="selectedVendor" class="w-full premium-select")
                   el-option(v-for="v in rfq?.vendors" :key="v.id" :label="v.vendor?.name" :value="v.id")
            el-form-item(:label="$t('procurement.rfq.totalOfferAmount')")
                el-input-number(v-model="offerAmount" class="w-full premium-input")
        .flex.justify-end.mt-4
            el-button(@click="submitOffer" type="primary") {{ $t('procurement.rfq.saveOffer') }}

</template>

<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue';
import { ElNotification } from 'element-plus';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const rfq = ref<any>(null);
const offerDialogVisible = ref(false);
const selectedVendor = ref(null);
const offerAmount = ref(0);
const activeRecordTab = ref('timeline');

onMounted(async () => {
  try {
    const res = await useApiFetch(`rfq/${route.params.id}`);
    if (res) {
      rfq.value = res;
    }
  } catch (e) {
    ElNotification({ title: t('common.error'), message: t('procurement.rfq.loadError'), type: 'error' });
  }
});

const getStatusType = (status: string) => {
  return status === 'Completed' ? 'success' : 'warning';
};

const getVendorStatus = (status: string) => {
  if (status === 'Won') return 'success';
  if (status === 'Lost') return 'danger';
  return 'info';
};

const getItemPrice = (vendor: any, itemId: string) => {
  // Navigate through RFQVendorItems to find price
  const item = vendor.items?.find((i: any) => i.rfqItemId === itemId);
  return item ? item.price : null;
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-SAR', { style: 'currency', currency: 'SAR' }).format(val);
};

// Logic to highlight lowest price
const isLowestPrice = (vendor: any) => {
  if (!rfq.value?.vendors) return false;
  const respondedVendors = rfq.value.vendors.filter((v: any) => v.totalOfferAmount > 0);
  if (respondedVendors.length === 0) return false;
  const min = Math.min(...respondedVendors.map((v: any) => parseFloat(v.totalOfferAmount)));
  return parseFloat(vendor.totalOfferAmount) === min;
};

const isWinner = (vendor: any) => vendor.status === 'Won';

function openAddOffer() {
  offerDialogVisible.value = true;
}

async function submitOffer() {
  try {
    // Quick mock integration
    await useApiFetch(`rfq/${route.params.id}/vendors/${selectedVendor.value}/response`, 'POST', {
      items: [], // Simplification: just updating total for demo
      notes: 'Manual Entry'
    });
    ElNotification({ title: t('common.success'), message: t('procurement.rfq.offerRecorded'), type: 'success' });
    offerDialogVisible.value = false;
    // Reload
    const res = await useApiFetch(`rfq/${route.params.id}`);
    rfq.value = res;
  } catch (e) {
    console.error(e);
  }
}

async function awardVendor(vendor: any) {
  ElNotification({ title: t('procurement.rfq.processing'), message: t('procurement.rfq.convertingToPo'), type: 'info' });
  // Future: Call API to convert
  setTimeout(() => {
    router.push('/procurement/purchase-orders');
    ElNotification({ title: t('common.success'), message: `${t('procurement.rfq.poCreatedFor')} ${vendor.vendor.name}`, type: 'success' });
  }, 1000);
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
.border-white_10 {
  border-color: rgba(255, 255, 255, 0.1);
}
.bg-purple-500_20 {
  background: rgba(168, 85, 247, 0.2);
}
.bg-purple-500_10 {
  background: rgba(168, 85, 247, 0.1);
}
</style>
