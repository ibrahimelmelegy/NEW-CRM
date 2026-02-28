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
import { ref, computed, onMounted, nextTick } from 'vue'
import { useApiFetch } from '~/composables/useApiFetch'

definePageMeta({ title: 'Unified Inbox' })

const { t } = useI18n()

// --- State ---
const loading = ref(true)
const searchQuery = ref('')
const activeChannel = ref('all')
const activeStatus = ref('all')
const selectedConversation = ref<Conversation | null>(null)
const showContactInfo = ref(false)
const showAssignDialog = ref(false)
const replyText = ref('')
const replyChannel = ref('email')
const messageThreadRef = ref<HTMLElement | null>(null)

// --- Types ---
interface Conversation {
  id: number
  contactName: string
  initials: string
  email: string
  phone: string
  company: string
  avatarColor: string
  channel: string
  lastMessage: string
  timeAgo: string
  group: 'today' | 'yesterday' | 'older'
  unread: boolean
  unreadCount: number
  starred: boolean
  archived: boolean
}

interface Message {
  direction: 'inbound' | 'outbound'
  text: string
  timestamp: string
  channel: string
  attachments?: string[]
}

interface KpiCard {
  label: string
  value: string
  icon: string
  color: string
  trend: number
  trendIcon: string
  trendColor: string
  trendText: string
}

// --- KPI Cards ---
const kpiCards = computed<KpiCard[]>(() => [
  {
    label: t('unifiedInbox.unreadMessages'),
    value: '47',
    icon: 'ph:envelope-bold',
    color: '#ef4444',
    trend: 15.2,
    trendIcon: 'ph:trend-up-bold',
    trendColor: '#22c55e',
    trendText: '+15.2%'
  },
  {
    label: t('unifiedInbox.avgResponseTime'),
    value: '12 min',
    icon: 'ph:clock-bold',
    color: '#3b82f6',
    trend: -18.5,
    trendIcon: 'ph:trend-down-bold',
    trendColor: '#22c55e',
    trendText: '-18.5%'
  },
  {
    label: t('unifiedInbox.conversationsToday'),
    value: '156',
    icon: 'ph:chat-circle-dots-bold',
    color: '#7849ff',
    trend: 8.3,
    trendIcon: 'ph:trend-up-bold',
    trendColor: '#22c55e',
    trendText: '+8.3%'
  },
  {
    label: t('unifiedInbox.resolutionRate'),
    value: '89.2%',
    icon: 'ph:check-bold',
    color: '#22c55e',
    trend: 3.1,
    trendIcon: 'ph:trend-up-bold',
    trendColor: '#22c55e',
    trendText: '+3.1%'
  }
])

// --- Channel Filters ---
const channelFilters = computed(() => [
  { label: t('unifiedInbox.all'), value: 'all', icon: '' },
  { label: t('unifiedInbox.email'), value: 'email', icon: 'ph:envelope-simple' },
  { label: t('unifiedInbox.chat'), value: 'chat', icon: 'ph:chat-circle-dots' },
  { label: t('unifiedInbox.sms'), value: 'sms', icon: 'ph:device-mobile' },
  { label: t('unifiedInbox.whatsapp'), value: 'whatsapp', icon: 'ph:whatsapp-logo' },
  { label: t('unifiedInbox.social'), value: 'social', icon: 'ph:share-network' }
])

// --- Status Filters ---
const statusFilters = computed(() => [
  { label: t('unifiedInbox.all'), value: 'all' },
  { label: t('unifiedInbox.unread'), value: 'unread' },
  { label: t('unifiedInbox.starred'), value: 'starred' },
  { label: t('unifiedInbox.archived'), value: 'archived' }
])

// --- Reply Channel Options ---
const replyChannelOptions = computed(() => [
  { label: t('unifiedInbox.email'), value: 'email' },
  { label: t('unifiedInbox.chat'), value: 'chat' },
  { label: t('unifiedInbox.sms'), value: 'sms' },
  { label: t('unifiedInbox.whatsapp'), value: 'whatsapp' },
  { label: t('unifiedInbox.social'), value: 'social' }
])

