<template lang="pug">
.email-page.p-8
  .header.mb-8
    .flex.items-center.justify-between
      div
        h2.text-3xl.font-bold.mb-2(style="color: var(--text-primary)") Email
        p(style="color: var(--text-muted)") View and manage your email messages
      .flex.items-center.gap-3
        el-button(type="primary" @click="composeVisible = true" class="!rounded-xl")
          Icon.mr-1(name="ph:pencil-bold" size="16")
          | Compose

  //- Layout: Folders + Messages
  .flex.gap-6(class="flex-col lg:flex-row")
    //- Sidebar
    .w-full(class="lg:w-56")
      .glass-card.p-4
        .space-y-1
          .flex.items-center.gap-3.p-3.rounded-xl.cursor-pointer(
            v-for="folder in folders"
            :key="folder.value"
            :style="{ background: activeFolder === folder.value ? 'rgba(120, 73, 255, 0.1)' : 'transparent' }"
            @click="setFolder(folder.value)"
          )
            Icon(:name="folder.icon" size="18" :style="{ color: activeFolder === folder.value ? '#7849ff' : 'var(--text-muted)' }")
            span.text-sm(:style="{ color: activeFolder === folder.value ? '#7849ff' : 'var(--text-primary)', fontWeight: activeFolder === folder.value ? '600' : '400' }") {{ folder.label }}

    //- Messages List
    .flex-1
      .flex.items-center.justify-between.mb-4
        el-input(v-model="searchQuery" placeholder="Search emails..." style="max-width: 300px" clearable)
          template(#prefix)
            Icon(name="ph:magnifying-glass" size="16")

      .flex.items-center.justify-center.py-20(v-if="loading")
        el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

      template(v-else)
        .space-y-2(v-if="messages.length")
          .glass-card.p-4.cursor-pointer.transition-all(
            v-for="msg in filteredMessages"
            :key="msg.id"
            :style="{ borderLeft: msg.isRead ? '3px solid transparent' : '3px solid #7849ff' }"
            @click="openMessage(msg)"
          )
            .flex.items-center.justify-between
              .flex.items-center.gap-3
                .w-8.h-8.rounded-full.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.1)")
                  span.text-xs.font-bold(style="color: #7849ff") {{ (msg.from || '?')[0].toUpperCase() }}
                div
                  p.text-sm.font-semibold(:style="{ color: 'var(--text-primary)', fontWeight: msg.isRead ? '400' : '600' }") {{ msg.subject || '(No Subject)' }}
                  p.text-xs(style="color: var(--text-muted)") {{ msg.from }}
              span.text-xs(style="color: var(--text-muted)") {{ formatDate(msg.sentAt) }}

        .text-center.py-12(v-else)
          Icon(name="ph:envelope-bold" size="48" style="color: var(--text-muted)")
          p.text-sm.mt-3(style="color: var(--text-muted)") No messages in {{ activeFolder }}

  //- Message Detail Dialog
  el-dialog(v-model="messageDialogVisible" :title="selectedMessage?.subject || 'Email'" width="700px")
    template(v-if="selectedMessage")
      .space-y-4
        .flex.items-center.justify-between
          .flex.items-center.gap-3
            .w-10.h-10.rounded-full.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.1)")
              span.text-sm.font-bold(style="color: #7849ff") {{ (selectedMessage.from || '?')[0].toUpperCase() }}
            div
              p.text-sm.font-semibold(style="color: var(--text-primary)") {{ selectedMessage.from }}
              p.text-xs(style="color: var(--text-muted)") To: {{ selectedMessage.to?.join(', ') }}
          span.text-xs(style="color: var(--text-muted)") {{ formatDate(selectedMessage.sentAt) }}
        .p-4.rounded-xl(style="background: var(--card-bg, rgba(255,255,255,0.03)); border: 1px solid var(--border-glass, rgba(255,255,255,0.08))" v-html="selectedMessage.body")

  //- Compose Dialog
  el-dialog(v-model="composeVisible" title="Compose Email" width="600px")
    el-form(:model="composeForm" label-position="top")
      el-form-item(label="To" required)
        el-input(v-model="composeForm.to" placeholder="recipient@email.com")
      el-form-item(label="Subject")
        el-input(v-model="composeForm.subject" placeholder="Email subject")
      el-form-item(label="Body")
        el-input(v-model="composeForm.body" type="textarea" :rows="8" placeholder="Write your message...")
    template(#footer)
      el-button(@click="composeVisible = false") Cancel
      el-button(type="primary" @click="handleSend" :loading="sending") Send
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { ElNotification } from 'element-plus';
import { fetchEmailMessages, sendEmail, fetchEmailAccounts } from '~/composables/useEmailIntegration';
import type { EmailMessage, EmailAccount } from '~/composables/useEmailIntegration';

definePageMeta({ title: 'Email' });

const loading = ref(true);
const sending = ref(false);
const activeFolder = ref('inbox');
const searchQuery = ref('');
const messageDialogVisible = ref(false);
const composeVisible = ref(false);
const selectedMessage = ref<EmailMessage | null>(null);

const messages = ref<EmailMessage[]>([]);
const accounts = ref<EmailAccount[]>([]);

const folders = [
  { label: 'Inbox', value: 'inbox', icon: 'ph:tray-bold' },
  { label: 'Sent', value: 'sent', icon: 'ph:paper-plane-tilt-bold' },
  { label: 'Drafts', value: 'drafts', icon: 'ph:file-dashed-bold' },
  { label: 'Trash', value: 'trash', icon: 'ph:trash-bold' }
];

const composeForm = reactive({
  to: '',
  subject: '',
  body: ''
});

const filteredMessages = computed(() => {
  if (!searchQuery.value.trim()) return messages.value;
  const q = searchQuery.value.toLowerCase();
  return messages.value.filter(m => m.subject?.toLowerCase().includes(q) || m.from?.toLowerCase().includes(q));
});

async function loadMessages() {
  loading.value = true;
  try {
    const [msgRes, accRes] = await Promise.all([fetchEmailMessages({ folder: activeFolder.value }), fetchEmailAccounts()]);
    messages.value = msgRes.docs;
    accounts.value = accRes;
  } catch (e) {
    console.error('Failed to load emails', e);
  } finally {
    loading.value = false;
  }
}

await loadMessages().catch(() => {
  loading.value = false;
});

function setFolder(folder: string) {
  activeFolder.value = folder;
  loadMessages();
}

function openMessage(msg: EmailMessage) {
  selectedMessage.value = msg;
  messageDialogVisible.value = true;
}

function formatDate(date: string) {
  if (!date) return '';
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function handleSend() {
  if (!composeForm.to || !composeForm.subject) {
    ElNotification({ type: 'warning', title: 'Warning', message: 'Please fill in To and Subject fields' });
    return;
  }
  sending.value = true;
  try {
    const accountId = accounts.value[0]?.id;
    if (!accountId) {
      ElNotification({ type: 'warning', title: 'Warning', message: 'No email account connected. Go to Settings > Email Accounts.' });
      return;
    }
    await sendEmail(accountId, {
      to: composeForm.to.split(',').map(e => e.trim()),
      subject: composeForm.subject,
      body: composeForm.body
    });
    composeVisible.value = false;
    composeForm.to = '';
    composeForm.subject = '';
    composeForm.body = '';
    ElNotification({ type: 'success', title: 'Success', message: 'Email sent' });
  } catch {
    ElNotification({ type: 'error', title: 'Error', message: 'Failed to send email' });
  } finally {
    sending.value = false;
  }
}
</script>

<style lang="scss" scoped>
.email-page {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
