<template lang="pug">
.unified-inbox-page.p-6(class="md:p-8")
  //- Header
  .flex.items-center.gap-4.mb-8
    .header-icon-wrapper
      Icon(name="ph:tray-bold" size="26" style="color: #fff")
    div
      h1.text-2xl.font-bold(style="color: var(--text-primary)") {{ t('unifiedInbox.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted)") {{ t('unifiedInbox.subtitle') }}

  //- Loading skeleton
  div(v-if="loading")
    .grid.gap-5.mb-8(class="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4")
      .kpi-card(v-for="n in 4" :key="n")
        el-skeleton(:rows="2" animated)
    .glass-card.p-6
      el-skeleton(:rows="12" animated)

  template(v-else)
    //- KPI Cards
    .grid.gap-5.mb-8(class="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4")
      .kpi-card(v-for="(kpi, idx) in kpiCards" :key="idx")
        .flex.items-start.justify-between
          div
            p.text-sm.font-medium.mb-1(style="color: var(--text-muted)") {{ kpi.label }}
            p.text-2xl.font-bold(:style="{ color: kpi.color }") {{ kpi.value }}
            .flex.items-center.gap-1.mt-2
              Icon(:name="kpi.trendIcon" size="14" :style="{ color: kpi.trendColor }")
              span.text-xs.font-semibold(:style="{ color: kpi.trendColor }") {{ kpi.trendText }}
          .kpi-icon-wrapper(:style="{ background: kpi.color + '18' }")
            Icon(:name="kpi.icon" size="24" :style="{ color: kpi.color }")

    //- Split-pane container
    .split-pane-container.flex.gap-0(style="height: calc(100vh - 340px); min-height: 500px")
      //- Left Panel (40%) - Conversation List
      .left-panel.glass-card.flex.flex-col(style="width: 40%; min-width: 320px")
        //- Search bar
        .p-4.border-b(style="border-color: var(--border-default)")
          el-input(
            v-model="searchQuery"
            :placeholder="t('unifiedInbox.search')"
            clearable
            size="large"
          )
            template(#prefix)
              Icon(name="ph:magnifying-glass" size="16" style="color: var(--text-muted)")

        //- Channel filter
        .flex.gap-2.px-4.py-3.border-b.overflow-x-auto.flex-shrink-0(style="border-color: var(--border-default)")
          .channel-filter-btn(
            v-for="ch in channelFilters"
            :key="ch.value"
            :class="{ active: activeChannel === ch.value }"
            @click="activeChannel = ch.value"
          )
            Icon(v-if="ch.icon" :name="ch.icon" size="14")
            span {{ ch.label }}

        //- Status filter
        .flex.gap-2.px-4.py-3.border-b.overflow-x-auto.flex-shrink-0(style="border-color: var(--border-default)")
          .status-filter-btn(
            v-for="sf in statusFilters"
            :key="sf.value"
            :class="{ active: activeStatus === sf.value }"
            @click="activeStatus = sf.value"
          )
            span {{ sf.label }}

        //- Conversation list
        .flex-1.overflow-y-auto
          template(v-if="filteredConversations.length === 0")
            .flex.flex-col.items-center.justify-center.py-12
              Icon(name="ph:chat-circle-dots" size="48" style="color: var(--text-muted)")
              p.text-sm.mt-3(style="color: var(--text-muted)") {{ t('unifiedInbox.noConversations') }}

          template(v-else)
            //- Today section
            template(v-if="todayConversations.length > 0")
              .section-header {{ t('unifiedInbox.today') }}
              .conversation-item(
                v-for="conv in todayConversations"
                :key="conv.id"
                :class="{ active: selectedConversation?.id === conv.id }"
                @click="selectConversation(conv)"
              )
                .flex.items-center.gap-3.p-4
                  .relative
                    .w-10.h-10.rounded-full.flex.items-center.justify-center(:style="{ background: conv.avatarColor + '20' }")
                      span.text-sm.font-bold(:style="{ color: conv.avatarColor }") {{ conv.initials }}
                    .channel-indicator
                      Icon(:name="getChannelIcon(conv.channel)" size="12")
                  .flex-1.min-w-0
                    .flex.items-center.justify-between
                      span.font-semibold.text-sm.truncate(style="color: var(--text-primary)") {{ conv.contactName }}
                      span.text-xs(style="color: var(--text-muted)") {{ conv.timeAgo }}
                    p.text-xs.truncate.mt-1(style="color: var(--text-muted)") {{ conv.lastMessage }}
                  .flex.flex-col.items-end.gap-1
                    .unread-badge(v-if="conv.unread") {{ conv.unreadCount }}
                    Icon(v-if="conv.starred" name="ph:star-fill" size="14" style="color: #f59e0b")

            //- Yesterday section
            template(v-if="yesterdayConversations.length > 0")
              .section-header {{ t('unifiedInbox.yesterday') }}
              .conversation-item(
                v-for="conv in yesterdayConversations"
                :key="conv.id"
                :class="{ active: selectedConversation?.id === conv.id }"
                @click="selectConversation(conv)"
              )
                .flex.items-center.gap-3.p-4
                  .relative
                    .w-10.h-10.rounded-full.flex.items-center.justify-center(:style="{ background: conv.avatarColor + '20' }")
                      span.text-sm.font-bold(:style="{ color: conv.avatarColor }") {{ conv.initials }}
                    .channel-indicator
                      Icon(:name="getChannelIcon(conv.channel)" size="12")
                  .flex-1.min-w-0
                    .flex.items-center.justify-between
                      span.font-semibold.text-sm.truncate(style="color: var(--text-primary)") {{ conv.contactName }}
                      span.text-xs(style="color: var(--text-muted)") {{ conv.timeAgo }}
                    p.text-xs.truncate.mt-1(style="color: var(--text-muted)") {{ conv.lastMessage }}
                  .flex.flex-col.items-end.gap-1
                    .unread-badge(v-if="conv.unread") {{ conv.unreadCount }}
                    Icon(v-if="conv.starred" name="ph:star-fill" size="14" style="color: #f59e0b")

            //- Older section
            template(v-if="olderConversations.length > 0")
              .section-header {{ t('unifiedInbox.older') }}
              .conversation-item(
                v-for="conv in olderConversations"
                :key="conv.id"
                :class="{ active: selectedConversation?.id === conv.id }"
                @click="selectConversation(conv)"
              )
                .flex.items-center.gap-3.p-4
                  .relative
                    .w-10.h-10.rounded-full.flex.items-center.justify-center(:style="{ background: conv.avatarColor + '20' }")
                      span.text-sm.font-bold(:style="{ color: conv.avatarColor }") {{ conv.initials }}
                    .channel-indicator
                      Icon(:name="getChannelIcon(conv.channel)" size="12")
                  .flex-1.min-w-0
                    .flex.items-center.justify-between
                      span.font-semibold.text-sm.truncate(style="color: var(--text-primary)") {{ conv.contactName }}
                      span.text-xs(style="color: var(--text-muted)") {{ conv.timeAgo }}
                    p.text-xs.truncate.mt-1(style="color: var(--text-muted)") {{ conv.lastMessage }}
                  .flex.flex-col.items-end.gap-1
                    .unread-badge(v-if="conv.unread") {{ conv.unreadCount }}
                    Icon(v-if="conv.starred" name="ph:star-fill" size="14" style="color: #f59e0b")

      //- Right Panel (60%) - Conversation Detail
      .right-panel.glass-card.flex.flex-col(style="width: 60%")
        template(v-if="!selectedConversation")
          .flex.flex-col.items-center.justify-center.h-full
            Icon(name="ph:chat-circle-dots" size="64" style="color: var(--text-muted)")
            p.text-lg.font-medium.mt-4(style="color: var(--text-muted)") {{ t('unifiedInbox.selectConversation') }}
            p.text-sm.mt-1(style="color: var(--text-muted)") {{ t('unifiedInbox.selectConversationHint') }}

        template(v-else)
          //- Contact header
          .conversation-header.flex.items-center.justify-between.p-4.border-b.flex-shrink-0(style="border-color: var(--border-default)")
            .flex.items-center.gap-3
              .w-10.h-10.rounded-full.flex.items-center.justify-center(:style="{ background: selectedConversation.avatarColor + '20' }")
                span.text-sm.font-bold(:style="{ color: selectedConversation.avatarColor }") {{ selectedConversation.initials }}
              div
                .flex.items-center.gap-2
                  span.font-semibold(style="color: var(--text-primary)") {{ selectedConversation.contactName }}
                  Icon(:name="getChannelIcon(selectedConversation.channel)" size="14" style="color: var(--text-muted)")
                span.text-xs(style="color: var(--text-muted)") {{ selectedConversation.email }}
            .flex.items-center.gap-2
              el-tooltip(:content="t('unifiedInbox.star')" placement="top")
                el-button(circle size="small" @click="toggleStar")
                  Icon(name="ph:star-bold" size="16" :style="{ color: selectedConversation.starred ? '#f59e0b' : 'var(--text-muted)' }")
              el-tooltip(:content="t('unifiedInbox.archive')" placement="top")
                el-button(circle size="small" @click="archiveConversation")
                  Icon(name="ph:archive-bold" size="16" style="color: var(--text-muted)")
              el-tooltip(:content="t('unifiedInbox.assignTo')" placement="top")
                el-button(circle size="small" @click="showAssignDialog = true")
                  Icon(name="ph:user-plus-bold" size="16" style="color: var(--text-muted)")
              el-tooltip(:content="t('unifiedInbox.snooze')" placement="top")
                el-button(circle size="small" @click="snoozeConversation")
                  Icon(name="ph:clock-bold" size="16" style="color: var(--text-muted)")
              el-button(type="success" size="small" round @click="markResolved")
                Icon(name="ph:check-bold" size="14" class="mr-1")
                | {{ t('unifiedInbox.markResolved') }}
              el-button(size="small" round @click="showContactInfo = !showContactInfo")
                Icon(name="ph:sidebar-simple-bold" size="14")

          //- Main content area with thread and optional contact sidebar
          .flex.flex-1.overflow-hidden
            //- Message thread area
            .flex-1.flex.flex-col.overflow-hidden
              //- Messages
              .flex-1.overflow-y-auto.p-4.message-thread(ref="messageThreadRef")
                .flex.flex-col.gap-4
                  template(v-for="(msg, idx) in selectedMessages" :key="idx")
                    //- Inbound message
                    .flex.justify-start(v-if="msg.direction === 'inbound'")
                      .message-bubble.inbound
                        p(style="color: var(--text-primary)") {{ msg.text }}
                        .flex.items-center.gap-2.mt-2
                          Icon(:name="getChannelIcon(msg.channel)" size="12" style="color: var(--text-muted)")
                          span.text-xs(style="color: var(--text-muted)") {{ msg.timestamp }}
                        //- Attachments
                        .flex.flex-wrap.gap-2.mt-2(v-if="msg.attachments && msg.attachments.length > 0")
                          .attachment-chip(v-for="(att, aIdx) in msg.attachments" :key="aIdx")
                            Icon(name="ph:paperclip" size="12")
                            span {{ att }}

                    //- Outbound message
                    .flex.justify-end(v-else)
                      .message-bubble.outbound
                        p(style="color: var(--text-primary)") {{ msg.text }}
                        .flex.items-center.justify-end.gap-2.mt-2
                          span.text-xs(style="color: var(--text-muted)") {{ msg.timestamp }}
                          Icon(:name="getChannelIcon(msg.channel)" size="12" style="color: var(--text-muted)")
                        .flex.flex-wrap.gap-2.mt-2(v-if="msg.attachments && msg.attachments.length > 0")
                          .attachment-chip(v-for="(att, aIdx) in msg.attachments" :key="aIdx")
                            Icon(name="ph:paperclip" size="12")
                            span {{ att }}

              //- Reply composer
              .reply-composer
                .flex.items-center.gap-3.mb-3
                  el-select(v-model="replyChannel" size="small" style="width: 140px")
                    template(#prefix)
                      Icon(:name="getChannelIcon(replyChannel)" size="14")
                    el-option(
                      v-for="ch in replyChannelOptions"
                      :key="ch.value"
                      :label="ch.label"
                      :value="ch.value"
                    )
                  span.text-xs(style="color: var(--text-muted)") {{ t('unifiedInbox.channelSelector') }}
                .flex.gap-3
                  el-input(
                    v-model="replyText"
                    type="textarea"
                    :rows="3"
                    :placeholder="t('unifiedInbox.replyPlaceholder')"
                    resize="none"
                  )
                .flex.items-center.justify-between.mt-3
                  el-button(size="small" round @click="attachFile")
                    Icon(name="ph:paperclip-bold" size="14" class="mr-1")
                    | {{ t('unifiedInbox.attach') }}
                  el-button(type="primary" size="default" round @click="sendReply" :disabled="!replyText.trim()")
                    Icon(name="ph:paper-plane-tilt-bold" size="14" class="mr-1")
                    | {{ t('unifiedInbox.send') }}

            //- Collapsible contact info sidebar
            .contact-sidebar.flex-shrink-0.border-l.overflow-y-auto(
              v-if="showContactInfo"
              style="width: 260px; border-color: var(--border-default)"
            )
              .p-4
                h3.text-sm.font-semibold.mb-4(style="color: var(--text-primary)") {{ t('unifiedInbox.contactInfo') }}

                //- Contact details
                .flex.flex-col.gap-3.mb-6
                  .flex.items-center.gap-2
                    Icon(name="ph:user-bold" size="14" style="color: var(--text-muted)")
                    span.text-sm(style="color: var(--text-primary)") {{ selectedConversation.contactName }}
                  .flex.items-center.gap-2
                    Icon(name="ph:envelope-bold" size="14" style="color: var(--text-muted)")
                    span.text-sm(style="color: var(--text-muted)") {{ selectedConversation.email }}
                  .flex.items-center.gap-2
                    Icon(name="ph:phone-bold" size="14" style="color: var(--text-muted)")
                    span.text-sm(style="color: var(--text-muted)") {{ selectedConversation.phone }}
                  .flex.items-center.gap-2
                    Icon(name="ph:buildings-bold" size="14" style="color: var(--text-muted)")
                    span.text-sm(style="color: var(--text-muted)") {{ selectedConversation.company }}

                //- Recent activity
                h3.text-sm.font-semibold.mb-3.mt-2(style="color: var(--text-primary)") {{ t('unifiedInbox.recentActivity') }}
                .flex.flex-col.gap-2.mb-6
                  .activity-item(v-for="(act, aIdx) in contactActivities" :key="aIdx")
                    .flex.items-start.gap-2
                      Icon(:name="act.icon" size="14" style="color: var(--text-muted)" class="mt-0.5")
                      div
                        p.text-xs(style="color: var(--text-primary)") {{ act.text }}
                        p.text-xs(style="color: var(--text-muted)") {{ act.time }}

                //- Linked deals
                h3.text-sm.font-semibold.mb-3(style="color: var(--text-primary)") {{ t('unifiedInbox.linkedDeals') }}
                .flex.flex-col.gap-2
                  .deal-card(v-for="(deal, dIdx) in linkedDeals" :key="dIdx")
                    .flex.items-center.justify-between
                      span.text-xs.font-medium(style="color: var(--text-primary)") {{ deal.name }}
                      span.text-xs.font-semibold(:style="{ color: deal.stageColor }") {{ deal.stage }}
                    p.text-xs.mt-1(style="color: var(--text-muted)") {{ deal.value }}
</template>

<script lang="ts" setup>
/* eslint-disable no-use-before-define */
import { ref, computed, onMounted, nextTick } from 'vue';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({ title: 'Unified Inbox' });

const { t } = useI18n();

// --- State ---
const loading = ref(true);
const searchQuery = ref('');
const activeChannel = ref('all');
const activeStatus = ref('all');
const selectedConversation = ref<Conversation | null>(null);
const showContactInfo = ref(false);
const showAssignDialog = ref(false);
const replyText = ref('');
const replyChannel = ref('email');
const messageThreadRef = ref<HTMLElement | null>(null);

// --- Types ---
interface Conversation {
  id: number;
  contactName: string;
  initials: string;
  email: string;
  phone: string;
  company: string;
  avatarColor: string;
  channel: string;
  lastMessage: string;
  timeAgo: string;
  group: 'today' | 'yesterday' | 'older';
  unread: boolean;
  unreadCount: number;
  starred: boolean;
  archived: boolean;
}

interface Message {
  direction: 'inbound' | 'outbound';
  text: string;
  timestamp: string;
  channel: string;
  attachments?: string[];
}

interface KpiCard {
  label: string;
  value: string;
  icon: string;
  color: string;
  trend: number;
  trendIcon: string;
  trendColor: string;
  trendText: string;
}

// --- KPI Cards ---
const kpiCards = computed<KpiCard[]>(() => [
  {
    label: t('unifiedInbox.unreadMessages'),
    value: '0',
    icon: 'ph:envelope-bold',
    color: '#ef4444',
    trend: 0,
    trendIcon: 'ph:trend-up-bold',
    trendColor: 'var(--text-muted)',
    trendText: '0%'
  },
  {
    label: t('unifiedInbox.avgResponseTime'),
    value: '\u2014',
    icon: 'ph:clock-bold',
    color: '#3b82f6',
    trend: 0,
    trendIcon: 'ph:trend-up-bold',
    trendColor: 'var(--text-muted)',
    trendText: '0%'
  },
  {
    label: t('unifiedInbox.conversationsToday'),
    value: '0',
    icon: 'ph:chat-circle-dots-bold',
    color: '#7849ff',
    trend: 0,
    trendIcon: 'ph:trend-up-bold',
    trendColor: 'var(--text-muted)',
    trendText: '0%'
  },
  {
    label: t('unifiedInbox.resolutionRate'),
    value: '0%',
    icon: 'ph:check-bold',
    color: '#22c55e',
    trend: 0,
    trendIcon: 'ph:trend-up-bold',
    trendColor: 'var(--text-muted)',
    trendText: '0%'
  }
]);

// --- Channel Filters ---
const channelFilters = computed(() => [
  { label: t('unifiedInbox.all'), value: 'all', icon: '' },
  { label: t('unifiedInbox.email'), value: 'email', icon: 'ph:envelope-simple' },
  { label: t('unifiedInbox.chat'), value: 'chat', icon: 'ph:chat-circle-dots' },
  { label: t('unifiedInbox.sms'), value: 'sms', icon: 'ph:device-mobile' },
  { label: t('unifiedInbox.whatsapp'), value: 'whatsapp', icon: 'ph:whatsapp-logo' },
  { label: t('unifiedInbox.social'), value: 'social', icon: 'ph:share-network' }
]);

// --- Status Filters ---
const statusFilters = computed(() => [
  { label: t('unifiedInbox.all'), value: 'all' },
  { label: t('unifiedInbox.unread'), value: 'unread' },
  { label: t('unifiedInbox.starred'), value: 'starred' },
  { label: t('unifiedInbox.archived'), value: 'archived' }
]);

// --- Reply Channel Options ---
const replyChannelOptions = computed(() => [
  { label: t('unifiedInbox.email'), value: 'email' },
  { label: t('unifiedInbox.chat'), value: 'chat' },
  { label: t('unifiedInbox.sms'), value: 'sms' },
  { label: t('unifiedInbox.whatsapp'), value: 'whatsapp' },
  { label: t('unifiedInbox.social'), value: 'social' }
]);

const conversations = ref<Conversation[]>([]);

// --- Message Threads ---
const messageThreads = ref<Record<number, Message[]>>({});

// --- Contact Activities ---
const contactActivities = computed(() => {
  if (!selectedConversation.value) return [];
  return [] as { icon: string; text: string; time: string }[];
});

// --- Linked Deals ---
const linkedDeals = computed(() => {
  return [] as { name: string; stage: string; stageColor: string; value: string }[];
});

// --- Computed Filters ---
const filteredConversations = computed(() => {
  let result = conversations.value;

  if (activeChannel.value !== 'all') {
    result = result.filter(c => c.channel === activeChannel.value);
  }

  if (activeStatus.value === 'unread') {
    result = result.filter(c => c.unread);
  } else if (activeStatus.value === 'starred') {
    result = result.filter(c => c.starred);
  } else if (activeStatus.value === 'archived') {
    result = result.filter(c => c.archived);
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      c => c.contactName.toLowerCase().includes(query) || c.lastMessage.toLowerCase().includes(query) || c.company.toLowerCase().includes(query)
    );
  }

  return result;
});

const todayConversations = computed(() => filteredConversations.value.filter(c => c.group === 'today'));

const yesterdayConversations = computed(() => filteredConversations.value.filter(c => c.group === 'yesterday'));

const olderConversations = computed(() => filteredConversations.value.filter(c => c.group === 'older'));

const selectedMessages = computed(() => {
  if (!selectedConversation.value) return [];
  return messageThreads.value[selectedConversation.value.id] || [];
});

// --- Helper Functions ---
function getChannelIcon(channel: string): string {
  const iconMap: Record<string, string> = {
    email: 'ph:envelope-simple',
    chat: 'ph:chat-circle-dots',
    sms: 'ph:device-mobile',
    whatsapp: 'ph:whatsapp-logo',
    social: 'ph:share-network'
  };
  return iconMap[channel] || 'ph:chat-circle-dots';
}

async function selectConversation(conv: Conversation) {
  selectedConversation.value = conv;
  replyChannel.value = conv.channel;
  showContactInfo.value = false;
  // Fetch thread from API
  try {
    const res = await useApiFetch(`communications/${conv.id}/messages`);
    if (res.success && Array.isArray(res.body)) {
      messageThreads.value[conv.id] = res.body;
    }
  } catch {
    /* ignore */
  }
  nextTick(() => scrollToBottom());
}

function scrollToBottom() {
  if (messageThreadRef.value) {
    messageThreadRef.value.scrollTop = messageThreadRef.value.scrollHeight;
  }
}

function toggleStar() {
  if (selectedConversation.value) {
    selectedConversation.value.starred = !selectedConversation.value.starred;
  }
}

function archiveConversation() {
  if (selectedConversation.value) {
    selectedConversation.value.archived = !selectedConversation.value.archived;
  }
}

function snoozeConversation() {
  // Mock snooze action
}

function markResolved() {
  if (selectedConversation.value) {
    selectedConversation.value.unread = false;
    selectedConversation.value.unreadCount = 0;
  }
}

function attachFile() {
  // Mock attach file action
}

function sendReply() {
  if (!replyText.value.trim() || !selectedConversation.value) return;

  const convId = selectedConversation.value.id;
  if (!messageThreads.value[convId]) {
    messageThreads.value[convId] = [];
  }

  messageThreads.value[convId].push({
    direction: 'outbound',
    text: replyText.value,
    timestamp: 'Just now',
    channel: replyChannel.value
  });

  selectedConversation.value.lastMessage = replyText.value;
  selectedConversation.value.timeAgo = 'Just now';
  replyText.value = '';

  nextTick(() => {
    scrollToBottom();
  });
}

// --- Data Loading ---
async function loadData() {
  loading.value = true;
  try {
    const res = await useApiFetch('communications/recent');
    if (res.success && Array.isArray(res.body)) {
      conversations.value = res.body as Conversation[];
    } else {
      conversations.value = [];
    }
  } catch {
    conversations.value = [];
  }
  loading.value = false;
}

// --- Lifecycle ---
onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.unified-inbox-page {
  animation: fadeInUp 0.6s ease-out;
  min-height: 100vh;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.glass-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  transition: box-shadow 0.3s ease;
  &:hover {
    box-shadow: 0 8px 32px rgba(120, 73, 255, 0.08);
  }
}

.kpi-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  cursor: default;
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(120, 73, 255, 0.12);
    border-color: rgba(120, 73, 255, 0.3);
  }
}

.kpi-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-icon-wrapper {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, #7849ff, #6730e3);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(120, 73, 255, 0.3);
}

.split-pane-container {
  .left-panel {
    border-right: none;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
  .right-panel {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-left: 1px solid var(--border-default);
  }
}

.channel-filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  color: var(--text-muted);
  background: transparent;
  border: 1px solid var(--border-default);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(120, 73, 255, 0.05);
    border-color: rgba(120, 73, 255, 0.2);
  }

  &.active {
    background: rgba(120, 73, 255, 0.12);
    border-color: #7849ff;
    color: #7849ff;
    font-weight: 600;
  }
}

.status-filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  color: var(--text-muted);
  background: transparent;
  border: 1px solid transparent;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(120, 73, 255, 0.05);
  }

  &.active {
    background: rgba(120, 73, 255, 0.08);
    color: #7849ff;
    font-weight: 600;
  }
}