// --- Mock Conversations (fallback) ---
const conversationsFallback: Conversation[] = [
  {
    id: 1,
    contactName: 'Sarah Al-Rashid',
    initials: 'SA',
    email: 'sarah.rashid@acmecorp.com',
    phone: '+966 55 123 4567',
    company: 'Acme Corporation',
    avatarColor: '#7849ff',
    channel: 'email',
    lastMessage: 'Hi, I wanted to follow up on the proposal we discussed last week...',
    timeAgo: '5m ago',
    group: 'today',
    unread: true,
    unreadCount: 3,
    starred: true,
    archived: false
  },
  {
    id: 2,
    contactName: 'Ahmed Hassan',
    initials: 'AH',
    email: 'ahmed.h@globaltech.io',
    phone: '+966 50 987 6543',
    company: 'GlobalTech Solutions',
    avatarColor: '#3b82f6',
    channel: 'whatsapp',
    lastMessage: 'Can we schedule a demo for our team next Tuesday?',
    timeAgo: '12m ago',
    group: 'today',
    unread: true,
    unreadCount: 1,
    starred: false,
    archived: false
  },
  {
    id: 3,
    contactName: 'Fatima Noor',
    initials: 'FN',
    email: 'fatima@brightstartup.co',
    phone: '+966 54 222 3344',
    company: 'BrightStartup',
    avatarColor: '#22c55e',
    channel: 'chat',
    lastMessage: 'The integration is working now! Thanks for the quick fix.',
    timeAgo: '28m ago',
    group: 'today',
    unread: false,
    unreadCount: 0,
    starred: true,
    archived: false
  },
  {
    id: 4,
    contactName: 'Omar Khalil',
    initials: 'OK',
    email: 'omar.k@nexusenterprise.com',
    phone: '+966 56 444 5566',
    company: 'Nexus Enterprise',
    avatarColor: '#f59e0b',
    channel: 'sms',
    lastMessage: 'Please send the updated invoice to our billing department.',
    timeAgo: '1h ago',
    group: 'today',
    unread: true,
    unreadCount: 2,
    starred: false,
    archived: false
  },
  {
    id: 5,
    contactName: 'Layla Ibrahim',
    initials: 'LI',
    email: 'layla.i@mediagrow.net',
    phone: '+966 55 777 8899',
    company: 'MediaGrow',
    avatarColor: '#ef4444',
    channel: 'social',
    lastMessage: '@YourCompany Great product! Can someone from sales reach out?',
    timeAgo: '2h ago',
    group: 'today',
    unread: true,
    unreadCount: 1,
    starred: false,
    archived: false
  },
  {
    id: 6,
    contactName: 'Khalid Mansour',
    initials: 'KM',
    email: 'khalid@dataflowsys.com',
    phone: '+966 50 111 2233',
    company: 'DataFlow Systems',
    avatarColor: '#8b5cf6',
    channel: 'email',
    lastMessage: 'We need to discuss the SLA terms before signing the contract.',
    timeAgo: 'Yesterday',
    group: 'yesterday',
    unread: false,
    unreadCount: 0,
    starred: true,
    archived: false
  },
  {
    id: 7,
    contactName: 'Nadia Faisal',
    initials: 'NF',
    email: 'nadia.f@cloudpeak.io',
    phone: '+966 54 333 4455',
    company: 'CloudPeak',
    avatarColor: '#06b6d4',
    channel: 'whatsapp',
    lastMessage: 'Thanks for the quote. I will review it with my manager.',
    timeAgo: 'Yesterday',
    group: 'yesterday',
    unread: false,
    unreadCount: 0,
    starred: false,
    archived: false
  },
  {
    id: 8,
    contactName: 'Tariq Aziz',
    initials: 'TA',
    email: 'tariq@smartlogistics.sa',
    phone: '+966 55 999 0011',
    company: 'Smart Logistics',
    avatarColor: '#10b981',
    channel: 'chat',
    lastMessage: 'Is there a way to automate the reporting process?',
    timeAgo: 'Yesterday',
    group: 'yesterday',
    unread: true,
    unreadCount: 4,
    starred: false,
    archived: false
  },
  {
    id: 9,
    contactName: 'Reem Sultan',
    initials: 'RS',
    email: 'reem.s@visionarydesign.com',
    phone: '+966 56 666 7788',
    company: 'Visionary Design',
    avatarColor: '#ec4899',
    channel: 'email',
    lastMessage: 'Attached is the updated mockup for the landing page project.',
    timeAgo: 'Yesterday',
    group: 'yesterday',
    unread: false,
    unreadCount: 0,
    starred: false,
    archived: false
  },
  {
    id: 10,
    contactName: 'Youssef Darwish',
    initials: 'YD',
    email: 'youssef@alphaventures.co',
    phone: '+966 50 555 6677',
    company: 'Alpha Ventures',
    avatarColor: '#f97316',
    channel: 'sms',
    lastMessage: 'Confirmed for the meeting on Thursday at 3 PM.',
    timeAgo: 'Yesterday',
    group: 'yesterday',
    unread: false,
    unreadCount: 0,
    starred: true,
    archived: false
  },
  {
    id: 11,
    contactName: 'Amira Bakri',
    initials: 'AB',
    email: 'amira@techoasis.sa',
    phone: '+966 54 888 9900',
    company: 'TechOasis',
    avatarColor: '#6366f1',
    channel: 'email',
    lastMessage: 'Could you resend the API documentation? The link expired.',
    timeAgo: '3 days ago',
    group: 'older',
    unread: false,
    unreadCount: 0,
    starred: false,
    archived: false
  },
  {
    id: 12,
    contactName: 'Hassan Al-Omari',
    initials: 'HO',
    email: 'hassan@buildright.com',
    phone: '+966 55 444 5566',
    company: 'BuildRight Construction',
    avatarColor: '#14b8a6',
    channel: 'whatsapp',
    lastMessage: 'The project timeline has been approved by our board.',
    timeAgo: '4 days ago',
    group: 'older',
    unread: false,
    unreadCount: 0,
    starred: false,
    archived: true
  },
  {
    id: 13,
    contactName: 'Dina Kassem',
    initials: 'DK',
    email: 'dina.k@ecogreen.org',
    phone: '+966 56 222 3344',
    company: 'EcoGreen Solutions',
    avatarColor: '#84cc16',
    channel: 'social',
    lastMessage: 'Loved the sustainability initiative post! Would love to partner.',
    timeAgo: '5 days ago',
    group: 'older',
    unread: false,
    unreadCount: 0,
    starred: false,
    archived: false
  },
  {
    id: 14,
    contactName: 'Bilal Haddad',
    initials: 'BH',
    email: 'bilal@swiftcommerce.co',
    phone: '+966 50 333 4455',
    company: 'SwiftCommerce',
    avatarColor: '#e11d48',
    channel: 'chat',
    lastMessage: 'Payment for invoice #4521 has been processed successfully.',
    timeAgo: '1 week ago',
    group: 'older',
    unread: false,
    unreadCount: 0,
    starred: false,
    archived: false
  },
  {
    id: 15,
    contactName: 'Mona Zayed',
    initials: 'MZ',
    email: 'mona@pearlgroup.sa',
    phone: '+966 54 111 2233',
    company: 'Pearl Group International',
    avatarColor: '#a855f7',
    channel: 'email',
    lastMessage: 'We are interested in the enterprise plan. Can we set up a call?',
    timeAgo: '1 week ago',
    group: 'older',
    unread: false,
    unreadCount: 0,
    starred: true,
    archived: false
  },
  {
    id: 16,
    contactName: 'Zain Al-Farsi',
    initials: 'ZF',
    email: 'zain@rapidlink.io',
    phone: '+966 55 666 7788',
    company: 'RapidLink Networks',
    avatarColor: '#0ea5e9',
    channel: 'sms',
    lastMessage: 'License renewal reminder: expires in 14 days.',
    timeAgo: '2 weeks ago',
    group: 'older',
    unread: false,
    unreadCount: 0,
    starred: false,
    archived: true
  }
]

