<template lang="pug">
.ticket-conversation
  .space-y-4(v-if="messages && messages.length")
    .message-item(
      v-for="msg in messages"
      :key="msg.id"
      :class="msg.isInternal ? 'internal-note' : 'public-message'"
    )
      //- Internal Note Banner
      .flex.items-center.gap-2.mb-2(v-if="msg.isInternal")
        el-icon(style="color: #e6a23c")
          Lock
        span.text-xs.font-bold.uppercase(style="color: #e6a23c") Internal Note

      //- Message Header
      .flex.items-center.justify-between.mb-2
        .flex.items-center.gap-2
          .w-8.h-8.rounded-full.flex.items-center.justify-center.text-xs.font-bold(
            :style="{ backgroundColor: msg.senderType === 'AGENT' ? 'var(--el-color-primary)' : '#67c23a', color: '#fff' }"
          ) {{ getInitials(msg.senderId) }}
          .flex.flex-col
            span.font-semibold.text-sm {{ msg.senderType === 'AGENT' ? 'Agent' : 'Customer' }}
            span.text-xs(style="color: var(--text-muted)") {{ formatTimestamp(msg.createdAt) }}

      //- Message Body
      .message-body.text-sm.leading-relaxed(style="white-space: pre-wrap") {{ msg.body }}

      //- Attachments
      .mt-2.flex.flex-wrap.gap-2(v-if="msg.attachments && msg.attachments.length")
        a.flex.items-center.gap-1.text-xs.underline(
          v-for="att in msg.attachments"
          :key="att.url"
          :href="att.url"
          target="_blank"
          style="color: var(--el-color-primary)"
        )
          el-icon
            Paperclip
          span {{ att.name }}

  //- Empty state
  .text-center.py-12(v-else)
    el-icon.text-4xl.mb-3(style="color: var(--text-muted)")
      ChatDotRound
    p(style="color: var(--text-muted)") No messages yet. Start the conversation.
</template>

<script setup lang="ts">
import { Lock, Paperclip, ChatDotRound } from '@element-plus/icons-vue';

interface MessageData {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: string;
  body: string;
  isInternal: boolean;
  attachments?: Array<{ name: string; url: string }>;
  createdAt: string;
}

defineProps<{
  messages: MessageData[];
}>();

function getInitials(senderId: string): string {
  if (!senderId) return '?';
  return senderId.substring(0, 2).toUpperCase();
}

function formatTimestamp(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
</script>

<style scoped>
.message-item {
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.public-message {
  background: rgba(64, 158, 255, 0.06);
  border-color: rgba(64, 158, 255, 0.15);
}

.internal-note {
  background: rgba(230, 162, 60, 0.08);
  border-color: rgba(230, 162, 60, 0.2);
}

.message-body {
  padding-left: 40px;
  color: var(--text-primary, #e5e7eb);
}
</style>
