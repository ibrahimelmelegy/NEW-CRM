<template lang="pug">
.social-listening-page.p-6(class="md:p-8")
  //- Page Header
  .flex.items-center.justify-between.mb-8(class="flex-col md:flex-row gap-4")
    div
      h1.text-3xl.font-black.tracking-tight.flex.items-center.gap-3(style="color: var(--text-primary)")
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: linear-gradient(135deg, #3b82f6, #22d3ee)")
          Icon(name="ph:ear-bold" size="22" style="color: white")
        | {{ $t('socialListening.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('socialListening.subtitle') }}

    .flex.items-center.gap-3(class="flex-wrap")
      el-date-picker(
        v-model="dateRange"
        type="daterange"
        :start-placeholder="$t('socialListening.startDate')"
        :end-placeholder="$t('socialListening.endDate')"
        size="large"
        style="max-width: 280px"
        value-format="YYYY-MM-DD"
      )
      el-button(
        size="large"
        @click="refreshData"
        :loading="loading"
        class="!rounded-2xl"
      )
        Icon(name="ph:arrows-clockwise-bold" size="16")
        span.ml-1 {{ $t('socialListening.refresh') }}

  //- KPI Cards
  .grid.gap-5.mb-8(class="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4")
    .kpi-card(v-for="(kpi, idx) in kpiCards" :key="idx")
      .flex.items-start.justify-between
        div
          p.text-sm.font-medium.mb-1(style="color: var(--text-muted)") {{ kpi.label }}
          p.text-2xl.font-bold(:style="{ color: kpi.color }") {{ kpi.value }}
          .flex.items-center.gap-1.mt-2
            Icon(:name="kpi.trend >= 0 ? 'ph:trend-up-bold' : 'ph:trend-down-bold'" size="14" :style="{ color: kpi.trend >= 0 ? '#22c55e' : '#ef4444' }")
            span.text-xs.font-semibold(:style="{ color: kpi.trend >= 0 ? '#22c55e' : '#ef4444' }") {{ kpi.trend >= 0 ? '+' : '' }}{{ kpi.trend }}%
        .kpi-icon-wrapper(:style="{ background: kpi.color + '18' }")
          Icon(:name="kpi.icon" size="24" :style="{ color: kpi.color }")

  //- Loading State
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="40" style="color: var(--accent-color, #7849ff)")

  //- Main Content Tabs
  template(v-else)
    el-tabs(v-model="activeTab" class="social-listening-tabs")

      //- ════════════════════════════════════════════════
      //- TAB 1: Feed
      //- ════════════════════════════════════════════════
      el-tab-pane(:label="$t('socialListening.feed')" name="feed")
        //- Filter Bar
        .glass-card.p-4.mb-5.rounded-2xl
          .flex.items-center.justify-between(class="flex-wrap gap-3")
            .flex.items-center.gap-3
              el-input(
                v-model="feedSearch"
                :placeholder="$t('socialListening.searchMentions')"
                clearable
                size="large"
                style="max-width: 280px"
                class="!rounded-xl"
              )
                template(#prefix)
                  Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")
              el-select(
                v-model="feedPlatformFilter"
                :placeholder="$t('socialListening.allPlatforms')"
                clearable
                size="large"
                style="width: 160px"
              )
                el-option(v-for="p in platformOptions" :key="p.value" :label="p.label" :value="p.value")
              el-select(
                v-model="feedSentimentFilter"
                :placeholder="$t('socialListening.allSentiments')"
                clearable
                size="large"
                style="width: 160px"
              )
                el-option(:label="$t('socialListening.positive')" value="positive")
                el-option(:label="$t('socialListening.neutral')" value="neutral")
                el-option(:label="$t('socialListening.negative')" value="negative")
            span.text-sm(style="color: var(--text-muted)") {{ filteredMentions.length }} {{ $t('socialListening.mentionsFound') }}

        //- Mention Cards
        .space-y-4
          .mention-card(v-for="mention in paginatedMentions" :key="mention.id")
            .flex.items-start.gap-4
              //- Platform Icon
              .w-10.h-10.rounded-xl.flex.items-center.justify-center.shrink-0(:style="{ background: getPlatformColor(mention.platform) + '15' }")
                Icon(:name="getPlatformIcon(mention.platform)" size="20" :style="{ color: getPlatformColor(mention.platform) }")

              .flex-1.min-w-0
                .flex.items-center.justify-between.mb-2(class="flex-wrap gap-2")
                  .flex.items-center.gap-3
                    //- Author Avatar
                    .author-avatar(:style="{ background: getAvatarColor(mention.authorName) }")
                      | {{ getInitials(mention.authorName) }}
                    div
                      .flex.items-center.gap-2
                        span.text-sm.font-bold(style="color: var(--text-primary)") {{ mention.authorName }}
                        span.text-xs(style="color: var(--text-muted)") {{ mention.handle }}
                      span.text-xs(style="color: var(--text-muted)") {{ formatRelativeTime(mention.date) }}
                  .flex.items-center.gap-2
                    el-tag(
                      :type="getSentimentTagType(mention.sentiment)"
                      size="small"
                      effect="dark"
                      round
                    ) {{ $t('socialListening.' + mention.sentiment) }}

                //- Mention Text
                p.text-sm.mb-3.mention-text(style="color: var(--text-secondary)") {{ mention.text }}

                //- Engagement Metrics & Actions
                .flex.items-center.justify-between(class="flex-wrap gap-2")
                  .flex.items-center.gap-4
                    .flex.items-center.gap-1
                      Icon(name="ph:heart-bold" size="14" style="color: var(--text-muted)")
                      span.text-xs(style="color: var(--text-muted)") {{ formatCompact(mention.likes) }}
                    .flex.items-center.gap-1
                      Icon(name="ph:share-bold" size="14" style="color: var(--text-muted)")
                      span.text-xs(style="color: var(--text-muted)") {{ formatCompact(mention.shares) }}
                    .flex.items-center.gap-1
                      Icon(name="ph:chat-circle-bold" size="14" style="color: var(--text-muted)")
                      span.text-xs(style="color: var(--text-muted)") {{ formatCompact(mention.comments) }}
                  .flex.items-center.gap-2
                    el-button(size="small" text type="primary" @click="handleReply(mention)")
                      Icon(name="ph:arrow-bend-up-left-bold" size="14" class="mr-1")
                      | {{ $t('socialListening.reply') }}
                    el-button(size="small" text @click="handleTrack(mention)")
                      Icon(name="ph:bookmark-simple-bold" size="14" class="mr-1")
                      | {{ $t('socialListening.track') }}

        //- Pagination
        .flex.justify-center.mt-6(v-if="filteredMentions.length > feedPageSize")
          el-pagination(
            v-model:current-page="feedPage"
            :page-size="feedPageSize"
            :total="filteredMentions.length"
            layout="prev, pager, next"
            background
          )

      //- ════════════════════════════════════════════════
      //- TAB 2: Sentiment Analysis
      //- ════════════════════════════════════════════════
      el-tab-pane(:label="$t('socialListening.sentimentAnalysis')" name="sentiment")
        .grid.gap-6.mb-6(class="grid-cols-1 lg:grid-cols-2")
          //- Sentiment Trend Line Chart
          .glass-card.p-6.rounded-2xl
            .flex.items-center.gap-2.mb-4
              Icon(name="ph:chart-line-up-bold" size="20" style="color: #3b82f6")
              h3.text-base.font-bold(style="color: var(--text-primary)") {{ $t('socialListening.sentimentTrend') }}
            ClientOnly
              VChart(v-if="sentimentTrendOption" :option="sentimentTrendOption" autoresize style="height: 320px; width: 100%")

          //- Sentiment Distribution Pie
          .glass-card.p-6.rounded-2xl
            .flex.items-center.gap-2.mb-4
              Icon(name="ph:chart-pie-slice-bold" size="20" style="color: #7849ff")
              h3.text-base.font-bold(style="color: var(--text-primary)") {{ $t('socialListening.sentimentDistribution') }}
            ClientOnly
              VChart(v-if="sentimentPieOption" :option="sentimentPieOption" autoresize style="height: 320px; width: 100%")

        //- Word Cloud
        .glass-card.p-6.rounded-2xl.mb-6
          .flex.items-center.gap-2.mb-4
            Icon(name="ph:text-aa-bold" size="20" style="color: #f59e0b")
            h3.text-base.font-bold(style="color: var(--text-primary)") {{ $t('socialListening.trendingTopics') }}
          .word-cloud
            span.word-tag(
              v-for="(word, idx) in wordCloudData"
              :key="idx"
              :class="word.sizeClass"
              :style="{ color: word.color, animationDelay: (idx * 0.05) + 's' }"
            ) {{ word.text }}

        //- Sentiment by Platform
        .glass-card.p-6.rounded-2xl
          .flex.items-center.gap-2.mb-4
            Icon(name="ph:stack-bold" size="20" style="color: #22c55e")
            h3.text-base.font-bold(style="color: var(--text-primary)") {{ $t('socialListening.sentimentByPlatform') }}
          ClientOnly
            VChart(v-if="sentimentByPlatformOption" :option="sentimentByPlatformOption" autoresize style="height: 340px; width: 100%")

      //- ════════════════════════════════════════════════
      //- TAB 3: Competitors
      //- ════════════════════════════════════════════════
      el-tab-pane(:label="$t('socialListening.competitors')" name="competitors")
        //- Comparison Table
        .glass-card.p-6.rounded-2xl.mb-6
          .flex.items-center.gap-2.mb-5
            Icon(name="ph:table-bold" size="20" style="color: #3b82f6")
            h3.text-base.font-bold(style="color: var(--text-primary)") {{ $t('socialListening.competitorComparison') }}

          el-table(:data="competitors" stripe style="width: 100%")
            el-table-column(:label="$t('socialListening.brand')" prop="name" min-width="180" sortable)
              template(#default="{ row }")
                .flex.items-center.gap-3
                  .w-9.h-9.rounded-xl.flex.items-center.justify-center.shrink-0(:style="{ background: row.color + '15' }")
                    Icon(name="ph:buildings-bold" size="18" :style="{ color: row.color }")
                  div
                    p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.name }}
                    p.text-xs(v-if="row.isOurs" style="color: #7849ff") {{ $t('socialListening.yourBrand') }}

            el-table-column(:label="$t('socialListening.mentions')" prop="mentions" width="140" align="center" sortable)
              template(#default="{ row }")
                span.text-sm.font-bold(style="color: var(--text-primary)") {{ formatCompact(row.mentions) }}

            el-table-column(:label="$t('socialListening.sentimentScore')" prop="sentimentScore" width="180" align="center" sortable)
              template(#default="{ row }")
                .flex.items-center.justify-center.gap-2
                  el-progress(
                    :percentage="row.sentimentScore"
                    :stroke-width="8"
                    :color="row.sentimentScore >= 70 ? '#22c55e' : row.sentimentScore >= 50 ? '#f59e0b' : '#ef4444'"
                    style="width: 80px"
                    :show-text="false"
                  )
                  span.text-sm.font-bold(:style="{ color: row.sentimentScore >= 70 ? '#22c55e' : row.sentimentScore >= 50 ? '#f59e0b' : '#ef4444' }") {{ row.sentimentScore }}%

            el-table-column(:label="$t('socialListening.shareOfVoice')" prop="shareOfVoice" width="160" align="center" sortable)
              template(#default="{ row }")
                .flex.items-center.justify-center.gap-2
                  .sov-bar
                    .sov-fill(:style="{ width: row.shareOfVoice + '%', background: row.color }")
                  span.text-sm.font-semibold(:style="{ color: row.color }") {{ row.shareOfVoice }}%

            el-table-column(:label="$t('socialListening.trend')" prop="trend" width="130" align="center" sortable)
              template(#default="{ row }")
                .flex.items-center.justify-center.gap-1
                  Icon(:name="row.trend >= 0 ? 'ph:trend-up-bold' : 'ph:trend-down-bold'" size="16" :style="{ color: row.trend >= 0 ? '#22c55e' : '#ef4444' }")
                  span.text-sm.font-bold(:style="{ color: row.trend >= 0 ? '#22c55e' : '#ef4444' }") {{ row.trend >= 0 ? '+' : '' }}{{ row.trend }}%

        .grid.gap-6(class="grid-cols-1 lg:grid-cols-2")
          //- Radar Chart
          .glass-card.p-6.rounded-2xl
            .flex.items-center.gap-2.mb-4
              Icon(name="ph:radar-bold" size="20" style="color: #7849ff")
              h3.text-base.font-bold(style="color: var(--text-primary)") {{ $t('socialListening.competitorRadar') }}
            ClientOnly
              VChart(v-if="competitorRadarOption" :option="competitorRadarOption" autoresize style="height: 380px; width: 100%")

          //- Share of Voice Area Chart
          .glass-card.p-6.rounded-2xl
            .flex.items-center.gap-2.mb-4
              Icon(name="ph:chart-line-bold" size="20" style="color: #f59e0b")
              h3.text-base.font-bold(style="color: var(--text-primary)") {{ $t('socialListening.shareOfVoiceOverTime') }}
            ClientOnly
              VChart(v-if="sovAreaOption" :option="sovAreaOption" autoresize style="height: 380px; width: 100%")

      //- ════════════════════════════════════════════════
      //- TAB 4: Influencers
      //- ════════════════════════════════════════════════
      el-tab-pane(:label="$t('socialListening.influencers')" name="influencers")
        //- Sort Controls
        .glass-card.p-4.mb-5.rounded-2xl
          .flex.items-center.justify-between(class="flex-wrap gap-3")
            .flex.items-center.gap-2
              Icon(name="ph:funnel-bold" size="18" style="color: var(--text-muted)")
              span.text-sm.font-medium(style="color: var(--text-muted)") {{ $t('socialListening.sortBy') }}
              el-radio-group(v-model="influencerSort" size="small")
                el-radio-button(value="followers") {{ $t('socialListening.followers') }}
                el-radio-button(value="engagement") {{ $t('socialListening.engagement') }}
                el-radio-button(value="relevance") {{ $t('socialListening.relevance') }}
            .flex.items-center.gap-3
              el-select(
                v-model="influencerPlatformFilter"
                :placeholder="$t('socialListening.allPlatforms')"
                clearable
                size="large"
                style="width: 160px"
              )
                el-option(v-for="p in platformOptions" :key="p.value" :label="p.label" :value="p.value")
              span.text-sm(style="color: var(--text-muted)") {{ sortedInfluencers.length }} {{ $t('socialListening.influencersFound') }}

        //- Influencer Cards Grid
        .grid.gap-5(class="grid-cols-1 md:grid-cols-2 xl:grid-cols-3")
          .influencer-card(v-for="influencer in sortedInfluencers" :key="influencer.id")
            .flex.items-start.gap-4.mb-4
              //- Influencer Avatar
              .influencer-avatar(:style="{ background: getAvatarColor(influencer.name) }")
                | {{ getInitials(influencer.name) }}
              .flex-1.min-w-0
                .flex.items-center.gap-2.mb-1
                  h4.text-sm.font-bold.truncate(style="color: var(--text-primary)") {{ influencer.name }}
                  Icon(:name="getPlatformIcon(influencer.platform)" size="14" :style="{ color: getPlatformColor(influencer.platform) }")
                p.text-xs.truncate(style="color: var(--text-muted)") {{ influencer.handle }}
              el-tag(
                :type="getSentimentTagType(influencer.sentiment)"
                size="small"
                effect="dark"
                round
              ) {{ $t('socialListening.' + influencer.sentiment) }}

            //- Stats
            .grid.grid-cols-2.gap-3.mb-4
              .stat-box
                p.text-xs(style="color: var(--text-muted)") {{ $t('socialListening.followers') }}
                p.text-sm.font-bold(style="color: var(--text-primary)") {{ formatCompact(influencer.followers) }}
              .stat-box
                p.text-xs(style="color: var(--text-muted)") {{ $t('socialListening.engagementRate') }}
                p.text-sm.font-bold(style="color: #22c55e") {{ influencer.engagementRate }}%
              .stat-box
                p.text-xs(style="color: var(--text-muted)") {{ $t('socialListening.relevanceScore') }}
                p.text-sm.font-bold(style="color: #7849ff") {{ influencer.relevanceScore }}
              .stat-box
                p.text-xs(style="color: var(--text-muted)") {{ $t('socialListening.avgLikes') }}
                p.text-sm.font-bold(style="color: var(--text-primary)") {{ formatCompact(influencer.avgLikes) }}

            //- Topics Tags
            .flex.flex-wrap.gap-1.mb-4
              el-tag(
                v-for="topic in influencer.topics"
                :key="topic"
                size="small"
                effect="plain"
                round
              ) {{ topic }}

            //- Connect Button
            el-button(
              type="primary"
              size="default"
              class="!w-full !rounded-xl !bg-[#7849ff] !border-none"
              @click="handleConnect(influencer)"
            )
              Icon(name="ph:handshake-bold" size="16" class="mr-1")
              | {{ $t('socialListening.connect') }}
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import VChart from 'vue-echarts';
import { graphic } from 'echarts';

definePageMeta({ title: 'Social Listening' });

const { t } = useI18n();

// ── Interfaces ────────────────────────────────────────
interface Mention {
  id: string;
  platform: string;
  authorName: string;
  handle: string;
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  likes: number;
  shares: number;
  comments: number;
  date: string;
}

interface Competitor {
  id: string;
  name: string;
  mentions: number;
  sentimentScore: number;
  shareOfVoice: number;
  trend: number;
  color: string;
  isOurs: boolean;
}

interface Influencer {
  id: string;
  name: string;
  handle: string;
  platform: string;
  followers: number;
  engagementRate: number;
  relevanceScore: number;
  avgLikes: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  topics: string[];
}

// ── State ─────────────────────────────────────────────
const loading = ref(false);
const activeTab = ref('feed');
const dateRange = ref<[string, string] | null>(null);

// Feed State
const feedSearch = ref('');
const feedPlatformFilter = ref('');
const feedSentimentFilter = ref('');
const feedPage = ref(1);
const feedPageSize = 8;

// Influencer State
const influencerSort = ref('followers');
const influencerPlatformFilter = ref('');

// Data
const mentions = ref<Mention[]>([]);
const competitors = ref<Competitor[]>([]);
const influencers = ref<Influencer[]>([]);
const sentimentTrendData = ref<{ date: string; positive: number; neutral: number; negative: number }[]>([]);
const sovTrendData = ref<{ month: string; values: Record<string, number> }[]>([]);

// ── Platform Config ───────────────────────────────────
const platformOptions = [
  { label: 'Twitter/X', value: 'twitter' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'Instagram', value: 'instagram' }
];

function getPlatformIcon(platform: string): string {
  const map: Record<string, string> = {
    twitter: 'ph:x-logo-bold',
    linkedin: 'ph:linkedin-logo-bold',
    facebook: 'ph:facebook-logo-bold',
    instagram: 'ph:instagram-logo-bold'
  };
  return map[platform] || 'ph:globe-bold';
}

function getPlatformColor(platform: string): string {
  const map: Record<string, string> = {
    twitter: '#1da1f2',
    linkedin: '#0077b5',
    facebook: '#1877f2',
    instagram: '#e4405f'
  };
  return map[platform] || '#7849ff';
}

// ── KPI Cards ─────────────────────────────────────────
const kpiCards = computed(() => {
  const totalMentions = mentions.value.length;
  const posCount = mentions.value.filter(m => m.sentiment === 'positive').length;
  const negCount = mentions.value.filter(m => m.sentiment === 'negative').length;
  const sentScore = totalMentions > 0 ? Math.round(((posCount - negCount) / totalMentions) * 100 + 50) : 50;
  const ourBrand = competitors.value.find(c => c.isOurs);
  const totalEng = mentions.value.reduce((s, m) => s + m.likes + m.shares + m.comments, 0);
  const engRate = totalMentions > 0 ? ((totalEng / totalMentions) / 100 * 4.2).toFixed(1) : '0.0';

  return [
    {
      label: t('socialListening.totalMentions'),
      value: formatCompact(totalMentions),
      icon: 'ph:at-bold',
      color: '#3b82f6',
      trend: 12.5
    },
    {
      label: t('socialListening.sentimentScore'),
      value: sentScore + '%',
      icon: 'ph:smiley-bold',
      color: '#22c55e',
      trend: 3.8
    },
    {
      label: t('socialListening.shareOfVoice'),
      value: (ourBrand?.shareOfVoice || 0) + '%',
      icon: 'ph:megaphone-bold',
      color: '#7849ff',
      trend: 5.2
    },
    {
      label: t('socialListening.engagementRate'),
      value: engRate + '%',
      icon: 'ph:heart-bold',
      color: '#f59e0b',
      trend: -1.4
    }
  ];
});

// ── Helpers ───────────────────────────────────────────
function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function getAvatarColor(name: string): string {
  const gradients = [
    'linear-gradient(135deg, #7849ff, #a855f7)',
    'linear-gradient(135deg, #3b82f6, #60a5fa)',
    'linear-gradient(135deg, #22c55e, #4ade80)',
    'linear-gradient(135deg, #f59e0b, #fbbf24)',
    'linear-gradient(135deg, #ef4444, #f87171)',
    'linear-gradient(135deg, #06b6d4, #22d3ee)',
    'linear-gradient(135deg, #ec4899, #f472b6)',
    'linear-gradient(135deg, #8b5cf6, #a78bfa)'
  ];
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return gradients[idx % gradients.length] ?? gradients[0]!;
}

function getSentimentTagType(sentiment: string): string {
  const map: Record<string, string> = {
    positive: 'success',
    neutral: 'info',
    negative: 'danger'
  };
  return map[sentiment] || 'info';
}

function formatCompact(n: number): string {
  if (!n && n !== 0) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return t('socialListening.justNow');
  if (diffMins < 60) return diffMins + t('socialListening.minutesAgo');
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return diffHours + t('socialListening.hoursAgo');
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return diffDays + t('socialListening.daysAgo');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Filtered & Paginated Mentions ─────────────────────
const filteredMentions = computed(() => {
  let result = [...mentions.value];
  if (feedPlatformFilter.value) {
    result = result.filter(m => m.platform === feedPlatformFilter.value);
  }
  if (feedSentimentFilter.value) {
    result = result.filter(m => m.sentiment === feedSentimentFilter.value);
  }
  if (feedSearch.value) {
    const q = feedSearch.value.toLowerCase();
    result = result.filter(m =>
      m.text.toLowerCase().includes(q) ||
      m.authorName.toLowerCase().includes(q) ||
      m.handle.toLowerCase().includes(q)
    );
  }
  return result;
});

const paginatedMentions = computed(() => {
  const start = (feedPage.value - 1) * feedPageSize;
  return filteredMentions.value.slice(start, start + feedPageSize);
});

// ── Sorted Influencers ────────────────────────────────
const sortedInfluencers = computed(() => {
  let result = [...influencers.value];
  if (influencerPlatformFilter.value) {
    result = result.filter(i => i.platform === influencerPlatformFilter.value);
  }
  switch (influencerSort.value) {
    case 'followers':
      result.sort((a, b) => b.followers - a.followers);
      break;
    case 'engagement':
      result.sort((a, b) => b.engagementRate - a.engagementRate);
      break;
    case 'relevance':
      result.sort((a, b) => b.relevanceScore - a.relevanceScore);
      break;
  }
  return result;
});

// ── Chart Options ─────────────────────────────────────
const chartTooltip = {
  backgroundColor: 'rgba(30, 30, 45, 0.9)',
  borderColor: 'rgba(120, 73, 255, 0.3)',
  textStyle: { color: '#fff' },
  extraCssText: 'backdrop-filter: blur(12px); border-radius: 12px;'
};

// Sentiment Trend Line Chart
const sentimentTrendOption = computed(() => {
  const data = sentimentTrendData.value;
  if (!data.length) return null;

  const dates = data.map(d => d.date);
  const positive = data.map(d => d.positive);
  const neutral = data.map(d => d.neutral);
  const negative = data.map(d => d.negative);

  return {
    tooltip: { ...chartTooltip, trigger: 'axis' },
    legend: {
      data: [t('socialListening.positive'), t('socialListening.neutral'), t('socialListening.negative')],
      textStyle: { color: '#94a3b8', fontSize: 11 },
      top: 0
    },
    grid: { top: 40, right: 20, bottom: 30, left: 50 },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#444' } },
      axisLabel: { color: '#999', fontSize: 10, rotate: 30 }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      axisLabel: { color: '#999', fontSize: 11 }
    },
    series: [
      {
        name: t('socialListening.positive'),
        type: 'line',
        data: positive,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 3, color: '#22c55e' },
        itemStyle: { color: '#22c55e' },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(34, 197, 94, 0.25)' },
            { offset: 1, color: 'rgba(34, 197, 94, 0.02)' }
          ])
        }
      },
      {
        name: t('socialListening.neutral'),
        type: 'line',
        data: neutral,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 3, color: '#94a3b8' },
        itemStyle: { color: '#94a3b8' },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(148, 163, 184, 0.15)' },
            { offset: 1, color: 'rgba(148, 163, 184, 0.02)' }
          ])
        }
      },
      {
        name: t('socialListening.negative'),
        type: 'line',
        data: negative,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 3, color: '#ef4444' },
        itemStyle: { color: '#ef4444' },
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(239, 68, 68, 0.2)' },
            { offset: 1, color: 'rgba(239, 68, 68, 0.02)' }
          ])
        }
      }
    ]
  };
});

