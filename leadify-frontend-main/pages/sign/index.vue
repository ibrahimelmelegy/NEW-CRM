<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") ✍️ E-Signatures
      p.text-sm.mt-1(style="color: var(--text-muted);") Digital document signing — request, track, and manage signatures.
    el-button(type="primary" size="default" @click="showDialog = true" style="background: var(--bg-obsidian); border: none; border-radius: 12px;")
      Icon(name="ph:signature" size="16" style="margin-right: 4px;")
      | Request Signature

  .grid.grid-cols-4.gap-4.mb-8
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Total
      p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ stats.total }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Signed
      p.text-3xl.font-black.mt-1(style="color: #22c55e;") {{ stats.signed }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Pending
      p.text-3xl.font-black.mt-1(style="color: #f59e0b;") {{ stats.pending }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Declined
      p.text-3xl.font-black.mt-1(style="color: #ef4444;") {{ stats.declined }}

  el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
    el-table(:data="signatures" style="width: 100%" empty-text="No signature requests yet.")
      el-table-column(label="Document" min-width="200")
        template(#default="{ row }")
          p.text-sm.font-bold {{ row.documentRef }}
          p.text-xs.text-gray-400 {{ row.documentType }}
      el-table-column(label="Signer" min-width="180")
        template(#default="{ row }")
          p.text-sm.font-semibold {{ row.signerName }}
          p.text-xs.text-gray-400 {{ row.signerEmail }}
      el-table-column(label="Status" width="120")
        template(#default="{ row }")
          el-tag(:type="row.status === 'signed' ? 'success' : row.status === 'declined' ? 'danger' : 'warning'" size="small" round) {{ row.status }}
      el-table-column(label="Date" width="150")
        template(#default="{ row }")
          span.text-xs.font-mono {{ new Date(row.signedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }}
      el-table-column(label="Signature" width="120")
        template(#default="{ row }")
          img.h-8(v-if="row.signatureData && row.status === 'signed'" :src="row.signatureData" alt="Signature")
          span.text-xs.text-gray-400(v-else) —
      el-table-column(width="60")
        template(#default="{ row }")
          el-button(text circle size="small" type="danger" @click="removeSignature(row.id)")
            Icon(name="ph:trash" size="14")

  el-dialog(v-model="showDialog" title="Request Signature" width="480px")
    el-form(label-position="top" size="large")
      el-form-item(label="Document Reference")
        el-input(v-model="form.documentRef" placeholder="INV-2026-0001")
      el-form-item(label="Document Type")
        el-input(v-model="form.documentType" placeholder="Invoice")
      .grid.grid-cols-2.gap-4
        el-form-item(label="Signer Name")
          el-input(v-model="form.signerName" placeholder="Full name")
        el-form-item(label="Signer Email")
          el-input(v-model="form.signerEmail" placeholder="email@example.com")
    template(#footer)
      el-button(@click="showDialog = false") Cancel
      el-button(type="primary" @click="saveRequest" style="border-radius: 12px;") Send Request
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { useSignature } from '~/composables/useSignature';
definePageMeta({});
const { t } = useI18n();
const { signatures, stats, requestSignature, removeSignature } = useSignature();
const showDialog = ref(false);
const form = reactive({ documentRef: '', documentType: '', signerName: '', signerEmail: '' });
function saveRequest() {
  requestSignature({ ...form, signatureData: '' });
  Object.assign(form, { documentRef: '', documentType: '', signerName: '', signerEmail: '' });
  showDialog.value = false;
  ElMessage.success(t('signatures.requestSent'));
}
</script>
