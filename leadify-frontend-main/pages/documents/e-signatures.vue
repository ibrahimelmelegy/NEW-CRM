<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-rose-400">E-Signatures</h1>
          <p class="text-slate-400 text-sm mt-1">Send, track, and manage electronic signatures for contracts and documents.</p>
        </div>
        <el-button type="primary" class="!rounded-xl" @click="showSendDialog = true">
          <Icon name="ph:paper-plane-tilt-bold" class="w-4 h-4 mr-2" />
          Send for Signature
        </el-button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-slate-200">{{ documents.length }}</div>
        <div class="text-xs text-slate-500 mt-1">Total Documents</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-emerald-400">{{ documents.filter(d => d.status === 'SIGNED').length }}</div>
        <div class="text-xs text-slate-500 mt-1">Signed</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-amber-400">{{ documents.filter(d => d.status === 'PENDING').length }}</div>
        <div class="text-xs text-slate-500 mt-1">Pending</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-red-400">{{ documents.filter(d => d.status === 'EXPIRED').length }}</div>
        <div class="text-xs text-slate-500 mt-1">Expired</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-indigo-400">{{ avgSignTime }}</div>
        <div class="text-xs text-slate-500 mt-1">Avg Sign Time</div>
      </div>
    </div>

    <!-- Documents Table -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex justify-between items-center mb-4">
        <div class="flex gap-2">
          <el-select v-model="filterStatus" placeholder="Status" clearable class="w-36">
            <el-option label="All" value="" />
            <el-option label="Pending" value="PENDING" />
            <el-option label="Signed" value="SIGNED" />
            <el-option label="Declined" value="DECLINED" />
            <el-option label="Expired" value="EXPIRED" />
          </el-select>
          <el-input v-model="searchQuery" placeholder="Search documents..." prefix-icon="Search" clearable class="!w-56" />
        </div>
      </div>

      <el-table :data="filteredDocuments" class="glass-table" stripe>
        <el-table-column label="Document" min-width="250">
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="getDocBg(row.type)">
                <Icon :name="getDocIcon(row.type)" class="w-5 h-5" :class="getDocIconColor(row.type)" />
              </div>
              <div>
                <div class="text-sm font-medium text-slate-200">{{ row.name }}</div>
                <div class="text-xs text-slate-500">{{ row.type }} - {{ row.pages }} pages</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Recipients" width="200">
          <template #default="{ row }">
            <div class="flex items-center -space-x-2">
              <el-avatar v-for="(r, idx) in row.recipients?.slice(0, 3)" :key="idx" :size="28" class="border-2 border-slate-800 bg-slate-700">
                {{ r.name?.charAt(0) }}
              </el-avatar>
              <span v-if="row.recipients?.length > 3" class="ml-2 text-xs text-slate-500">+{{ row.recipients.length - 3 }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Status" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="getSignStatusType(row.status)" effect="dark" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Progress" width="150">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <el-progress
                :percentage="(row.signedCount / row.totalSigners) * 100"
                :stroke-width="4"
                :show-text="false"
                :color="getSignStatusColor(row.status)"
                class="flex-1"
              />
              <span class="text-xs text-slate-500">{{ row.signedCount }}/{{ row.totalSigners }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Sent" width="120">
          <template #default="{ row }">
            <span class="text-sm text-slate-400">{{ formatDate(row.sentDate) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="120" align="center">
          <template #default="{ row }">
            <div class="flex gap-1 justify-center">
              <el-button text type="primary" size="small" @click="viewDocument(row)">
                <Icon name="ph:eye-bold" class="w-4 h-4" />
              </el-button>
              <el-button v-if="row.status === 'PENDING'" text type="warning" size="small" @click="sendReminder(row)">
                <Icon name="ph:bell-ringing-bold" class="w-4 h-4" />
              </el-button>
              <el-button text type="info" size="small" @click="downloadDocument(row)">
                <Icon name="ph:download-bold" class="w-4 h-4" />
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Send for Signature Dialog -->
    <el-dialog v-model="showSendDialog" title="Send Document for Signature" width="560px">
      <el-form label-position="top">
        <el-form-item label="Document">
          <el-upload drag action="" :auto-upload="false" :limit="1" accept=".pdf,.doc,.docx" class="w-full">
            <div class="py-4">
              <Icon name="ph:cloud-arrow-up-bold" class="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p class="text-sm text-slate-400">Drop your document here or click to upload</p>
              <p class="text-xs text-slate-600 mt-1">PDF, DOC, DOCX up to 25MB</p>
            </div>
          </el-upload>
        </el-form-item>
        <el-form-item label="Document Name">
          <el-input v-model="newSignRequest.name" placeholder="e.g., Service Agreement - Acme Corp" />
        </el-form-item>
        <el-form-item label="Recipients">
          <div class="space-y-2 w-full">
            <div v-for="(recipient, idx) in newSignRequest.recipients" :key="idx" class="flex gap-2">
              <el-input v-model="recipient.name" placeholder="Name" class="flex-1" />
              <el-input v-model="recipient.email" placeholder="Email" class="flex-1" />
              <el-button text type="danger" @click="newSignRequest.recipients.splice(idx, 1)">
                <Icon name="ph:x-bold" class="w-4 h-4" />
              </el-button>
            </div>
            <el-button text type="primary" @click="newSignRequest.recipients.push({ name: '', email: '' })">
              <Icon name="ph:plus-bold" class="w-4 h-4 mr-1" />
              Add Recipient
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="Message (Optional)">
          <el-input v-model="newSignRequest.message" type="textarea" :rows="2" placeholder="Add a message for recipients..." />
        </el-form-item>
        <el-form-item label="Expiry">
          <el-date-picker v-model="newSignRequest.expiryDate" type="date" placeholder="Set expiry date" class="w-full" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSendDialog = false">Cancel</el-button>
        <el-button type="primary" @click="sendForSignature">
          <Icon name="ph:paper-plane-tilt-bold" class="w-4 h-4 mr-2" />
          Send
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';

definePageMeta({
  layout: 'default',
  middleware: 'permissions'
});

const filterStatus = ref('');
const searchQuery = ref('');
const showSendDialog = ref(false);

const newSignRequest = ref({
  name: '',
  message: '',
  expiryDate: null,
  recipients: [{ name: '', email: '' }]
});

const documents = ref([
  {
    id: 1,
    name: 'Service Agreement - Acme Corp',
    type: 'CONTRACT',
    pages: 12,
    status: 'SIGNED',
    signedCount: 2,
    totalSigners: 2,
    sentDate: '2026-02-15',
    recipients: [
      { name: 'John Smith', email: 'john@acme.com' },
      { name: 'Sara Ahmed', email: 'sara@company.com' }
    ]
  },
  {
    id: 2,
    name: 'NDA - TechStart Inc',
    type: 'NDA',
    pages: 4,
    status: 'PENDING',
    signedCount: 1,
    totalSigners: 2,
    sentDate: '2026-02-18',
    recipients: [
      { name: 'Mike Johnson', email: 'mike@techstart.com' },
      { name: 'Ali Hassan', email: 'ali@company.com' }
    ]
  },
  {
    id: 3,
    name: 'SOW - Project Alpha',
    type: 'SOW',
    pages: 8,
    status: 'PENDING',
    signedCount: 0,
    totalSigners: 3,
    sentDate: '2026-02-19',
    recipients: [
      { name: 'Lisa Park', email: 'lisa@client.com' },
      { name: 'David Kim', email: 'david@client.com' },
      { name: 'Omar Farooq', email: 'omar@company.com' }
    ]
  },
  {
    id: 4,
    name: 'Employment Contract - New Hire',
    type: 'CONTRACT',
    pages: 6,
    status: 'SIGNED',
    signedCount: 2,
    totalSigners: 2,
    sentDate: '2026-02-10',
    recipients: [
      { name: 'Khalid Ibrahim', email: 'khalid@hire.com' },
      { name: 'HR Dept', email: 'hr@company.com' }
    ]
  },
  {
    id: 5,
    name: 'Lease Agreement - Office B',
    type: 'LEASE',
    pages: 15,
    status: 'EXPIRED',
    signedCount: 0,
    totalSigners: 2,
    sentDate: '2026-01-15',
    recipients: [{ name: 'Property Manager', email: 'pm@building.com' }]
  },
  {
    id: 6,
    name: 'Vendor Agreement - Supplier X',
    type: 'CONTRACT',
    pages: 10,
    status: 'DECLINED',
    signedCount: 0,
    totalSigners: 1,
    sentDate: '2026-02-01',
    recipients: [{ name: 'Vendor Rep', email: 'rep@vendor.com' }]
  }
]);

const avgSignTime = computed(() => '1.3 days');

const filteredDocuments = computed(() => {
  let result = documents.value;
  if (filterStatus.value) result = result.filter(d => d.status === filterStatus.value);
  if (searchQuery.value) result = result.filter(d => d.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
  return result;
});

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

const viewDocument = (doc: any) => ElMessage.info(`Viewing: ${doc.name}`);
const sendReminder = (doc: any) => ElMessage.success(`Reminder sent for: ${doc.name}`);
const downloadDocument = (doc: any) => ElMessage.info(`Downloading: ${doc.name}`);

const sendForSignature = () => {
  if (!newSignRequest.value.name) {
    ElMessage.warning('Document name is required');
    return;
  }
  ElMessage.success('Document sent for signature');
  showSendDialog.value = false;
};
</script>