// Sentiment Pie Chart
const sentimentPieOption = computed(() => {
  const posCount = mentions.value.filter(m => m.sentiment === 'positive').length;
  const neuCount = mentions.value.filter(m => m.sentiment === 'neutral').length;
  const negCount = mentions.value.filter(m => m.sentiment === 'negative').length;

  return {
    tooltip: { ...chartTooltip, trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: {
      orient: 'vertical',
      right: 20,
      top: 'center',
      textStyle: { color: '#94a3b8', fontSize: 12 }
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '75%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: 'transparent', borderWidth: 3 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#fff' },
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' }
        },
        data: [
          { value: posCount, name: t('socialListening.positive'), itemStyle: { color: '#22c55e' } },
          { value: neuCount, name: t('socialListening.neutral'), itemStyle: { color: '#94a3b8' } },
          { value: negCount, name: t('socialListening.negative'), itemStyle: { color: '#ef4444' } }
        ]
      }
    ]
  };
});

// Sentiment By Platform (Stacked Horizontal Bar)
const sentimentByPlatformOption = computed(() => {
  const platforms = ['Twitter/X', 'LinkedIn', 'Facebook', 'Instagram'];
  const platformKeys = ['twitter', 'linkedin', 'facebook', 'instagram'];

  const posData = platformKeys.map(pk => mentions.value.filter(m => m.platform === pk && m.sentiment === 'positive').length);
  const neuData = platformKeys.map(pk => mentions.value.filter(m => m.platform === pk && m.sentiment === 'neutral').length);
  const negData = platformKeys.map(pk => mentions.value.filter(m => m.platform === pk && m.sentiment === 'negative').length);

  return {
    tooltip: { ...chartTooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      data: [t('socialListening.positive'), t('socialListening.neutral'), t('socialListening.negative')],
      textStyle: { color: '#94a3b8', fontSize: 11 },
      top: 0
    },
    grid: { top: 40, right: 30, bottom: 20, left: 100 },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      axisLabel: { color: '#999', fontSize: 11 }
    },
    yAxis: {
      type: 'category',
      data: platforms,
      axisLine: { lineStyle: { color: '#444' } },
      axisLabel: { color: '#999', fontSize: 12, fontWeight: 'bold' }
    },
    series: [
      {
        name: t('socialListening.positive'),
        type: 'bar',
        stack: 'sentiment',
        data: posData,
        itemStyle: { color: '#22c55e', borderRadius: [0, 0, 0, 0] }
      },
      {
        name: t('socialListening.neutral'),
        type: 'bar',
        stack: 'sentiment',
        data: neuData,
        itemStyle: { color: '#94a3b8' }
      },
      {
        name: t('socialListening.negative'),
        type: 'bar',
        stack: 'sentiment',
        data: negData,
        itemStyle: { color: '#ef4444', borderRadius: [0, 4, 4, 0] }
      }
    ]
  };
});

