<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") {{ $t('whatsapp.title') || 'WhatsApp Integration' }}
      p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('whatsapp.subtitle') || 'Send documents and messages to clients via WhatsApp.' }}
    el-button(type="primary" size="default" @click="showDialog = true" style="background: #25D366; border: none; border-radius: 12px;")
      Icon(name="ph:whatsapp-logo" size="16" style="margin-right: 4px;")
      | {{ $t('whatsapp.newMessage') || 'New Message' }}

  .grid.grid-cols-1.gap-4.mb-8(class="md:grid-cols-3")
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('whatsapp.messagesSent') || 'Messages Sent' }}
      p.text-3xl.font-black.mt-1(style="color: #25D366;") {{ messages.length }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('whatsapp.documentsShared') || 'Documents Shared' }}
      p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ messages.filter(m => m.hasAttachment).length }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('whatsapp.today') || 'Today' }}
      p.text-3xl.font-black.mt-1(style="color: #7c3aed;") {{ todayCount }}

  el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);" v-loading="loading")
    el-table(:data="messages" style="width: 100%" :empty-text="$t('whatsapp.noMessages') || 'No WhatsApp messages sent yet.'")
      el-table-column(:label="$t('whatsapp.to') || 'To'" min-width="200")
        template(#default="{ row }")
          p.text-sm.font-bold {{ row.contactName }}
          p.text-xs.text-gray-400 {{ row.phone }}
      el-table-column(:label="$t('whatsapp.message') || 'Message'" min-width="300")
        template(#default="{ row }")
          p.text-sm.line-clamp-2 {{ row.message }}
      el-table-column(:label="$t('whatsapp.attachment') || 'Attachment'" width="120")
        template(#default="{ row }")
          el-tag(v-if="row.hasAttachment" size="small" type="success" round) Document
          span.text-gray-400(v-else) —
      el-table-column(:label="$t('whatsapp.sent') || 'Sent'" width="150")
        template(#default="{ row }")
          span.text-xs.font-mono {{ new Date(row.sentAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) }}

  el-dialog(v-model="showDialog" :title="$t('whatsapp.sendMessage') || 'Send WhatsApp Message'" width="500px")
    el-form(label-position="top" size="large")
      .grid.grid-cols-1.gap-4(class="md:grid-cols-2")
        el-form-item(:label="$t('whatsapp.contactName') || 'Contact Name'")
          el-input(v-model="form.contactName")
        el-form-item(:label="$t('whatsapp.phone') || 'Phone (with country code)'")
          el-input(v-model="form.phone" placeholder="+966501234567")
      el-form-item(:label="$t('whatsapp.messageLabel') || 'Message'")
        el-input(v-model="form.message" type="textarea" :rows="4" placeholder="Hello! Here is your document...")
      el-form-item(:label="$t('whatsapp.attachDoc') || 'Attach Document Reference'")
        el-input(v-model="form.docRef" placeholder="INV-2026-0001 (optional)")
    template(#footer)
      el-button(@click="showDialog = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="primary" :loading="sending" @click="sendMessage" style="background: #25D366; border: none; border-radius: 12px;") {{ $t('whatsapp.send') || 'Send via WhatsApp' }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useApiFetch } from '~/composables/useApiFetch';
definePageMeta({});

interface WaMessage {
  id: string | number;
  contactName: string;
  phone: string;
  message: string;
  hasAttachment: boolean;
  docRef?: string;
  sentAt: string;
}

const messages = ref<WaMessage[]>([]);
const loading = ref(false);
const sending = ref(false);
const showDialog = ref(false);
const form = reactive({ contactName: '', phone: '', message: '', docRef: '' });

const todayCount = computed(() => {
  const t = new Date().toISOString().slice(0, 10);
  return messages.value.filter(m => m.sentAt.startsWith(t)).length;
});

onMounted(async () => {
  loading.value = true;
  try {
    const { body, success } = await useApiFetch('messaging/conversations?limit=100');
    if (success && body) {
      const data = body as any;
      const docs = data.docs || data || [];
      messages.value = docs.map((m: any) => ({
        id: m.id,
        contactName: m.contactName || m.contactPhone || '',
        phone: m.contactPhone || '',
        message: m.lastMessage || m.message || '',
        hasAttachment: m.hasAttachment || false,
        docRef: m.docRef || '',
        sentAt: m.updatedAt || m.createdAt
      }));
    }
  } finally {
    loading.value = false;
  }
});

async function sendMessage() {
  sending.value = true;
  try {
    const { success } = await useApiFetch('messaging/send', 'POST', {
      contactPhone: form.phone,
      contactName: form.contactName,
      message: form.message + (form.docRef ? `\n\nDocument: ${form.docRef}` : ''),
      channel: 'whatsapp'
    });

    if (success) {
      messages.value.unshift({
        id: `wa_${Date.now()}`,
        contactName: form.contactName,
        phone: form.phone,
        message: form.message,
        hasAttachment: !!form.docRef,
        docRef: form.docRef,
        sentAt: new Date().toISOString()
      });

      // Open WhatsApp Web with the message
      const encoded = encodeURIComponent(form.message + (form.docRef ? `\n\nDocument: ${form.docRef}` : ''));
      const cleanPhone = form.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');

      Object.assign(form, { contactName: '', phone: '', message: '', docRef: '' });
      showDialog.value = false;
      ElMessage.success('Message sent!');
    }
  } finally {
    sending.value = false;
  }
}
</script>
