<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-rose-400">{{ $t('socialCrm.title') }}</h1>
          <p class="text-slate-400 text-sm mt-1">{{ $t('socialCrm.subtitle') }}</p>
        </div>
        <div class="flex gap-2">
          <el-button class="!rounded-xl" @click="showComposeDialog = true">
            <Icon name="ph:pencil-line-bold" class="w-4 h-4 mr-2" />
            {{ $t('socialCrm.compose') }}
          </el-button>
          <el-button type="primary" class="!rounded-xl" @click="showConnectDialog = true">
            <Icon name="ph:plugs-connected-bold" class="w-4 h-4 mr-2" />
            {{ $t('socialCrm.connectAccount') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- Social Accounts -->
    <div v-loading="loading" class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div
        v-for="account in socialAccounts"
        :key="account.platform"
        class="glass-panel p-4 rounded-xl text-center cursor-pointer hover:border-primary-500/30 transition"
        :class="selectedPlatform === account.platform ? 'border border-primary-500/50' : ''"
        @click="selectedPlatform = account.platform"
      >
        <Icon :name="account.icon" class="w-8 h-8 mx-auto mb-2" :class="account.iconColor" />
        <div class="text-sm font-bold text-slate-200">{{ account.followers }}</div>
        <div class="text-[10px] text-slate-500">{{ account.platform }}</div>
        <div class="flex items-center justify-center gap-1 mt-1">
          <div class="w-2 h-2 rounded-full" :class="account.connected ? 'bg-emerald-400' : 'bg-red-400'"></div>
          <span class="text-[10px]" :class="account.connected ? 'text-emerald-400' : 'text-red-400'">
            {{ account.connected ? $t('socialCrm.connected') : $t('socialCrm.disconnected') }}
          </span>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" class="glass-tabs">
      <!-- Social Feed / Mentions -->
      <el-tab-pane :label="$t('socialCrm.mentionsAndFeed')" name="feed">
        <div class="space-y-4">
          <div v-for="mention in mentions" :key="mention.id" class="glass-panel p-5 rounded-xl hover:border-primary-500/30 transition-all">
            <div class="flex items-start gap-3">
              <el-avatar :size="40" :src="(mention as unknown).avatar" class="bg-slate-700 flex-shrink-0">{{ mention.author.charAt(0) }}</el-avatar>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-sm font-medium text-slate-200">{{ mention.author }}</span>
                  <span class="text-xs text-slate-500">@{{ mention.handle }}</span>
                  <Icon :name="getPlatformIcon(mention.platform)" class="w-4 h-4" :class="getPlatformColor(mention.platform)" />
                  <span class="text-xs text-slate-600">{{ mention.timeAgo }}</span>
                </div>
                <p class="text-sm text-slate-300 mb-2">{{ mention.content }}</p>
                <div class="flex items-center gap-4 text-xs text-slate-500">
                  <span class="flex items-center gap-1">
                    <Icon name="ph:heart" class="w-3 h-3" />
                    {{ mention.likes }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Icon name="ph:chat-circle" class="w-3 h-3" />
                    {{ mention.comments }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Icon name="ph:share" class="w-3 h-3" />
                    {{ mention.shares }}
                  </span>
                </div>
                <!-- Sentiment & Actions -->
                <div class="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60">
                  <div class="flex items-center gap-2">
                    <el-tag :type="getSentimentType(mention.sentiment)" effect="dark" size="small" class="!text-[10px]">
                      {{ mention.sentiment }}
                    </el-tag>
                    <el-tag v-if="mention.isLead" type="success" effect="dark" size="small" class="!text-[10px]">Lead Potential</el-tag>
                  </div>
                  <div class="flex gap-1">
                    <el-button text size="small" type="primary" @click="replyToMention(mention)">
                      <Icon name="ph:arrow-bend-up-left" class="w-3 h-3 mr-1" />
                      {{ $t('socialCrm.reply') }}
                    </el-button>
                    <el-button text size="small" @click="convertToLead(mention)">
                      <Icon name="ph:user-plus" class="w-3 h-3 mr-1" />
                      {{ $t('socialCrm.convert') }}
                    </el-button>
                    <el-button text size="small" @click="assignMention(mention)">
                      <Icon name="ph:user-switch" class="w-3 h-3 mr-1" />
                      {{ $t('common.assign') }}
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="mentions.length === 0 && !loading" class="glass-panel p-12 rounded-2xl text-center">
            <Icon name="ph:chat-circle-dots-bold" class="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p class="text-slate-500">{{ $t('socialCrm.noMentions') }}</p>
          </div>
        </div>
      </el-tab-pane>

      <!-- Analytics -->
      <el-tab-pane :label="$t('socialCrm.analytics')" name="analytics">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Engagement Over Time -->
          <div class="glass-panel p-6 rounded-xl">
            <h3 class="text-sm font-medium text-slate-300 mb-4">Engagement Trend</h3>
            <div class="space-y-3">
              <div v-for="day in engagementData" :key="day.date" class="flex items-center gap-3">
                <span class="text-xs text-slate-500 w-12">{{ day.date }}</span>
                <div class="flex-1 flex gap-1 h-6">
                  <div class="h-full rounded-l bg-blue-500/40" :style="{ width: day.likes / 2 + '%' }"></div>
                  <div class="h-full bg-purple-500/40" :style="{ width: day.comments / 2 + '%' }"></div>
                  <div class="h-full rounded-r bg-emerald-500/40" :style="{ width: day.shares / 2 + '%' }"></div>
                </div>
                <span class="text-xs text-slate-400 w-16 text-right">{{ day.likes + day.comments + day.shares }}</span>
              </div>
            </div>
            <div class="flex gap-4 mt-3 text-[10px] text-slate-500">
              <span class="flex items-center gap-1">
                <div class="w-2 h-2 bg-blue-500/40 rounded"></div>
                Likes
              </span>
              <span class="flex items-center gap-1">
                <div class="w-2 h-2 bg-purple-500/40 rounded"></div>
                Comments
              </span>
              <span class="flex items-center gap-1">
                <div class="w-2 h-2 bg-emerald-500/40 rounded"></div>
                Shares
              </span>
            </div>
          </div>

          <!-- Sentiment Analysis -->
          <div class="glass-panel p-6 rounded-xl">
            <h3 class="text-sm font-medium text-slate-300 mb-4">Sentiment Analysis</h3>
            <div class="flex items-center justify-center gap-8 mb-4">
              <div class="text-center">
                <div class="text-3xl font-bold text-emerald-400">{{ sentimentData.positive }}%</div>
                <div class="text-xs text-slate-500 mt-1">Positive</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold text-amber-400">{{ sentimentData.neutral }}%</div>
                <div class="text-xs text-slate-500 mt-1">Neutral</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold text-red-400">{{ sentimentData.negative }}%</div>
                <div class="text-xs text-slate-500 mt-1">Negative</div>
              </div>
            </div>
            <el-progress
              :percentage="100"
              :stroke-width="16"
              :show-text="false"
              class="!rounded-full overflow-hidden"
              :color="[
                { color: '#10B981', percentage: sentimentData.positive },
                { color: '#F59E0B', percentage: sentimentData.positive + sentimentData.neutral },
                { color: '#EF4444', percentage: 100 }
              ]"
            />
          </div>

          <!-- Top Hashtags -->
          <div class="glass-panel p-6 rounded-xl">
            <h3 class="text-sm font-medium text-slate-300 mb-4">Trending Hashtags</h3>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="tag in trendingHashtags"
                :key="tag.name"
                class="px-3 py-1.5 rounded-full border border-slate-700/50 bg-slate-800/30 text-sm cursor-pointer hover:border-primary-500/30 transition"
              >
                <span class="text-slate-300">#{{ tag.name }}</span>
                <span class="text-xs text-slate-500 ml-1">({{ tag.count }})</span>
              </div>
            </div>
          </div>

          <!-- Top Influencers -->
          <div class="glass-panel p-6 rounded-xl">
            <h3 class="text-sm font-medium text-slate-300 mb-4">Key Influencers</h3>
            <div class="space-y-3">
              <div v-for="inf in influencers" :key="inf.handle" class="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30">
                <el-avatar :size="36" class="bg-slate-700">{{ inf.name.charAt(0) }}</el-avatar>
                <div class="flex-1">
                  <div class="text-sm text-slate-200">{{ inf.name }}</div>
                  <div class="text-xs text-slate-500">@{{ inf.handle }} - {{ inf.followers }} followers</div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-medium text-indigo-400">{{ inf.engagementRate }}%</div>
                  <div class="text-[10px] text-slate-500">Engagement</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Scheduled Posts -->
      <el-tab-pane :label="$t('socialCrm.scheduled')" name="scheduled">
        <div v-loading="postsLoading" class="space-y-4">
          <div v-for="post in scheduledPosts" :key="post.id" class="glass-panel p-5 rounded-xl">
            <div class="flex items-start gap-3">
              <div class="flex gap-1 flex-shrink-0">
                <Icon v-for="p in post.platforms" :key="p" :name="getPlatformIcon(p)" class="w-5 h-5" :class="getPlatformColor(p)" />
              </div>
              <div class="flex-1">
                <p class="text-sm text-slate-300 mb-2">{{ post.content }}</p>
                <div class="flex items-center gap-3 text-xs text-slate-500">
                  <span class="flex items-center gap-1">
                    <Icon name="ph:calendar" class="w-3 h-3" />
                    {{ post.scheduledDate }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Icon name="ph:clock" class="w-3 h-3" />
                    {{ post.scheduledTime }}
                  </span>
                  <el-tag :type="post.status === 'SCHEDULED' ? 'info' : 'success'" effect="dark" size="small" class="!text-[10px]">
                    {{ post.status }}
                  </el-tag>
                </div>
              </div>
              <div class="flex gap-1">
                <el-button text size="small" @click="editPost(post)"><Icon name="ph:pencil-simple" class="w-4 h-4" /></el-button>
                <el-button text type="danger" size="small" @click="deletePost(post)"><Icon name="ph:trash" class="w-4 h-4" /></el-button>
              </div>
            </div>
          </div>
          <div v-if="scheduledPosts.length === 0" class="glass-panel p-12 rounded-2xl text-center">
            <Icon name="ph:clock-bold" class="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p class="text-slate-500">{{ $t('socialCrm.noScheduledPosts') }}</p>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- Compose Dialog -->
    <el-dialog v-model="showComposeDialog" :title="$t('socialCrm.composePost')" width="560px">
      <el-form label-position="top">
        <el-form-item :label="$t('socialCrm.content')">
          <el-input
            v-model="newPost.content"
            type="textarea"
            :rows="4"
            :placeholder="$t('socialCrm.whatsOnYourMind')"
            show-word-limit
            :maxlength="280"
          />
        </el-form-item>
        <el-form-item :label="$t('socialCrm.platforms')">
          <el-checkbox-group v-model="newPost.platforms">
            <el-checkbox v-for="acc in socialAccounts.filter(a => a.connected)" :key="acc.platform" :value="acc.platform">
              {{ acc.platform }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item :label="$t('socialCrm.scheduleDate')">
            <el-date-picker v-model="newPost.date" type="date" class="w-full" />
          </el-form-item>
          <el-form-item :label="$t('common.time')">
            <el-time-picker v-model="newPost.time" format="HH:mm" class="w-full" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button
          @click="
            showComposeDialog = false;
            editingPostId = null;
          "
        >
          {{ $t('common.cancel') }}
        </el-button>
        <el-button :loading="postSaving" @click="publishNow">{{ $t('socialCrm.publishNow') }}</el-button>
        <el-button type="primary" :loading="postSaving" @click="schedulePost">{{ $t('socialCrm.schedule') }}</el-button>
      </template>
    </el-dialog>

    <!-- Connect Account Dialog -->
    <el-dialog v-model="showConnectDialog" :title="$t('socialCrm.connectSocialAccount')" width="480px">
      <div class="space-y-3">
        <div
          v-for="platform in availablePlatforms"
          :key="platform.name"
          class="flex items-center justify-between p-4 rounded-xl border border-slate-700/50 bg-slate-800/20 hover:border-primary-500/30 transition cursor-pointer"
          @click="connectPlatform(platform.name)"
        >
          <div class="flex items-center gap-3">
            <Icon :name="platform.icon" class="w-8 h-8" :class="platform.color" />
            <div>
              <div class="text-sm font-medium text-slate-200">{{ platform.name }}</div>
              <div class="text-xs text-slate-500">{{ platform.description }}</div>
            </div>
          </div>
          <el-button type="primary" size="small">{{ $t('socialCrm.connect') }}</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useApiFetch } from '~/composables/useApiFetch';
import logger from '~/utils/logger'

definePageMeta({
  layout: 'default',
  middleware: 'permissions'
});

const { $i18n } = useNuxtApp();
const t = $i18n.t;

// ── State ──────────────────────────────────────────────────────────────────────
const loading = ref(false);
const activeTab = ref('feed');
const selectedPlatform = ref('');
const showComposeDialog = ref(false);
const showConnectDialog = ref(false);

const newPost = ref({ content: '', platforms: [] as string[], date: '', time: '' });

// ── Platform display helpers (static mapping) ──────────────────────────────────
const platformMeta: Record<string, { icon: string; iconColor: string }> = {
  TWITTER: { icon: 'ph:twitter-logo-bold', iconColor: 'text-blue-400' },
  LINKEDIN: { icon: 'ph:linkedin-logo-bold', iconColor: 'text-blue-600' },
  FACEBOOK: { icon: 'ph:facebook-logo-bold', iconColor: 'text-blue-500' },
  INSTAGRAM: { icon: 'ph:instagram-logo-bold', iconColor: 'text-pink-400' },
  TIKTOK: { icon: 'ph:tiktok-logo-bold', iconColor: 'text-slate-200' },
  YOUTUBE: { icon: 'ph:youtube-logo-bold', iconColor: 'text-red-500' }
};

function formatFollowers(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function platformDisplayName(key: string): string {
  const names: Record<string, string> = {
    TWITTER: 'Twitter',
    LINKEDIN: 'LinkedIn',
    FACEBOOK: 'Facebook',
    INSTAGRAM: 'Instagram',
    TIKTOK: 'TikTok',
    YOUTUBE: 'YouTube'
  };
  return names[key] || key;
}

// ── Profiles from API (raw backend records) ────────────────────────────────────
interface SocialProfile {
  id: number;
  clientId: string;
  platform: string;
  handle: string;
  profileUrl: string;
  followers: number;
  engagement: number;
  sentiment: string;
  lastActivity: string;
  notes: string;
  tenantId: string;
}

const profiles = ref<SocialProfile[]>([]);

// ── Derived: socialAccounts (what the template cards iterate) ───────────────────
const socialAccounts = computed(() => {
  if (profiles.value.length === 0) return [];
  // Group by platform, aggregate followers
  const grouped: Record<string, { followers: number; connected: boolean }> = {};
  for (const p of profiles.value) {
    const key = p.platform.toUpperCase();
    if (!grouped[key]) grouped[key] = { followers: 0, connected: true };
    grouped[key].followers += p.followers || 0;
  }
  return Object.entries(grouped).map(([key, val]) => ({
    platform: platformDisplayName(key),
    icon: platformMeta[key]?.icon || 'ph:globe-bold',
    iconColor: platformMeta[key]?.iconColor || 'text-slate-400',
    followers: formatFollowers(val.followers),
    connected: val.connected
  }));
});

// ── Derived: mentions (built from profiles since no separate endpoint) ─────────
const mentions = computed(() => {
  return profiles.value
    .map((p, idx) => ({
      id: p.id,
      author: p.handle || 'Unknown',
      handle: p.handle || '',
      platform: platformDisplayName(p.platform.toUpperCase()),
      content: p.notes || '',
      likes: p.engagement || 0,
      comments: 0,
      shares: 0,
      sentiment: (p.sentiment || 'neutral').toLowerCase(),
      isLead: !!p.clientId,
      timeAgo: p.lastActivity ? getTimeAgo(p.lastActivity) : ''
    }))
    .filter(m => m.content); // only show profiles that have notes as "mentions"
});

// ── Sentiment computed from profiles ───────────────────────────────────────────
const sentimentData = computed(() => {
  const total = profiles.value.length || 1;
  let pos = 0;
  let neu = 0;
  let neg = 0;
  for (const p of profiles.value) {
    const s = (p.sentiment || '').toUpperCase();
    if (s === 'POSITIVE') pos++;
    else if (s === 'NEGATIVE') neg++;
    else neu++;
  }
  return {
    positive: Math.round((pos / total) * 100),
    neutral: Math.round((neu / total) * 100),
    negative: Math.round((neg / total) * 100)
  };
});

// ── Analytics: engagement data derived from profiles ───────────────────────────
const engagementData = computed(() => {
  // Group by lastActivity date and sum engagement values
  const byDate: Record<string, { likes: number; comments: number; shares: number }> = {};
  for (const p of profiles.value) {
    const dateKey = p.lastActivity ? new Date(p.lastActivity).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown';
    if (!byDate[dateKey]) byDate[dateKey] = { likes: 0, comments: 0, shares: 0 };
    byDate[dateKey].likes += p.engagement || 0;
  }
  return Object.entries(byDate).map(([date, vals]) => ({
    date,
    likes: vals.likes,
    comments: vals.comments,
    shares: vals.shares
  }));
});

// ── Hashtags / Influencers: computed from profile data ─────────────────────────
const trendingHashtags = computed(() => {
  const counts: Record<string, number> = {};
  for (const p of profiles.value) {
    if (!p.notes) continue;
    const tags = p.notes.match(/#(\w+)/g);
    if (tags) {
      for (const t of tags) {
        const name = t.replace('#', '');
        counts[name] = (counts[name] || 0) + 1;
      }
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));
});

const influencers = computed(() => {
  return [...profiles.value]
    .sort((a, b) => (b.followers || 0) - (a.followers || 0))
    .slice(0, 5)
    .map(p => ({
      name: p.handle || 'Unknown',
      handle: p.handle || '',
      followers: formatFollowers(p.followers || 0),
      engagementRate: p.followers > 0 ? Number(((p.engagement / p.followers) * 100).toFixed(1)) : 0
    }));
});

// ── Scheduled posts (from API) ──────────────────────────────────────────────
const scheduledPosts = ref<
  {
    id: number;
    content: string;
    platforms: string[];
    scheduledDate: string;
    scheduledTime: string;
    status: string;
  }[]
>([]);
const postsLoading = ref(false);
const postSaving = ref(false);

// ── Available platforms for the connect dialog ─────────────────────────────────
const availablePlatforms = ref([
  {
    name: 'Twitter/X',
    icon: 'ph:twitter-logo-bold',
    color: 'text-blue-400',
    description: 'Connect your Twitter account for mentions and posting',
    apiPlatform: 'TWITTER'
  },
  {
    name: 'LinkedIn',
    icon: 'ph:linkedin-logo-bold',
    color: 'text-blue-600',
    description: 'Monitor LinkedIn company page and personal profiles',
    apiPlatform: 'LINKEDIN'
  },
  {
    name: 'Facebook',
    icon: 'ph:facebook-logo-bold',
    color: 'text-blue-500',
    description: 'Manage Facebook pages and groups',
    apiPlatform: 'FACEBOOK'
  },
  {
    name: 'Instagram',
    icon: 'ph:instagram-logo-bold',
    color: 'text-pink-400',
    description: 'Track mentions and manage Instagram business profile',
    apiPlatform: 'INSTAGRAM'
  }
]);

// ── Helpers ─────────────────────────────────────────────────────────────────────
function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

const getPlatformIcon = (p: string) => {
  const m: Record<string, string> = {
    Twitter: 'ph:twitter-logo-bold',
    LinkedIn: 'ph:linkedin-logo-bold',
    Facebook: 'ph:facebook-logo-bold',
    Instagram: 'ph:instagram-logo-bold',
    TikTok: 'ph:tiktok-logo-bold',
    YouTube: 'ph:youtube-logo-bold'
  };
  return m[p] || 'ph:globe-bold';
};
const getPlatformColor = (p: string) => {
  const m: Record<string, string> = {
    Twitter: 'text-blue-400',
    LinkedIn: 'text-blue-600',
    Facebook: 'text-blue-500',
    Instagram: 'text-pink-400',
    TikTok: 'text-slate-200',
    YouTube: 'text-red-500'
  };
  return m[p] || 'text-slate-400';
};

const getSentimentType = (s: string): 'success' | 'warning' | 'danger' | undefined => {
  const m: Record<string, 'success' | 'warning' | 'danger' | undefined> = { positive: 'success', neutral: 'warning', negative: 'danger' };
  return m[s];
};

// ── API: Fetch profiles ────────────────────────────────────────────────────────
async function fetchProfiles() {
  loading.value = true;
  try {
    const res = await useApiFetch('social-crm');
    if (res?.success) {
      profiles.value = res.body?.docs || res.body || [];
    } else {
      logger.error('Failed to load social profiles:', res?.message);
    }
  } catch (e) {
    logger.error('Error fetching social profiles:', e);
  } finally {
    loading.value = false;
  }
}

// ── API: Connect platform (create profile) ─────────────────────────────────────
const connectPlatform = async (name: string) => {
  const platformEntry = availablePlatforms.value.find(p => p.name === name);
  const apiPlatform = platformEntry?.apiPlatform || name.toUpperCase().replace('/X', '');

  try {
    const res = await useApiFetch('social-crm', 'POST', {
      platform: apiPlatform,
      handle: '',
      profileUrl: '',
      followers: 0,
      engagement: 0,
      sentiment: 'NEUTRAL'
    });

    if (res?.success) {
      ElMessage.success(t('common.saved'));
      showConnectDialog.value = false;
      await fetchProfiles();
    } else {
      ElMessage.error(t('common.error'));
    }
  } catch (e) {
    ElMessage.error(t('common.error'));
  }
};

// ── API: Delete profile ────────────────────────────────────────────────────────
const deleteProfile = async (id: number) => {
  try {
    const res = await useApiFetch(`social-crm/${id}`, 'DELETE');
    if (res?.success) {
      ElMessage.success(t('common.deleted'));
      await fetchProfiles();
    } else {
      ElMessage.error(t('common.error'));
    }
  } catch (e) {
    ElMessage.error(t('common.error'));
  }
};

// ── Actions: Mentions ──────────────────────────────────────────────────────────
const replyToMention = (_m: unknown) => ElMessage.info(t('common.saved'));
const convertToLead = (_m: unknown) => ElMessage.success(t('common.saved'));
const assignMention = (_m: unknown) => ElMessage.info(t('common.saved'));

// ── API: Fetch scheduled posts ──────────────────────────────────────────────
async function fetchPosts() {
  postsLoading.value = true;
  try {
    const res = await useApiFetch('social-crm/posts');
    if (res?.success) {
      const docs = res.body?.docs || res.body || [];
      scheduledPosts.value = docs.map(p => ({
        id: p.id,
        content: p.content || '',
        platforms: p.platforms || [],
        scheduledDate: p.scheduledDate ? new Date(p.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD',
        scheduledTime: p.scheduledTime || 'TBD',
        status: p.status || 'SCHEDULED'
      }));
    }
  } catch (e) {
    logger.error('Error fetching posts:', e);
  } finally {
    postsLoading.value = false;
  }
}

// ── Actions: Scheduled posts (API-backed) ──────────────────────────────────
const editPost = (p: unknown) => {
  newPost.value = {
    content: p.content,
    platforms: [...p.platforms],
    date: '',
    time: ''
  };
  editingPostId.value = p.id;
  showComposeDialog.value = true;
};

const editingPostId = ref<number | null>(null);

const deletePost = async (p: unknown) => {
  try {
    const res = await useApiFetch(`social-crm/posts/${p.id}`, 'DELETE');
    if (res?.success) {
      ElMessage.success(t('common.deleted'));
      await fetchPosts();
    } else {
      ElMessage.error(t('common.error'));
    }
  } catch (e) {
    ElMessage.error(t('common.error'));
  }
};

const publishNow = async () => {
  if (!newPost.value.content) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  postSaving.value = true;
  try {
    const payload = {
      content: newPost.value.content,
      platforms: newPost.value.platforms,
      scheduledDate: newPost.value.date ? new Date(newPost.value.date).toISOString().split('T')[0] : null,
      scheduledTime: newPost.value.time
        ? new Date(newPost.value.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
        : null,
      status: 'PUBLISHED'
    };

    if (editingPostId.value) {
      const res = await useApiFetch(`social-crm/posts/${editingPostId.value}`, 'PUT', payload);
      if (!res?.success) {
        ElMessage.error(t('common.error'));
        return;
      }
    } else {
      const res = await useApiFetch('social-crm/posts', 'POST', payload);
      if (!res?.success) {
        ElMessage.error(t('common.error'));
        return;
      }
    }

    ElMessage.success(t('common.saved'));
    showComposeDialog.value = false;
    editingPostId.value = null;
    newPost.value = { content: '', platforms: [], date: '', time: '' };
    await fetchPosts();
  } catch (e) {
    ElMessage.error(t('common.error'));
  } finally {
    postSaving.value = false;
  }
};

const schedulePost = async () => {
  if (!newPost.value.content) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  postSaving.value = true;
  try {
    const payload = {
      content: newPost.value.content,
      platforms: newPost.value.platforms,
      scheduledDate: newPost.value.date ? new Date(newPost.value.date).toISOString().split('T')[0] : null,
      scheduledTime: newPost.value.time
        ? new Date(newPost.value.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
        : null,
      status: 'SCHEDULED'
    };

    if (editingPostId.value) {
      const res = await useApiFetch(`social-crm/posts/${editingPostId.value}`, 'PUT', payload);
      if (!res?.success) {
        ElMessage.error(t('common.error'));
        return;
      }
    } else {
      const res = await useApiFetch('social-crm/posts', 'POST', payload);
      if (!res?.success) {
        ElMessage.error(t('common.error'));
        return;
      }
    }

    ElMessage.success(t('common.saved'));
    showComposeDialog.value = false;
    editingPostId.value = null;
    newPost.value = { content: '', platforms: [], date: '', time: '' };
    await fetchPosts();
  } catch (e) {
    ElMessage.error(t('common.error'));
  } finally {
    postSaving.value = false;
  }
};

// ── Init ───────────────────────────────────────────────────────────────────────
onMounted(() => {
  fetchProfiles();
  fetchPosts();
});
</script>
