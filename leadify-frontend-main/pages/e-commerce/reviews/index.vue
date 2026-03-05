<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") {{ $t('ecommerce.reviews.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('ecommerce.reviews.subtitle') }}

  //- Stats Row
  .grid.grid-cols-2.gap-4.mb-8(class="md_grid-cols-4")
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
          Icon(name="ph:chat-circle-text-bold" size="20" style="color: #7849ff")
        div
          p.text-2xl.font-black(style="color: var(--text-primary);") {{ reviews.length }}
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('ecommerce.reviews.totalReviews') }}
    .p-5.rounded-2xl.border(style="border-color: #f59e0b33; background: var(--bg-elevated);")
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(245, 158, 11, 0.15)")
          Icon(name="ph:clock-bold" size="20" style="color: #f59e0b")
        div
          p.text-2xl.font-black(style="color: #f59e0b;") {{ pendingCount }}
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('ecommerce.reviews.pendingModeration') }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(245, 158, 11, 0.15)")
          Icon(name="ph:star-bold" size="20" style="color: #f59e0b")
        div
          p.text-2xl.font-black(style="color: #f59e0b;")
            | {{ averageRating }}
            span.text-lg.ml-1 {{ renderStars(Math.round(Number(averageRating))) }}
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('ecommerce.reviews.avgRating') }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(34, 197, 94, 0.15)")
          Icon(name="ph:check-circle-bold" size="20" style="color: #22c55e")
        div
          p.text-2xl.font-black(style="color: #22c55e;") {{ approvedCount }}
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('ecommerce.reviews.approvedReviews') }}

  //- Filter Bar
  .flex.flex-wrap.items-center.gap-3.mb-6
    el-input(
      v-model="searchQuery"
      :placeholder="$t('ecommerce.reviews.searchPlaceholder')"
      clearable
      class="!w-64"
      size="default"
    )
      template(#prefix)
        Icon(name="ph:magnifying-glass" size="16")

    //- Status Tabs
    el-radio-group(v-model="filterStatus" size="default")
      el-radio-button(value="") {{ $t('common.all') }}
      el-radio-button(value="PENDING")
        .flex.items-center.gap-1
          | {{ $t('ecommerce.reviews.pending') }}
          el-badge(:value="pendingCount" :hidden="!pendingCount" type="warning" class="ml-1")
      el-radio-button(value="APPROVED") {{ $t('ecommerce.reviews.approved') }}
      el-radio-button(value="REJECTED") {{ $t('ecommerce.reviews.rejected') }}

    el-select(v-model="filterRating" :placeholder="$t('ecommerce.reviews.filterByRating')" clearable size="default")
      el-option(:label="$t('ecommerce.reviews.allRatings')" value="")
      el-option(v-for="star in 5" :key="star" :label="`${6 - star} ${renderStars(6 - star)}`" :value="6 - star")

  //- Reviews List (card-based)
  .space-y-4(v-loading="loading")
    el-card.rounded-2xl(
      v-for="review in filteredReviews"
      :key="review.id"
      shadow="never"
      :style="review.status === 'PENDING' ? 'border: 2px solid #f59e0b40;' : 'border: 1px solid var(--border-default);'"
    )
      //- Review Header
      .flex.flex-wrap.items-center.justify-between.gap-2.mb-3
        .flex.items-center.gap-3
          .w-9.h-9.rounded-full.flex.items-center.justify-center.text-sm.font-bold(
            style="background: linear-gradient(135deg, #7849ff, #a78bfa); color: white;"
          ) {{ getInitials(review.clientName || review.customerName || 'A') }}
          div
            .flex.items-center.gap-2
              span.text-sm.font-bold(style="color: var(--text-primary);") {{ review.clientName || review.customerName || 'Anonymous' }}
              el-tag(v-if="review.isVerifiedPurchase" type="success" size="small" round effect="plain")
                Icon(name="ph:seal-check" size="12" style="margin-right: 2px;")
                | {{ $t('ecommerce.reviews.verified') }}
            div.flex.items-center.gap-2(class="mt-0.5")
              span.text-xs(style="color: var(--text-muted);") {{ review.productName || 'Product' }}
              span.text-xs(style="color: var(--text-muted);") &middot;
              span.text-xs(style="color: var(--text-muted);") {{ review.createdAt ? new Date(review.createdAt).toLocaleDateString() : '--' }}
        .flex.items-center.gap-2
          el-tag(:type="getReviewStatusTag(review.status)" size="small" round effect="dark") {{ review.status }}

      //- Star Rating
      .mb-2
        span.text-lg(style="color: #f59e0b; letter-spacing: 2px;") {{ renderStars(review.rating || 0) }}

      //- Review Content
      h4.text-sm.font-bold.mb-1(v-if="review.title" style="color: var(--text-primary);") {{ review.title }}
      p.text-sm.leading-relaxed.mb-3(style="color: var(--text-muted);") {{ review.comment || review.content || 'No comment provided.' }}

      //- Merchant Response (if exists)
      .p-4.rounded-xl.mb-3(v-if="review.merchantResponse || review.response" style="background: var(--bg-elevated); border: 1px solid var(--border-default);")
        .flex.items-center.gap-2.mb-2
          Icon(name="ph:storefront" size="16" style="color: #7849ff;")
          span.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('ecommerce.reviews.merchantResponse') }}
        p.text-sm(style="color: var(--text-primary);") {{ review.merchantResponse || review.response }}

      //- Action Buttons
      .flex.flex-wrap.items-center.gap-2.pt-3(style="border-top: 1px solid var(--border-default);")
        el-button(
          v-if="review.status !== 'APPROVED'"
          type="success"
          size="small"
          plain
          @click="handleApprove(review.id)"
          :loading="actionLoading === review.id + '-approve'"
          style="border-radius: 10px;"
        )
          Icon(name="ph:check" size="14" style="margin-right: 4px;")
          | {{ $t('ecommerce.reviews.approve') }}
        el-button(
          v-if="review.status !== 'REJECTED'"
          type="danger"
          size="small"
          plain
          @click="handleReject(review.id)"
          :loading="actionLoading === review.id + '-reject'"
          style="border-radius: 10px;"
        )
          Icon(name="ph:x" size="14" style="margin-right: 4px;")
          | {{ $t('ecommerce.reviews.reject') }}
        el-button(
          size="small"
          plain
          @click="openRespondDialog(review)"
          style="border-radius: 10px;"
        )
          Icon(name="ph:chat-text" size="14" style="margin-right: 4px;")
          | {{ $t('ecommerce.reviews.respond') }}
        .flex-1
        el-button(
          size="small"
          text
          type="danger"
          @click="handleDeleteReview(review.id)"
        )
          Icon(name="ph:trash" size="14")

  //- Empty State
  .rounded-2xl.border-2.border-dashed.text-center.p-12(v-if="!loading && filteredReviews.length === 0" style="border-color: var(--border-default); color: var(--text-muted);")
    Icon(name="ph:chat-circle-text" size="48")
    p.text-sm.mt-3 {{ $t('ecommerce.reviews.noReviews') }}

  //- Pagination
  .flex.justify-center.mt-6(v-if="totalPages > 1")
    el-pagination(
      v-model:current-page="currentPage"
      :page-size="pageSize"
      :total="totalItems"
      layout="prev, pager, next"
      background
    )

  //- Respond Dialog
  el-dialog(v-model="showRespondDialog" :title="$t('ecommerce.reviews.respondToReview')" width="560px")
    //- Review Preview
    .p-4.rounded-xl.mb-4(v-if="respondTarget" style="background: var(--bg-elevated); border: 1px solid var(--border-default);")
      .flex.items-center.gap-2.mb-2
        span.text-sm.font-bold(style="color: var(--text-primary);") {{ respondTarget.clientName || respondTarget.customerName || 'Customer' }}
        span.text-lg(style="color: #f59e0b;") {{ renderStars(respondTarget.rating || 0) }}
      h4.text-sm.font-semibold.mb-1(v-if="respondTarget.title" style="color: var(--text-primary);") {{ respondTarget.title }}
      p.text-sm(style="color: var(--text-muted);") {{ respondTarget.comment || respondTarget.content || '--' }}

    el-form(label-position="top" size="large")
      el-form-item(:label="$t('ecommerce.reviews.yourResponse')" required)
        el-input(
          v-model="respondText"
          type="textarea"
          :rows="4"
          :placeholder="$t('ecommerce.reviews.responsePlaceholder')"
        )
    template(#footer)
      el-button(@click="showRespondDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="respondLoading" @click="submitResponse" style="border-radius: 12px;") {{ $t('ecommerce.reviews.submitResponse') }}
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { fetchReviews, approveReview, rejectReview, respondToReview, deleteReview } from '~/composables/useEcommerce';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

const reviews = ref<Record<string, unknown>[]>([]);
const loading = ref(false);
const actionLoading = ref<string | null>(null);
const respondLoading = ref(false);
const searchQuery = ref('');
const filterStatus = ref('');
const filterRating = ref<number | string>('');
const currentPage = ref(1);
const pageSize = ref(20);
const totalItems = ref(0);

const showRespondDialog = ref(false);
const respondTarget = ref<Record<string, unknown> | null>(null);
const respondText = ref('');

// Computed stats
const pendingCount = computed(() => reviews.value.filter(r => r.status === 'PENDING').length);
const approvedCount = computed(() => reviews.value.filter(r => r.status === 'APPROVED').length);
const averageRating = computed(() => {
  if (!reviews.value.length) return '0.0';
  const avg = reviews.value.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.value.length;
  return avg.toFixed(1);
});

const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value));