.section-header {
  padding: 8px 16px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  background: rgba(120, 73, 255, 0.03);
  border-bottom: 1px solid var(--border-default);
}

.conversation-item {
  border-bottom: 1px solid var(--border-default);
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    background: rgba(120, 73, 255, 0.05);
  }
  &.active {
    background: rgba(120, 73, 255, 0.1);
    border-left: 3px solid #7849ff;
  }
}

.channel-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--bg-elevated);
  border: 2px solid var(--border-default);
  display: flex;
  align-items: center;
  justify-content: center;
}

.unread-badge {
  background: #ef4444;
  color: white;
  font-size: 11px;
  font-weight: 700;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
}

.conversation-header {
  background: var(--bg-elevated);
  border-radius: 0 16px 0 0;
}

.message-thread {
  background: var(--bg-default, var(--bg-elevated));
}

.message-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;

  &.inbound {
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-bottom-left-radius: 4px;
  }
  &.outbound {
    background: rgba(120, 73, 255, 0.15);
    border: 1px solid rgba(120, 73, 255, 0.2);
    border-bottom-right-radius: 4px;
  }
}

.attachment-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  background: rgba(120, 73, 255, 0.08);
  color: #7849ff;
  border: 1px solid rgba(120, 73, 255, 0.15);
}

.reply-composer {
  border-top: 1px solid var(--border-default);
  padding: 16px;
  background: var(--bg-elevated);
  border-radius: 0 0 16px 0;
}

.contact-sidebar {
  background: var(--bg-elevated);
  border-radius: 0 16px 16px 0;
}

.activity-item {
  padding: 8px;
  border-radius: 8px;
  transition: background 0.2s ease;
  &:hover {
    background: rgba(120, 73, 255, 0.05);
  }
}

.deal-card {
  padding: 10px;
  border-radius: 10px;
  border: 1px solid var(--border-default);
  transition: all 0.2s ease;
  &:hover {
    border-color: rgba(120, 73, 255, 0.3);
    box-shadow: 0 4px 12px rgba(120, 73, 255, 0.08);
  }
}

// Scrollbar styling
.overflow-y-auto {
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(120, 73, 255, 0.15);
    border-radius: 3px;
    &:hover {
      background: rgba(120, 73, 255, 0.25);
    }
  }
}
</style>
