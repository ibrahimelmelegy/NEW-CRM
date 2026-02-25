<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") 💬 WhatsApp Integration
      p.text-sm.mt-1(style="color: var(--text-muted);") Send documents and messages to clients via WhatsApp.
    el-button(type="primary" size="default" @click="showDialog = true" style="background: #25D366; border: none; border-radius: 12px;")
      Icon(name="ph:whatsapp-logo" size="16" style="margin-right: 4px;")
      | New Message

  .grid.grid-cols-3.gap-4.mb-8
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Messages Sent
      p.text-3xl.font-black.mt-1(style="color: #25D366;") {{ messages.length }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Documents Shared
      p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ messages.filter(m => m.hasAttachment).length }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Today
      p.text-3xl.font-black.mt-1(style="color: #7c3aed;") {{ todayCount }}

  el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
    el-table(:data="messages" style="width: 100%" empty-text="No WhatsApp messages sent yet.")
      el-table-column(label="To" min-width="200")
        template(#default="{ row }")
          p.text-sm.font-bold {{ row.contactName }}
          p.text-xs.text-gray-400 {{ row.phone }}
      el-table-column(label="Message" min-width="300")
        template(#default="{ row }")
          p.text-sm.line-clamp-2 {{ row.message }}
      el-table-column(label="Attachment" width="120")
        template(#default="{ row }")
          el-tag(v-if="row.hasAttachment" size="small" type="success" round) 📎 Document
          span.text-gray-400(v-else) —
      el-table-column(label="Sent" width="150")
        template(#default="{ row }")
          span.text-xs.font-mono {{ new Date(row.sentAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) }}

  el-dialog(v-model="showDialog" title="Send WhatsApp Message" width="500px")
    el-form(label-position="top" size="large")
      .grid.grid-cols-2.gap-4
        el-form-item(label="Contact Name")
          el-input(v-model="form.contactName")
        el-form-item(label="Phone (with country code)")
          el-input(v-model="form.phone" placeholder="+966501234567")
      el-form-item(label="Message")
        el-input(v-model="form.message" type="textarea" :rows="4" placeholder="Hello! Here is your document...")
      el-form-item(label="Attach Document Reference")
        el-input(v-model="form.docRef" placeholder="INV-2026-0001 (optional)")
    template(#footer)
      el-button(@click="showDialog = false") Cancel
      el-button(type="primary" @click="sendMessage" style="background: #25D366; border: none; border-radius: 12px;") Send via WhatsApp
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
definePageMeta({});

interface WaMessage {
  id: string;
  contactName: string;
  phone: string;
  message: string;
  hasAttachment: boolean;
  docRef?: string;
  sentAt: string;
}
const STORAGE_KEY = 'crm_whatsapp_messages';
const messages = ref<WaMessage[]>(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));

const showDialog = ref(false);
const form = reactive({ contactName: '', phone: '', message: '', docRef: '' });

const todayCount = computed(() => {
  const t = new Date().toISOString().slice(0, 10);
  return messages.value.filter(m => m.sentAt.startsWith(t)).length;
});

function sendMessage() {
  const msg: WaMessage = {
    id: `wa_${Date.now()}`,
    contactName: form.contactName,
    phone: form.phone,
    message: form.message,
    hasAttachment: !!form.docRef,
    docRef: form.docRef,
    sentAt: new Date().toISOString()
  };
  messages.value.unshift(msg);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.value));

  // Open WhatsApp Web with the message
  const encoded = encodeURIComponent(form.message + (form.docRef ? `\n\nDocument: ${form.docRef}` : ''));
  const cleanPhone = form.phone.replace(/\D/g, '');
  window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');

  Object.assign(form, { contactName: '', phone: '', message: '', docRef: '' });
  showDialog.value = false;
  ElMessage.success('Opening WhatsApp...');
}
</script>