// Competitor Radar Chart
const competitorRadarOption = computed(() => {
  const dimensions = [
    t('socialListening.brandAwareness'),
    t('socialListening.sentimentScore'),
    t('socialListening.engagementRate'),
    t('socialListening.contentQuality'),
    t('socialListening.audienceGrowth')
  ];

  const ourBrand = competitors.value.find(c => c.isOurs);
  const topCompetitors = competitors.value.filter(c => !c.isOurs).slice(0, 3);

  const radarData = [
    {
      value: [82, ourBrand?.sentimentScore || 72, 78, 85, 70],
      name: ourBrand?.name || t('socialListening.yourBrand'),
      lineStyle: { width: 3, color: '#7849ff' },
      itemStyle: { color: '#7849ff' },
      areaStyle: { color: 'rgba(120, 73, 255, 0.2)' }
    },
    ...topCompetitors.map((comp, idx) => {
      const colors = ['#3b82f6', '#f59e0b', '#ef4444'];
      const baseVals = [
        [75, 68, 72, 70, 65],
        [60, 55, 80, 62, 58],
        [45, 48, 55, 50, 72]
      ];
      return {
        value: baseVals[idx] || [50, 50, 50, 50, 50],
        name: comp.name,
        lineStyle: { width: 2, color: colors[idx] ?? '#999', type: 'dashed' as const },
        itemStyle: { color: colors[idx] ?? '#999' },
        areaStyle: { color: (colors[idx] ?? '#999') + '15' }
      };
    })
  ];

  return {
    tooltip: chartTooltip,
    legend: {
      data: radarData.map(d => d.name),
      textStyle: { color: '#94a3b8', fontSize: 11 },
      bottom: 0
    },
    radar: {
      indicator: dimensions.map(d => ({ name: d, max: 100 })),
      shape: 'polygon',
      splitNumber: 4,
      axisName: { color: '#94a3b8', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      splitArea: { show: false },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
    },
    series: [
      {
        type: 'radar',
        data: radarData
      }
    ]
  };
});

// Share of Voice Area Chart
const sovAreaOption = computed(() => {
  const data = sovTrendData.value;
  if (!data.length) return null;

  const months = data.map(d => d.month);
  const brands = competitors.value.map(c => c.name);
  const colors = competitors.value.map(c => c.color);

  return {
    tooltip: { ...chartTooltip, trigger: 'axis' },
    legend: {
      data: brands,
      textStyle: { color: '#94a3b8', fontSize: 11 },
      top: 0
    },
    grid: { top: 40, right: 20, bottom: 30, left: 50 },
    xAxis: {
      type: 'category',
      data: months,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#444' } },
      axisLabel: { color: '#999', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      max: 100,
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      axisLabel: { color: '#999', fontSize: 11, formatter: '{value}%' }
    },
    series: brands.map((brand, idx) => ({
      name: brand,
      type: 'line',
      stack: 'sov',
      areaStyle: {
        color: new graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: (colors[idx] ?? '#999') + '60' },
          { offset: 1, color: (colors[idx] ?? '#999') + '10' }
        ])
      },
      lineStyle: { width: 2, color: colors[idx] ?? '#999' },
      itemStyle: { color: colors[idx] ?? '#999' },
      emphasis: { focus: 'series' },
      smooth: true,
      symbol: 'none',
      data: data.map(d => d.values[brand] || 0)
    }))
  };
});