const conversations = ref<Conversation[]>([])

// --- Message Threads ---
const messageThreads = ref<Record<number, Message[]>>({
  1: [
    {
      direction: 'inbound',
      text: 'Hi, I wanted to follow up on the proposal we discussed last week regarding the enterprise CRM implementation. Our team has reviewed the initial scope and we have a few questions.',
      timestamp: 'Today, 10:05 AM',
      channel: 'email'
    },
    {
      direction: 'outbound',
      text: 'Hi Sarah! Thanks for following up. I would be happy to address any questions your team has. Could you share the specific points you would like to discuss?',
      timestamp: 'Today, 10:18 AM',
      channel: 'email'
    },
    {
      direction: 'inbound',
      text: 'Mainly around the data migration timeline and the custom integration with our existing ERP system. Also, what support packages are available post-launch?',
      timestamp: 'Today, 10:32 AM',
      channel: 'email',
      attachments: ['requirements-doc.pdf']
    },
    {
      direction: 'outbound',
      text: 'Great questions! For data migration, we typically allocate 4-6 weeks depending on volume. Our team has extensive experience with ERP integrations. I am attaching our support tier overview.',
      timestamp: 'Today, 10:45 AM',
      channel: 'email',
      attachments: ['support-tiers.pdf', 'migration-timeline.xlsx']
    },
    {
      direction: 'inbound',
      text: 'This looks comprehensive. One more thing - can we get a sandbox environment to test before going live?',
      timestamp: 'Today, 11:02 AM',
      channel: 'email'
    },
    {
      direction: 'outbound',
      text: 'Absolutely! We provide a full sandbox environment as part of the enterprise plan. I will set one up for your team by end of day and send you the credentials.',
      timestamp: 'Today, 11:15 AM',
      channel: 'email'
    },
    {
      direction: 'inbound',
      text: 'Perfect, that would be wonderful. Looking forward to it. Also, is there any possibility of extending the pilot period from 30 to 45 days?',
      timestamp: 'Today, 11:28 AM',
      channel: 'email'
    }
  ],
  2: [
    {
      direction: 'inbound',
      text: 'Hello! We are very interested in seeing a live demo of the CRM platform.',
      timestamp: 'Today, 9:30 AM',
      channel: 'whatsapp'
    },
    {
      direction: 'outbound',
      text: 'Hi Ahmed! We would love to arrange that. How large is your team?',
      timestamp: 'Today, 9:35 AM',
      channel: 'whatsapp'
    },
    {
      direction: 'inbound',
      text: 'About 25 people across sales and operations. Can we schedule for next Tuesday?',
      timestamp: 'Today, 9:42 AM',
      channel: 'whatsapp'
    },
    {
      direction: 'outbound',
      text: 'Tuesday works! I have 10 AM and 2 PM slots open. Which works better?',
      timestamp: 'Today, 9:50 AM',
      channel: 'whatsapp'
    },
    {
      direction: 'inbound',
      text: 'Let us go with 2 PM. Can we do it over Zoom?',
      timestamp: 'Today, 9:55 AM',
      channel: 'whatsapp'
    },
    {
      direction: 'outbound',
      text: 'Done! I will send a calendar invite with the Zoom link shortly. See you Tuesday!',
      timestamp: 'Today, 10:02 AM',
      channel: 'whatsapp'
    }
  ],
  3: [
    {
      direction: 'inbound',
      text: 'Hey, the webhook integration was throwing 502 errors since this morning.',
      timestamp: 'Today, 8:15 AM',
      channel: 'chat'
    },
    {
      direction: 'outbound',
      text: 'Let me check the logs right away. Can you confirm which endpoint?',
      timestamp: 'Today, 8:18 AM',
      channel: 'chat'
    },
    {
      direction: 'inbound',
      text: 'It is the /api/v2/webhooks/inbound endpoint.',
      timestamp: 'Today, 8:20 AM',
      channel: 'chat'
    },
    {
      direction: 'outbound',
      text: 'Found it - there was a misconfigured SSL cert on the load balancer. Deploying a fix now.',
      timestamp: 'Today, 8:35 AM',
      channel: 'chat'
    },
    {
      direction: 'outbound',
      text: 'Fix deployed! Can you try again and confirm it works?',
      timestamp: 'Today, 8:42 AM',
      channel: 'chat'
    },
    {
      direction: 'inbound',
      text: 'The integration is working now! Thanks for the quick fix.',
      timestamp: 'Today, 8:50 AM',
      channel: 'chat'
    }
  ],
  4: [
    {
      direction: 'inbound',
      text: 'Hi, could you please resend invoice #7823? We cannot find it in our email.',
      timestamp: 'Today, 7:45 AM',
      channel: 'sms'
    },
    {
      direction: 'outbound',
      text: 'Sure! I will resend it to your billing email right away.',
      timestamp: 'Today, 7:52 AM',
      channel: 'sms'
    },
    {
      direction: 'inbound',
      text: 'Please send the updated invoice to our billing department.',
      timestamp: 'Today, 8:10 AM',
      channel: 'sms'
    },
    {
      direction: 'outbound',
      text: 'Done! Sent to billing@nexusenterprise.com. Let me know if you need anything else.',
      timestamp: 'Today, 8:15 AM',
      channel: 'sms'
    },
    {
      direction: 'inbound',
      text: 'Got it, thanks. Can you also send the PO for Q1?',
      timestamp: 'Today, 8:30 AM',
      channel: 'sms'
    }
  ],
  5: [
    {
      direction: 'inbound',
      text: '@YourCompany Great product! Saw the demo at the tech expo. Can someone from sales reach out?',
      timestamp: 'Today, 6:30 AM',
      channel: 'social'
    },
    {
      direction: 'outbound',
      text: 'Thank you, Layla! We are glad you liked what you saw. I am connecting you with our sales team right now.',
      timestamp: 'Today, 7:00 AM',
      channel: 'social'
    },
    {
      direction: 'inbound',
      text: 'Awesome! Looking forward to learning more about the enterprise features.',
      timestamp: 'Today, 7:15 AM',
      channel: 'social'
    }
  ]
})

