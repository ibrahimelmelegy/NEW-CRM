<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">Data Governance</h1>
          <p class="text-slate-400 text-sm mt-1">Manage data quality, compliance, retention policies, and GDPR/privacy controls.</p>
        </div>
        <el-button type="primary" class="!rounded-xl" :loading="auditing" @click="runAudit">
          <Icon name="ph:magnifying-glass-bold" class="w-4 h-4 mr-2" />
          Run Data Audit
        </el-button>
      </div>
    </div>

    <!-- Data Quality Score -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div class="glass-panel p-5 rounded-xl text-center">
        <div class="w-16 h-16 mx-auto mb-2 relative">
          <svg class="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="#1e293b" stroke-width="4" />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              :stroke="qualityScoreColor"
              stroke-width="4"
              :stroke-dasharray="`${qualityScore * 1.76} 176`"
              stroke-linecap="round"
            />
          </svg>
          <span class="absolute inset-0 flex items-center justify-center text-lg font-bold text-slate-200">{{ qualityScore }}%</span>
        </div>
        <div class="text-xs text-slate-500">Data Quality Score</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-emerald-400">{{ dataMetrics.completeRecords }}%</div>
        <div class="text-xs text-slate-500 mt-1">Complete Records</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-amber-400">{{ dataMetrics.duplicates }}</div>
        <div class="text-xs text-slate-500 mt-1">Duplicates Found</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-blue-400">{{ dataMetrics.validEmails }}%</div>
        <div class="text-xs text-slate-500 mt-1">Valid Emails</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-red-400">{{ dataMetrics.staleRecords }}</div>
        <div class="text-xs text-slate-500 mt-1">Stale Records</div>
      </div>
    </div>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" class="glass-tabs">
      <!-- Data Quality -->
      <el-tab-pane label="Data Quality" name="quality">
        <div class="space-y-4">
          <div v-for="entity in qualityReport" :key="entity.name" class="glass-panel p-5 rounded-xl">
            <div class="flex justify-between items-center mb-3">
              <div class="flex items-center gap-3">
                <Icon :name="entity.icon" class="w-5 h-5 text-indigo-400" />
                <h4 class="text-sm font-medium text-slate-200">{{ entity.name }}</h4>
              </div>
              <el-tag :type="entity.score >= 80 ? 'success' : entity.score >= 60 ? 'warning' : 'danger'" effect="dark" size="small">
                {{ entity.score }}% Quality
              </el-tag>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div class="p-2 rounded-lg bg-slate-800/40">
                <div class="text-sm font-medium text-slate-300">{{ entity.totalRecords }}</div>
                <div class="text-xs text-slate-500">Total</div>
              </div>
              <div class="p-2 rounded-lg bg-slate-800/40">
                <div class="text-sm font-medium text-emerald-400">{{ entity.complete }}</div>
                <div class="text-xs text-slate-500">Complete</div>
              </div>
              <div class="p-2 rounded-lg bg-slate-800/40">
                <div class="text-sm font-medium text-amber-400">{{ entity.missingFields }}</div>
                <div class="text-xs text-slate-500">Missing Fields</div>
              </div>
              <div class="p-2 rounded-lg bg-slate-800/40">
                <div class="text-sm font-medium text-red-400">{{ entity.duplicates }}</div>
                <div class="text-xs text-slate-500">Duplicates</div>
              </div>
            </div>
            <el-progress :percentage="entity.score" :stroke-width="4" :color="getProgressColor(entity.score)" :show-text="false" class="mt-3" />
          </div>
        </div>
      </el-tab-pane>

      <!-- Retention Policies -->
      <el-tab-pane label="Retention Policies" name="retention">
        <div class="glass-panel p-6 rounded-xl">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-slate-200">Data Retention Policies</h3>
            <el-button type="primary" size="small" @click="showPolicyDialog = true">
              <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" />
              Add Policy
            </el-button>
          </div>
          <el-table :data="retentionPolicies" class="glass-table" stripe>
            <el-table-column prop="entity" label="Data Entity" width="180" />
            <el-table-column prop="retentionPeriod" label="Retention" width="140" />
            <el-table-column prop="action" label="Action" width="140">
              <template #default="{ row }">
                <el-tag :type="row.action === 'DELETE' ? 'danger' : row.action === 'ARCHIVE' ? 'warning' : 'info'" effect="dark" size="small">
                  {{ row.action }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="affectedRecords" label="Affected Records" width="140" align="center" />
            <el-table-column prop="lastRun" label="Last Run" width="130">
              <template #default="{ row }">
                <span class="text-sm text-slate-400">{{ row.lastRun || 'Never' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Active" width="80" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.isActive" size="small" />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- GDPR / Privacy -->
      <el-tab-pane label="Privacy & GDPR" name="privacy">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="glass-panel p-6 rounded-xl">
            <h3 class="text-lg font-medium text-slate-200 mb-4">Consent Management</h3>
            <div class="space-y-4">
              <div class="flex justify-between items-center p-3 rounded-lg bg-slate-800/40">
                <div>
                  <div class="text-sm text-slate-200">Marketing Emails</div>
                  <div class="text-xs text-slate-500">Opt-in required for marketing communications</div>
                </div>
                <el-switch v-model="privacySettings.marketingConsent" />
              </div>
              <div class="flex justify-between items-center p-3 rounded-lg bg-slate-800/40">
                <div>
                  <div class="text-sm text-slate-200">Data Processing</div>
                  <div class="text-xs text-slate-500">Require explicit consent for data processing</div>
                </div>
                <el-switch v-model="privacySettings.dataProcessing" />
              </div>
              <div class="flex justify-between items-center p-3 rounded-lg bg-slate-800/40">
                <div>
                  <div class="text-sm text-slate-200">Cookie Consent</div>
                  <div class="text-xs text-slate-500">Show cookie consent banner on portal</div>
                </div>
                <el-switch v-model="privacySettings.cookieConsent" />
              </div>
              <div class="flex justify-between items-center p-3 rounded-lg bg-slate-800/40">
                <div>
                  <div class="text-sm text-slate-200">Right to Be Forgotten</div>
                  <div class="text-xs text-slate-500">Allow customers to request data deletion</div>
                </div>
                <el-switch v-model="privacySettings.rightToBeForgotten" />
              </div>
            </div>
          </div>

          <div class="glass-panel p-6 rounded-xl">
            <h3 class="text-lg font-medium text-slate-200 mb-4">Data Erasure Requests</h3>
            <div class="space-y-3">
              <div v-for="req in erasureRequests" :key="req.id" class="p-3 rounded-lg bg-slate-800/40 flex justify-between items-center">
                <div>
                  <div class="text-sm text-slate-200">{{ req.name }}</div>
                  <div class="text-xs text-slate-500">{{ req.email }} - {{ req.date }}</div>
                </div>
                <div class="flex gap-2">
                  <el-button v-if="req.status === 'PENDING'" type="success" size="small" @click="processErasure(req)">Process</el-button>
                  <el-tag v-else :type="req.status === 'COMPLETED' ? 'success' : 'info'" effect="dark" size="small">{{ req.status }}</el-tag>
                </div>
              </div>
              <div v-if="erasureRequests.length === 0" class="text-center py-4 text-slate-500 text-sm">No erasure requests pending</div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Field-Level Encryption -->
      <el-tab-pane label="Encryption" name="encryption">
        <div class="glass-panel p-6 rounded-xl">
          <h3 class="text-lg font-medium text-slate-200 mb-4">Field-Level Encryption</h3>
          <p class="text-sm text-slate-500 mb-4">Configure which fields should be encrypted at rest for added security.</p>
          <el-table :data="encryptionFields" class="glass-table" stripe>
            <el-table-column prop="entity" label="Entity" width="140" />
            <el-table-column prop="field" label="Field" width="180" />
            <el-table-column prop="type" label="Data Type" width="120" />
            <el-table-column label="Encrypted" width="100" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.encrypted" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="Sensitivity" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="row.sensitivity === 'HIGH' ? 'danger' : row.sensitivity === 'MEDIUM' ? 'warning' : 'info'" effect="dark" size="small">
                  {{ row.sensitivity }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- Policy Dialog -->
    <el-dialog v-model="showPolicyDialog" title="Add Retention Policy" width="500px">
      <el-form label-position="top">
        <el-form-item label="Data Entity">
          <el-select v-model="newPolicy.entity" class="w-full">
            <el-option label="Leads" value="Leads" />
            <el-option label="Deals" value="Deals" />
            <el-option label="Activities" value="Activities" />
            <el-option label="Audit Logs" value="Audit Logs" />
            <el-option label="Sessions" value="Sessions" />
          </el-select>
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="Retention Period">
            <el-select v-model="newPolicy.retentionPeriod" class="w-full">
              <el-option label="30 days" value="30 days" />
              <el-option label="90 days" value="90 days" />
              <el-option label="6 months" value="6 months" />
              <el-option label="1 year" value="1 year" />
              <el-option label="3 years" value="3 years" />
            </el-select>
          </el-form-item>
          <el-form-item label="Action">
            <el-select v-model="newPolicy.action" class="w-full">
              <el-option label="Archive" value="ARCHIVE" />
              <el-option label="Delete" value="DELETE" />
              <el-option label="Anonymize" value="ANONYMIZE" />
            </el-select>
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showPolicyDialog = false">Cancel</el-button>
        <el-button type="primary" @click="savePolicy">Save Policy</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

definePageMeta({
  layout: 'default',
  middleware: 'permissions',
  permission: 'VIEW_SETTINGS'
});

const activeTab = ref('quality');
const auditing = ref(false);
const showPolicyDialog = ref(false);
const newPolicy = ref({ entity: '', retentionPeriod: '1 year', action: 'ARCHIVE' });

const qualityScore = ref(78);
const qualityScoreColor = computed(() => (qualityScore.value >= 80 ? '#10B981' : qualityScore.value >= 60 ? '#F59E0B' : '#EF4444'));

const dataMetrics = ref({ completeRecords: 85, duplicates: 47, validEmails: 92, staleRecords: 128 });

const qualityReport = ref([
  { name: 'Leads', icon: 'ph:users-three-bold', score: 82, totalRecords: 1250, complete: 1025, missingFields: 225, duplicates: 18 },
  { name: 'Clients', icon: 'ph:briefcase-bold', score: 91, totalRecords: 420, complete: 382, missingFields: 38, duplicates: 5 },
  { name: 'Deals', icon: 'ph:handshake-bold', score: 75, totalRecords: 680, complete: 510, missingFields: 170, duplicates: 12 },
  { name: 'Contacts', icon: 'ph:address-book-bold', score: 68, totalRecords: 890, complete: 605, missingFields: 285, duplicates: 22 }
]);

const retentionPolicies = ref([
  { entity: 'Audit Logs', retentionPeriod: '1 year', action: 'ARCHIVE', affectedRecords: 12500, lastRun: 'Feb 1, 2026', isActive: true },
  { entity: 'Sessions', retentionPeriod: '90 days', action: 'DELETE', affectedRecords: 8200, lastRun: 'Feb 15, 2026', isActive: true },
  { entity: 'Lost Leads', retentionPeriod: '6 months', action: 'ANONYMIZE', affectedRecords: 340, lastRun: null, isActive: false },
  { entity: 'Activity Logs', retentionPeriod: '2 years', action: 'ARCHIVE', affectedRecords: 45000, lastRun: 'Jan 1, 2026', isActive: true }
]);

const privacySettings = ref({
  marketingConsent: true,
  dataProcessing: true,
  cookieConsent: true,
  rightToBeForgotten: true
});

const erasureRequests = ref([
  { id: 1, name: 'John Smith', email: 'john@example.com', date: 'Feb 18, 2026', status: 'PENDING' },
  { id: 2, name: 'Lisa Park', email: 'lisa@example.com', date: 'Feb 10, 2026', status: 'COMPLETED' }
]);

const encryptionFields = ref([
  { entity: 'User', field: 'password', type: 'STRING', encrypted: true, sensitivity: 'HIGH' },
  { entity: 'User', field: 'twoFactorSecret', type: 'STRING', encrypted: true, sensitivity: 'HIGH' },
  { entity: 'Client', field: 'email', type: 'STRING', encrypted: false, sensitivity: 'MEDIUM' },
  { entity: 'Lead', field: 'phone', type: 'STRING', encrypted: false, sensitivity: 'MEDIUM' },
  { entity: 'Integration', field: 'apiKey', type: 'STRING', encrypted: true, sensitivity: 'HIGH' },
  { entity: 'Payment', field: 'reference', type: 'STRING', encrypted: true, sensitivity: 'HIGH' }
]);

const getProgressColor = (pct: number) => {
  if (pct >= 80) return '#10B981';
  if (pct >= 60) return '#F59E0B';
  return '#EF4444';
};

const runAudit = () => {
  auditing.value = true;
  setTimeout(() => {
    auditing.value = false;
    ElMessage.success(t('dataGovernance.auditCompleted'));
  }, 2000);
};

const processErasure = (req: any) => {
  req.status = 'COMPLETED';
  ElMessage.success(`Data erasure processed for ${req.name}`);
};

const savePolicy = () => {
  if (!newPolicy.value.entity) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  retentionPolicies.value.push({ ...newPolicy.value, affectedRecords: 0, lastRun: null, isActive: true });
  showPolicyDialog.value = false;
  ElMessage.success(t('dataGovernance.policySaved'));
};
</script>