// ── Word Cloud Data ───────────────────────────────────
const wordCloudData = computed(() => {
  const words = [
    { text: '#BrandCRM', sizeClass: 'text-2xl', color: '#7849ff' },
    { text: 'customer service', sizeClass: 'text-xl', color: '#3b82f6' },
    { text: 'automation', sizeClass: 'text-lg', color: '#22c55e' },
    { text: '#SaaS', sizeClass: 'text-2xl', color: '#f59e0b' },
    { text: 'integration', sizeClass: 'text-base', color: '#06b6d4' },
    { text: 'analytics', sizeClass: 'text-xl', color: '#ec4899' },
    { text: 'dashboard', sizeClass: 'text-sm', color: '#8b5cf6' },
    { text: '#CRMsoftware', sizeClass: 'text-lg', color: '#ef4444' },
    { text: 'pipeline', sizeClass: 'text-base', color: '#14b8a6' },
    { text: 'sales team', sizeClass: 'text-xl', color: '#f97316' },
    { text: '#digital', sizeClass: 'text-sm', color: '#64748b' },
    { text: 'workflow', sizeClass: 'text-lg', color: '#7849ff' },
    { text: 'ROI', sizeClass: 'text-2xl', color: '#22c55e' },
    { text: '#MarTech', sizeClass: 'text-base', color: '#3b82f6' },
    { text: 'lead scoring', sizeClass: 'text-lg', color: '#f59e0b' },
    { text: 'onboarding', sizeClass: 'text-sm', color: '#06b6d4' },
    { text: '#AI', sizeClass: 'text-2xl', color: '#ec4899' },
    { text: 'real-time', sizeClass: 'text-base', color: '#8b5cf6' },
    { text: 'reporting', sizeClass: 'text-xl', color: '#14b8a6' },
    { text: 'engagement', sizeClass: 'text-lg', color: '#ef4444' },
    { text: '#B2B', sizeClass: 'text-sm', color: '#64748b' },
    { text: 'conversion', sizeClass: 'text-xl', color: '#f97316' },
    { text: 'support', sizeClass: 'text-base', color: '#22c55e' },
    { text: '#Growth', sizeClass: 'text-lg', color: '#7849ff' },
    { text: 'feedback', sizeClass: 'text-sm', color: '#3b82f6' },
    { text: 'retention', sizeClass: 'text-xl', color: '#f59e0b' },
    { text: 'personalization', sizeClass: 'text-base', color: '#ec4899' },
    { text: '#Data', sizeClass: 'text-lg', color: '#06b6d4' },
    { text: 'scalability', sizeClass: 'text-sm', color: '#8b5cf6' },
    { text: 'omnichannel', sizeClass: 'text-xl', color: '#ef4444' }
  ];
  return words;
});

