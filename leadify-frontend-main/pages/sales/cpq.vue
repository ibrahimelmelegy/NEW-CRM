<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-400">
            Configure, Price, Quote (CPQ)
          </h1>
          <p class="text-slate-400 text-sm mt-1">Build professional quotes with product configuration and dynamic pricing.</p>
        </div>
        <el-button type="primary" class="!rounded-xl shadow-lg shadow-primary-500/20" @click="createQuote">
          <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" />
          New Quote
        </el-button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-slate-200">{{ quotes.length }}</div>
        <div class="text-xs text-slate-500 mt-1">Total Quotes</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-emerald-400">{{ quotes.filter(q => q.status === 'APPROVED').length }}</div>
        <div class="text-xs text-slate-500 mt-1">Approved</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-amber-400">{{ quotes.filter(q => q.status === 'PENDING').length }}</div>
        <div class="text-xs text-slate-500 mt-1">Pending</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-indigo-400">{{ formatCurrency(totalQuoteValue) }}</div>
        <div class="text-xs text-slate-500 mt-1">Total Value</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-teal-400">{{ avgConversionRate }}%</div>
        <div class="text-xs text-slate-500 mt-1">Win Rate</div>
      </div>
    </div>

    <!-- Tabs: Quotes / Product Catalog / Pricing Rules -->
    <el-tabs v-model="activeTab" class="glass-tabs">
      <!-- Quotes List -->
      <el-tab-pane label="Quotes" name="quotes">
        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="i in 6" :key="i" class="glass-panel p-6 rounded-xl animate-pulse h-40"></div>
        </div>
        <div v-else-if="quotes.length === 0" class="glass-panel p-12 rounded-2xl text-center">
          <Icon name="ph:file-text-bold" class="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-slate-300">No Quotes Yet</h3>
          <p class="text-slate-500 text-sm mt-2">Create your first professional quote with dynamic pricing.</p>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="quote in quotes" :key="quote.id" class="glass-panel p-5 rounded-xl hover:border-primary-500/30 transition-all">
            <div class="flex justify-between items-start mb-3">
              <div>
                <h4 class="text-sm font-medium text-slate-200">{{ quote.name }}</h4>
                <p class="text-xs text-slate-500 mt-1">{{ quote.clientName || 'No client' }}</p>
              </div>
              <el-tag :type="getStatusType(quote.status)" effect="dark" size="small">{{ quote.status }}</el-tag>
            </div>
            <div class="flex justify-between items-end mt-4">
              <div>
                <div class="text-xs text-slate-500">Total Value</div>
                <div class="text-lg font-bold text-slate-200">{{ formatCurrency(quote.totalAmount) }}</div>
              </div>
              <div class="text-right">
                <div class="text-xs text-slate-500">Items</div>
                <div class="text-sm text-slate-400">{{ quote.itemCount || 0 }}</div>
              </div>
            </div>
            <div class="flex gap-2 mt-4 pt-3 border-t border-slate-800/60">
              <el-button size="small" text type="primary" @click="editQuote(quote)">
                <Icon name="ph:pencil-simple" class="w-4 h-4 mr-1" /> Edit
              </el-button>
              <el-button size="small" text @click="duplicateQuote(quote)">
                <Icon name="ph:copy" class="w-4 h-4 mr-1" /> Clone
              </el-button>
              <el-button size="small" text @click="exportQuote(quote)">
                <Icon name="ph:file-pdf" class="w-4 h-4 mr-1" /> PDF
              </el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Product Catalog -->
      <el-tab-pane label="Product Catalog" name="catalog">
        <div class="glass-panel p-6 rounded-xl">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-slate-200">Products & Services</h3>
            <el-button type="primary" size="small" @click="showProductDialog = true">
              <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" /> Add Product
            </el-button>
          </div>
          <el-table :data="products" class="glass-table" stripe>
            <el-table-column prop="name" label="Product" min-width="200">
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
            <el-table-column prop="category" label="Category" width="140" />
            <el-table-column label="Price" width="120" align="right">
              <template #default="{ row }">
                <span class="text-sm font-medium text-slate-200">{{ formatCurrency(row.price) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="unit" label="Unit" width="100" />
            <el-table-column label="Status" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.isActive ? 'success' : 'info'" effect="dark" size="small">
                  {{ row.isActive ? 'Active' : 'Inactive' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- Pricing Rules -->
      <el-tab-pane label="Pricing Rules" name="pricing">
        <div class="glass-panel p-6 rounded-xl">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-slate-200">Discount & Pricing Rules</h3>
            <el-button type="primary" size="small" @click="showPricingDialog = true">
              <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" /> Add Rule
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
                <span>Min Qty: {{ rule.minQuantity }}</span>
              </div>
            </div>
            <div v-if="pricingRules.length === 0" class="col-span-2 text-center py-8 text-slate-500">
              No pricing rules configured yet
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- Product Dialog -->
    <el-dialog v-model="showProductDialog" title="Add Product" width="500px">
      <el-form label-position="top">
        <el-form-item label="Product Name">
          <el-input v-model="newProduct.name" placeholder="Product name" />
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="SKU">
            <el-input v-model="newProduct.sku" placeholder="SKU-001" />
          </el-form-item>
          <el-form-item label="Category">
            <el-select v-model="newProduct.category" placeholder="Category" class="w-full">
              <el-option label="Software" value="SOFTWARE" />
              <el-option label="Service" value="SERVICE" />
              <el-option label="Hardware" value="HARDWARE" />
              <el-option label="Subscription" value="SUBSCRIPTION" />
            </el-select>
          </el-form-item>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="Unit Price (SAR)">
            <el-input-number v-model="newProduct.price" :min="0" :step="100" class="!w-full" />
          </el-form-item>
          <el-form-item label="Unit">
            <el-select v-model="newProduct.unit" class="w-full">
              <el-option label="Per Unit" value="UNIT" />
              <el-option label="Per Hour" value="HOUR" />
              <el-option label="Per Month" value="MONTH" />
              <el-option label="Per Year" value="YEAR" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="Description">
          <el-input v-model="newProduct.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showProductDialog = false">Cancel</el-button>
        <el-button type="primary" @click="saveProduct">Save Product</el-button>
      </template>
    </el-dialog>

    <!-- Pricing Rule Dialog -->
    <el-dialog v-model="showPricingDialog" title="Add Pricing Rule" width="500px">
      <el-form label-position="top">
        <el-form-item label="Rule Name">
          <el-input v-model="newRule.name" placeholder="e.g., Volume Discount" />
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="Type">
            <el-select v-model="newRule.type" class="w-full">
              <el-option label="Discount" value="DISCOUNT" />
              <el-option label="Markup" value="MARKUP" />
              <el-option label="Bundle" value="BUNDLE" />
            </el-select>
          </el-form-item>
          <el-form-item label="Value Type">
            <el-select v-model="newRule.valueType" class="w-full">
              <el-option label="Percentage" value="PERCENTAGE" />
              <el-option label="Fixed Amount" value="FIXED" />
            </el-select>
          </el-form-item>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="Value">
            <el-input-number v-model="newRule.value" :min="0" class="!w-full" />
          </el-form-item>
          <el-form-item label="Min Quantity">
            <el-input-number v-model="newRule.minQuantity" :min="1" class="!w-full" />
          </el-form-item>
        </div>
        <el-form-item label="Description">
          <el-input v-model="newRule.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPricingDialog = false">Cancel</el-button>
        <el-button type="primary" @click="savePricingRule">Save Rule</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useApiFetch } from '~/composables/useApiFetch';

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
    APPROVED: 'success', PENDING: 'warning', DRAFT: 'info', REJECTED: 'danger', EXPIRED: 'danger'
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

const createQuote = () => ElMessage.info('Quote builder opening...');
const editQuote = (quote: any) => ElMessage.info(`Editing quote: ${quote.name}`);
const duplicateQuote = (quote: any) => ElMessage.info(`Cloning quote: ${quote.name}`);
const exportQuote = (quote: any) => ElMessage.info(`Generating PDF for: ${quote.name}`);

const saveProduct = async () => {
  const res: any = await useApiFetch('catalog/products', 'POST', newProduct.value);
  if (res?.success) {
    ElMessage.success('Product saved');
    showProductDialog.value = false;
    fetchProducts();
  } else {
    ElMessage.error(res?.message || 'Failed to save product');
  }
};

const savePricingRule = () => {
  pricingRules.value.push({ ...newRule.value, id: Date.now() });
  showPricingDialog.value = false;
  ElMessage.success('Pricing rule saved');
};

onMounted(() => {
  fetchQuotes();
  fetchProducts();
});
</script>