// --- Contact Activities ---
const contactActivities = computed(() => [
  { icon: 'ph:envelope-bold', text: 'Email sent: Proposal Follow-up', time: '2 hours ago' },
  { icon: 'ph:phone-bold', text: 'Call logged: 15 min discussion', time: 'Yesterday' },
  { icon: 'ph:note-bold', text: 'Note added: Budget confirmed', time: '2 days ago' },
  { icon: 'ph:calendar-bold', text: 'Meeting scheduled: Product Demo', time: '3 days ago' }
])

// --- Linked Deals ---
const linkedDeals = computed(() => [
  { name: 'Enterprise CRM License', stage: 'Negotiation', stageColor: '#f59e0b', value: 'SAR 245,000' },
  { name: 'Support & Training Package', stage: 'Proposal', stageColor: '#3b82f6', value: 'SAR 48,000' }
])

// --- Computed Filters ---
const filteredConversations = computed(() => {
  let result = conversations.value

  if (activeChannel.value !== 'all') {
    result = result.filter(c => c.channel === activeChannel.value)
  }

  if (activeStatus.value === 'unread') {
    result = result.filter(c => c.unread)
  } else if (activeStatus.value === 'starred') {
    result = result.filter(c => c.starred)
  } else if (activeStatus.value === 'archived') {
    result = result.filter(c => c.archived)
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(c =>
      c.contactName.toLowerCase().includes(query) ||
      c.lastMessage.toLowerCase().includes(query) ||
      c.company.toLowerCase().includes(query)
    )
  }

  return result
})