// ── Actions ───────────────────────────────────────────
function handleReply(mention: Mention) {
  ElMessage.info(t('socialListening.replyingSoon', { author: mention.authorName }));
}

function handleTrack(mention: Mention) {
  ElMessage.success(t('socialListening.tracked'));
}

function handleConnect(influencer: Influencer) {
  ElMessage.success(t('socialListening.connectionRequested', { name: influencer.name }));
}

// ── Mock Data Generation ──────────────────────────────
function generateMentions() {
  const now = new Date();
  const platforms = ['twitter', 'linkedin', 'facebook', 'instagram'];
  const sentiments: Mention['sentiment'][] = ['positive', 'neutral', 'negative'];

  const mockAuthors = [
    { name: 'Sarah Mitchell', handle: '@sarahmit' },
    { name: 'Ahmed Al-Farsi', handle: '@ahmedfarsi' },
    { name: 'David Park', handle: '@davidpark_tech' },
    { name: 'Elena Rodriguez', handle: '@elenarodz' },
    { name: 'James Thompson', handle: '@jthompson_biz' },
    { name: 'Yuki Tanaka', handle: '@yukitanaka' },
    { name: 'Priya Sharma', handle: '@priya_insights' },
    { name: 'Marco Bianchi', handle: '@marcob_digital' },
    { name: 'Aisha Khan', handle: '@aisha_mkt' },
    { name: 'Robert Chen', handle: '@robchen_ceo' },
    { name: 'Fatima Hassan', handle: '@fatima_saas' },
    { name: 'Tom Wilson', handle: '@tomw_analytics' },
    { name: 'Maria Garcia', handle: '@maria_crm' },
    { name: 'Li Wei', handle: '@liwei_tech' },
    { name: 'Nadia Popov', handle: '@nadiap_marketing' },
    { name: 'Oscar Mendez', handle: '@oscarmendez' },
    { name: 'Hannah Brown', handle: '@hannahb_sales' },
    { name: 'Raj Patel', handle: '@rajpatel_biz' }
  ];

  const positiveMentions = [
    'Just switched to @BrandCRM and the pipeline management is incredible! Our close rates improved by 30% in two months. Highly recommend for any B2B team.',
    'Amazing customer support from @BrandCRM today. Issue resolved in under 10 minutes. This is how SaaS companies should operate! #CustomerFirst',
    'The new analytics dashboard from @BrandCRM is a game changer. Finally real-time insights that actually drive decisions. Love the direction!',
    'Our team has been using @BrandCRM for 6 months now and productivity is up 40%. The automation features save us hours every week.',
    'Just attended the @BrandCRM webinar on lead scoring. Mind blown by the AI capabilities. The future of sales is here!',
    'Shoutout to @BrandCRM for the seamless integration with our marketing stack. No more data silos!',
    'The ROI we have seen from @BrandCRM in Q4 has been phenomenal. Best CRM investment we have made as a startup.'
  ];

  const neutralMentions = [
    'Comparing @BrandCRM vs CompetitorX for our enterprise rollout. Both have strong features, but looking for community feedback. Thoughts?',
    'New update from @BrandCRM just dropped. Checking out the features now. Will report back with my findings.',
    'Anyone else using @BrandCRM for their sales operations? Curious about your workflow setup and customizations.',
    'Reading the @BrandCRM Q4 report. Interesting market positioning. Some good numbers but also areas for improvement.',
    'Evaluating CRM solutions for mid-market companies. @BrandCRM is on our shortlist alongside a few others.',
    'The @BrandCRM mobile app got a redesign. Looks cleaner but still getting used to the new navigation.'
  ];

  const negativeMentions = [
    'Having some sync issues with @BrandCRM today. Calendar integration keeps dropping. Anyone else experiencing this?',
    'The pricing tier changes from @BrandCRM are frustrating. Features we relied on moved to enterprise plan. Not cool.',
    '@BrandCRM reporting could use work. Custom report builder is clunky compared to what @CompetitorY offers.',
    'Waited 3 hours for @BrandCRM support today. For enterprise pricing, response times should be much better.',
    'Import feature in @BrandCRM failed on a 10K contact list. Had to split into smaller batches. Needs improvement.'
  ];

  const allMentionTexts = { positive: positiveMentions, neutral: neutralMentions, negative: negativeMentions };
  const items: Mention[] = [];

  for (let i = 0; i < 18; i++) {
    const author = mockAuthors[i % mockAuthors.length]!;
    const platform = platforms[Math.floor(Math.random() * platforms.length)]!;
    const rand = Math.random();
    const sentiment: Mention['sentiment'] = rand < 0.45 ? 'positive' : rand < 0.75 ? 'neutral' : 'negative';
    const textPool = allMentionTexts[sentiment];
    const text = textPool[Math.floor(Math.random() * textPool.length)]!;
    const minutesAgo = Math.floor(Math.random() * 43200); // up to 30 days

    items.push({
      id: `mention-${i}`,
      platform,
      authorName: author.name,
      handle: author.handle,
      text,
      sentiment,
      likes: Math.floor(Math.random() * 500) + 5,
      shares: Math.floor(Math.random() * 120) + 1,
      comments: Math.floor(Math.random() * 80) + 1,
      date: new Date(now.getTime() - minutesAgo * 60000).toISOString()
    });
  }

  mentions.value = items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function generateSentimentTrend() {
  const data: { date: string; positive: number; neutral: number; negative: number }[] = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 86400000);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const basePositive = 35 + Math.floor(Math.random() * 25);
    const baseNeutral = 20 + Math.floor(Math.random() * 15);
    const baseNegative = 8 + Math.floor(Math.random() * 12);

    data.push({
      date: dateStr,
      positive: basePositive,
      neutral: baseNeutral,
      negative: baseNegative
    });
  }

  sentimentTrendData.value = data;
}

