<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-rose-400">Social CRM</h1>
          <p class="text-slate-400 text-sm mt-1">Monitor social media, track brand mentions, and engage with your audience.</p>
        </div>
        <div class="flex gap-2">
          <el-button class="!rounded-xl" @click="showComposeDialog = true">
            <Icon name="ph:pencil-line-bold" class="w-4 h-4 mr-2" />
            Compose
          </el-button>
          <el-button type="primary" class="!rounded-xl" @click="showConnectDialog = true">
            <Icon name="ph:plugs-connected-bold" class="w-4 h-4 mr-2" />
            Connect Account
          </el-button>
        </div>
      </div>
    </div>

    <!-- Social Accounts -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
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
            {{ account.connected ? 'Connected' : 'Disconnected' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" class="glass-tabs">
      <!-- Social Feed / Mentions -->
      <el-tab-pane label="Mentions & Feed" name="feed">
        <div class="space-y-4">
          <div v-for="mention in mentions" :key="mention.id" class="glass-panel p-5 rounded-xl hover:border-primary-500/30 transition-all">
            <div class="flex items-start gap-3">
              <el-avatar :size="40" :src="(mention as any).avatar" class="bg-slate-700 flex-shrink-0">{{ mention.author.charAt(0) }}</el-avatar>
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
                      Reply
                    </el-button>
                    <el-button text size="small" @click="convertToLead(mention)">
                      <Icon name="ph:user-plus" class="w-3 h-3 mr-1" />
                      Convert
                    </el-button>
                    <el-button text size="small" @click="assignMention(mention)">
                      <Icon name="ph:user-switch" class="w-3 h-3 mr-1" />
                      Assign
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Analytics -->
      <el-tab-pane label="Analytics" name="analytics">
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
      <el-tab-pane label="Scheduled" name="scheduled">
        <div class="space-y-4">
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
            <p class="text-slate-500">No scheduled posts</p>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- Compose Dialog -->
    <el-dialog v-model="showComposeDialog" title="Compose Post" width="560px">
      <el-form label-position="top">
        <el-form-item label="Content">
          <el-input v-model="newPost.content" type="textarea" :rows="4" placeholder="What's on your mind?" show-word-limit :maxlength="280" />
        </el-form-item>
        <el-form-item label="Platforms">
          <el-checkbox-group v-model="newPost.platforms">
            <el-checkbox v-for="acc in socialAccounts.filter(a => a.connected)" :key="acc.platform" :value="acc.platform">
              {{ acc.platform }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="Schedule Date">
            <el-date-picker v-model="newPost.date" type="date" class="w-full" />
          </el-form-item>
          <el-form-item label="Time">
            <el-time-picker v-model="newPost.time" format="HH:mm" class="w-full" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showComposeDialog = false">Cancel</el-button>
        <el-button @click="publishNow">Publish Now</el-button>
        <el-button type="primary" @click="schedulePost">Schedule</el-button>
      </template>
    </el-dialog>

    <!-- Connect Account Dialog -->
    <el-dialog v-model="showConnectDialog" title="Connect Social Account" width="480px">
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
          <el-button type="primary" size="small">Connect</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';

definePageMeta({
  layout: 'default',
  middleware: 'permissions'
});

const activeTab = ref('feed');
const selectedPlatform = ref('');
const showComposeDialog = ref(false);
const showConnectDialog = ref(false);

const newPost = ref({ content: '', platforms: ['Twitter'], date: '', time: '' });

const socialAccounts = ref([
  { platform: 'Twitter', icon: 'ph:twitter-logo-bold', iconColor: 'text-blue-400', followers: '12.5K', connected: true },
  { platform: 'LinkedIn', icon: 'ph:linkedin-logo-bold', iconColor: 'text-blue-600', followers: '8.2K', connected: true },
  { platform: 'Facebook', icon: 'ph:facebook-logo-bold', iconColor: 'text-blue-500', followers: '15.3K', connected: true },
  { platform: 'Instagram', icon: 'ph:instagram-logo-bold', iconColor: 'text-pink-400', followers: '6.8K', connected: false },
  { platform: 'YouTube', icon: 'ph:youtube-logo-bold', iconColor: 'text-red-500', followers: '2.1K', connected: false }
]);

const mentions = ref([
  {
    id: 1,
    author: 'Tech Arabia',
    handle: 'techarabia',
    platform: 'Twitter',
    content: 'Just switched to @habortech CRM and the automation features are incredible! Saved us 10 hours/week already. #CRM #SaaS',
    likes: 45,
    comments: 12,
    shares: 8,
    sentiment: 'positive',
    isLead: false,
    timeAgo: '2h ago'
  },
  {
    id: 2,
    author: 'Sarah Tech',
    handle: 'sarahtech_sa',
    platform: 'LinkedIn',
    content:
      'Looking for a CRM solution with strong Arabic language support. Anyone tried High Point Technology? Need recommendations for a 50-person sales team.',
    likes: 23,
    comments: 18,
    shares: 5,
    sentiment: 'neutral',
    isLead: true,
    timeAgo: '4h ago'
  },
  {
    id: 3,
    author: 'Digital Saudi',
    handle: 'digitalsaudi',
    platform: 'Twitter',
    content:
      'The reporting in @habortech needs work. Dashboard loading times are too slow for enterprise-level data volumes. Hope they fix this soon.',
    likes: 15,
    comments: 7,
    shares: 2,
    sentiment: 'negative',
    isLead: false,
    timeAgo: '6h ago'
  },
  {
    id: 4,
    author: 'Gulf Business Hub',
    handle: 'gulfbizhub',
    platform: 'Facebook',
    content: 'Great webinar by the High Point Technology team on CRM best practices for SMBs in the MENA region! Excellent insights on lead scoring.',
    likes: 89,
    comments: 24,
    shares: 31,
    sentiment: 'positive',
    isLead: false,
    timeAgo: '1d ago'
  },
  {
    id: 5,
    author: 'Startup Riyadh',
    handle: 'startupriyadh',
    platform: 'Twitter',
    content: 'Can @habortech integrate with our existing ERP system? Looking for seamless data flow between sales and operations.',
    likes: 8,
    comments: 3,
    shares: 1,
    sentiment: 'neutral',
    isLead: true,
    timeAgo: '1d ago'
  }
]);

const scheduledPosts = ref([
  {
    id: 1,
    content: 'Excited to announce our new AI-powered lead scoring feature! Predict conversion probability with 94% accuracy. #AI #CRM #SalesTech',
    platforms: ['Twitter', 'LinkedIn'],
    scheduledDate: 'Feb 22',
    scheduledTime: '10:00 AM',
    status: 'SCHEDULED'
  },
  {
    id: 2,
    content: 'Join our upcoming webinar: "CRM Best Practices for Growing Businesses" - Register now! Link in bio.',
    platforms: ['LinkedIn', 'Facebook'],
    scheduledDate: 'Feb 24',
    scheduledTime: '2:00 PM',
    status: 'SCHEDULED'
  },
  {
    id: 3,
    content:
      'Customer success story: How TechCorp increased their sales pipeline by 300% using High Point Technology CRM. Full case study coming soon!',
    platforms: ['Twitter', 'LinkedIn', 'Facebook'],
    scheduledDate: 'Feb 26',
    scheduledTime: '9:00 AM',
    status: 'SCHEDULED'
  }
]);

const engagementData = ref([
  { date: 'Feb 14', likes: 120, comments: 45, shares: 23 },
  { date: 'Feb 15', likes: 145, comments: 52, shares: 30 },
  { date: 'Feb 16', likes: 98, comments: 38, shares: 18 },
  { date: 'Feb 17', likes: 167, comments: 61, shares: 42 },
  { date: 'Feb 18', likes: 134, comments: 48, shares: 25 },
  { date: 'Feb 19', likes: 189, comments: 72, shares: 38 },
  { date: 'Feb 20', likes: 156, comments: 55, shares: 32 }
]);

const sentimentData = ref({ positive: 62, neutral: 25, negative: 13 });

const trendingHashtags = ref([
  { name: 'CRM', count: 234 },
  { name: 'SaaS', count: 189 },
  { name: 'SalesTech', count: 156 },
  { name: 'HPTech', count: 145 },
  { name: 'AI', count: 123 },
  { name: 'MENA', count: 98 },
  { name: 'DigitalTransformation', count: 87 },
  { name: 'B2B', count: 76 }
]);

const influencers = ref([
  { name: 'Tech Arabia', handle: 'techarabia', followers: '45.2K', engagementRate: 4.8 },
  { name: 'Gulf Business Hub', handle: 'gulfbizhub', followers: '32.1K', engagementRate: 3.9 },
  { name: 'Saudi Startups', handle: 'saudistartups', followers: '28.7K', engagementRate: 5.2 },
  { name: 'Digital Saudi', handle: 'digitalsaudi', followers: '21.4K', engagementRate: 3.1 }
]);

const availablePlatforms = ref([
  { name: 'Twitter/X', icon: 'ph:twitter-logo-bold', color: 'text-blue-400', description: 'Connect your Twitter account for mentions and posting' },
  { name: 'LinkedIn', icon: 'ph:linkedin-logo-bold', color: 'text-blue-600', description: 'Monitor LinkedIn company page and personal profiles' },
  { name: 'Facebook', icon: 'ph:facebook-logo-bold', color: 'text-blue-500', description: 'Manage Facebook pages and groups' },
  { name: 'Instagram', icon: 'ph:instagram-logo-bold', color: 'text-pink-400', description: 'Track mentions and manage Instagram business profile' }
]);

const getPlatformIcon = (p: string) => {
  const m: Record<string, string> = {
    Twitter: 'ph:twitter-logo-bold',
    LinkedIn: 'ph:linkedin-logo-bold',
    Facebook: 'ph:facebook-logo-bold',
    Instagram: 'ph:instagram-logo-bold'
  };
  return m[p] || 'ph:globe-bold';
};
const getPlatformColor = (p: string) => {
  const m: Record<string, string> = { Twitter: 'text-blue-400', LinkedIn: 'text-blue-600', Facebook: 'text-blue-500', Instagram: 'text-pink-400' };
  return m[p] || 'text-slate-400';
};

const getSentimentType = (s: string): 'success' | 'warning' | 'danger' | undefined => {
  const m: Record<string, 'success' | 'warning' | 'danger' | undefined> = { positive: 'success', neutral: 'warning', negative: 'danger' };
  return m[s];
};

const replyToMention = (m: any) => ElMessage.info(`Replying to @${m.handle}`);
const convertToLead = (m: any) => ElMessage.success(`Converting @${m.handle} to lead`);
const assignMention = (m: any) => ElMessage.info(`Assigning mention from @${m.handle}`);
const editPost = (p: any) => ElMessage.info('Editing post');
const deletePost = (p: any) => {
  scheduledPosts.value = scheduledPosts.value.filter(sp => sp.id !== p.id);
  ElMessage.success('Post deleted');
};
const connectPlatform = (name: string) => {
  ElMessage.info(`Connecting ${name}...`);
  showConnectDialog.value = false;
};

const publishNow = () => {
  if (!newPost.value.content) {
    ElMessage.warning('Content required');
    return;
  }
  ElMessage.success('Post published!');
  showComposeDialog.value = false;
};

const schedulePost = () => {
  if (!newPost.value.content) {
    ElMessage.warning('Content required');
    return;
  }
  ElMessage.success('Post scheduled!');
  showComposeDialog.value = false;
};
</script>
