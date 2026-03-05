<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-rose-400">{{ $t("eSignatures.title") }}</h1>
          <p class="text-slate-400 text-sm mt-1">{{ $t("eSignatures.subtitle") }}</p>
        </div>
        <el-button type="primary" class="!rounded-xl" @click="showSendDialog = true">
          <Icon name="ph:paper-plane-tilt-bold" class="w-4 h-4 mr-2" />
          {{ $t("eSignatures.sendForSignature") }}
        </el-button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-slate-200">{{ documents.length }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t("eSignatures.totalDocuments") }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-emerald-400">{{ documents.filter(d => d.status === 'SIGNED').length }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t("eSignatures.signed") }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-amber-400">{{ documents.filter(d => d.status === 'PENDING').length }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t("eSignatures.pending") }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-red-400">{{ documents.filter(d => d.status === 'EXPIRED').length }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t("eSignatures.expired") }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-indigo-400">{{ avgSignTime }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t("eSignatures.avgSignTime") }}</div>
      </div>
    </div>

    <!-- Documents Table -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex justify-between items-center mb-4">
        <div class="flex gap-2">
          <el-select v-model="filterStatus" :placeholder="$t('common.status')" clearable class="w-36">
            <el-option :label="$t('common.all')" value="" />
            <el-option :label="$t('common.pending')" value="PENDING" />
            <el-option :label="$t('eSignatures.signed')" value="SIGNED" />
            <el-option :label="$t('eSignatures.declined')" value="DECLINED" />
            <el-option :label="$t('eSignatures.expired')" value="EXPIRED" />
          </el-select>
          <el-input v-model="searchQuery" :placeholder="$t('eSignatures.searchDocuments')" prefix-icon="Search" clearable class="!w-56" />
        </div>
      </div>

      <el-table v-loading="loading" :data="filteredDocuments" class="glass-table" stripe>
        <el-table-column :label="$t('eSignatures.document')" min-width="250">
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="getDocBg(row.type)">
                <Icon :name="getDocIcon(row.type)" class="w-5 h-5" :class="getDocIconColor(row.type)" />
              </div>
              <div>
                <div class="text-sm font-medium text-slate-200">{{ row.name }}</div>
                <div class="text-xs text-slate-500">{{ row.type }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('eSignatures.recipients')" width="200">
          <template #default="{ row }">
            <div class="flex items-center -space-x-2">
              <el-avatar v-for="(r, idx) in row.recipients?.slice(0, 3)" :key="idx" :size="28" class="border-2 border-slate-800 bg-slate-700">
                {{ r.name?.charAt(0) }}
              </el-avatar>
              <span v-if="row.recipients?.length > 3" class="ml-2 text-xs text-slate-500">+{{ row.recipients.length - 3 }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.status')" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="getSignStatusType(row.status)" effect="dark" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('eSignatures.progress')" width="150">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <el-progress
                :percentage="row.totalSigners > 0 ? (row.signedCount / row.totalSigners) * 100 : 0"
                :stroke-width="4"
                :show-text="false"
                :color="getSignStatusColor(row.status)"
                class="flex-1"
              />
              <span class="text-xs text-slate-500">{{ row.signedCount }}/{{ row.totalSigners }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('eSignatures.sent')" width="120">
          <template #default="{ row }">
            <span class="text-sm text-slate-400">{{ formatDate(row.sentDate) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.actions')" width="120" align="center">
          <template #default="{ row }">
            <div class="flex gap-1 justify-center">
              <el-button text type="primary" size="small" @click="viewDocument(row)">
                <Icon name="ph:eye-bold" class="w-4 h-4" />
              </el-button>
              <el-button v-if="row.status === 'PENDING'" text type="warning" size="small" @click="sendReminder(row)">
                <Icon name="ph:bell-ringing-bold" class="w-4 h-4" />
              </el-button>
              <el-button text type="danger" size="small" @click="deleteSignature(row)">
                <Icon name="ph:trash-bold" class="w-4 h-4" />
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Send for Signature Dialog -->
    <el-dialog v-model="showSendDialog" :title="$t('eSignatures.sendDocumentForSignature')" width="560px">
      <el-form label-position="top">
        <el-form-item :label="$t('eSignatures.document')">
          <el-upload drag action="" :auto-upload="false" :limit="1" accept=".pdf,.doc,.docx" class="w-full">
            <div class="py-4">
              <Icon name="ph:cloud-arrow-up-bold" class="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p class="text-sm text-slate-400">{{ $t("eSignatures.dropDocument") }}</p>
              <p class="text-xs text-slate-600 mt-1">{{ $t("eSignatures.fileTypes") }}</p>
            </div>
          </el-upload>
        </el-form-item>
        <el-form-item :label="$t('eSignatures.documentName')">
          <el-input v-model="newSignRequest.name" placeholder="e.g., Service Agreement - Acme Corp" />
        </el-form-item>
        <el-form-item :label="$t('eSignatures.recipients')">
          <div class="space-y-2 w-full">
            <div v-for="(recipient, idx) in newSignRequest.recipients" :key="idx" class="flex gap-2">
              <el-input v-model="recipient.name" :placeholder="$t('common.name')" class="flex-1" />
              <el-input v-model="recipient.email" :placeholder="$t('common.email')" class="flex-1" />
              <el-button text type="danger" @click="newSignRequest.recipients.splice(idx, 1)">
                <Icon name="ph:x-bold" class="w-4 h-4" />
              </el-button>
            </div>
            <el-button text type="primary" @click="newSignRequest.recipients.push({ name: '', email: '' })">
              <Icon name="ph:plus-bold" class="w-4 h-4 mr-1" />
              {{ $t("eSignatures.addRecipient") }}
            </el-button>
          </div>
        </el-form-item>
        <el-form-item :label="$t('eSignatures.messageOptional')">
          <el-input v-model="newSignRequest.message" type="textarea" :rows="2" :placeholder="$t('eSignatures.messagePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('eSignatures.expiry')">
          <el-date-picker v-model="newSignRequest.expiryDate" type="date" :placeholder="$t('eSignatures.setExpiryDate')" class="w-full" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSendDialog = false">{{ $t("common.cancel") }}</el-button>
        <el-button type="primary" :loading="sending" @click="sendForSignature">
          <Icon name="ph:paper-plane-tilt-bold" class="w-4 h-4 mr-2" />
          {{ $t("common.submit") }}
        </el-button>
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

const { $i18n } = useNuxtApp();
const t = $i18n.t;

// ---------- Reactive state ----------
const filterStatus = ref('');
const searchQuery = ref('');
const showSendDialog = ref(false);
const loading = ref(false);
const sending = ref(false);

const newSignRequest = ref({
  name: '',
  message: '',
  expiryDate: null as Date | null,
  recipients: [{ name: '', email: '' }]
});

// ---------- E-Signature → display-document mapping ----------

interface DisplayDocument {
  id: string;
  name: string;
  type: string;
  status: 'SIGNED' | 'PENDING' | 'EXPIRED' | 'DECLINED';
  signedCount: number;
  totalSigners: number;
  sentDate: string;
  recipients: { name: string; email: string; status?: string; signedAt?: string | null }[];
  _raw: unknown;
}

const documents = ref<DisplayDocument[]>([]);

/**
 * Derive a document type from the title for icon/color display.
 */
function deriveType(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('nda') || lower.includes('non-disclosure')) return 'NDA';
  if (lower.includes('sow') || lower.includes('scope of work') || lower.includes('statement of work')) return 'SOW';
  if (lower.includes('lease')) return 'LEASE';
  return 'CONTRACT';
}

/**
 * Convert a raw ESignature record from the API into the display shape the template expects.
 */
function mapRecord(record: unknown): DisplayDocument {
  const recipients = record.recipients || [];
  const signedCount = recipients.filter((r) => r.status === 'SIGNED').length;
  const totalSigners = recipients.length;
  return {
    id: record.id,
    name: record.title,
    type: deriveType(record.title),
    status: record.status,
    signedCount,
    totalSigners,
    sentDate: record.sentAt || record.createdAt || '',
    recipients,
    _raw: record
  };
}

// ---------- Fetch e-signatures from API ----------

async function fetchDocuments() {
  loading.value = true;
  try {
    const res = await useApiFetch('e-signatures?limit=100');
    if (res?.success) {
      const raw = res.body?.docs || res.body || [];
      const list = Array.isArray(raw) ? raw : [];
      documents.value = list.map(mapRecord);
    } else {
      ElMessage.error(t('common.error'));
    }
  } catch (e: unknown) {
    ElMessage.error(t('common.error'));
    console.error(e);
  } finally {
    loading.value = false;
  }
}

onMounted(fetchDocuments);

// ---------- Computed ----------

const avgSignTime = computed(() => {
  const signed = documents.value.filter(d => d.status === 'SIGNED' && d._raw?.createdAt);
  if (!signed.length) return 'N/A';
  // Compute average time from sentAt to the last recipient signedAt
  let totalMs = 0;
  let count = 0;
  for (const d of signed) {
    const sentTime = new Date(d._raw.sentAt || d._raw.createdAt).getTime();
    const signedRecipients = (d._raw.recipients || []).filter((r) => r.signedAt);
    if (signedRecipients.length > 0) {
      // Use the last signer's time
      const lastSignedAt = Math.max(...signedRecipients.map((r) => new Date(r.signedAt).getTime()));
      totalMs += lastSignedAt - sentTime;
      count++;
    }
  }
  if (!count) return 'N/A';
  const avgDays = totalMs / count / (1000 * 60 * 60 * 24);
  if (avgDays < 1) {
    const avgHours = Math.round(totalMs / count / (1000 * 60 * 60));
    return avgHours <= 1 ? '< 1 hr' : `${avgHours} hrs`;
  }
  return `${avgDays.toFixed(1)} days`;
});

const filteredDocuments = computed(() => {
  let result = documents.value;
  if (filterStatus.value) result = result.filter(d => d.status === filterStatus.value);
  if (searchQuery.value) result = result.filter(d => d.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
  return result;
});

// ---------- UI helpers ----------

const getDocBg = (type: string) => {
  const map: Record<string, string> = { CONTRACT: 'bg-blue-500/10', NDA: 'bg-purple-500/10', SOW: 'bg-amber-500/10', LEASE: 'bg-teal-500/10' };
  return map[type] || 'bg-slate-500/10';
};

const getDocIcon = (type: string) => {
  const map: Record<string, string> = {
    CONTRACT: 'ph:file-doc-bold',
    NDA: 'ph:shield-check-bold',
    SOW: 'ph:clipboard-text-bold',
    LEASE: 'ph:house-bold'
  };
  return map[type] || 'ph:file-bold';
};

const getDocIconColor = (type: string) => {
  const map: Record<string, string> = { CONTRACT: 'text-blue-400', NDA: 'text-purple-400', SOW: 'text-amber-400', LEASE: 'text-teal-400' };
  return map[type] || 'text-slate-400';
};

const getSignStatusType = (s: string): 'success' | 'warning' | 'info' | 'danger' | undefined => {
  const m: Record<string, 'success' | 'warning' | 'info' | 'danger' | undefined> = {
    SIGNED: 'success',
    PENDING: 'warning',
    EXPIRED: 'danger',
    DECLINED: 'danger'
  };
  return m[s] || 'info';
};

const getSignStatusColor = (s: string) => {
  const m: Record<string, string> = { SIGNED: '#10B981', PENDING: '#F59E0B', EXPIRED: '#EF4444', DECLINED: '#EF4444' };
  return m[s] || '#94A3B8';
};

const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '-');

// ---------- Actions ----------

const viewDocument = (doc: DisplayDocument) => {
  ElMessage.info(doc.name);
};

const sendReminder = async (doc: DisplayDocument) => {
  try {
    const res = await useApiFetch(`e-signatures/${doc.id}/remind`, 'POST', {});
    if (res?.success) {
      ElMessage.success(t('common.saved'));
    } else {
      ElMessage.error(t('common.error'));
    }
  } catch {
    ElMessage.error(t('common.error'));
  }
};

const deleteSignature = async (doc: DisplayDocument) => {
  try {
    const res = await useApiFetch(`e-signatures/${doc.id}`, 'DELETE');
    if (res?.success) {
      documents.value = documents.value.filter(d => d.id !== doc.id);
      ElMessage.success(t('common.deleted'));
    } else {
      ElMessage.error(t('common.error'));
    }
  } catch {
    ElMessage.error(t('common.error'));
  }
};

const sendForSignature = async () => {
  const req = newSignRequest.value;
  if (!req.name) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  if (!req.recipients.length || !req.recipients[0]!.email) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }

  sending.value = true;
  try {
    const payload: unknown = {
      title: req.name,
      message: req.message || '',
      recipients: req.recipients.filter(r => r.email),
      ...(req.expiryDate ? { expiresAt: req.expiryDate } : {})
    };

    const res = await useApiFetch('e-signatures', 'POST', payload);

    if (res?.success) {
      ElMessage.success(t('common.saved'));
      showSendDialog.value = false;
      newSignRequest.value = { name: '', message: '', expiryDate: null, recipients: [{ name: '', email: '' }] };
      await fetchDocuments();
    } else {
      ElMessage.error(t('common.error'));
    }
  } catch (e: unknown) {
    ElMessage.error(t('common.error'));
    console.error(e);
  } finally {
    sending.value = false;
  }
};
</script>