function generateCompetitors() {
  competitors.value = [
    { id: 'comp-0', name: 'BrandCRM', mentions: 4280, sentimentScore: 72, shareOfVoice: 35, trend: 5.2, color: '#7849ff', isOurs: true },
    { id: 'comp-1', name: 'CompetitorX', mentions: 3150, sentimentScore: 65, shareOfVoice: 26, trend: 2.1, color: '#3b82f6', isOurs: false },
    { id: 'comp-2', name: 'RivalCRM', mentions: 2480, sentimentScore: 58, shareOfVoice: 20, trend: -3.4, color: '#f59e0b', isOurs: false },
    { id: 'comp-3', name: 'SalesForce Pro', mentions: 1560, sentimentScore: 61, shareOfVoice: 13, trend: 1.8, color: '#22c55e', isOurs: false },
    { id: 'comp-4', name: 'PipelineHub', mentions: 730, sentimentScore: 54, shareOfVoice: 6, trend: -1.2, color: '#ef4444', isOurs: false }
  ];
}

function generateSovTrend() {
  const data: { month: string; values: Record<string, number> }[] = [];
  const now = new Date();
  const brands = competitors.value.map(c => c.name);

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const values: Record<string, number> = {};

    // Generate values that roughly sum to 100
    const baseValues = [33 + Math.floor(Math.random() * 6), 24 + Math.floor(Math.random() * 5), 19 + Math.floor(Math.random() * 4), 12 + Math.floor(Math.random() * 3), 5 + Math.floor(Math.random() * 3)];
    brands.forEach((brand, idx) => {
      values[brand] = baseValues[idx] || 5;
    });

    data.push({ month: monthLabel, values });
  }

  sovTrendData.value = data;
}

