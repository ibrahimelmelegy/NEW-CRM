<template lang="pug">
    .flex.items-center.justify-between.mb-5.mt-5
      .title.font-bold.text-2xl.mb-1.capitalize {{dailyTask?.name}}
    .flex.align-center.gap-6.mt-3(class="flex-col xl:flex-row")
            .flex-1.glass-card.p-10.rounded-3xl
              .grid.gap-4(class="md:grid-cols-2 lg:grid-cols-3  xl:grid-cols-4")
                div
                  .text-neutral-400.font-medium.mb-2.flex.items-center
                    Icon(name="solar:hashtag-outline" size="20" class="mr-2")
                    p {{ $t('operations.dailyTasks.details.name') }}
                  p.text-neutral-800.mb-2 {{dailyTask?.name}}
                div
                  .text-neutral-400.font-medium.mb-2.flex.items-center
                    Icon(name="fluent:manufacturer-24-regular" size="20" class="mr-2")
                    p {{ $t('operations.dailyTasks.details.clientName') }}
                  p.text-neutral-800.mb-2 {{dailyTask?.client?.clientName}}
                div
                  .text-neutral-400.font-medium.mb-2.flex.items-center
                    Icon(name="fluent:manufacturer-24-regular" size="20" class="mr-2")
                    p {{ $t('operations.dailyTasks.details.salesRepName') }}
                  p.text-neutral-800.mb-2 {{dailyTask?.salesRepresentative?.name}}
                div
                  .text-neutral-400.font-medium.mb-2.flex.items-center
                    Icon(name="fluent:manufacturer-24-regular" size="20" class="mr-2")
                    p {{ $t('operations.dailyTasks.details.assignedTo') }}
                  p.text-neutral-800.mb-2 {{dailyTask?.user?.name}}
                div
                  .text-neutral-400.font-medium.mb-2.flex.items-center
                    Icon(name="solar:hashtag-outline" size="20" class="mr-2")
                    p {{ $t('operations.dailyTasks.details.cost') }}
                  p.text-neutral-800.mb-2 {{dailyTask?.cost}}
                div
                  .text-neutral-400.font-medium.mb-2.flex.items-center
                    Icon(name="solar:hashtag-outline" size="20" class="mr-2")
                    p {{ $t('operations.dailyTasks.details.totalPaid') }}
                  p.text-neutral-800.mb-2 {{dailyTask?.totalPaid}}
                div
                  .text-neutral-400.font-medium.mb-2.flex.items-center
                    Icon(name="solar:hashtag-outline" size="20" class="mr-2")
                    p {{ $t('operations.dailyTasks.details.downPayment') }}
                  p.text-neutral-800.mb-2 {{dailyTask?.downPayment}}
                div
                  .text-neutral-400.font-medium.mb-2.flex.items-center
                    Icon(name="solar:hashtag-outline" size="20" class="mr-2")
                    p {{ $t('operations.dailyTasks.details.priority') }}
                  p.text-neutral-800.mb-2 {{dailyTask?.priority}}
                div
                  .text-neutral-400.font-medium.mb-2.flex.items-center
                    Icon(name="solar:hashtag-outline" size="20" class="mr-2")
                    p {{ $t('operations.dailyTasks.details.status') }}
                  p.text-neutral-800.mb-2 {{dailyTask?.status}}
                div
                  .text-neutral-400.font-medium.mb-2.flex.items-center
                    Icon(name="solar:hashtag-outline" size="20" class="mr-2")
                    p {{ $t('operations.dailyTasks.details.date') }}
                  p.text-neutral-800.mb-2 {{getYear(dailyTask?.createdAt)}}
                div
                  .text-neutral-400.font-medium.mb-2.flex.items-center
                    Icon(name="solar:hashtag-outline" size="20" class="mr-2")
                    p {{ $t('operations.dailyTasks.details.startDate') }}
                  p.text-neutral-800.mb-2 {{getYear(dailyTask?.startDate)}}
                div
                  .text-neutral-400.font-medium.mb-2.flex.items-center
                    Icon(name="solar:hashtag-outline" size="20" class="mr-2")
                    p {{ $t('operations.dailyTasks.details.endDate') }}
                  p.text-neutral-800.mb-2 {{getYear(dailyTask?.endDate)}}
            .flex-1.glass-card.p-10.rounded-3xl(v-if="dailyTask?.notes")
             .flex.items-center.gap-2.mb-4
               .flex.items-center.justify-center.w-10.h-10.rounded-full.bg-secondary-turquoise-50: Icon.text-secondary-turquoise-700(name="IconNote" size="24")
             h4.text-lg.font-semibold.text-neutral-900 {{ $t('operations.dailyTasks.details.notes') }}
             p.text-neutral-800.leading-relaxed {{dailyTask?.notes}}
    </template>
<script lang="ts" setup>
const route = useRoute();

const dailyTask = await getDailyTask(route.params.slug as string);
</script>
<style scoped lang="scss">
.activity {
  position: relative;
  ::before {
    content: '';
    height: 100%;
    width: 1px;
    position: absolute;
    left: 24px;
    top: 2%;
    border: 1px dashed var(--color-border-subtle);
    z-index: -1;
  }
  > div:last-of-type {
    background: var(--color-neutral-background-3) !important;
  }
}
</style>
