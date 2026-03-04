<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-yellow-400">{{ $t('loyalty.title') }}</h1>
          <p class="text-slate-400 text-sm mt-1">{{ $t('loyalty.subtitle') }}</p>
        </div>
        <div class="flex gap-2">
          <el-button class="!rounded-xl" @click="showAddRewardDialog = true">
            <Icon name="ph:gift-bold" class="w-4 h-4 mr-2" />
            {{ $t('loyalty.addReward') }}
          </el-button>
          <el-button type="primary" class="!rounded-xl" @click="showAddMemberDialog = true">
            <Icon name="ph:user-plus-bold" class="w-4 h-4 mr-2" />
            {{ $t('loyalty.addMember') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-slate-200">{{ members.length }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('loyalty.totalMembers') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-amber-400">{{ totalActivePoints.toLocaleString() }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('loyalty.activePoints') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold text-emerald-400">{{ redeemedThisMonth.toLocaleString() }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('loyalty.redeemedThisMonth') }}</div>
      </div>
      <div class="glass-panel p-4 rounded-xl text-center">
        <div class="flex justify-center gap-2">
          <span v-for="tier in tierDistribution" :key="tier.name" class="text-center">
            <div class="text-sm font-bold" :class="tier.color">{{ tier.count }}</div>
            <div class="text-[10px] text-slate-500">{{ tier.name }}</div>
          </span>
        </div>
        <div class="text-xs text-slate-500 mt-1">{{ $t('loyalty.tierDistribution') }}</div>
      </div>
    </div>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" class="glass-tabs">
      <!-- Members -->
      <el-tab-pane :label="$t('loyalty.members')" name="members">
        <div class="glass-panel p-6 rounded-xl">
          <div class="flex justify-between items-center mb-4">
            <el-input v-model="memberSearch" :placeholder="$t('loyalty.searchMembers')" clearable class="!w-56" size="small">
              <template #prefix>
                <Icon name="ph:magnifying-glass" class="w-4 h-4" />
              </template>
            </el-input>
            <el-select v-model="filterTier" :placeholder="$t('loyalty.allTiers')" clearable size="small" class="!w-36">
              <el-option :label="$t('loyalty.allTiers')" value="" />
              <el-option :label="$t('loyalty.platinum')" value="Platinum" />
              <el-option :label="$t('loyalty.gold')" value="Gold" />
              <el-option :label="$t('loyalty.silver')" value="Silver" />
              <el-option :label="$t('loyalty.bronze')" value="Bronze" />
            </el-select>
          </div>
          <el-table :data="filteredMembers" class="glass-table" stripe>
            <el-table-column :label="$t('loyalty.member')" min-width="200">
              <template #default="{ row }">
                <div class="flex items-center gap-3">
                  <el-avatar :size="32" class="bg-slate-700">{{ row.name.charAt(0) }}</el-avatar>
                  <div>
                    <div class="text-sm font-medium text-slate-200">{{ row.name }}</div>
                    <div class="text-xs text-slate-500">{{ row.email }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="$t('loyalty.tier')" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="getTierType(row.tier)" effect="dark" size="small" :class="getTierClass(row.tier)">
                  {{ row.tier }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="$t('loyalty.pointsBalance')" width="140" align="right">
              <template #default="{ row }">
                <span class="text-sm font-bold text-amber-400">{{ row.pointsBalance.toLocaleString() }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('loyalty.lifetimePoints')" width="140" align="right">
              <template #default="{ row }">
                <span class="text-sm text-slate-300">{{ row.lifetimePoints.toLocaleString() }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('loyalty.joinDate')" width="120">
              <template #default="{ row }">
                <span class="text-sm text-slate-500">{{ row.joinDate }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('common.actions')" width="100" align="center">
              <template #default="{ row }">
                <el-button text type="primary" size="small" @click="viewMember(row)">
                  <Icon name="ph:eye-bold" class="w-4 h-4" />
                </el-button>
                <el-button text size="small" @click="adjustPoints(row)">
                  <Icon name="ph:plus-minus-bold" class="w-4 h-4" />
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- Rewards Catalog -->
      <el-tab-pane :label="$t('loyalty.rewardsCatalog')" name="rewards">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="reward in rewards" :key="reward.id" class="glass-panel p-5 rounded-xl hover:border-primary-500/30 transition-all">
            <div class="flex justify-between items-start mb-3">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500/10">
                <Icon :name="reward.icon" class="w-6 h-6 text-amber-400" />
              </div>
              <el-tag :type="reward.stock > 0 ? 'success' : 'danger'" effect="dark" size="small">
                {{ reward.stock > 0 ? `${reward.stock} ${$t('loyalty.left')}` : $t('loyalty.outOfStock') }}
              </el-tag>
            </div>
            <h4 class="text-sm font-medium text-slate-200 mt-3">{{ reward.name }}</h4>
            <p class="text-xs text-slate-500 mt-1">{{ reward.description }}</p>
            <div class="flex justify-between items-center mt-4 pt-3 border-t border-slate-800/60">
              <div>
                <span class="text-lg font-bold text-amber-400">{{ reward.pointsCost.toLocaleString() }}</span>
                <span class="text-xs text-slate-500 ml-1">{{ $t('loyalty.points') }}</span>
              </div>
              <el-tag effect="plain" size="small">{{ reward.category }}</el-tag>
            </div>
            <div class="flex gap-2 mt-3">
              <el-button size="small" text type="primary" @click="editReward(reward)">
                <Icon name="ph:pencil-simple" class="w-4 h-4 mr-1" />
                {{ $t('common.edit') }}
              </el-button>
              <el-button size="small" text type="danger" @click="removeReward(reward)">
                <Icon name="ph:trash" class="w-4 h-4 mr-1" />
                {{ $t('common.delete') }}
              </el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Tiers -->
      <el-tab-pane :label="$t('loyalty.tiers')" name="tiers">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="tier in tiers" :key="tier.name" class="glass-panel p-5 rounded-xl border" :class="tier.borderClass">
            <div class="text-center mb-4">
              <div class="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-2" :class="tier.bgClass">
                <Icon name="ph:crown-bold" class="w-7 h-7" :class="tier.iconColor" />
              </div>
              <h4 class="text-lg font-bold" :class="tier.textColor">{{ tier.name }}</h4>
              <p class="text-xs text-slate-500 mt-0.5">{{ tier.minPoints.toLocaleString() }}+ points</p>
            </div>
            <div class="space-y-2">
              <h5 class="text-xs font-medium text-slate-400">{{ $t('loyalty.benefits') }}</h5>
              <div v-for="benefit in tier.benefits" :key="benefit" class="flex items-start gap-2">
                <Icon name="ph:check-bold" class="w-3 h-3 mt-0.5 flex-shrink-0" :class="tier.iconColor" />
                <span class="text-xs text-slate-300">{{ benefit }}</span>
              </div>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-800/60 text-center">
              <span class="text-sm font-bold text-slate-300">{{ tier.memberCount }} {{ $t('loyalty.membersCount') }}</span>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- Activity -->
      <el-tab-pane :label="$t('loyalty.activity')" name="activity">
        <div class="glass-panel p-6 rounded-xl">
          <div class="space-y-4">
            <div
              v-for="activity in recentActivity"
              :key="activity.id"
              class="flex items-start gap-4 p-3 rounded-xl bg-slate-800/20 hover:bg-slate-800/40 transition"
            >
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                :class="activity.type === 'earn' ? 'bg-emerald-500/10' : 'bg-amber-500/10'"
              >
                <Icon
                  :name="activity.type === 'earn' ? 'ph:arrow-up-bold' : 'ph:gift-bold'"
                  class="w-5 h-5"
                  :class="activity.type === 'earn' ? 'text-emerald-400' : 'text-amber-400'"
                />
              </div>
              <div class="flex-1">
                <div class="flex justify-between items-start">
                  <div>
                    <span class="text-sm font-medium text-slate-200">{{ activity.memberName }}</span>
                    <span class="text-sm text-slate-400 ml-1">{{ activity.description }}</span>
                  </div>
                  <span class="text-sm font-bold" :class="activity.type === 'earn' ? 'text-emerald-400' : 'text-amber-400'">
                    {{ activity.type === 'earn' ? '+' : '-' }}{{ activity.points.toLocaleString() }} pts
                  </span>
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs text-slate-500">{{ activity.date }}</span>
                  <el-tag
                    :type="getTierType(activity.tier)"
                    effect="dark"
                    size="small"
                    class="!text-[10px] !px-1.5 !py-0"
                    :class="getTierClass(activity.tier)"
                  >
                    {{ activity.tier }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- Add Member Dialog -->
    <el-dialog v-model="showAddMemberDialog" :title="$t('loyalty.addLoyaltyMember')" width="480px">
      <el-form label-position="top">
        <el-form-item :label="$t('loyalty.fullName')">
          <el-input v-model="newMember.name" :placeholder="$t('loyalty.enterMemberName')" />
        </el-form-item>
        <el-form-item :label="$t('common.email')">
          <el-input v-model="newMember.email" :placeholder="$t('loyalty.enterEmail')" />
        </el-form-item>
        <el-form-item :label="$t('loyalty.initialPoints')">
          <el-input-number v-model="newMember.points" :min="0" :step="100" class="!w-full" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddMemberDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="addMember">{{ $t('loyalty.addMember') }}</el-button>
      </template>
    </el-dialog>

    <!-- Add Reward Dialog -->
    <el-dialog v-model="showAddRewardDialog" :title="$t('loyalty.addReward')" width="500px">
      <el-form label-position="top">
        <el-form-item :label="$t('loyalty.rewardName')">
          <el-input v-model="newReward.name" placeholder="e.g., Free Month Subscription" />
        </el-form-item>
        <el-form-item :label="$t('common.description')">
          <el-input v-model="newReward.description" type="textarea" :rows="2" :placeholder="$t('loyalty.describeReward')" />
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item :label="$t('loyalty.pointsCost')">
            <el-input-number v-model="newReward.pointsCost" :min="0" :step="100" class="!w-full" />
          </el-form-item>
          <el-form-item :label="$t('loyalty.stock')">
            <el-input-number v-model="newReward.stock" :min="0" class="!w-full" />
          </el-form-item>
        </div>
        <el-form-item :label="$t('common.category')">
          <el-select v-model="newReward.category" :placeholder="$t('loyalty.selectCategory')" class="w-full">
            <el-option :label="$t('loyalty.discountCat')" value="Discount" />
            <el-option :label="$t('loyalty.productCat')" value="Product" />
            <el-option :label="$t('loyalty.serviceCat')" value="Service" />
            <el-option :label="$t('loyalty.experienceCat')" value="Experience" />
            <el-option :label="$t('loyalty.giftCard')" value="Gift Card" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddRewardDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="addReward">{{ $t('loyalty.addReward') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';

definePageMeta({ layout: 'default', middleware: 'permissions' });

const { t } = useI18n();

const activeTab = ref('members');
const memberSearch = ref('');
const filterTier = ref('');
const showAddMemberDialog = ref(false);
const showAddRewardDialog = ref(false);

const newMember = ref({ name: '', email: '', points: 0 });
const newReward = ref({ name: '', description: '', pointsCost: 0, stock: 0, category: 'Discount' });

const members = ref([
  { id: 1, name: 'Ahmed Al-Farsi', email: 'ahmed@techcorp.sa', tier: 'Platinum', pointsBalance: 45200, lifetimePoints: 128500, joinDate: 'Jan 2023' },
  { id: 2, name: 'Sara Mohammed', email: 'sara@gulfbiz.com', tier: 'Gold', pointsBalance: 22800, lifetimePoints: 67400, joinDate: 'Mar 2023' },
  { id: 3, name: 'Omar Hassan', email: 'omar@startup.sa', tier: 'Gold', pointsBalance: 18600, lifetimePoints: 52100, joinDate: 'Jun 2023' },
  { id: 4, name: 'Fatima Ali', email: 'fatima@retailco.sa', tier: 'Silver', pointsBalance: 9400, lifetimePoints: 31200, joinDate: 'Aug 2023' },
  { id: 5, name: 'Khalid Ibrahim', email: 'khalid@finserv.sa', tier: 'Silver', pointsBalance: 7200, lifetimePoints: 24800, joinDate: 'Oct 2023' },
  { id: 6, name: 'Noura Salem', email: 'noura@media.sa', tier: 'Bronze', pointsBalance: 3100, lifetimePoints: 8900, joinDate: 'Feb 2024' },
  { id: 7, name: 'Hassan Al-Qahtani', email: 'hassan@logistics.sa', tier: 'Bronze', pointsBalance: 1800, lifetimePoints: 5200, joinDate: 'May 2024' },
  { id: 8, name: 'Amal Rashid', email: 'amal@design.sa', tier: 'Platinum', pointsBalance: 52300, lifetimePoints: 145000, joinDate: 'Dec 2022' },
  { id: 9, name: 'Youssef Mansour', email: 'youssef@pharma.sa', tier: 'Gold', pointsBalance: 16200, lifetimePoints: 48700, joinDate: 'Apr 2023' },
  { id: 10, name: 'Layla Bashar', email: 'layla@education.sa', tier: 'Bronze', pointsBalance: 2400, lifetimePoints: 6100, joinDate: 'Sep 2024' }
]);

const rewards = ref([
  {
    id: 1,
    name: 'Free Month Subscription',
    description: 'Get one month of premium access for free',
    pointsCost: 5000,
    stock: 50,
    category: 'Service',
    icon: 'ph:calendar-star-bold'
  },
  {
    id: 2,
    name: '20% Discount Coupon',
    description: 'Apply 20% discount on next purchase',
    pointsCost: 2000,
    stock: 100,
    category: 'Discount',
    icon: 'ph:percent-bold'
  },
  {
    id: 3,
    name: 'Premium Support Upgrade',
    description: '3 months of dedicated priority support',
    pointsCost: 8000,
    stock: 20,
    category: 'Service',
    icon: 'ph:headset-bold'
  },
  {
    id: 4,
    name: 'Branded Merchandise Pack',
    description: 'Exclusive company merchandise bundle',
    pointsCost: 3500,
    stock: 30,
    category: 'Product',
    icon: 'ph:t-shirt-bold'
  },
  {
    id: 5,
    name: 'Conference VIP Pass',
    description: 'VIP access to annual industry conference',
    pointsCost: 15000,
    stock: 10,
    category: 'Experience',
    icon: 'ph:ticket-bold'
  },
  {
    id: 6,
    name: 'Gift Card 500 SAR',
    description: 'Digital gift card worth 500 SAR',
    pointsCost: 10000,
    stock: 0,
    category: 'Gift Card',
    icon: 'ph:credit-card-bold'
  }
]);

const tiers = ref([
  {
    name: 'Bronze',
    minPoints: 0,
    memberCount: 3,
    benefits: ['Basic rewards access', 'Monthly newsletter', 'Birthday bonus (100 pts)', 'Standard support'],
    borderClass: 'border-amber-700/30',
    bgClass: 'bg-amber-700/20',
    iconColor: 'text-amber-700',
    textColor: 'text-amber-600'
  },
  {
    name: 'Silver',
    minPoints: 5000,
    memberCount: 2,
    benefits: ['All Bronze benefits', '10% bonus on earned points', 'Quarterly bonus (500 pts)', 'Priority support', 'Early access to new rewards'],
    borderClass: 'border-slate-400/30',
    bgClass: 'bg-slate-400/20',
    iconColor: 'text-slate-300',
    textColor: 'text-slate-300'
  },
  {
    name: 'Gold',
    minPoints: 15000,
    memberCount: 3,
    benefits: [
      'All Silver benefits',
      '25% bonus on earned points',
      'Free shipping on merchandise',
      'Exclusive events access',
      'Dedicated account manager'
    ],
    borderClass: 'border-amber-400/30',
    bgClass: 'bg-amber-400/20',
    iconColor: 'text-amber-400',
    textColor: 'text-amber-400'
  },
  {
    name: 'Platinum',
    minPoints: 40000,
    memberCount: 2,
    benefits: [
      'All Gold benefits',
      '50% bonus on earned points',
      'Annual VIP experience',
      'Custom rewards requests',
      'Executive support line',
      'Referral double points'
    ],
    borderClass: 'border-indigo-400/30',
    bgClass: 'bg-indigo-400/20',
    iconColor: 'text-indigo-400',
    textColor: 'text-indigo-400'
  }
]);

const recentActivity = ref([
  {
    id: 1,
    memberName: 'Ahmed Al-Farsi',
    description: 'earned points from deal closure',
    type: 'earn',
    points: 2500,
    date: 'Feb 20, 2026',
    tier: 'Platinum'
  },
  {
    id: 2,
    memberName: 'Sara Mohammed',
    description: 'redeemed 20% Discount Coupon',
    type: 'redeem',
    points: 2000,
    date: 'Feb 20, 2026',
    tier: 'Gold'
  },
  {
    id: 3,
    memberName: 'Amal Rashid',
    description: 'earned points from referral',
    type: 'earn',
    points: 5000,
    date: 'Feb 19, 2026',
    tier: 'Platinum'
  },
  {
    id: 4,
    memberName: 'Omar Hassan',
    description: 'redeemed Premium Support Upgrade',
    type: 'redeem',
    points: 8000,
    date: 'Feb 19, 2026',
    tier: 'Gold'
  },
  {
    id: 5,
    memberName: 'Fatima Ali',
    description: 'earned points from subscription renewal',
    type: 'earn',
    points: 1200,
    date: 'Feb 18, 2026',
    tier: 'Silver'
  },
  { id: 6, memberName: 'Noura Salem', description: 'earned birthday bonus', type: 'earn', points: 100, date: 'Feb 18, 2026', tier: 'Bronze' },
  {
    id: 7,
    memberName: 'Khalid Ibrahim',
    description: 'redeemed Branded Merchandise Pack',
    type: 'redeem',
    points: 3500,
    date: 'Feb 17, 2026',
    tier: 'Silver'
  },
  {
    id: 8,
    memberName: 'Youssef Mansour',
    description: 'earned points from training completion',
    type: 'earn',
    points: 800,
    date: 'Feb 17, 2026',
    tier: 'Gold'
  },
  {
    id: 9,
    memberName: 'Hassan Al-Qahtani',
    description: 'earned points from survey completion',
    type: 'earn',
    points: 200,
    date: 'Feb 16, 2026',
    tier: 'Bronze'
  },
  { id: 10, memberName: 'Layla Bashar', description: 'earned sign-up bonus', type: 'earn', points: 500, date: 'Feb 16, 2026', tier: 'Bronze' }
]);

const filteredMembers = computed(() => {
  let result = members.value;
  if (memberSearch.value) {
    const s = memberSearch.value.toLowerCase();
    result = result.filter(m => m.name.toLowerCase().includes(s) || m.email.toLowerCase().includes(s));
  }
  if (filterTier.value) {
    result = result.filter(m => m.tier === filterTier.value);
  }
  return result;
});

const totalActivePoints = computed(() => members.value.reduce((s, m) => s + m.pointsBalance, 0));

const redeemedThisMonth = computed(() => recentActivity.value.filter(a => a.type === 'redeem').reduce((s, a) => s + a.points, 0));

const tierDistribution = computed(() => [
  { name: 'Platinum', count: members.value.filter(m => m.tier === 'Platinum').length, color: 'text-indigo-400' },
  { name: 'Gold', count: members.value.filter(m => m.tier === 'Gold').length, color: 'text-amber-400' },
  { name: 'Silver', count: members.value.filter(m => m.tier === 'Silver').length, color: 'text-slate-300' },
  { name: 'Bronze', count: members.value.filter(m => m.tier === 'Bronze').length, color: 'text-amber-600' }
]);

const getTierType = (tier: string): 'warning' | 'info' | 'success' | 'danger' | undefined => {
  const map: Record<string, 'warning' | 'info' | 'success' | 'danger' | undefined> = {
    Platinum: 'info',
    Gold: 'warning',
    Silver: undefined,
    Bronze: 'danger'
  };
  return map[tier];
};

const getTierClass = (tier: string): string => {
  const map: Record<string, string> = {
    Platinum: '!bg-indigo-500/20 !border-indigo-500/40 !text-indigo-300',
    Gold: '!bg-amber-500/20 !border-amber-500/40 !text-amber-300',
    Silver: '!bg-slate-400/20 !border-slate-400/40 !text-slate-300',
    Bronze: '!bg-amber-700/20 !border-amber-700/40 !text-amber-600'
  };
  return map[tier] || '';
};

const formatCurrency = (val: number) => {
  if (!val) return '0 SAR';
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M SAR`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K SAR`;
  return `${val} SAR`;
};

const viewMember = (member: any) => {
  ElMessage.info(`Viewing ${member.name}'s loyalty profile`);
};

const adjustPoints = (member: any) => {
  ElMessage.info(`Adjusting points for ${member.name}`);
};

const editReward = (reward: any) => {
  ElMessage.info(`Editing reward: ${reward.name}`);
};

const removeReward = (reward: any) => {
  rewards.value = rewards.value.filter(r => r.id !== reward.id);
  ElMessage.success(`Removed reward: ${reward.name}`);
};

const addMember = () => {
  if (!newMember.value.name || !newMember.value.email) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  members.value.push({
    id: Date.now(),
    name: newMember.value.name,
    email: newMember.value.email,
    tier: 'Bronze',
    pointsBalance: newMember.value.points,
    lifetimePoints: newMember.value.points,
    joinDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  });
  ElMessage.success(`${newMember.value.name} added to loyalty program`);
  showAddMemberDialog.value = false;
  newMember.value = { name: '', email: '', points: 0 };
};

const addReward = () => {
  if (!newReward.value.name) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  rewards.value.push({
    id: Date.now(),
    name: newReward.value.name,
    description: newReward.value.description,
    pointsCost: newReward.value.pointsCost,
    stock: newReward.value.stock,
    category: newReward.value.category,
    icon: 'ph:gift-bold'
  });
  ElMessage.success(`Reward "${newReward.value.name}" added to catalog`);
  showAddRewardDialog.value = false;
  newReward.value = { name: '', description: '', pointsCost: 0, stock: 0, category: 'Discount' };
};
</script>
