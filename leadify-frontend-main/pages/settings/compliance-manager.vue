<template lang="pug">
.compliance-manager-page.p-6(class="md:p-8")
  //- Page Header
  .header.mb-8
    .flex.items-center.justify-between.flex-wrap.gap-4
      div
        .flex.items-center.gap-3.mb-2
          .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: linear-gradient(135deg, #7849ff, #6a3ae0)")
            Icon(name="ph:shield-check-bold" size="22" style="color: white")
          h2.text-3xl.font-bold(style="color: var(--text-primary)") {{ $t('complianceManager.title') }}
          .compliance-score-badge(:class="overallScoreClass")
            Icon(name="ph:seal-check-bold" size="16")
            span {{ overallScore }}/100
        p(style="color: var(--text-muted)") {{ $t('complianceManager.subtitle') }}
      .flex.items-center.gap-3.flex-wrap
        el-button(size="large" type="primary" class="!bg-[#7849ff] !border-none !rounded-xl" @click="runAudit" :loading="auditRunning")
          Icon(name="ph:magnifying-glass-bold" size="16")
          span.ml-2 {{ $t('complianceManager.runAudit') }}
        el-button(size="large" class="!rounded-xl" @click="exportReport")
          Icon(name="ph:file-arrow-down-bold" size="16")
          span.ml-2 {{ $t('complianceManager.exportReport') }}

  //- Compliance Score Overview
  .grid.gap-5.mb-8(class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-5")
    .score-card.overall
      .score-card-inner
        .flex.items-center.justify-between
          div
            p.score-label {{ $t('complianceManager.overallScore') }}
            p.score-value {{ overallScore }}%
          el-progress(
            type="circle"
            :percentage="overallScore"
            :width="64"
            :stroke-width="6"
            :color="getScoreColor(overallScore)"
          )
    .score-card(v-for="fw in frameworks" :key="fw.key")
      .score-card-inner
        .flex.items-center.justify-between
          div
            p.score-label {{ fw.name }}
            .flex.items-baseline.gap-2
              p.score-value(:style="{ color: getScoreColor(fw.score) }") {{ fw.score }}%
              el-tag(:type="fw.score >= 90 ? 'success' : fw.score >= 75 ? 'warning' : 'danger'" size="small" effect="dark" round) {{ fw.score >= 90 ? $t('complianceManager.excellent') : fw.score >= 75 ? $t('complianceManager.good') : $t('complianceManager.needsWork') }}
          .framework-icon(:style="{ background: fw.iconBg }")
            Icon(:name="fw.icon" size="22" :style="{ color: fw.iconColor }")

  //- Tabs
  .max-w-full
    el-tabs(v-model="activeTab")

      //- Tab 1: Consent Management
      el-tab-pane(:label="$t('complianceManager.consentManagement')" name="consent")
        .glass-card.rounded-2xl.overflow-hidden
          .p-5.flex.items-center.justify-between.flex-wrap.gap-3(style="border-bottom: 1px solid var(--border-default)")
            h3.text-sm.font-bold.uppercase(style="color: var(--text-muted)") {{ $t('complianceManager.consentRecords') }}
            .flex.items-center.gap-2
              el-select(v-model="consentStatusFilter" clearable :placeholder="$t('complianceManager.allStatuses')" size="large" style="width: 160px")
                el-option(:label="$t('complianceManager.allStatuses')" value="")
                el-option(:label="$t('complianceManager.statusActive')" value="Active")
                el-option(:label="$t('complianceManager.statusWithdrawn')" value="Withdrawn")
                el-option(:label="$t('complianceManager.statusExpired')" value="Expired")
              el-input(
                v-model="consentSearch"
                :placeholder="$t('complianceManager.searchContacts')"
                prefix-icon="Search"
                clearable
                size="large"
                style="width: 240px"
              )

          el-table(:data="filteredConsentRecords" style="width: 100%" stripe)
            el-table-column(:label="$t('complianceManager.contact')" min-width="200")
              template(#default="{ row }")
                .flex.items-center.gap-3
                  .w-8.h-8.rounded-full.flex.items-center.justify-center.text-white.text-xs.font-bold(style="background: linear-gradient(135deg, #7849ff, #a78bfa)") {{ getInitials(row.name) }}
                  div
                    .text-sm.font-semibold(style="color: var(--text-primary)") {{ row.name }}
                    .text-xs(style="color: var(--text-muted)") {{ row.email }}
            el-table-column(:label="$t('complianceManager.consentTypes')" min-width="220")
              template(#default="{ row }")
                .flex.items-center.gap-1.flex-wrap
                  el-tag(v-for="ct in row.consentTypes" :key="ct" :type="getConsentTagType(ct)" size="small" effect="plain" round) {{ $t(`complianceManager.consent_${ct}`) }}
            el-table-column(:label="$t('complianceManager.consentDate')" width="140" sortable prop="consentDate")
              template(#default="{ row }")
                span.text-sm(style="color: var(--text-secondary)") {{ formatDate(row.consentDate) }}
            el-table-column(:label="$t('complianceManager.status')" width="130" align="center")
              template(#default="{ row }")
                el-tag(:type="getStatusTagType(row.status)" size="small" effect="dark" round) {{ $t(`complianceManager.status${row.status}`) }}
            el-table-column(:label="$t('complianceManager.actions')" width="120" align="center")
              template(#default="{ row }")
                .flex.items-center.gap-1.justify-center
                  el-tooltip(:content="$t('complianceManager.viewDetails')")
                    el-button(size="small" circle @click="viewConsentDetail(row)")
                      Icon(name="ph:eye-bold" size="14")
                  el-tooltip(:content="$t('complianceManager.revokeConsent')")
                    el-button(size="small" type="danger" circle @click="revokeConsent(row)" :disabled="row.status !== 'Active'")
                      Icon(name="ph:x-bold" size="14")
            template(#empty)
              .py-8.text-center
                Icon(name="ph:check-square-bold" size="40" style="color: var(--text-muted)")
                p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('complianceManager.noConsentRecords') }}

      //- Tab 2: Data Requests
      el-tab-pane(:label="$t('complianceManager.dataRequests')" name="requests")
        .glass-card.rounded-2xl.overflow-hidden
          .p-5.flex.items-center.justify-between.flex-wrap.gap-3(style="border-bottom: 1px solid var(--border-default)")
            h3.text-sm.font-bold.uppercase(style="color: var(--text-muted)") {{ $t('complianceManager.dsarRequests') }}
            .flex.items-center.gap-2
              el-select(v-model="requestStatusFilter" clearable :placeholder="$t('complianceManager.allStatuses')" size="large" style="width: 160px")
                el-option(:label="$t('complianceManager.allStatuses')" value="")
                el-option(:label="$t('complianceManager.reqPending')" value="Pending")
                el-option(:label="$t('complianceManager.reqInProgress')" value="In Progress")
                el-option(:label="$t('complianceManager.reqCompleted')" value="Completed")
                el-option(:label="$t('complianceManager.reqDenied')" value="Denied")
              el-button(type="primary" size="large" class="!bg-[#7849ff] !border-none !rounded-xl" @click="showRequestDetailDialog = true; selectedRequest = null")
                Icon(name="ph:plus-bold" size="16")
                span.ml-2 {{ $t('complianceManager.newRequest') }}

          el-table(:data="filteredDataRequests" style="width: 100%" stripe)
            el-table-column(:label="$t('complianceManager.requester')" min-width="200")
              template(#default="{ row }")
                .flex.items-center.gap-3
                  .w-8.h-8.rounded-full.flex.items-center.justify-center.text-white.text-xs.font-bold(:style="{ background: getAvatarColor(row.requester) }") {{ getInitials(row.requester) }}
                  div
                    .text-sm.font-semibold(style="color: var(--text-primary)") {{ row.requester }}
                    .text-xs(style="color: var(--text-muted)") {{ row.email }}
            el-table-column(:label="$t('complianceManager.requestType')" width="150")
              template(#default="{ row }")
                el-tag(:type="getRequestTypeTag(row.type)" size="small" effect="dark" round)
                  Icon(:name="getRequestTypeIcon(row.type)" size="12" class="mr-1")
                  | {{ $t(`complianceManager.type_${row.type}`) }}
            el-table-column(:label="$t('complianceManager.status')" width="130" align="center")
              template(#default="{ row }")
                el-tag(:type="getRequestStatusTag(row.status)" size="small" effect="dark" round) {{ $t(`complianceManager.req${row.status.replace(/\s/g, '')}`) }}
            el-table-column(:label="$t('complianceManager.deadline')" width="140" sortable prop="deadline")
              template(#default="{ row }")
                .flex.items-center.gap-1
                  Icon(v-if="isOverdue(row.deadline)" name="ph:warning-bold" size="14" style="color: #ef4444")
                  span.text-sm(:style="{ color: isOverdue(row.deadline) ? '#ef4444' : 'var(--text-secondary)' }") {{ formatDate(row.deadline) }}
            el-table-column(:label="$t('complianceManager.assignedTo')" width="150")
              template(#default="{ row }")
                .flex.items-center.gap-2
                  .w-6.h-6.rounded-full.flex.items-center.justify-center.text-white.text-xs.font-bold(style="background: linear-gradient(135deg, #3b82f6, #60a5fa)") {{ getInitials(row.assignedTo) }}
                  span.text-sm(style="color: var(--text-secondary)") {{ row.assignedTo }}
            el-table-column(:label="$t('complianceManager.actions')" width="100" align="center")
              template(#default="{ row }")
                el-tooltip(:content="$t('complianceManager.viewDetails')")
                  el-button(size="small" circle @click="openRequestDetail(row)")
                    Icon(name="ph:eye-bold" size="14")
            template(#empty)
              .py-8.text-center
                Icon(name="ph:user-circle-bold" size="40" style="color: var(--text-muted)")
                p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('complianceManager.noRequests') }}

      //- Tab 3: Privacy Impact Assessments
      el-tab-pane(:label="$t('complianceManager.piaTab')" name="pia")
        .flex.items-center.justify-between.mb-6
          h3.text-sm.font-bold.uppercase(style="color: var(--text-muted)") {{ $t('complianceManager.privacyImpactAssessments') }}
          el-button(type="primary" size="large" class="!bg-[#7849ff] !border-none !rounded-xl" @click="showNewPiaDialog = true")
            Icon(name="ph:plus-bold" size="16")
            span.ml-2 {{ $t('complianceManager.newPia') }}
        .grid.gap-5(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-4")
          .pia-card(v-for="pia in piaList" :key="pia.id")
            .glass-card.p-5.rounded-2xl.h-full
              .flex.items-center.justify-between.mb-3
                el-tag(:type="getRiskTagType(pia.riskLevel)" size="small" effect="dark" round) {{ $t(`complianceManager.risk_${pia.riskLevel}`) }}
                el-tag(:type="getPiaStatusTag(pia.status)" size="small" effect="plain" round) {{ $t(`complianceManager.pia_${pia.status}`) }}
              h4.text-sm.font-bold.mb-1(style="color: var(--text-primary)") {{ pia.name }}
              .flex.items-center.gap-1.mb-3
                Icon(name="ph:buildings-bold" size="14" style="color: var(--text-muted)")
                span.text-xs(style="color: var(--text-muted)") {{ pia.department }}
              .flex.items-center.justify-between.pt-3(style="border-top: 1px solid var(--border-default)")
                .flex.items-center.gap-1
                  Icon(name="ph:calendar-bold" size="14" style="color: var(--text-muted)")
                  span.text-xs(style="color: var(--text-muted)") {{ formatDate(pia.lastReviewed) }}
                el-button(size="small" type="primary" plain class="!rounded-lg" @click="openRequestDetail(pia)")
                  Icon(name="ph:eye-bold" size="14")

      //- Tab 4: Audit Trail
      el-tab-pane(:label="$t('complianceManager.auditTrail')" name="audit")
        .glass-card.rounded-2xl.overflow-hidden.mb-6
          .p-5.flex.items-center.justify-between.flex-wrap.gap-3(style="border-bottom: 1px solid var(--border-default)")
            h3.text-sm.font-bold.uppercase(style="color: var(--text-muted)") {{ $t('complianceManager.complianceEvents') }}
            .flex.items-center.gap-3
              el-select(v-model="auditCategoryFilter" clearable :placeholder="$t('complianceManager.allCategories')" size="large" style="width: 180px")
                el-option(:label="$t('complianceManager.allCategories')" value="")
                el-option(:label="$t('complianceManager.catConsent')" value="Consent")
                el-option(:label="$t('complianceManager.catDataRequest')" value="Data Request")
                el-option(:label="$t('complianceManager.catPolicy')" value="Policy")
                el-option(:label="$t('complianceManager.catAccess')" value="Access")
                el-option(:label="$t('complianceManager.catSecurity')" value="Security")
              el-radio-group(v-model="auditViewMode" size="small")
                el-radio-button(value="table") {{ $t('complianceManager.tableView') }}
                el-radio-button(value="timeline") {{ $t('complianceManager.timelineView') }}

          //- Table View
          template(v-if="auditViewMode === 'table'")
            el-table(:data="filteredAuditEntries" style="width: 100%" stripe)
              el-table-column(:label="$t('complianceManager.timestamp')" width="180" sortable prop="timestamp")
                template(#default="{ row }")
                  .text-sm.font-mono(style="color: var(--text-secondary)") {{ formatDateTime(row.timestamp) }}
              el-table-column(:label="$t('complianceManager.action')" min-width="180")
                template(#default="{ row }")
                  .flex.items-center.gap-2
                    Icon(:name="getAuditIcon(row.category)" size="16" :style="{ color: getAuditColor(row.category) }")
                    span.text-sm.font-medium(style="color: var(--text-primary)") {{ row.action }}
              el-table-column(:label="$t('complianceManager.user')" width="160")
                template(#default="{ row }")
                  .flex.items-center.gap-2
                    .w-6.h-6.rounded-full.flex.items-center.justify-center.text-white.text-xs.font-bold(style="background: linear-gradient(135deg, #7849ff, #a78bfa)") {{ getInitials(row.user) }}
                    span.text-sm(style="color: var(--text-secondary)") {{ row.user }}
              el-table-column(:label="$t('complianceManager.affectedRecords')" width="140" align="center")
                template(#default="{ row }")
                  span.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.affectedRecords.toLocaleString() }}
              el-table-column(:label="$t('complianceManager.category')" width="140")
                template(#default="{ row }")
                  el-tag(:type="getCategoryTag(row.category)" size="small" effect="plain" round) {{ row.category }}
              template(#empty)
                .py-8.text-center
                  Icon(name="ph:list-bullets-bold" size="40" style="color: var(--text-muted)")
                  p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('complianceManager.noAuditEntries') }}

          //- Timeline View
          template(v-else)
            .p-6
              el-timeline
                el-timeline-item(
                  v-for="entry in filteredAuditEntries"
                  :key="entry.id"
                  :timestamp="formatDateTime(entry.timestamp)"
                  placement="top"
                  :color="getAuditColor(entry.category)"
                )
                  .glass-card.p-4.rounded-xl
                    .flex.items-center.justify-between
                      .flex.items-center.gap-3
                        Icon(:name="getAuditIcon(entry.category)" size="18" :style="{ color: getAuditColor(entry.category) }")
                        div
                          .text-sm.font-semibold(style="color: var(--text-primary)") {{ entry.action }}
                          .text-xs(style="color: var(--text-muted)") {{ entry.user }} -- {{ entry.affectedRecords.toLocaleString() }} {{ $t('complianceManager.recordsAffected') }}
                      el-tag(:type="getCategoryTag(entry.category)" size="small" effect="plain" round) {{ entry.category }}

      //- Tab 5: Data Classification
      el-tab-pane(:label="$t('complianceManager.dataClassification')" name="classification")
        .glass-card.rounded-2xl.overflow-hidden
          .p-5.flex.items-center.justify-between(style="border-bottom: 1px solid var(--border-default)")
            h3.text-sm.font-bold.uppercase(style="color: var(--text-muted)") {{ $t('complianceManager.dataFieldClassification') }}
            .flex.items-center.gap-3
              .flex.items-center.gap-2(v-for="cl in classificationLegend" :key="cl.level")
                .w-3.h-3.rounded-sm(:style="{ background: cl.color }")
                span.text-xs(style="color: var(--text-muted)") {{ $t(`complianceManager.class_${cl.level}`) }}

          el-table(:data="dataClassificationFields" style="width: 100%" stripe)
            el-table-column(:label="$t('complianceManager.fieldName')" min-width="180")
              template(#default="{ row }")
                .flex.items-center.gap-2
                  Icon(name="ph:database-bold" size="16" style="color: var(--text-muted)")
                  span.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.fieldName }}
            el-table-column(:label="$t('complianceManager.classification')" width="160")
              template(#default="{ row }")
                el-tag(:type="getClassificationTag(row.classification)" size="small" effect="dark" round)
                  Icon(:name="getClassificationIcon(row.classification)" size="12" class="mr-1")
                  | {{ $t(`complianceManager.class_${row.classification}`) }}
            el-table-column(:label="$t('complianceManager.retentionPeriod')" width="150")
              template(#default="{ row }")
                span.text-sm(style="color: var(--text-secondary)") {{ row.retentionPeriod }}
            el-table-column(:label="$t('complianceManager.encryption')" width="130" align="center")
              template(#default="{ row }")
                .flex.items-center.justify-center
                  el-switch(v-model="row.encrypted" :active-text="''" :inactive-text="''" active-color="#22c55e" inactive-color="#ef4444" disabled)
            el-table-column(:label="$t('complianceManager.accessCount')" width="140" align="center" sortable prop="accessCount")
              template(#default="{ row }")
                .flex.items-center.justify-center.gap-1
                  Icon(name="ph:eye-bold" size="14" style="color: var(--text-muted)")
                  span.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.accessCount.toLocaleString() }}
            template(#empty)
              .py-8.text-center
                Icon(name="ph:database-bold" size="40" style="color: var(--text-muted)")
                p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('complianceManager.noDataFields') }}

  //- Data Request Detail Dialog
  el-dialog(v-model="showRequestDetailDialog" :title="selectedRequest ? $t('complianceManager.requestDetails') : $t('complianceManager.newRequest')" width="680px")
    template(v-if="selectedRequest")
      .space-y-4
        //- Request Info Grid
        .grid.gap-4(class="grid-cols-2")
          .p-4.rounded-xl(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
            .text-xs.mb-1(style="color: var(--text-muted)") {{ $t('complianceManager.requester') }}
            .text-sm.font-semibold(style="color: var(--text-primary)") {{ selectedRequest.requester }}
            .text-xs(style="color: var(--text-muted)") {{ selectedRequest.email }}
          .p-4.rounded-xl(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
            .text-xs.mb-1(style="color: var(--text-muted)") {{ $t('complianceManager.requestType') }}
            el-tag(:type="getRequestTypeTag(selectedRequest.type)" size="small" effect="dark") {{ $t(`complianceManager.type_${selectedRequest.type}`) }}
        .grid.gap-4(class="grid-cols-3")
          .p-4.rounded-xl(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
            .text-xs.mb-1(style="color: var(--text-muted)") {{ $t('complianceManager.deadline') }}
            .text-sm.font-bold(:style="{ color: isOverdue(selectedRequest.deadline) ? '#ef4444' : '#22c55e' }") {{ formatDate(selectedRequest.deadline) }}
          .p-4.rounded-xl(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
            .text-xs.mb-1(style="color: var(--text-muted)") {{ $t('complianceManager.assignedTo') }}
            .text-sm(style="color: var(--text-primary)") {{ selectedRequest.assignedTo }}
          .p-4.rounded-xl(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
            .text-xs.mb-1(style="color: var(--text-muted)") {{ $t('complianceManager.status') }}
            el-tag(:type="getRequestStatusTag(selectedRequest.status)" effect="dark" size="small") {{ $t(`complianceManager.req${selectedRequest.status.replace(/\\s/g, '')}`) }}

        //- Checklist
        .p-4.rounded-xl(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
          .text-xs.mb-3.font-bold.uppercase(style="color: var(--text-muted)") {{ $t('complianceManager.processingChecklist') }}
          .space-y-2
            .flex.items-center.gap-2(v-for="(step, idx) in requestChecklist" :key="idx")
              el-checkbox(v-model="step.done" :label="step.label")

        //- Notes
        .p-4.rounded-xl(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
          .text-xs.mb-2.font-bold.uppercase(style="color: var(--text-muted)") {{ $t('complianceManager.notes') }}
          .text-sm(style="color: var(--text-primary)") {{ selectedRequest.notes || $t('complianceManager.noNotes') }}

        //- Timeline
        .p-4.rounded-xl(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
          .text-xs.mb-3.font-bold.uppercase(style="color: var(--text-muted)") {{ $t('complianceManager.requestTimeline') }}
          el-timeline
            el-timeline-item(
              v-for="(ev, idx) in selectedRequest.timeline"
              :key="idx"
              :timestamp="ev.date"
              placement="top"
              :color="ev.color"
            )
              span.text-sm(style="color: var(--text-primary)") {{ ev.text }}

    template(#footer)
      el-button(@click="showRequestDetailDialog = false") {{ $t('complianceManager.close') }}
      el-button(v-if="selectedRequest && selectedRequest.status !== 'Completed'" type="primary" @click="markRequestCompleted" class="!bg-[#7849ff] !border-none") {{ $t('complianceManager.markCompleted') }}

  //- New PIA Dialog
  el-dialog(v-model="showNewPiaDialog" :title="$t('complianceManager.newPia')" width="620px")
    el-form(:model="newPiaForm" label-position="top")
      el-form-item(:label="$t('complianceManager.assessmentName')" required)
        el-input(v-model="newPiaForm.name" :placeholder="$t('complianceManager.enterAssessmentName')")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('complianceManager.department')" required)
          el-select(v-model="newPiaForm.department" style="width: 100%")
            el-option(v-for="dept in departments" :key="dept" :label="dept" :value="dept")
        el-form-item(:label="$t('complianceManager.riskLevel')")
          el-select(v-model="newPiaForm.riskLevel" style="width: 100%")
            el-option(:label="$t('complianceManager.risk_High')" value="High")
            el-option(:label="$t('complianceManager.risk_Medium')" value="Medium")
            el-option(:label="$t('complianceManager.risk_Low')" value="Low")
      el-form-item(:label="$t('complianceManager.description')")
        el-input(v-model="newPiaForm.description" type="textarea" :rows="3" :placeholder="$t('complianceManager.describePia')")
      el-form-item(:label="$t('complianceManager.dataTypes')")
        el-checkbox-group(v-model="newPiaForm.dataTypes")
          el-checkbox(label="PII" value="PII") PII
          el-checkbox(label="Financial" value="Financial") {{ $t('complianceManager.financial') }}
          el-checkbox(label="Health" value="Health") {{ $t('complianceManager.health') }}
          el-checkbox(label="Biometric" value="Biometric") {{ $t('complianceManager.biometric') }}
          el-checkbox(label="Behavioral" value="Behavioral") {{ $t('complianceManager.behavioral') }}
    template(#footer)
      el-button(@click="showNewPiaDialog = false") {{ $t('complianceManager.cancel') }}
      el-button(type="primary" @click="submitNewPia" class="!bg-[#7849ff] !border-none") {{ $t('complianceManager.createPia') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElMessage, ElNotification } from 'element-plus';

definePageMeta({ title: 'Compliance Manager' });

const { t } = useI18n();

// --- State ---
const activeTab = ref('consent');
const auditRunning = ref(false);
const consentSearch = ref('');
const consentStatusFilter = ref('');
const requestStatusFilter = ref('');
const auditCategoryFilter = ref('');
const auditViewMode = ref('table');
const showRequestDetailDialog = ref(false);
const showNewPiaDialog = ref(false);
const selectedRequest = ref<any>(null);
const overallScore = ref(87);

// --- Frameworks ---
const frameworks = ref([
  { key: 'gdpr', name: 'GDPR', score: 92, icon: 'ph:flag-bold', iconColor: '#3b82f6', iconBg: 'rgba(59, 130, 246, 0.1)' },
  { key: 'ccpa', name: 'CCPA', score: 85, icon: 'ph:shield-bold', iconColor: '#f59e0b', iconBg: 'rgba(245, 158, 11, 0.1)' },
  { key: 'sox', name: 'SOX', score: 78, icon: 'ph:scales-bold', iconColor: '#ef4444', iconBg: 'rgba(239, 68, 68, 0.1)' },
  { key: 'hipaa', name: 'HIPAA', score: 90, icon: 'ph:heart-bold', iconColor: '#22c55e', iconBg: 'rgba(34, 197, 94, 0.1)' }
]);

const overallScoreClass = computed(() => {
  if (overallScore.value >= 90) return 'score-excellent';
  if (overallScore.value >= 75) return 'score-good';
  return 'score-needs-work';
});

// --- Consent Records (20 records) ---
const consentRecords = ref([
  { id: 1, name: 'Emily Watson', email: 'emily.watson@techcorp.com', consentTypes: ['marketing', 'analytics'], consentDate: '2025-09-15', status: 'Active' },
  { id: 2, name: 'Michael Chen', email: 'michael.chen@globex.com', consentTypes: ['analytics', 'thirdParty'], consentDate: '2025-11-01', status: 'Active' },
  { id: 3, name: 'Sarah Al-Rashid', email: 'sarah.r@nexgen.io', consentTypes: ['marketing', 'analytics', 'thirdParty'], consentDate: '2025-06-20', status: 'Active' },
  { id: 4, name: 'James Okonkwo', email: 'james.o@dataflow.co', consentTypes: ['marketing'], consentDate: '2025-08-10', status: 'Withdrawn' },
  { id: 5, name: 'Anna Petrova', email: 'anna.p@cloudnine.eu', consentTypes: ['analytics'], consentDate: '2025-10-05', status: 'Active' },
  { id: 6, name: 'Carlos Mendoza', email: 'carlos.m@latamhub.com', consentTypes: ['marketing', 'thirdParty'], consentDate: '2025-12-12', status: 'Active' },
  { id: 7, name: 'Fatima Al-Zahra', email: 'fatima.z@gulfdata.sa', consentTypes: ['marketing', 'analytics'], consentDate: '2025-07-01', status: 'Expired' },
  { id: 8, name: 'Thomas Mueller', email: 'thomas.m@eurobiz.de', consentTypes: ['analytics', 'thirdParty'], consentDate: '2025-05-18', status: 'Withdrawn' },
  { id: 9, name: 'Yuki Tanaka', email: 'yuki.t@nihontech.jp', consentTypes: ['marketing'], consentDate: '2025-11-25', status: 'Active' },
  { id: 10, name: 'Rachel Kim', email: 'rachel.k@seoulsoft.kr', consentTypes: ['analytics', 'thirdParty'], consentDate: '2025-09-30', status: 'Active' },
  { id: 11, name: 'Oliver Schmidt', email: 'oliver.s@berlinsys.de', consentTypes: ['marketing', 'analytics'], consentDate: '2025-04-15', status: 'Expired' },
  { id: 12, name: 'Amara Diallo', email: 'amara.d@westafrica.io', consentTypes: ['marketing', 'analytics', 'thirdParty'], consentDate: '2026-01-08', status: 'Active' },
  { id: 13, name: 'Liam OBrien', email: 'liam.ob@dublintech.ie', consentTypes: ['thirdParty'], consentDate: '2025-10-22', status: 'Active' },
  { id: 14, name: 'Priya Sharma', email: 'priya.s@bangalore.in', consentTypes: ['marketing', 'analytics'], consentDate: '2025-08-30', status: 'Active' },
  { id: 15, name: 'Hassan Ibrahim', email: 'hassan.i@cairosolutions.eg', consentTypes: ['analytics'], consentDate: '2025-06-15', status: 'Withdrawn' },
  { id: 16, name: 'Sofia Rossi', email: 'sofia.r@milandesign.it', consentTypes: ['marketing', 'thirdParty'], consentDate: '2025-12-01', status: 'Active' },
  { id: 17, name: 'David Park', email: 'david.p@innotech.kr', consentTypes: ['marketing', 'analytics', 'thirdParty'], consentDate: '2026-01-20', status: 'Active' },
  { id: 18, name: 'Mei Lin Zhang', email: 'meilin.z@shenzhenai.cn', consentTypes: ['analytics'], consentDate: '2025-07-10', status: 'Expired' },
  { id: 19, name: 'Erik Johansson', email: 'erik.j@stockholmhq.se', consentTypes: ['marketing'], consentDate: '2025-11-05', status: 'Active' },
  { id: 20, name: 'Natasha Volkov', email: 'natasha.v@moscowcorp.ru', consentTypes: ['marketing', 'analytics'], consentDate: '2025-09-18', status: 'Withdrawn' }
]);

const filteredConsentRecords = computed(() => {
  return consentRecords.value.filter((rec) => {
    const matchSearch = !consentSearch.value ||
      rec.name.toLowerCase().includes(consentSearch.value.toLowerCase()) ||
      rec.email.toLowerCase().includes(consentSearch.value.toLowerCase());
    const matchStatus = !consentStatusFilter.value || rec.status === consentStatusFilter.value;
    return matchSearch && matchStatus;
  });
});

// --- Data Requests (10 records) ---
const dataRequests = ref([
  { id: 1, requester: 'Emma Thompson', email: 'emma.t@techcorp.com', type: 'Access', status: 'In Progress', deadline: '2026-03-20', assignedTo: 'Sarah Johnson', notes: 'Full data export requested for personal records held across CRM, billing, and support systems.', timeline: [{ date: '2026-02-15', text: 'Request submitted via privacy portal', color: '#3b82f6' }, { date: '2026-02-17', text: 'Assigned to Sarah Johnson', color: '#f59e0b' }, { date: '2026-02-20', text: 'Data collection in progress', color: '#7849ff' }] },
  { id: 2, requester: 'David Park', email: 'david.p@innotech.kr', type: 'Deletion', status: 'Pending', deadline: '2026-03-25', assignedTo: 'Ahmed Hassan', notes: 'Right to erasure for all marketing and analytics data. Retain only legally required records.', timeline: [{ date: '2026-02-22', text: 'Request submitted', color: '#3b82f6' }, { date: '2026-02-23', text: 'Under initial review', color: '#f59e0b' }] },
  { id: 3, requester: 'Lisa Muller', email: 'lisa.m@eurobiz.de', type: 'Portability', status: 'In Progress', deadline: '2026-03-12', assignedTo: 'Maria Garcia', notes: 'Export all personal data in machine-readable JSON format for transfer to competitor CRM.', timeline: [{ date: '2026-02-10', text: 'Request received', color: '#3b82f6' }, { date: '2026-02-12', text: 'Data mapping initiated', color: '#f59e0b' }, { date: '2026-02-18', text: 'Export file generation started', color: '#7849ff' }] },
  { id: 4, requester: 'Omar Al-Fayed', email: 'omar.f@gulfdata.sa', type: 'Rectification', status: 'Pending', deadline: '2026-03-05', assignedTo: 'James Chen', notes: 'Correction of inaccurate company name and phone number in contact records.', timeline: [{ date: '2026-01-28', text: 'Request submitted with evidence', color: '#3b82f6' }] },
  { id: 5, requester: 'Maria Santos', email: 'maria.s@latamhub.com', type: 'Access', status: 'Completed', deadline: '2026-02-28', assignedTo: 'Sarah Johnson', notes: 'Standard data access request fulfilled with full PDF export delivered securely.', timeline: [{ date: '2026-02-01', text: 'Request submitted', color: '#3b82f6' }, { date: '2026-02-03', text: 'Assigned to Sarah Johnson', color: '#f59e0b' }, { date: '2026-02-10', text: 'Data compiled', color: '#7849ff' }, { date: '2026-02-15', text: 'Delivered to requester', color: '#22c55e' }] },
  { id: 6, requester: 'Kenji Nakamura', email: 'kenji.n@nihontech.jp', type: 'Deletion', status: 'Pending', deadline: '2026-03-22', assignedTo: 'Ahmed Hassan', notes: 'Complete data removal including backups, archives, and third-party system records.', timeline: [{ date: '2026-02-22', text: 'Request submitted', color: '#3b82f6' }] },
  { id: 7, requester: 'Sophie Laurent', email: 'sophie.l@francais.fr', type: 'Portability', status: 'In Progress', deadline: '2026-03-18', assignedTo: 'Maria Garcia', notes: 'Data export for migration to Salesforce. Requires CSV and JSON formats.', timeline: [{ date: '2026-02-25', text: 'Request submitted', color: '#3b82f6' }, { date: '2026-02-27', text: 'Format requirements confirmed', color: '#f59e0b' }] },
  { id: 8, requester: 'Aisha Patel', email: 'aisha.p@mumbaitech.in', type: 'Access', status: 'Denied', deadline: '2026-02-20', assignedTo: 'James Chen', notes: 'Request denied: insufficient identity verification provided. Requester notified with resubmission instructions.', timeline: [{ date: '2026-02-05', text: 'Request submitted', color: '#3b82f6' }, { date: '2026-02-07', text: 'Identity verification requested', color: '#f59e0b' }, { date: '2026-02-14', text: 'Verification not received, request denied', color: '#ef4444' }] },
  { id: 9, requester: 'Robert Andersson', email: 'robert.a@stockholmhq.se', type: 'Rectification', status: 'Completed', deadline: '2026-02-25', assignedTo: 'Sarah Johnson', notes: 'Email address and job title corrected across all systems.', timeline: [{ date: '2026-02-10', text: 'Request submitted', color: '#3b82f6' }, { date: '2026-02-12', text: 'Changes applied to CRM', color: '#7849ff' }, { date: '2026-02-13', text: 'Propagated to marketing automation', color: '#22c55e' }] },
  { id: 10, requester: 'Chen Wei', email: 'chen.w@shanghaidata.cn', type: 'Deletion', status: 'In Progress', deadline: '2026-03-15', assignedTo: 'Ahmed Hassan', notes: 'Cross-border data deletion request. Legal review required for data residency compliance.', timeline: [{ date: '2026-02-18', text: 'Request submitted', color: '#3b82f6' }, { date: '2026-02-20', text: 'Legal review initiated', color: '#f59e0b' }, { date: '2026-02-25', text: 'Legal clearance received', color: '#22c55e' }] }
]);

const filteredDataRequests = computed(() => {
  return dataRequests.value.filter((req) => {
    return !requestStatusFilter.value || req.status === requestStatusFilter.value;
  });
});

// --- Request Detail Checklist ---
const requestChecklist = ref([
  { label: t('complianceManager.checkIdentity'), done: true },
  { label: t('complianceManager.checkScope'), done: true },
  { label: t('complianceManager.checkLegal'), done: false },
  { label: t('complianceManager.checkDataCollect'), done: false },
  { label: t('complianceManager.checkThirdParty'), done: false },
  { label: t('complianceManager.checkDeliver'), done: false }
]);

// --- Privacy Impact Assessments (8 records) ---
const piaList = ref([
  { id: 1, name: 'Customer Data Migration to Cloud', department: 'Engineering', riskLevel: 'High', status: 'UnderReview', lastReviewed: '2026-02-15' },
  { id: 2, name: 'Marketing Analytics Platform', department: 'Marketing', riskLevel: 'Medium', status: 'Approved', lastReviewed: '2026-01-20' },
  { id: 3, name: 'Employee Biometric Access System', department: 'HR', riskLevel: 'High', status: 'Draft', lastReviewed: '2026-02-28' },
  { id: 4, name: 'Third-Party CRM Integration', department: 'Sales', riskLevel: 'Medium', status: 'Approved', lastReviewed: '2025-12-10' },
  { id: 5, name: 'AI-Powered Lead Scoring', department: 'Sales', riskLevel: 'High', status: 'UnderReview', lastReviewed: '2026-02-20' },
  { id: 6, name: 'Customer Feedback Collection', department: 'Support', riskLevel: 'Low', status: 'Approved', lastReviewed: '2025-11-05' },
  { id: 7, name: 'Financial Reporting Automation', department: 'Finance', riskLevel: 'Medium', status: 'Draft', lastReviewed: '2026-02-25' },
  { id: 8, name: 'Mobile App User Tracking', department: 'Product', riskLevel: 'High', status: 'UnderReview', lastReviewed: '2026-02-22' }
]);

// --- Audit Entries (15 records) ---
const auditEntries = ref([
  { id: 1, timestamp: '2026-02-28T14:32:00', action: 'Consent record updated for Emily Watson', user: 'Sarah Johnson', affectedRecords: 1, category: 'Consent' },
  { id: 2, timestamp: '2026-02-28T13:15:00', action: 'DSAR access request completed (REQ-2026-042)', user: 'Ahmed Hassan', affectedRecords: 1, category: 'Data Request' },
  { id: 3, timestamp: '2026-02-28T12:45:00', action: 'Automated purge of expired session data', user: 'System', affectedRecords: 1240, category: 'Policy' },
  { id: 4, timestamp: '2026-02-28T11:20:00', action: 'Data retention policy updated for communications', user: 'Maria Garcia', affectedRecords: 89500, category: 'Policy' },
  { id: 5, timestamp: '2026-02-27T16:42:00', action: 'Marketing consent revoked for Thomas Mueller', user: 'Sarah Johnson', affectedRecords: 1, category: 'Consent' },
  { id: 6, timestamp: '2026-02-27T15:30:00', action: 'New deletion request created (REQ-2026-045)', user: 'Ahmed Hassan', affectedRecords: 1, category: 'Data Request' },
  { id: 7, timestamp: '2026-02-27T14:10:00', action: 'Field-level encryption enabled for PII fields', user: 'James Chen', affectedRecords: 12450, category: 'Security' },
  { id: 8, timestamp: '2026-02-27T11:55:00', action: 'Contact data rectified for Omar Al-Fayed', user: 'Maria Garcia', affectedRecords: 3, category: 'Data Request' },
  { id: 9, timestamp: '2026-02-26T17:30:00', action: 'New 90-day retention policy for session data', user: 'Sarah Johnson', affectedRecords: 245000, category: 'Policy' },
  { id: 10, timestamp: '2026-02-26T14:15:00', action: 'Batch anonymization of expired marketing leads', user: 'System', affectedRecords: 340, category: 'Policy' },
  { id: 11, timestamp: '2026-02-26T10:45:00', action: 'Unauthorized access attempt blocked on financial records', user: 'System', affectedRecords: 0, category: 'Security' },
  { id: 12, timestamp: '2026-02-25T16:20:00', action: 'PIA approved for Marketing Analytics Platform', user: 'Compliance Officer', affectedRecords: 1, category: 'Access' },
  { id: 13, timestamp: '2026-02-25T11:00:00', action: 'Weekly compliance scan completed (Score: 87/100)', user: 'System', affectedRecords: 0, category: 'Security' },
  { id: 14, timestamp: '2026-02-24T15:45:00', action: 'Bulk consent renewal for 128 marketing records', user: 'Ahmed Hassan', affectedRecords: 128, category: 'Consent' },
  { id: 15, timestamp: '2026-02-24T09:10:00', action: 'Export of quarterly compliance report generated', user: 'James Chen', affectedRecords: 0, category: 'Access' }
]);

const filteredAuditEntries = computed(() => {
  return auditEntries.value.filter((entry) => {
    return !auditCategoryFilter.value || entry.category === auditCategoryFilter.value;
  });
});

// --- Data Classification (12 fields) ---
const dataClassificationFields = ref([
  { id: 1, fieldName: 'Full Name', classification: 'Internal', retentionPeriod: '3 years', encrypted: false, accessCount: 45230 },
  { id: 2, fieldName: 'Email Address', classification: 'Confidential', retentionPeriod: '3 years', encrypted: true, accessCount: 38920 },
  { id: 3, fieldName: 'Phone Number', classification: 'Confidential', retentionPeriod: '3 years', encrypted: true, accessCount: 22100 },
  { id: 4, fieldName: 'National ID / SSN', classification: 'Restricted', retentionPeriod: '7 years', encrypted: true, accessCount: 1250 },
  { id: 5, fieldName: 'Company Name', classification: 'Public', retentionPeriod: '5 years', encrypted: false, accessCount: 67800 },
  { id: 6, fieldName: 'Billing Address', classification: 'Confidential', retentionPeriod: '7 years', encrypted: true, accessCount: 15400 },
  { id: 7, fieldName: 'Credit Card (Last 4)', classification: 'Restricted', retentionPeriod: '1 year', encrypted: true, accessCount: 8900 },
  { id: 8, fieldName: 'IP Address', classification: 'Internal', retentionPeriod: '90 days', encrypted: false, accessCount: 156000 },
  { id: 9, fieldName: 'Purchase History', classification: 'Internal', retentionPeriod: '5 years', encrypted: false, accessCount: 34500 },
  { id: 10, fieldName: 'Health Records', classification: 'Restricted', retentionPeriod: '10 years', encrypted: true, accessCount: 420 },
  { id: 11, fieldName: 'Job Title', classification: 'Public', retentionPeriod: '3 years', encrypted: false, accessCount: 52300 },
  { id: 12, fieldName: 'Login Credentials', classification: 'Restricted', retentionPeriod: 'Until account deletion', encrypted: true, accessCount: 0 }
]);

const classificationLegend = [
  { level: 'Public', color: '#22c55e' },
  { level: 'Internal', color: '#3b82f6' },
  { level: 'Confidential', color: '#f59e0b' },
  { level: 'Restricted', color: '#ef4444' }
];

// --- New PIA Form ---
const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Support', 'Product', 'Legal'];
const newPiaForm = reactive({
  name: '',
  department: '',
  riskLevel: 'Medium',
  description: '',
  dataTypes: [] as string[]
});

// --- Helpers ---
function getInitials(name: string): string {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = ['#7849ff', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length] || '#7849ff';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function isOverdue(dateStr: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#22c55e';
  if (score >= 75) return '#f59e0b';
  return '#ef4444';
}

function getConsentTagType(type: string): 'success' | 'warning' | 'info' | '' {
  switch (type) {
    case 'marketing': return 'warning';
    case 'analytics': return 'info';
    case 'thirdParty': return '';
    default: return '';
  }
}

function getStatusTagType(status: string): 'success' | 'danger' | 'warning' | 'info' | '' {
  switch (status) {
    case 'Active': return 'success';
    case 'Withdrawn': return 'danger';
    case 'Expired': return 'warning';
    default: return 'info';
  }
}

function getRequestTypeTag(type: string): 'success' | 'danger' | 'warning' | 'info' | '' {
  switch (type) {
    case 'Access': return 'info';
    case 'Deletion': return 'danger';
    case 'Portability': return 'warning';
    case 'Rectification': return 'success';
    default: return '';
  }
}

function getRequestTypeIcon(type: string): string {
  switch (type) {
    case 'Access': return 'ph:eye-bold';
    case 'Deletion': return 'ph:trash-bold';
    case 'Portability': return 'ph:export-bold';
    case 'Rectification': return 'ph:pencil-bold';
    default: return 'ph:question-bold';
  }
}

function getRequestStatusTag(status: string): 'success' | 'danger' | 'warning' | 'info' | '' {
  switch (status) {
    case 'Pending': return 'info';
    case 'In Progress': return 'warning';
    case 'Completed': return 'success';
    case 'Denied': return 'danger';
    default: return '';
  }
}

function getRiskTagType(level: string): 'success' | 'danger' | 'warning' | '' {
  switch (level) {
    case 'High': return 'danger';
    case 'Medium': return 'warning';
    case 'Low': return 'success';
    default: return '';
  }
}

function getPiaStatusTag(status: string): 'success' | 'warning' | 'info' | '' {
  switch (status) {
    case 'Approved': return 'success';
    case 'UnderReview': return 'warning';
    case 'Draft': return 'info';
    default: return '';
  }
}

function getAuditIcon(category: string): string {
  switch (category) {
    case 'Consent': return 'ph:check-square-bold';
    case 'Data Request': return 'ph:user-circle-bold';
    case 'Policy': return 'ph:file-text-bold';
    case 'Access': return 'ph:key-bold';
    case 'Security': return 'ph:lock-bold';
    default: return 'ph:info-bold';
  }
}

function getAuditColor(category: string): string {
  switch (category) {
    case 'Consent': return '#22c55e';
    case 'Data Request': return '#f59e0b';
    case 'Policy': return '#3b82f6';
    case 'Access': return '#7849ff';
    case 'Security': return '#ef4444';
    default: return '#7849ff';
  }
}

function getCategoryTag(category: string): 'success' | 'danger' | 'warning' | 'info' | '' {
  switch (category) {
    case 'Consent': return 'success';
    case 'Data Request': return 'warning';
    case 'Policy': return 'info';
    case 'Access': return '';
    case 'Security': return 'danger';
    default: return '';
  }
}

function getClassificationTag(level: string): 'success' | 'danger' | 'warning' | 'info' | '' {
  switch (level) {
    case 'Public': return 'success';
    case 'Internal': return 'info';
    case 'Confidential': return 'warning';
    case 'Restricted': return 'danger';
    default: return '';
  }
}

function getClassificationIcon(level: string): string {
  switch (level) {
    case 'Public': return 'ph:globe-bold';
    case 'Internal': return 'ph:buildings-bold';
    case 'Confidential': return 'ph:lock-simple-bold';
    case 'Restricted': return 'ph:shield-warning-bold';
    default: return 'ph:info-bold';
  }
}

// --- Actions ---
function runAudit() {
  auditRunning.value = true;
  setTimeout(() => {
    auditRunning.value = false;
    overallScore.value = Math.min(100, overallScore.value + Math.floor(Math.random() * 3));
    ElNotification({
      type: 'success',
      title: t('complianceManager.auditComplete'),
      message: t('complianceManager.auditCompleteMsg')
    });
  }, 2500);
}

function exportReport() {
  const headers = ['Framework', 'Score'];
  const rows = frameworks.value.map((fw) => [fw.name, `${fw.score}%`]);
  rows.unshift(['Overall', `${overallScore.value}%`]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `compliance-report-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  ElMessage.success(t('complianceManager.exportSuccess'));
}

function viewConsentDetail(record: any) {
  ElMessage.info(`${t('complianceManager.viewingConsent')}: ${record.name}`);
}

function revokeConsent(record: any) {
  record.status = 'Withdrawn';
  ElMessage.success(`${t('complianceManager.consentRevoked')}: ${record.name}`);
}

function openRequestDetail(request: any) {
  selectedRequest.value = request;
  requestChecklist.value.forEach((step, idx) => {
    step.done = idx < 2;
  });
  showRequestDetailDialog.value = true;
}

function markRequestCompleted() {
  if (selectedRequest.value) {
    selectedRequest.value.status = 'Completed';
    showRequestDetailDialog.value = false;
    ElNotification({
      type: 'success',
      title: t('complianceManager.requestCompleted'),
      message: `${t('complianceManager.requestCompletedMsg')}: ${selectedRequest.value.requester}`
    });
  }
}

function submitNewPia() {
  if (!newPiaForm.name.trim() || !newPiaForm.department) {
    ElMessage.warning(t('complianceManager.fillRequired'));
    return;
  }
  piaList.value.unshift({
    id: piaList.value.length + 1,
    name: newPiaForm.name,
    department: newPiaForm.department,
    riskLevel: newPiaForm.riskLevel,
    status: 'Draft',
    lastReviewed: new Date().toISOString().split('T')[0]!
  });
  showNewPiaDialog.value = false;
  newPiaForm.name = '';
  newPiaForm.department = '';
  newPiaForm.riskLevel = 'Medium';
  newPiaForm.description = '';
  newPiaForm.dataTypes = [];
  ElNotification({
    type: 'success',
    title: t('complianceManager.piaCreated'),
    message: t('complianceManager.piaCreatedMsg')
  });
}
</script>

<style lang="scss" scoped>
.compliance-manager-page {
  animation: fadeInUp 0.5s ease-out;
  min-height: 100vh;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Compliance Score Badge
.compliance-score-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 700;

  &.score-excellent {
    background: rgba(34, 197, 94, 0.12);
    color: #22c55e;
  }

  &.score-good {
    background: rgba(245, 158, 11, 0.12);
    color: #f59e0b;
  }

  &.score-needs-work {
    background: rgba(239, 68, 68, 0.12);
    color: #ef4444;
  }
}

// Score Cards
.score-card {
  .score-card-inner {
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: 16px;
    padding: 20px;
    transition: all 0.25s ease;
    height: 100%;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(120, 73, 255, 0.08);
    }
  }

  &.overall .score-card-inner {
    border-color: rgba(120, 73, 255, 0.3);
    background: linear-gradient(135deg, rgba(120, 73, 255, 0.06), rgba(120, 73, 255, 0.02));
  }

  .score-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .score-value {
    font-size: 28px;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1;
  }
}

.framework-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  flex-shrink: 0;
}

// Glass Card
.glass-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
}

// PIA Cards
.pia-card {
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-2px);

    .glass-card {
      box-shadow: 0 8px 32px rgba(120, 73, 255, 0.08);
      border-color: rgba(120, 73, 255, 0.3);
    }
  }
}

// Table Styling
:deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: transparent;
  --el-table-row-hover-bg-color: rgba(120, 73, 255, 0.04);
  --el-table-border-color: var(--border-default);
  --el-table-text-color: var(--text-primary);
  --el-table-header-text-color: var(--text-muted);

  .el-table__header th {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

// Tabs Styling
:deep(.el-tabs) {
  .el-tabs__header {
    margin-bottom: 24px;
  }

  .el-tabs__item {
    font-size: 14px;
    font-weight: 500;
  }
}

// Timeline
:deep(.el-timeline-item__tail) {
  border-left: 2px solid var(--border-default);
}

:deep(.el-timeline-item__timestamp) {
  color: var(--text-muted) !important;
  font-size: 12px;
}

// Dialog
:deep(.el-dialog) {
  border-radius: 16px;
}

// Progress Circle
:deep(.el-progress__text) {
  font-size: 14px !important;
  font-weight: 700;
}

// Responsive
@media (max-width: 767px) {
  .compliance-manager-page {
    padding: 16px !important;
  }

  .score-card .score-card-inner {
    padding: 16px;
  }

  .score-card .score-value {
    font-size: 22px;
  }
}
</style>