const todayConversations = computed(() =>
  filteredConversations.value.filter(c => c.group === 'today')
)

const yesterdayConversations = computed(() =>
  filteredConversations.value.filter(c => c.group === 'yesterday')
)

const olderConversations = computed(() =>
  filteredConversations.value.filter(c => c.group === 'older')
)

const selectedMessages = computed(() => {
  if (!selectedConversation.value) return []
  return messageThreads.value[selectedConversation.value.id] || []
})

// --- Helper Functions ---
function getChannelIcon(channel: string): string {
  const iconMap: Record<string, string> = {
    email: 'ph:envelope-simple',
    chat: 'ph:chat-circle-dots',
    sms: 'ph:device-mobile',
    whatsapp: 'ph:whatsapp-logo',
    social: 'ph:share-network'
  }
  return iconMap[channel] || 'ph:chat-circle-dots'
}

function selectConversation(conv: Conversation) {
  selectedConversation.value = conv
  replyChannel.value = conv.channel
  showContactInfo.value = false
  nextTick(() => {
    scrollToBottom()
  })
}

function scrollToBottom() {
  if (messageThreadRef.value) {
    messageThreadRef.value.scrollTop = messageThreadRef.value.scrollHeight
  }
}

function toggleStar() {
  if (selectedConversation.value) {
    selectedConversation.value.starred = !selectedConversation.value.starred
  }
}

function archiveConversation() {
  if (selectedConversation.value) {
    selectedConversation.value.archived = !selectedConversation.value.archived
  }
}

function snoozeConversation() {
  // Mock snooze action
}

function markResolved() {
  if (selectedConversation.value) {
    selectedConversation.value.unread = false
    selectedConversation.value.unreadCount = 0
  }
}

function attachFile() {
  // Mock attach file action
}

function sendReply() {
  if (!replyText.value.trim() || !selectedConversation.value) return

  const convId = selectedConversation.value.id
  if (!messageThreads.value[convId]) {
    messageThreads.value[convId] = []
  }

  messageThreads.value[convId].push({
    direction: 'outbound',
    text: replyText.value,
    timestamp: 'Just now',
    channel: replyChannel.value
  })

  selectedConversation.value.lastMessage = replyText.value
  selectedConversation.value.timeAgo = 'Just now'
  replyText.value = ''

  nextTick(() => {
    scrollToBottom()
  })
}

// --- Data Loading ---
async function loadData() {
  loading.value = true
  try {
    const res = await useApiFetch('communications/recent')
    if (res.success && Array.isArray(res.body)) {
      conversations.value = res.body as any
    } else {
      conversations.value = conversationsFallback
    }
  } catch {
    conversations.value = conversationsFallback
  }
  loading.value = false
}

// --- Lifecycle ---
onMounted(() => { loadData() })
</script>

<style lang="scss" scoped>
.unified-inbox-page {
  animation: fadeInUp 0.6s ease-out;
  min-height: 100vh;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

.glass-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  transition: box-shadow 0.3s ease;
  &:hover { box-shadow: 0 8px 32px rgba(120, 73, 255, 0.08); }
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
  &:hover { background: rgba(120, 73, 255, 0.05); }
  &.active {
    background: rgba(120, 73, 255, 0.10);
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
