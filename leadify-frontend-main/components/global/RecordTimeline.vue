<template lang="pug">
div
  ActivityTimeline(:activities="activities")
  .flex.justify-center.items-center.w-full.mt-4(v-if="hasMore")
    el-button(:loading="loading" class="!rounded-2xl" type="primary" size="large" @click="loadMore") {{ $t('common.view') }} More
</template>

<script setup lang="ts">
const props = defineProps<{
  entityType: string;
  entityId: string | number;
}>();

const loading = ref(false);
const activities = ref<any[]>([]);
const page = ref(1);
const totalPages = ref(1);

const hasMore = computed(() => activities.value.length > 0 && page.value < totalPages.value);

async function fetchActivities(pageNum: number) {
  loading.value = true;
  try {
    const { body, success } = (await useApiFetch(`activity/${props.entityType}/${props.entityId}?limit=10&page=${pageNum}`)) as any;
    if (success && body) {
      if (pageNum === 1) {
        activities.value = body.docs || [];
      } else {
        activities.value = [...activities.value, ...(body.docs || [])];
      }
      totalPages.value = body.pagination?.totalPages || 1;
    }
  } finally {
    loading.value = false;
  }
}

async function loadMore() {
  page.value++;
  await fetchActivities(page.value);
}

onMounted(() => fetchActivities(1));

watch(
  () => [props.entityType, props.entityId],
  () => {
    page.value = 1;
    fetchActivities(1);
  }
);
</script>