function generateInfluencers() {
  influencers.value = [
    {
      id: 'inf-1', name: 'Alex Rivera', handle: '@alexrivera_saas', platform: 'twitter',
      followers: 284000, engagementRate: 4.8, relevanceScore: 95, avgLikes: 2400,
      sentiment: 'positive', topics: ['SaaS', 'CRM', 'Sales Tech']
    },
    {
      id: 'inf-2', name: 'Diana Chen', handle: '@dianachen_growth', platform: 'linkedin',
      followers: 156000, engagementRate: 6.2, relevanceScore: 92, avgLikes: 3800,
      sentiment: 'positive', topics: ['Growth', 'Marketing', 'B2B']
    },
    {
      id: 'inf-3', name: 'Marcus Johnson', handle: '@marcusj_tech', platform: 'twitter',
      followers: 198000, engagementRate: 3.5, relevanceScore: 88, avgLikes: 1900,
      sentiment: 'neutral', topics: ['Tech Reviews', 'Enterprise', 'Cloud']
    },
    {
      id: 'inf-4', name: 'Sofia Petrov', handle: '@sofiapetrov_biz', platform: 'instagram',
      followers: 342000, engagementRate: 5.1, relevanceScore: 78, avgLikes: 8200,
      sentiment: 'positive', topics: ['Startup Life', 'Productivity', 'Tools']
    },
    {
      id: 'inf-5', name: 'Ryan Nakamura', handle: '@ryannaka_sales', platform: 'linkedin',
      followers: 89000, engagementRate: 7.3, relevanceScore: 96, avgLikes: 1200,
      sentiment: 'positive', topics: ['Sales Strategy', 'CRM', 'Pipeline']
    },
    {
      id: 'inf-6', name: 'Leila Amari', handle: '@leila_digital', platform: 'twitter',
      followers: 420000, engagementRate: 3.9, relevanceScore: 82, avgLikes: 5600,
      sentiment: 'neutral', topics: ['Digital Marketing', 'Analytics', 'Data']
    },
    {
      id: 'inf-7', name: 'Thomas Mueller', handle: '@tmueller_ent', platform: 'linkedin',
      followers: 67000, engagementRate: 8.1, relevanceScore: 91, avgLikes: 980,
      sentiment: 'positive', topics: ['Enterprise Tech', 'CRM', 'Innovation']
    },
    {
      id: 'inf-8', name: 'Camila Santos', handle: '@camilasantos_mkt', platform: 'instagram',
      followers: 510000, engagementRate: 4.4, relevanceScore: 74, avgLikes: 12000,
      sentiment: 'positive', topics: ['Marketing', 'Brand', 'Content']
    },
    {
      id: 'inf-9', name: 'Jamal Williams', handle: '@jamalw_startups', platform: 'twitter',
      followers: 132000, engagementRate: 5.6, relevanceScore: 87, avgLikes: 2800,
      sentiment: 'neutral', topics: ['Startups', 'SaaS', 'Funding']
    },
    {
      id: 'inf-10', name: 'Nina Kowalski', handle: '@ninak_revenue', platform: 'linkedin',
      followers: 78000, engagementRate: 6.8, relevanceScore: 93, avgLikes: 1500,
      sentiment: 'positive', topics: ['Revenue Ops', 'CRM', 'Sales']
    },
    {
      id: 'inf-11', name: 'Oliver Chang', handle: '@oliverchang_ai', platform: 'twitter',
      followers: 245000, engagementRate: 4.2, relevanceScore: 85, avgLikes: 3200,
      sentiment: 'positive', topics: ['AI', 'Automation', 'SaaS']
    },
    {
      id: 'inf-12', name: 'Fatima Al-Zahra', handle: '@fatimaalzahra_biz', platform: 'facebook',
      followers: 95000, engagementRate: 5.9, relevanceScore: 80, avgLikes: 1800,
      sentiment: 'neutral', topics: ['Business', 'MENA Tech', 'CRM']
    }
  ];
}

