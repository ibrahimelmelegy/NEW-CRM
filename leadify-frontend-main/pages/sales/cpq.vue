<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-400">
            {{ $t('cpq.configPriceQuote') }}
          </h1>
          <p class="text-slate-400 text-sm mt-1">{{ $t('cpq.buildProfessionalQuotes') }}</p>
        </div>
        <el-button type="primary" class="!rounded-xl shadow-lg shadow-primary-500/20" @click="createQuote">
          <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" />
          {{ $t('cpq.newQuote') }}
        </el-button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-slate-200">{{ quotes.length }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('cpq.totalQuotes') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-emerald-400">{{ quotes.filter(q => q.status === 'APPROVED').length }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('cpq.approved') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-amber-400">{{ quotes.filter(q => q.status === 'PENDING').length }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('cpq.pending') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-indigo-400">{{ formatCurrency(totalQuoteValue) }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('cpq.totalValue') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-teal-400">{{ avgConversionRate }}%</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('cpq.winRate') }}</div>
      </div>
    </div>

    <!-- Tabs: Quotes / Product Catalog / Pricing Rules -->
    <el-tabs v-model="activeTab" class="glass-tabs">
      <!-- Quotes List -->
      <el-tab-pane :label="$t('cpq.quotes')" name="quotes">
        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="i in 6" :key="i" class="glass-panel p-6 rounded-xl animate-pulse h-40"></div>
        </div>
        <div v-else-if="quotes.length === 0" class="glass-panel p-12 rounded-2xl text-center">
          <Icon name="ph:file-text-bold" class="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-slate-300">{{ $t('cpq.noQuotesYet') }}</h3>
          <p class="text-slate-500 text-sm mt-2">{{ $t('cpq.noQuotesDesc') }}</p>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="quote in quotes" :key="quote.id" class="glass-panel p-5 rounded-xl hover:border-primary-500/30 transition-all">
            <div class="flex justify-between items-start mb-3">
              <div>
                <h4 class="text-sm font-medium text-slate-200">{{ quote.name }}</h4>
                <p class="text-xs text-slate-500 mt-1">{{ quote.clientName || $t('cpq.noClient') }}</p>
              </div>
              <el-tag :type="getStatusType(quote.status)" effect="dark" size="small">{{ quote.status }}</el-tag>
            </div>
            <div class="flex justify-between items-end mt-4">
              <div>
                <div class="text-xs text-slate-500">Total Value</div>
                <div class="text-lg font-bold text-slate-200">{{ formatCurrency(quote.totalAmount) }}</div>
              </div>
              <div class="text-right">
                <div class="text-xs text-slate-500">{{ $t('cpq.items') }}</div>
                <div class="text-sm text-slate-400">{{ quote.itemCount || 0 }}</div>
              </div>
            </div>
            <div class="flex gap-2 mt-4 pt-3 border-t border-slate-800/60">
              <el-button size="small" text type="primary" @click="editQuote(quote)">
                <Icon name="ph:pencil-simple" class="w-4 h-4 mr-1" />
                {{ $t('common.edit') }}
              </el-button>
              <el-button size="small" text @click="duplicateQuote(quote)">
                <Icon name="ph:copy" class="w-4 h-4 mr-1" />
                {{ $t('cpq.clone') }}
              </el-button>
              <el-button size="small" text @click="exportQuote(quote)">
                <Icon name="ph:file-pdf" class="w-4 h-4 mr-1" />
                PDF
              </el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Product Catalog -->
      <el-tab-pane :label="$t('cpq.productCatalog')" name="catalog">
        <div class="glass-panel p-6 rounded-xl">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-slate-200">{{ $t('cpq.productsAndServices') }}</h3>
            <el-button type="primary" size="small" @click="showProductDialog = true">
              <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" />
              {{ $t('cpq.addProduct') }}
            </el-button>
          </div>
          <el-table :data="products" class="glass-table" stripe>
            <el-table-column prop="name" :label="$t('cpq.product')" min-width="200">
              <template #default="{ row }">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center">
                    <Icon name="ph:package-bold" class="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <div class="text-sm font-medium text-slate-200">{{ row.name }}</div>
                    <div class="text-xs text-slate-500">{{ row.sku }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="category" :label="$t('cpq.category')" width="140" />
            <el-table-column :label="$t('cpq.price')" width="120" align="right">
              <template #default="{ row }">
                <span class="text-sm font-medium text-slate-200">{{ formatCurrency(row.price) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="unit" :label="$t('cpq.unit')" width="100" />
            <el-table-column :label="$t('common.status')" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.isActive ? 'success' : 'info'" effect="dark" size="small">
                  {{ row.isActive ? $t('common.active') : $t('common.inactive') }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- Pricing Rules -->
      <el-tab-pane :label="$t('cpq.pricingRules')" name="pricing">
        <div class="glass-panel p-6 rounded-xl">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-slate-200">{{ $t('cpq.discountPricingRules') }}</h3>
            <el-button type="primary" size="small" @click="showPricingDialog = true">
              <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" />
              {{ $t('cpq.addRule') }}
            </el-button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="rule in pricingRules" :key="rule.id" class="glass-panel p-4 rounded-xl border border-slate-700/50">
              <div class="flex justify-between items-start">
                <div>
                  <h4 class="text-sm font-medium text-slate-200">{{ rule.name }}</h4>
                  <p class="text-xs text-slate-500 mt-1">{{ rule.description }}</p>
                </div>
                <el-tag :type="rule.type === 'DISCOUNT' ? 'success' : 'warning'" effect="dark" size="small">
                  {{ rule.type }}
                </el-tag>
              </div>
              <div class="mt-3 flex items-center gap-4 text-sm text-slate-400">
                <span>{{ rule.value }}{{ rule.valueType === 'PERCENTAGE' ? '%' : ' SAR' }}</span>
                <span>{{ $t('cpq.minQty') }}: {{ rule.minQuantity }}</span>
              </div>
            </div>
            <div v-if="pricingRules.length === 0" class="col-span-2 text-center py-8 text-slate-500">{{ $t('cpq.noPricingRules') }}</div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- Product Dialog -->
    <el-dialog v-model="showProductDialog" :title="$t('cpq.addProduct')" width="500px">
      <el-form label-position="top">
        <el-form-item :label="$t('cpq.productName')">
          <el-input v-model="newProduct.name" :placeholder="$t('cpq.productNamePlaceholder')" />
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item :label="$t('cpq.sku')">
            <el-input v-model="newProduct.sku" placeholder="SKU-001" />
          </el-form-item>
          <el-form-item :label="$t('cpq.category')">
            <el-select v-model="newProduct.category" :placeholder="$t('cpq.categoryPlaceholder')" class="w-full">
              <el-option :label="$t('cpq.software')" value="SOFTWARE" />
              <el-option :label="$t('cpq.service')" value="SERVICE" />
              <el-option :label="$t('cpq.hardware')" value="HARDWARE" />
              <el-option :label="$t('cpq.subscription')" value="SUBSCRIPTION" />
            </el-select>
          </el-form-item>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item :label="$t('cpq.unitPriceSAR')">
            <el-input-number v-model="newProduct.price" :min="0" :step="100" class="!w-full" />
          </el-form-item>
          <el-form-item :label="$t('cpq.unit')">
            <el-select v-model="newProduct.unit" class="w-full">
              <el-option :label="$t('cpq.perUnit')" value="UNIT" />
              <el-option :label="$t('cpq.perHour')" value="HOUR" />
              <el-option :label="$t('cpq.perMonth')" value="MONTH" />
              <el-option :label="$t('cpq.perYear')" value="YEAR" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item :label="$t('common.description')">
          <el-input v-model="newProduct.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showProductDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveProduct">{{ $t('cpq.saveProduct') }}</el-button>
      </template>
    </el-dialog>

    <!-- Pricing Rule Dialog -->
    <el-dialog v-model="showPricingDialog" :title="$t('cpq.addPricingRule')" width="500px">
      <el-form label-position="top">
        <el-form-item :label="$t('cpq.ruleName')">
          <el-input v-model="newRule.name" placeholder="e.g., Volume Discount" />
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item :label="$t('common.type')">
            <el-select v-model="newRule.type" class="w-full">
              <el-option :label="$t('cpq.discount')" value="DISCOUNT" />
              <el-option :label="$t('cpq.markup')" value="MARKUP" />
              <el-option :label="$t('cpq.bundle')" value="BUNDLE" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('cpq.valueType')">
            <el-select v-model="newRule.valueType" class="w-full">
              <el-option :label="$t('cpq.percentage')" value="PERCENTAGE" />
              <el-option :label="$t('cpq.fixedAmount')" value="FIXED" />
            </el-select>
          </el-form-item>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item :label="$t('common.value')">
            <el-input-number v-model="newRule.value" :min="0" class="!w-full" />
          </el-form-item>
          <el-form-item :label="$t('cpq.minQuantity')">
            <el-input-number v-model="newRule.minQuantity" :min="1" class="!w-full" />
          </el-form-item>
        </div>
        <el-form-item :label="$t('common.description')">
          <el-input v-model="newRule.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPricingDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="savePricingRule">{{ $t('cpq.saveRule') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { useApiFetch } from '~/composables/useApiFetch';

const { t } = useI18n();

definePageMeta({
  layout: 'default',
  middleware: 'permissions'
});

const activeTab = ref('quotes');
const loading = ref(true);
const quotes = ref<any[]>([]);
const products = ref<any[]>([]);
const pricingRules = ref<any[]>([]);
const showProductDialog = ref(false);
const showPricingDialog = ref(false);

const newProduct = ref({ name: '', sku: '', category: 'SOFTWARE', price: 0, unit: 'UNIT', description: '' });
const newRule = ref({ name: '', type: 'DISCOUNT', valueType: 'PERCENTAGE', value: 0, minQuantity: 1, description: '' });

const totalQuoteValue = computed(() => quotes.value.reduce((s, q) => s + (q.totalAmount || 0), 0));
const avgConversionRate = computed(() => {
  const total = quotes.value.length;
  if (!total) return 0;
  const approved = quotes.value.filter(q => q.status === 'APPROVED').length;
  return Math.round((approved / total) * 100);
});

const formatCurrency = (val: number) => {
  if (!val) return '0 SAR';
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M SAR`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K SAR`;
  return `${val} SAR`;
};

const getStatusType = (status: string): 'success' | 'warning' | 'info' | 'danger' | undefined => {
  const map: Record<string, 'success' | 'warning' | 'info' | 'danger' | undefined> = {
    APPROVED: 'success',
    PENDING: 'warning',
    DRAFT: 'info',
    REJECTED: 'danger',
    EXPIRED: 'danger'
  };
  return map[status] || 'info';
};

const fetchQuotes = async () => {
  loading.value = true;
  try {
    const res: any = await useApiFetch('proposal');
    if (res?.success) {
      quotes.value = (res.body?.docs || res.body || []).map((p: any) => ({
        id: p.id,
        name: p.name || p.title || `Quote #${p.id}`,
        clientName: p.client?.name || p.clientName || '',
        status: p.status || 'DRAFT',
        totalAmount: p.totalAmount || p.total || 0,
        itemCount: p.itemCount || 0
      }));
    }
  } catch (err) {
    console.error('[CPQ] Failed to fetch quotes:', err);
  }
  loading.value = false;
};

const fetchProducts = async () => {
  try {
    const res: any = await useApiFetch('catalog/products');
    if (res?.success) {
      products.value = res.body?.docs || res.body || [];
    }
  } catch (err) {
    console.error('[CPQ] Failed to fetch products:', err);
  }
};

const createQuote = () => ElMessage.info(t('cpq.quoteOpening'));
const editQuote = (quote: any) => ElMessage.info(`Editing quote: ${quote.name}`);
const duplicateQuote = (quote: any) => ElMessage.info(`Cloning quote: ${quote.name}`);
const exportQuote = (quote: any) => ElMessage.info(`Generating PDF for: ${quote.name}`);

const saveProduct = async () => {
  const res: any = await useApiFetch('catalog/products', 'POST', newProduct.value);
  if (res?.success) {
    ElMessage.success(t('common.saved'));
    showProductDialog.value = false;
    fetchProducts();
  } else {
    ElMessage.error(res?.message || 'Failed to save product');
  }
};

const savePricingRule = () => {
  pricingRules.value.push({ ...newRule.value, id: Date.now() });
  showPricingDialog.value = false;
  ElMessage.success(t('common.saved'));
};

onMounted(() => {
  fetchQuotes();
  fetchProducts();
});
</script>
