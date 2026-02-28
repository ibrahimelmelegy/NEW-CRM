<template lang="pug">
div(class="space-y-6 pb-8")
  //- Header
  .flex.items-center.justify-between.flex-wrap.gap-4
    div
      h1(class="text-2xl font-bold" style="color: var(--text-primary)") {{ $t('journey.title') }}
      p(class="text-sm mt-1" style="color: var(--text-muted)") {{ $t('journey.subtitle') }}
    .flex.items-center.gap-3
      //- Back to lead button
      el-button(size="small" @click="goBack")
        Icon(name="ph:arrow-left-bold" size="16" class="mr-1")
        | {{ $t('common.back') }}
      //- Zoom controls
      el-button-group
        el-button(
          :type="zoomLevel === 'year' ? 'primary' : ''"
          size="small"
          @click="setZoom('year')"
        ) {{ $t('journey.year') }}
        el-button(
          :type="zoomLevel === 'month' ? 'primary' : ''"
          size="small"
          @click="setZoom('month')"
        ) {{ $t('journey.month') }}
        el-button(
          :type="zoomLevel === 'week' ? 'primary' : ''"
          size="small"
          @click="setZoom('week')"
        ) {{ $t('journey.week') }}

  //- Loading state
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  //- Error state
  .flex.flex-col.items-center.justify-center.py-20(v-else-if="error")
    Icon(name="ph:warning-circle-bold" size="48" style="color: var(--text-muted)")
    p(class="text-sm mt-3" style="color: var(--text-muted)") {{ error }}
    el-button(type="primary" size="small" class="mt-4" @click="fetchJourney(slug)") {{ $t('common.retry') }}

  //- Journey content
  template(v-else-if="journey")
    //- Summary Stats
    CustomerJourneyJourneySummary(:summary="journey.summary")

    //- Timeline
    .glass-card.p-6.rounded-2xl(style="border: 1px solid var(--glass-border); background: var(--glass-bg); backdrop-filter: blur(var(--glass-blur, 12px))")
      .flex.items-center.gap-2.mb-4
        Icon(name="ph:path-bold" size="22" style="color: var(--brand-primary)")
        h2(class="text-lg font-semibold" style="color: var(--text-primary)") {{ $t('journey.title') }}
      CustomerJourneyJourneyTimeline(
        :events="journey.events"
        :type-colors="typeColors"
        :type-icons="typeIcons"
        :zoom-level="zoomLevel"
      )

  //- Empty state
  .flex.flex-col.items-center.justify-center.py-20(v-else)
    Icon(name="ph:map-trifold-bold" size="48" style="color: var(--text-muted)")
    p(class="text-sm mt-3" style="color: var(--text-muted)") No journey data available
</template>

<script lang="ts" setup>
definePageMeta({
  layout: 'default',
  middleware: 'permissions'
});

const route = useRoute();
const router = useRouter();

// Get the slug from route params
const rawSlug = route.params.slug;
const slug = (Array.isArray(rawSlug) ? rawSlug[0] : rawSlug || '') as string;

const { journey, loading, error, zoomLevel, fetchJourney, setZoom, typeColors, typeIcons } = useCustomerJourney();

// Fetch journey data on mount
await fetchJourney(slug);

function goBack() {
  router.push(`/sales/leads/${slug}`);
}
</script>

<style scoped lang="scss">
.glass-card {
  background: var(--glass-bg, rgba(255, 255, 255, 0.8));
  backdrop-filter: blur(var(--glass-blur, 12px));
  border: 1px solid var(--glass-border);
  border-radius: 16px;
}
</style>
