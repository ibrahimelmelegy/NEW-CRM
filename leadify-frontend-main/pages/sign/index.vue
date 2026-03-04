<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") {{ $t('signatures.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('signatures.subtitle') }}
    el-button(type="primary" size="default" @click="showDialog = true" style="background: var(--bg-obsidian); border: none; border-radius: 12px;")
      Icon(name="ph:signature" size="16" style="margin-right: 4px;")
      | {{ $t('signatures.requestSignature') }}

  .grid.grid-cols-4.gap-4.mb-8
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('common.total') }}
      p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ stats.total }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('signatures.signed') }}
      p.text-3xl.font-black.mt-1(style="color: #22c55e;") {{ stats.signed }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('signatures.pending') }}
      p.text-3xl.font-black.mt-1(style="color: #f59e0b;") {{ stats.pending }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('signatures.declined') }}
      p.text-3xl.font-black.mt-1(style="color: #ef4444;") {{ stats.declined }}

  el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
    el-table(:data="signatures" style="width: 100%" :empty-text="$t('signatures.noRequests')")
      el-table-column(:label="$t('signatures.document')" min-width="200")
        template(#default="{ row }")
          p.text-sm.font-bold {{ row.documentRef }}
          p.text-xs.text-gray-400 {{ row.documentType }}
      el-table-column(:label="$t('signatures.signer')" min-width="180")
        template(#default="{ row }")
          p.text-sm.font-semibold {{ row.signerName }}
          p.text-xs.text-gray-400 {{ row.signerEmail }}
      el-table-column(:label="$t('common.status')" width="120")
        template(#default="{ row }")
          el-tag(:type="row.status === 'signed' ? 'success' : row.status === 'declined' ? 'danger' : 'warning'" size="small" round) {{ row.status }}
      el-table-column(:label="$t('common.date')" width="150")
        template(#default="{ row }")
          span.text-xs.font-mono {{ new Date(row.signedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }}
      el-table-column(:label="$t('signatures.signature')" width="120")
        template(#default="{ row }")
          img.h-8(v-if="row.signatureData && row.status === 'signed'" :src="row.signatureData" alt="Signature")
          span.text-xs.text-gray-400(v-else) —
      el-table-column(width="60")
        template(#default="{ row }")
          el-button(text circle size="small" type="danger" @click="removeSignature(row.id)")
            Icon(name="ph:trash" size="14")

  el-dialog(v-model="showDialog" :title="$t('signatures.requestSignature')" width="480px")
    el-form(label-position="top" size="large")
      el-form-item(:label="$t('signatures.documentReference')")
        el-input(v-model="form.documentRef" placeholder="INV-2026-0001")
      el-form-item(:label="$t('signatures.documentType')")
        el-input(v-model="form.documentType" :placeholder="$t('signatures.documentTypePlaceholder')")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('signatures.signerName')")
          el-input(v-model="form.signerName" :placeholder="$t('signatures.fullName')")
        el-form-item(:label="$t('signatures.signerEmail')")
          el-input(v-model="form.signerEmail" placeholder="email{'@'}example.com")
    template(#footer)
      el-button(@click="showDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="saveRequest" style="border-radius: 12px;") {{ $t('signatures.sendRequest') }}
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