// ── Data Loading ──────────────────────────────────────
function loadData() {
  loading.value = true;
  setTimeout(() => {
    generateMentions();
    generateSentimentTrend();
    generateCompetitors();
    generateSovTrend();
    generateInfluencers();
    loading.value = false;
  }, 600);
}

function refreshData() {
  loadData();
}

// ── Lifecycle ─────────────────────────────────────────
onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.social-listening-page {
  animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── KPI Cards ── */
.kpi-card {
  padding: 24px;
  border-radius: 16px;
  background: var(--bg-elevated, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--border-default, rgba(255, 255, 255, 0.08));
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  }
}

.kpi-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ── Glass Card ── */
.glass-card {
  background: var(--bg-elevated, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--border-default, rgba(255, 255, 255, 0.08));
  border-radius: 16px;
}

/* ── Tabs ── */
.social-listening-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 24px;
  }

  :deep(.el-tabs__item) {
    color: var(--text-muted, #94a3b8);
    font-weight: 600;
    font-size: 14px;
  }

  :deep(.el-tabs__item.is-active) {
    color: #3b82f6;
  }

  :deep(.el-tabs__active-bar) {
    background-color: #3b82f6;
  }
}

/* ── Mention Card ── */
.mention-card {
  padding: 20px;
  border-radius: 16px;
  background: var(--bg-elevated, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--border-default, rgba(255, 255, 255, 0.08));
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }
}

.mention-text {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.6;
}

/* ── Author Avatar ── */
.author-avatar {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  color: white;
}

/* ── Influencer Card ── */
.influencer-card {
  padding: 24px;
  border-radius: 16px;
  background: var(--bg-elevated, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--border-default, rgba(255, 255, 255, 0.08));
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  }
}

.influencer-avatar {
  width: 48px;
  height: 48px;
  min-width: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 16px;
  color: white;
}

.stat-box {
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--glass-bg, rgba(255, 255, 255, 0.02));
  border: 1px solid var(--border-default, rgba(255, 255, 255, 0.06));
}

/* ── SOV Bar ── */
.sov-bar {
  width: 80px;
  height: 8px;
  border-radius: 4px;
  background: var(--border-default, rgba(255, 255, 255, 0.08));
  overflow: hidden;
}

.sov-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ── Word Cloud ── */
.word-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
  justify-content: center;
  align-items: center;
  padding: 20px 10px;
  min-height: 160px;
}

.word-tag {
  font-weight: 700;
  cursor: default;
  transition: transform 0.2s ease, opacity 0.2s ease;
  animation: wordFadeIn 0.5s ease-out forwards;
  opacity: 0;

  &:hover {
    transform: scale(1.15);
    opacity: 0.85;
  }
}

@keyframes wordFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── Table Enhancements ── */
:deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: rgba(59, 130, 246, 0.05);
}

:deep(.el-table .el-table__row:hover > td) {
  background: rgba(59, 130, 246, 0.04) !important;
}

:deep(.el-table th.el-table__cell) {
  background: rgba(59, 130, 246, 0.05) !important;
  color: var(--text-secondary);
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .word-cloud {
    gap: 8px 10px;
    padding: 12px 4px;
  }

  .mention-text {
    -webkit-line-clamp: 2;
  }
}
</style>