// Filtered reviews
const filteredReviews = computed(() => {
  let result = [...reviews.value];
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      r => (r.title || '').toLowerCase().includes(q) || (r.comment || '').toLowerCase().includes(q) || (r.content || '').toLowerCase().includes(q)
    );
  }
  if (filterStatus.value) {
    result = result.filter(r => r.status === filterStatus.value);
  }
  if (filterRating.value) {
    result = result.filter(r => r.rating === Number(filterRating.value));
  }
  return result;
});

onMounted(() => {
  loadReviews();
});

watch(currentPage, () => {
  loadReviews();
});

async function loadReviews() {
  loading.value = true;
  try {
    const res = await fetchReviews({ page: String(currentPage.value), limit: String(pageSize.value) });
    reviews.value = (res as unknown)?.body?.docs || res?.docs || [];
    totalItems.value = (res as unknown)?.body?.totalDocs || (res as unknown)?.totalDocs || reviews.value.length;
  } finally {
    loading.value = false;
  }
}

function renderStars(rating: number): string {
  const safeRating = Math.max(0, Math.min(5, Math.round(rating)));
  return '\u2605'.repeat(safeRating) + '\u2606'.repeat(5 - safeRating);
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getReviewStatusTag(status: string): string {
  if (status === 'APPROVED') return 'success';
  if (status === 'PENDING') return 'warning';
  if (status === 'REJECTED') return 'danger';
  return 'info';
}

async function handleApprove(id: string) {
  actionLoading.value = id + '-approve';
  try {
    const res = await approveReview(id);
    if (res?.success !== false) {
      const review = reviews.value.find(r => r.id === id);
      if (review) review.status = 'APPROVED';
      ElMessage.success(t('common.saved'));
    }
  } finally {
    actionLoading.value = null;
  }
}

async function handleReject(id: string) {
  actionLoading.value = id + '-reject';
  try {
    const res = await rejectReview(id);
    if (res?.success !== false) {
      const review = reviews.value.find(r => r.id === id);
      if (review) review.status = 'REJECTED';
      ElMessage.success(t('common.saved'));
    }
  } finally {
    actionLoading.value = null;
  }
}

function openRespondDialog(review: unknown) {
  respondTarget.value = review;
  respondText.value = review.merchantResponse || review.response || '';
  showRespondDialog.value = true;
}

async function submitResponse() {
  if (!respondText.value.trim()) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  respondLoading.value = true;
  try {
    const res = await respondToReview(respondTarget.value.id, respondText.value);
    if (res?.success !== false) {
      const review = reviews.value.find(r => r.id === respondTarget.value.id);
      if (review) {
        review.merchantResponse = respondText.value;
        review.response = respondText.value;
      }
      showRespondDialog.value = false;
      ElMessage.success(t('common.saved'));
    }
  } finally {
    respondLoading.value = false;
  }
}

async function handleDeleteReview(id: string) {
  try {
    await ElMessageBox.confirm(t('common.confirmAction'), t('common.warning'), {
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    });
    const res = await deleteReview(id);
    if (res?.success !== false) {
      reviews.value = reviews.value.filter(r => r.id !== id);
      ElMessage.success(t('common.deleted'));
    }
  } catch {
    // User cancelled
  }
}
</script>
