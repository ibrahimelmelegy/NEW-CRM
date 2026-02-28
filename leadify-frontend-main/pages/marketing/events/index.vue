<template lang="pug">
div
  //- Header
  ModuleHeader(
    :title="$t('eventManagement.title')"
    :subtitle="$t('eventManagement.subtitle')"
  )
    template(#actions)
      el-button(size="large" @click="exportEvents" class="!rounded-2xl")
        Icon(name="ph:download-bold" size="16")
        span.ml-1 {{ $t('common.export') }}
      el-button(size="large" type="primary" class="!rounded-2xl" @click="openEventDialog()")
        Icon(name="ph:plus-bold" size="16")
        span.ml-1 {{ $t('eventManagement.newEvent') }}

  //- KPI Stats
  StatCards(:stats="kpiStats")

  //- Loading
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  //- Content Tabs
  template(v-else)
    el-tabs(v-model="activeTab")

      //- ─── Tab 1: Events Calendar / List ─────────────────
      el-tab-pane(:label="$t('eventManagement.eventsTab')" name="events")
        .glass-card.p-6.rounded-2xl
          .flex.items-center.justify-between.mb-4.flex-wrap.gap-3
            el-input(
              v-model="eventSearch"
              :placeholder="$t('common.search')"
              clearable
              style="max-width: 280px"
              size="large"
              class="!rounded-xl"
            )
              template(#prefix)
                Icon(name="ph:magnifying-glass" size="18" style="color: var(--text-muted)")
            .flex.items-center.gap-2
              el-select(v-model="filterType" :placeholder="$t('eventManagement.allTypes')" clearable size="large" style="width: 160px")
                el-option(v-for="opt in typeOptions" :key="opt.value" :label="opt.label" :value="opt.value")
              el-select(v-model="filterStatus" :placeholder="$t('eventManagement.allStatuses')" clearable size="large" style="width: 160px")
                el-option(v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value")

          //- Desktop Table
          .hidden(class="md:block")
            el-table(:data="filteredEvents" style="width: 100%" stripe @row-click="openEventDialog")
              el-table-column(:label="$t('eventManagement.eventName')" min-width="220" sortable prop="name")
                template(#default="{ row }")
                  .flex.items-center.gap-3
                    .w-9.h-9.rounded-xl.flex.items-center.justify-center.shrink-0(:style="{ background: getTypeColor(row.type) + '15' }")
                      Icon(:name="getTypeIcon(row.type)" size="18" :style="{ color: getTypeColor(row.type) }")
                    div
                      p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.name }}
                      p.text-xs(style="color: var(--text-muted)") {{ row.location === 'virtual' ? $t('eventManagement.virtual') : row.venue }}
              el-table-column(:label="$t('eventManagement.type')" width="130" sortable prop="type")
                template(#default="{ row }")
                  el-tag(:color="getTypeColor(row.type)" effect="dark" size="small" round style="border: none; color: #fff") {{ $t('eventManagement.types.' + row.type) }}
              el-table-column(:label="$t('eventManagement.date')" width="150" sortable prop="date")
                template(#default="{ row }")
                  .flex.items-center.gap-1
                    Icon(name="ph:calendar-blank" size="14" style="color: var(--text-muted)")
                    span.text-sm(style="color: var(--text-primary)") {{ formatDate(row.date) }}
              el-table-column(:label="$t('eventManagement.location')" width="110" align="center")
                template(#default="{ row }")
                  el-tag(:type="row.location === 'virtual' ? 'primary' : 'warning'" size="small" effect="plain") {{ row.location === 'virtual' ? $t('eventManagement.virtual') : $t('eventManagement.physical') }}
              el-table-column(:label="$t('eventManagement.capacity')" width="120" align="center")
                template(#default="{ row }")
                  .flex.items-center.justify-center.gap-1
                    span.text-sm.font-bold(:style="{ color: row.registered >= row.capacity ? '#ef4444' : 'var(--text-primary)' }") {{ row.registered }}
                    span.text-xs(style="color: var(--text-muted)") / {{ row.capacity }}
              el-table-column(:label="$t('common.status')" width="130" sortable prop="status")
                template(#default="{ row }")
                  el-tag(:type="getStatusTagType(row.status)" effect="dark" size="small" round) {{ $t('eventManagement.statuses.' + row.status) }}
              el-table-column(:label="$t('common.actions')" width="140" align="center")
                template(#default="{ row }")
                  .flex.items-center.justify-center.gap-1
                    el-button(text size="small" type="primary" :aria-label="$t('common.edit')" @click.stop="openEventDialog(row)")
                      Icon(name="ph:pencil-bold" size="16")
                    el-button(text size="small" type="info" :aria-label="$t('eventManagement.copy')" @click.stop="duplicateEvent(row)")
                      Icon(name="ph:copy-bold" size="16")
                    el-button(text size="small" type="danger" :aria-label="$t('common.delete')" @click.stop="handleDeleteEvent(row)")
                      Icon(name="ph:trash-bold" size="16")

          //- Mobile Cards
          .space-y-3(class="md:hidden")
            .glass-card.p-4.rounded-2xl.cursor-pointer(v-for="row in filteredEvents" :key="row.id" @click="openEventDialog(row)")
              .flex.items-start.justify-between.mb-2
                .flex.items-center.gap-3
                  .w-9.h-9.rounded-xl.flex.items-center.justify-center.shrink-0(:style="{ background: getTypeColor(row.type) + '15' }")
                    Icon(:name="getTypeIcon(row.type)" size="18" :style="{ color: getTypeColor(row.type) }")
                  div
                    p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.name }}
                    p.text-xs(style="color: var(--text-muted)") {{ formatDate(row.date) }}
                el-tag(:type="getStatusTagType(row.status)" effect="dark" size="small" round) {{ $t('eventManagement.statuses.' + row.status) }}
              .flex.items-center.justify-between.mt-2
                span.text-xs(style="color: var(--text-muted)") {{ row.registered }}/{{ row.capacity }} {{ $t('eventManagement.registered') }}
                el-tag(:color="getTypeColor(row.type)" effect="dark" size="small" round style="border: none; color: #fff") {{ $t('eventManagement.types.' + row.type) }}

          //- Empty State
          .text-center.py-12(v-if="!filteredEvents.length")
            Icon(name="ph:calendar-x" size="48" style="color: var(--text-muted); opacity: 0.4")
            p.text-sm.mt-3(style="color: var(--text-muted)") {{ $t('eventManagement.noEvents') }}

      //- ─── Tab 2: Registrations & Attendees ──────────────
      el-tab-pane(:label="$t('eventManagement.registrationsTab')" name="registrations")
        .glass-card.p-6.rounded-2xl
          //- Event Selector
          .flex.items-center.justify-between.mb-4.flex-wrap.gap-3
            el-select(
              v-model="selectedEventId"
              :placeholder="$t('eventManagement.selectEvent')"
              size="large"
              style="max-width: 360px"
              filterable
            )
              el-option(v-for="ev in events" :key="ev.id" :label="ev.name" :value="ev.id")
            .flex.items-center.gap-2(v-if="selectedEventId")
              el-button(size="large" plain class="!rounded-2xl" @click="sendBulkReminder")
                Icon(name="ph:bell-ringing-bold" size="16")
                span.ml-1 {{ $t('eventManagement.sendReminder') }}
              el-button(size="large" plain class="!rounded-2xl" @click="exportAttendees")
                Icon(name="ph:download-bold" size="16")
                span.ml-1 {{ $t('common.export') }}

          //- Attendee Stats Summary
          .grid.gap-4.mb-4(v-if="selectedEventId" class="grid-cols-1 sm:grid-cols-3")
            .glass-card.p-4.rounded-xl.text-center
              p.text-xs.uppercase.tracking-wider(style="color: var(--text-muted)") {{ $t('eventManagement.totalRegistered') }}
              p.text-xl.font-bold(style="color: #7849ff") {{ selectedEventAttendees.length }}
            .glass-card.p-4.rounded-xl.text-center
              p.text-xs.uppercase.tracking-wider(style="color: var(--text-muted)") {{ $t('eventManagement.attended') }}
              p.text-xl.font-bold(style="color: #22c55e") {{ selectedEventAttendees.filter(a => a.attendance === 'attended').length }}
            .glass-card.p-4.rounded-xl.text-center
              p.text-xs.uppercase.tracking-wider(style="color: var(--text-muted)") {{ $t('eventManagement.noShow') }}
              p.text-xl.font-bold(style="color: #ef4444") {{ selectedEventAttendees.filter(a => a.attendance === 'no-show').length }}

          //- Bulk Selection Bar
          .flex.items-center.gap-2.mb-3(v-if="selectedAttendees.length")
            span.text-sm.font-medium(style="color: var(--text-primary)") {{ selectedAttendees.length }} {{ $t('common.selected') }}
            el-button(size="small" @click="sendBulkReminder" class="!rounded-xl")
              Icon(name="ph:bell-ringing-bold" size="14")
              span.ml-1 {{ $t('eventManagement.sendReminder') }}
            el-button(size="small" @click="exportAttendees" class="!rounded-xl")
              Icon(name="ph:download-bold" size="14")
              span.ml-1 {{ $t('common.export') }}

          //- Attendees Table
          template(v-if="selectedEventId")
            el-table(:data="filteredAttendees" style="width: 100%" stripe @selection-change="handleAttendeeSelection")
              el-table-column(type="selection" width="40")
              el-table-column(:label="$t('eventManagement.attendeeName')" min-width="180" sortable)
                template(#default="{ row }")
                  .flex.items-center.gap-3
                    .w-8.h-8.rounded-full.flex.items-center.justify-center.shrink-0(style="background: rgba(120, 73, 255, 0.1)")
                      span.text-xs.font-bold(style="color: #7849ff") {{ (row.name || '?').charAt(0).toUpperCase() }}
                    div
                      p.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.name }}
                      p.text-xs(style="color: var(--text-muted)") {{ row.email }}
              el-table-column(:label="$t('eventManagement.company')" prop="company" width="160")
                template(#default="{ row }")
                  span.text-sm(style="color: var(--text-primary)") {{ row.company || '--' }}
              el-table-column(:label="$t('eventManagement.registrationDate')" width="150" sortable prop="registrationDate")
                template(#default="{ row }")
                  span.text-sm(style="color: var(--text-muted)") {{ formatDate(row.registrationDate) }}
              el-table-column(:label="$t('eventManagement.attendanceStatus')" width="140" align="center")
                template(#default="{ row }")
                  el-tag(:type="getAttendanceType(row.attendance)" effect="dark" size="small" round) {{ $t('eventManagement.attendance.' + row.attendance) }}
              el-table-column(:label="$t('eventManagement.leadScore')" width="120" align="center" sortable prop="leadScore")
                template(#default="{ row }")
                  .flex.items-center.justify-center.gap-1
                    Icon(name="ph:fire-bold" size="14" :style="{ color: row.leadScore >= 70 ? '#22c55e' : row.leadScore >= 40 ? '#f59e0b' : '#ef4444' }")
                    span.text-sm.font-bold(:style="{ color: row.leadScore >= 70 ? '#22c55e' : row.leadScore >= 40 ? '#f59e0b' : '#ef4444' }") {{ row.leadScore }}

            .text-center.py-8(v-if="!filteredAttendees.length")
              Icon(name="ph:users" size="48" style="color: var(--text-muted); opacity: 0.4")
              p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('eventManagement.noAttendees') }}

          //- No event selected
          .text-center.py-12(v-else)
            Icon(name="ph:hand-pointing" size="48" style="color: var(--text-muted); opacity: 0.4")
            p.text-sm.mt-3(style="color: var(--text-muted)") {{ $t('eventManagement.selectEventPrompt') }}

      //- ─── Tab 3: Follow-Up Automation ───────────────────
      el-tab-pane(:label="$t('eventManagement.followUpTab')" name="followup")
        .glass-card.p-6.rounded-2xl
          .flex.items-center.gap-2.mb-6
            Icon(name="ph:robot-bold" size="22" style="color: #7849ff")
            h3.text-base.font-bold(style="color: var(--text-primary)") {{ $t('eventManagement.automationConfig') }}

          //- Automation Toggles
          .space-y-4.mb-6
            .glass-card.p-5.rounded-xl(v-for="auto in automations" :key="auto.id")
              .flex.items-center.justify-between.mb-3
                .flex.items-center.gap-3
                  .w-10.h-10.rounded-xl.flex.items-center.justify-center(:style="{ background: auto.color + '15' }")
                    Icon(:name="auto.icon" size="20" :style="{ color: auto.color }")
                  div
                    p.text-sm.font-semibold(style="color: var(--text-primary)") {{ $t('eventManagement.automations.' + auto.id + '.title') }}
                    p.text-xs(style="color: var(--text-muted)") {{ $t('eventManagement.automations.' + auto.id + '.description') }}
                el-switch(v-model="auto.enabled" :active-color="auto.color")

              //- Expanded config when enabled
              template(v-if="auto.enabled")
                .border-t.pt-3.mt-2(style="border-color: var(--border-default)")

                //- Thank You Email Config
                template(v-if="auto.id === 'thankYou'")
                  .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
                    el-form-item(:label="$t('eventManagement.delayHours')")
                      el-input-number(v-model="auto.config.delayHours" :min="0" :max="72" class="!w-full")
                    el-form-item(:label="$t('eventManagement.emailTemplate')")
                      el-select(v-model="auto.config.template" class="w-full")
                        el-option(:label="$t('eventManagement.templates.thankYouGeneral')" value="thank_you_general")
                        el-option(:label="$t('eventManagement.templates.thankYouWebinar')" value="thank_you_webinar")
                        el-option(:label="$t('eventManagement.templates.thankYouConference')" value="thank_you_conference")

                //- Resource Sharing Config
                template(v-if="auto.id === 'resourceSharing'")
                  .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
                    el-form-item(:label="$t('eventManagement.delayDays')")
                      el-input-number(v-model="auto.config.delayDays" :min="0" :max="14" class="!w-full")
                    el-form-item(:label="$t('eventManagement.resourceType')")
                      el-select(v-model="auto.config.resourceType" class="w-full" multiple)
                        el-option(:label="$t('eventManagement.resources.slides')" value="slides")
                        el-option(:label="$t('eventManagement.resources.recording')" value="recording")
                        el-option(:label="$t('eventManagement.resources.handouts')" value="handouts")
                        el-option(:label="$t('eventManagement.resources.whitepaper')" value="whitepaper")

                //- Sales Handoff Config
                template(v-if="auto.id === 'salesHandoff'")
                  .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
                    el-form-item(:label="$t('eventManagement.minLeadScore')")
                      el-input-number(v-model="auto.config.minLeadScore" :min="0" :max="100" class="!w-full")
                    el-form-item(:label="$t('eventManagement.assignTo')")
                      el-select(v-model="auto.config.assignTo" class="w-full")
                        el-option(:label="$t('eventManagement.assignOptions.roundRobin')" value="round_robin")
                        el-option(:label="$t('eventManagement.assignOptions.topPerformer')" value="top_performer")
                        el-option(:label="$t('eventManagement.assignOptions.territoryBased')" value="territory_based")

                //- Feedback Survey Config
                template(v-if="auto.id === 'feedbackSurvey'")
                  .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
                    el-form-item(:label="$t('eventManagement.delayDays')")
                      el-input-number(v-model="auto.config.delayDays" :min="0" :max="7" class="!w-full")
                    el-form-item(:label="$t('eventManagement.surveyTemplate')")
                      el-select(v-model="auto.config.surveyId" class="w-full")
                        el-option(:label="$t('eventManagement.surveys.postEvent')" value="post_event")
                        el-option(:label="$t('eventManagement.surveys.nps')" value="nps")
                        el-option(:label="$t('eventManagement.surveys.detailed')" value="detailed")

          //- Template Preview
          .glass-card.p-5.rounded-xl
            .flex.items-center.gap-2.mb-4
              Icon(name="ph:eye-bold" size="18" style="color: #3b82f6")
              h4.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('eventManagement.templatePreview') }}
            .p-4.rounded-lg(style="background: var(--bg-input); border: 1px dashed var(--border-default)")
              p.text-sm.font-semibold.mb-2(style="color: var(--text-primary)") {{ $t('eventManagement.previewSubject') }}
              p.text-xs.leading-relaxed(style="color: var(--text-muted)") {{ $t('eventManagement.previewBody') }}
            .flex.justify-end.mt-4
              el-button(type="primary" plain size="small" class="!rounded-xl" @click="saveAutomation")
                Icon(name="ph:floppy-disk-bold" size="14")
                span.ml-1 {{ $t('common.save') }}

      //- ─── Tab 4: Event ROI & Analytics ──────────────────
      el-tab-pane(:label="$t('eventManagement.analyticsTab')" name="analytics")
        //- ROI KPI Cards
        .grid.gap-4.mb-6(class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")
          .glass-card.p-5.rounded-2xl.text-center(v-for="metric in roiMetrics" :key="metric.label")
            .w-10.h-10.rounded-xl.flex.items-center.justify-center.mx-auto.mb-3(:style="{ background: metric.color + '20' }")
              Icon(:name="metric.icon" size="20" :style="{ color: metric.color }")
            p.text-2xl.font-bold(:style="{ color: metric.color }") {{ metric.value }}
            p.text-xs.mt-1(style="color: var(--text-muted)") {{ metric.label }}
            .flex.items-center.justify-center.gap-1.mt-2(v-if="metric.trend !== undefined")
              Icon(:name="metric.trend >= 0 ? 'ph:trend-up-bold' : 'ph:trend-down-bold'" size="12" :style="{ color: metric.trend >= 0 ? '#22c55e' : '#ef4444' }")
              span.text-xs.font-medium(:style="{ color: metric.trend >= 0 ? '#22c55e' : '#ef4444' }") {{ metric.trend > 0 ? '+' : '' }}{{ metric.trend }}%

        //- Performance Chart
        .glass-card.p-6.rounded-2xl.mb-6
          .flex.items-center.justify-between.mb-4
            .flex.items-center.gap-2
              Icon(name="ph:chart-line-up-bold" size="20" style="color: #7849ff")
              h3.text-base.font-bold(style="color: var(--text-primary)") {{ $t('eventManagement.performanceOverTime') }}
            el-radio-group(v-model="chartPeriod" size="small" @change="updateChart")
              el-radio-button(value="6m") {{ $t('eventManagement.sixMonths') }}
              el-radio-button(value="12m") {{ $t('eventManagement.twelveMonths') }}
          VChart.w-full(:option="performanceChartOption" :style="{ height: '360px' }" autoresize)

        //- ROI Table per Event
        .glass-card.p-6.rounded-2xl
          .flex.items-center.gap-2.mb-4
            Icon(name="ph:table-bold" size="20" style="color: #3b82f6")
            h3.text-base.font-bold(style="color: var(--text-primary)") {{ $t('eventManagement.roiByEvent') }}

          el-table(:data="eventsWithROI" style="width: 100%" stripe)
            el-table-column(:label="$t('eventManagement.eventName')" min-width="200" sortable prop="name")
              template(#default="{ row }")
                .flex.items-center.gap-2
                  .w-7.h-7.rounded-lg.flex.items-center.justify-center(:style="{ background: getTypeColor(row.type) + '15' }")
                    Icon(:name="getTypeIcon(row.type)" size="14" :style="{ color: getTypeColor(row.type) }")
                  span.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.name }}
            el-table-column(:label="$t('eventManagement.attendees')" width="110" align="center" sortable prop="registered")
              template(#default="{ row }")
                span.text-sm.font-bold(style="color: var(--text-primary)") {{ row.registered }}
            el-table-column(:label="$t('eventManagement.leadsGenerated')" width="140" align="center" sortable prop="leadsGenerated")
              template(#default="{ row }")
                span.text-sm.font-bold(style="color: #3b82f6") {{ row.leadsGenerated }}
            el-table-column(:label="$t('eventManagement.opportunities')" width="140" align="center" sortable prop="opportunities")
              template(#default="{ row }")
                span.text-sm.font-bold(style="color: #f59e0b") {{ row.opportunities }}
            el-table-column(:label="$t('eventManagement.revenue')" width="140" align="center" sortable prop="revenue")
              template(#default="{ row }")
                span.text-sm.font-bold(style="color: #22c55e") {{ formatCurrency(row.revenue) }}
            el-table-column(:label="$t('eventManagement.cost')" width="120" align="center" sortable prop="cost")
              template(#default="{ row }")
                span.text-sm(style="color: var(--text-muted)") {{ formatCurrency(row.cost) }}
            el-table-column(:label="$t('eventManagement.roi')" width="110" align="center" sortable prop="roi")
              template(#default="{ row }")
                el-tag(:type="row.roi >= 100 ? 'success' : row.roi >= 0 ? 'warning' : 'danger'" effect="dark" size="small" round) {{ row.roi }}%

  //- ─── Create / Edit Event Dialog ───────────────────────
  el-dialog(
    v-model="eventDialogVisible"
    :title="editingEvent ? $t('eventManagement.editEvent') : $t('eventManagement.newEvent')"
    width="640px"
    destroy-on-close
  )
    el-form(:model="eventForm" label-position="top")
      el-form-item(:label="$t('eventManagement.eventName')" required)
        el-input(v-model="eventForm.name" :placeholder="$t('eventManagement.eventNamePlaceholder')")
      el-form-item(:label="$t('common.description')")
        el-input(v-model="eventForm.description" type="textarea" :rows="2" :placeholder="$t('eventManagement.descriptionPlaceholder')")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('eventManagement.type')" required)
          el-select(v-model="eventForm.type" class="w-full")
            el-option(v-for="opt in typeOptions" :key="opt.value" :label="opt.label" :value="opt.value")
        el-form-item(:label="$t('common.status')")
          el-select(v-model="eventForm.status" class="w-full")
            el-option(v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('eventManagement.date')" required)
          el-date-picker(v-model="eventForm.date" type="datetime" :placeholder="$t('eventManagement.pickDate')" class="!w-full")
        el-form-item(:label="$t('eventManagement.endDate')")
          el-date-picker(v-model="eventForm.endDate" type="datetime" :placeholder="$t('eventManagement.pickEndDate')" class="!w-full")
      .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
        el-form-item(:label="$t('eventManagement.location')")
          el-select(v-model="eventForm.location" class="w-full")
            el-option(:label="$t('eventManagement.virtual')" value="virtual")
            el-option(:label="$t('eventManagement.physical')" value="physical")
        el-form-item(:label="$t('eventManagement.capacity')")
          el-input-number(v-model="eventForm.capacity" :min="1" class="!w-full")
      el-form-item(v-if="eventForm.location === 'physical'" :label="$t('eventManagement.venue')")
        el-input(v-model="eventForm.venue" :placeholder="$t('eventManagement.venuePlaceholder')")
      el-form-item(v-if="eventForm.location === 'virtual'" :label="$t('eventManagement.meetingLink')")
        el-input(v-model="eventForm.meetingLink" :placeholder="$t('eventManagement.meetingLinkPlaceholder')")
      el-form-item(:label="$t('eventManagement.tags')")
        el-select(v-model="eventForm.tags" multiple filterable allow-create class="w-full" :placeholder="$t('eventManagement.addTags')")
          el-option(v-for="tag in availableTags" :key="tag" :label="tag" :value="tag")
    template(#footer)
      el-button(@click="eventDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="handleSaveEvent" :loading="saving") {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import VChart from 'vue-echarts';

interface EventItem {
  id: number;
  name: string;
  type: string;
  date: string;
  endDate: string;
  location: string;
  venue: string;
  meetingLink: string;
  capacity: number;
  registered: number;
  status: string;
  description: string;
  tags: string[];
  leadsGenerated: number;
  opportunities: number;
  revenue: number;
  cost: number;
}

interface Attendee {
  id: number;
  name: string;
  email: string;
  company: string;
  registrationDate: string;
  attendance: string;
  leadScore: number;
}

definePageMeta({ middleware: 'permissions' });

const { t, locale } = useI18n();

const loading = ref(false);
const saving = ref(false);
const activeTab = ref('events');
const eventDialogVisible = ref(false);
const editingEvent = ref<EventItem | null>(null);
const eventSearch = ref('');
const filterType = ref('');
const filterStatus = ref('');
const selectedEventId = ref<string | number>('');
const selectedAttendees = ref<Attendee[]>([]);
const chartPeriod = ref('6m');

// ─── Options ──────────────────────────────────────────────
const typeOptions = computed(() => [
  { label: t('eventManagement.types.webinar'), value: 'webinar' },
  { label: t('eventManagement.types.conference'), value: 'conference' },
  { label: t('eventManagement.types.workshop'), value: 'workshop' },
  { label: t('eventManagement.types.meetup'), value: 'meetup' }
]);

const statusOptions = computed(() => [
  { label: t('eventManagement.statuses.upcoming'), value: 'upcoming' },
  { label: t('eventManagement.statuses.live'), value: 'live' },
  { label: t('eventManagement.statuses.completed'), value: 'completed' },
  { label: t('eventManagement.statuses.cancelled'), value: 'cancelled' }
]);

const availableTags = computed(() => [
  t('eventManagement.tagOptions.marketing'),
  t('eventManagement.tagOptions.sales'),
  t('eventManagement.tagOptions.product'),
  t('eventManagement.tagOptions.engineering'),
  t('eventManagement.tagOptions.leadership'),
  t('eventManagement.tagOptions.onboarding'),
  t('eventManagement.tagOptions.training')
]);

// ─── Demo Data ────────────────────────────────────────────
const events = ref<EventItem[]>([
  { id: 1, name: 'Q1 Product Webinar', type: 'webinar', date: '2026-03-15T10:00:00', endDate: '2026-03-15T11:30:00', location: 'virtual', venue: '', meetingLink: 'https://meet.example.com/q1-webinar', capacity: 500, registered: 387, status: 'upcoming', description: 'Quarterly product updates and roadmap review', tags: ['Product', 'Marketing'], leadsGenerated: 142, opportunities: 28, revenue: 85000, cost: 2500 },
  { id: 2, name: 'Annual Sales Conference 2026', type: 'conference', date: '2026-04-20T09:00:00', endDate: '2026-04-22T17:00:00', location: 'physical', venue: 'Grand Hyatt, Dubai', meetingLink: '', capacity: 300, registered: 256, status: 'upcoming', description: 'Three-day sales conference with keynotes and workshops', tags: ['Sales', 'Leadership'], leadsGenerated: 0, opportunities: 0, revenue: 0, cost: 45000 },
  { id: 3, name: 'CRM Mastery Workshop', type: 'workshop', date: '2026-02-10T14:00:00', endDate: '2026-02-10T17:00:00', location: 'virtual', venue: '', meetingLink: 'https://meet.example.com/crm-workshop', capacity: 80, registered: 73, status: 'completed', description: 'Hands-on workshop for advanced CRM techniques', tags: ['Training', 'Sales'], leadsGenerated: 56, opportunities: 12, revenue: 34000, cost: 1200 },
  { id: 4, name: 'Tech Meetup: AI in Sales', type: 'meetup', date: '2026-02-25T18:00:00', endDate: '2026-02-25T20:00:00', location: 'physical', venue: 'Innovation Hub, Riyadh', meetingLink: '', capacity: 60, registered: 58, status: 'completed', description: 'Community meetup exploring AI applications in sales', tags: ['Engineering', 'Sales'], leadsGenerated: 34, opportunities: 8, revenue: 22000, cost: 3000 },
  { id: 5, name: 'Customer Success Webinar', type: 'webinar', date: '2026-02-28T11:00:00', endDate: '2026-02-28T12:00:00', location: 'virtual', venue: '', meetingLink: 'https://meet.example.com/cs-webinar', capacity: 200, registered: 163, status: 'live', description: 'Best practices for customer success and retention', tags: ['Marketing'], leadsGenerated: 89, opportunities: 15, revenue: 41000, cost: 800 },
  { id: 6, name: 'Product Launch: CRM 3.0', type: 'webinar', date: '2026-01-18T10:00:00', endDate: '2026-01-18T11:00:00', location: 'virtual', venue: '', meetingLink: '', capacity: 1000, registered: 842, status: 'completed', description: 'Major product launch event for CRM version 3.0', tags: ['Product', 'Marketing'], leadsGenerated: 310, opportunities: 67, revenue: 195000, cost: 8000 },
  { id: 7, name: 'Leadership Summit', type: 'conference', date: '2026-05-10T09:00:00', endDate: '2026-05-11T17:00:00', location: 'physical', venue: 'Ritz-Carlton, Jeddah', meetingLink: '', capacity: 150, registered: 42, status: 'upcoming', description: 'Executive leadership summit on digital transformation', tags: ['Leadership'], leadsGenerated: 0, opportunities: 0, revenue: 0, cost: 35000 },
  { id: 8, name: 'Pipeline Management Workshop', type: 'workshop', date: '2025-12-05T14:00:00', endDate: '2025-12-05T16:00:00', location: 'virtual', venue: '', meetingLink: '', capacity: 100, registered: 91, status: 'completed', description: 'Training workshop for effective pipeline management', tags: ['Sales', 'Training'], leadsGenerated: 45, opportunities: 10, revenue: 28000, cost: 900 }
]);

const attendeesData = ref<Record<number, Attendee[]>>({
  1: [
    { id: 1, name: 'Ahmed Al-Rashid', email: 'ahmed@company.com', company: 'Tech Solutions', registrationDate: '2026-02-20', attendance: 'registered', leadScore: 85 },
    { id: 2, name: 'Sarah Johnson', email: 'sarah@enterprise.io', company: 'Enterprise Inc', registrationDate: '2026-02-18', attendance: 'registered', leadScore: 72 },
    { id: 3, name: 'Mohammed Khalid', email: 'mkhalid@startup.sa', company: 'StartupSA', registrationDate: '2026-02-22', attendance: 'registered', leadScore: 56 },
    { id: 4, name: 'Lisa Chen', email: 'lisa.chen@global.com', company: 'Global Corp', registrationDate: '2026-02-15', attendance: 'registered', leadScore: 91 },
    { id: 5, name: 'Omar Farouk', email: 'omar@digital.ae', company: 'Digital AE', registrationDate: '2026-02-24', attendance: 'registered', leadScore: 63 }
  ],
  3: [
    { id: 6, name: 'Fatima Al-Saud', email: 'fatima@corp.sa', company: 'Corp SA', registrationDate: '2026-01-28', attendance: 'attended', leadScore: 88 },
    { id: 7, name: 'David Miller', email: 'david@analytics.com', company: 'Analytics Co', registrationDate: '2026-01-30', attendance: 'attended', leadScore: 76 },
    { id: 8, name: 'Noura Bakr', email: 'noura@venture.io', company: 'Venture IO', registrationDate: '2026-02-01', attendance: 'no-show', leadScore: 45 },
    { id: 9, name: 'James Park', email: 'james@solutions.kr', company: 'Solutions KR', registrationDate: '2026-02-03', attendance: 'attended', leadScore: 82 },
    { id: 10, name: 'Layla Hassan', email: 'layla@tech.eg', company: 'Tech EG', registrationDate: '2026-02-05', attendance: 'attended', leadScore: 69 }
  ],
  5: [
    { id: 11, name: 'Khalid Omar', email: 'khalid@success.sa', company: 'Success SA', registrationDate: '2026-02-20', attendance: 'attended', leadScore: 78 },
    { id: 12, name: 'Emma Wilson', email: 'emma@growth.co', company: 'Growth Co', registrationDate: '2026-02-22', attendance: 'attended', leadScore: 65 },
    { id: 13, name: 'Youssef Nabil', email: 'youssef@digital.sa', company: 'Digital SA', registrationDate: '2026-02-24', attendance: 'no-show', leadScore: 42 }
  ],
  6: [
    { id: 14, name: 'Abdullah Faisal', email: 'abdullah@mega.sa', company: 'Mega Corp', registrationDate: '2026-01-05', attendance: 'attended', leadScore: 94 },
    { id: 15, name: 'Rachel Green', email: 'rachel@west.com', company: 'Westfield Inc', registrationDate: '2026-01-08', attendance: 'attended', leadScore: 87 },
    { id: 16, name: 'Tariq Mansour', email: 'tariq@innovate.ae', company: 'Innovate AE', registrationDate: '2026-01-10', attendance: 'attended', leadScore: 73 },
    { id: 17, name: 'Mia Anderson', email: 'mia@scale.io', company: 'Scale IO', registrationDate: '2026-01-12', attendance: 'no-show', leadScore: 51 }
  ]
});

// ─── Follow-Up Automations ────────────────────────────────
const automations = ref([
  {
    id: 'thankYou',
    icon: 'ph:envelope-open-bold',
    color: '#7849ff',
    enabled: true,
    config: { delayHours: 2, template: 'thank_you_general' }
  },
  {
    id: 'resourceSharing',
    icon: 'ph:file-arrow-down-bold',
    color: '#3b82f6',
    enabled: true,
    config: { delayDays: 1, resourceType: ['slides', 'recording'] }
  },
  {
    id: 'salesHandoff',
    icon: 'ph:handshake-bold',
    color: '#22c55e',
    enabled: false,
    config: { minLeadScore: 70, assignTo: 'round_robin' }
  },
  {
    id: 'feedbackSurvey',
    icon: 'ph:clipboard-text-bold',
    color: '#f59e0b',
    enabled: true,
    config: { delayDays: 3, surveyId: 'post_event' }
  }
]);

// ─── Event Form ───────────────────────────────────────────
const defaultEventForm = () => ({
  name: '',
  description: '',
  type: 'webinar',
  status: 'upcoming',
  date: '',
  endDate: '',
  location: 'virtual',
  venue: '',
  meetingLink: '',
  capacity: 100,
  tags: [] as string[]
});

const eventForm = ref(defaultEventForm());

// ─── KPI Stats ────────────────────────────────────────────
const kpiStats = computed(() => {
  const total = events.value.length;
  const upcoming = events.value.filter(e => e.status === 'upcoming').length;
  const totalReg = events.value.reduce((sum, e) => sum + (e.registered || 0), 0);
  const completedEvents = events.value.filter(e => e.status === 'completed');
  const avgAttendance = completedEvents.length
    ? Math.round(completedEvents.reduce((sum, e) => sum + ((e.registered / e.capacity) * 100), 0) / completedEvents.length)
    : 0;

  return [
    { label: t('eventManagement.totalEvents'), value: total, icon: 'ph:calendar-bold', color: '#7849ff' },
    { label: t('eventManagement.upcomingEvents'), value: upcoming, icon: 'ph:clock-bold', color: '#3b82f6' },
    { label: t('eventManagement.totalRegistrations'), value: totalReg.toLocaleString(), icon: 'ph:users-bold', color: '#22c55e' },
    { label: t('eventManagement.avgAttendanceRate'), value: avgAttendance + '%', icon: 'ph:chart-line-up-bold', color: '#f59e0b' }
  ];
});

// ─── ROI Metrics ──────────────────────────────────────────
const roiMetrics = computed(() => {
  const completed = events.value.filter(e => e.status === 'completed');
  const totalAttendees = completed.reduce((s, e) => s + e.registered, 0);
  const totalOpps = completed.reduce((s, e) => s + (e.opportunities || 0), 0);
  const totalRevenue = completed.reduce((s, e) => s + (e.revenue || 0), 0);
  const convRate = totalAttendees > 0 ? ((totalOpps / totalAttendees) * 100).toFixed(1) : '0';

  return [
    { label: t('eventManagement.completedEvents'), value: completed.length, icon: 'ph:check-circle-bold', color: '#7849ff', trend: 12 },
    { label: t('eventManagement.totalAttendees'), value: totalAttendees.toLocaleString(), icon: 'ph:users-bold', color: '#3b82f6', trend: 8 },
    { label: t('eventManagement.conversionRate'), value: convRate + '%', icon: 'ph:funnel-bold', color: '#f59e0b', trend: 5.2 },
    { label: t('eventManagement.revenueAttributed'), value: formatCurrency(totalRevenue), icon: 'ph:currency-circle-dollar-bold', color: '#22c55e', trend: 18 }
  ];
});

// ─── Events with ROI data ─────────────────────────────────
const eventsWithROI = computed(() => {
  return events.value
    .filter(e => e.status === 'completed')
    .map(e => ({
      ...e,
      roi: e.cost > 0 ? Math.round(((e.revenue - e.cost) / e.cost) * 100) : 0
    }))
    .sort((a, b) => b.roi - a.roi);
});

// ─── Filtered Data ────────────────────────────────────────
const filteredEvents = computed(() => {
  let data = events.value;
  if (filterType.value) {
    data = data.filter(e => e.type === filterType.value);
  }
  if (filterStatus.value) {
    data = data.filter(e => e.status === filterStatus.value);
  }
  if (eventSearch.value) {
    const q = eventSearch.value.toLowerCase();
    data = data.filter(e =>
      (e.name || '').toLowerCase().includes(q) ||
      (e.description || '').toLowerCase().includes(q) ||
      (e.venue || '').toLowerCase().includes(q)
    );
  }
  return data;
});

const selectedEventAttendees = computed(() => {
  if (!selectedEventId.value) return [];
  return attendeesData.value[selectedEventId.value as number] || [];
});

const filteredAttendees = computed(() => {
  return selectedEventAttendees.value;
});

// ─── Chart ────────────────────────────────────────────────
const performanceChartOption = computed(() => {
  const months = chartPeriod.value === '6m'
    ? ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb']
    : ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];

  const attendeesLine = chartPeriod.value === '6m'
    ? [120, 185, 210, 91, 842, 550]
    : [80, 95, 110, 145, 130, 165, 120, 185, 210, 91, 842, 550];

  const leadsLine = chartPeriod.value === '6m'
    ? [42, 68, 75, 45, 310, 231]
    : [28, 35, 40, 52, 48, 60, 42, 68, 75, 45, 310, 231];

  const revenueBars = chartPeriod.value === '6m'
    ? [18000, 32000, 41000, 28000, 195000, 126000]
    : [12000, 15000, 18000, 25000, 22000, 30000, 18000, 32000, 41000, 28000, 195000, 126000];

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: [
        t('eventManagement.attendees'),
        t('eventManagement.leadsGenerated'),
        t('eventManagement.revenue')
      ],
      bottom: 0,
      textStyle: { color: '#94a3b8' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: { color: '#94a3b8' },
      axisLine: { lineStyle: { color: '#374151' } }
    },
    yAxis: [
      {
        type: 'value',
        name: t('eventManagement.people'),
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: '#1f2937' } }
      },
      {
        type: 'value',
        name: t('eventManagement.revenue'),
        axisLabel: { color: '#94a3b8', formatter: (v: number) => new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(v) },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: t('eventManagement.attendees'),
        type: 'line',
        smooth: true,
        data: attendeesLine,
        lineStyle: { color: '#7849ff', width: 3 },
        itemStyle: { color: '#7849ff' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(120, 73, 255, 0.25)' }, { offset: 1, color: 'rgba(120, 73, 255, 0.02)' }] } }
      },
      {
        name: t('eventManagement.leadsGenerated'),
        type: 'line',
        smooth: true,
        data: leadsLine,
        lineStyle: { color: '#3b82f6', width: 2 },
        itemStyle: { color: '#3b82f6' }
      },
      {
        name: t('eventManagement.revenue'),
        type: 'bar',
        yAxisIndex: 1,
        data: revenueBars,
        barWidth: '40%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(34, 197, 94, 0.6)' }, { offset: 1, color: 'rgba(34, 197, 94, 0.1)' }]
          },
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  };
});

// ─── Helpers ──────────────────────────────────────────────
function getTypeColor(type: string): string {
  const map: Record<string, string> = {
    webinar: '#7849ff',
    conference: '#3b82f6',
    workshop: '#f59e0b',
    meetup: '#22c55e'
  };
  return map[type] || '#6b7280';
}

function getTypeIcon(type: string): string {
  const map: Record<string, string> = {
    webinar: 'ph:monitor-play-bold',
    conference: 'ph:microphone-stage-bold',
    workshop: 'ph:wrench-bold',
    meetup: 'ph:users-three-bold'
  };
  return map[type] || 'ph:calendar-bold';
}

function getStatusTagType(status: string): string {
  const map: Record<string, string> = {
    upcoming: 'primary',
    live: 'success',
    completed: 'info',
    cancelled: 'danger'
  };
  return map[status] || 'info';
}

function getAttendanceType(attendance: string): string {
  const map: Record<string, string> = {
    registered: 'warning',
    attended: 'success',
    'no-show': 'danger'
  };
  return map[attendance] || 'info';
}

function formatDate(d: string): string {
  if (!d) return '--';
  try {
    return new Date(d).toLocaleDateString(locale.value, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return d;
  }
}

function formatCurrency(val: number): string {
  if (!val) return new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(0);
  return new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(val);
}

// ─── Actions ──────────────────────────────────────────────
function openEventDialog(event?: EventItem) {
  if (event && event.id) {
    editingEvent.value = event;
    eventForm.value = {
      name: event.name || '',
      description: event.description || '',
      type: event.type || 'webinar',
      status: event.status || 'upcoming',
      date: event.date || '',
      endDate: event.endDate || '',
      location: event.location || 'virtual',
      venue: event.venue || '',
      meetingLink: event.meetingLink || '',
      capacity: event.capacity || 100,
      tags: event.tags ? [...event.tags] : []
    };
  } else {
    editingEvent.value = null;
    eventForm.value = defaultEventForm();
  }
  eventDialogVisible.value = true;
}

async function handleSaveEvent() {
  if (!eventForm.value.name.trim()) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  saving.value = true;
  try {
    if (editingEvent.value) {
      const idx = events.value.findIndex(e => e.id === editingEvent.value.id);
      if (idx >= 0) {
        events.value[idx] = { ...events.value[idx], ...eventForm.value };
      }
    } else {
      const newEvent = {
        ...eventForm.value,
        id: Date.now(),
        registered: 0,
        leadsGenerated: 0,
        opportunities: 0,
        revenue: 0,
        cost: 0
      };
      events.value.unshift(newEvent);
    }
    eventDialogVisible.value = false;
    ElMessage.success(t('common.saved'));
  } catch {
    ElMessage.error(t('common.error'));
  } finally {
    saving.value = false;
  }
}

async function handleDeleteEvent(event: EventItem) {
  try {
    await ElMessageBox.confirm(
      t('common.confirmDelete'),
      t('common.warning'),
      { type: 'warning', confirmButtonText: t('common.delete'), cancelButtonText: t('common.cancel') }
    );
    events.value = events.value.filter(e => e.id !== event.id);
    ElMessage.success(t('common.deleted'));
  } catch {
    // User cancelled
  }
}

function duplicateEvent(event: EventItem) {
  const duplicate = {
    ...event,
    id: Date.now(),
    name: event.name + ' (' + t('eventManagement.copy') + ')',
    status: 'upcoming',
    registered: 0,
    leadsGenerated: 0,
    opportunities: 0,
    revenue: 0
  };
  events.value.unshift(duplicate);
  ElMessage.success(t('eventManagement.eventDuplicated'));
}

function handleAttendeeSelection(rows: Attendee[]) {
  selectedAttendees.value = rows;
}

function sendBulkReminder() {
  const count = selectedAttendees.value.length || selectedEventAttendees.value.length;
  ElMessage.success(t('eventManagement.reminderSent', { count }));
}

function exportAttendees() {
  const data = selectedAttendees.value.length ? selectedAttendees.value : selectedEventAttendees.value;
  if (!data.length) return;
  const headers = [t('eventManagement.attendeeName'), t('eventManagement.email'), t('eventManagement.company'), t('eventManagement.registrationDate'), t('eventManagement.attendanceStatus'), t('eventManagement.leadScore')];
  const csv = [headers.join(','), ...data.map((row: Attendee) =>
    [
      `"${row.name || ''}"`,
      `"${row.email || ''}"`,
      `"${row.company || ''}"`,
      `"${row.registrationDate || ''}"`,
      `"${row.attendance || ''}"`,
      row.leadScore || 0
    ].join(',')
  )].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `event-attendees-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  ElMessage.success(t('common.exported'));
}

function exportEvents() {
  const data = filteredEvents.value;
  if (!data.length) return;
  const headers = [t('eventManagement.eventName'), t('eventManagement.type'), t('eventManagement.date'), t('eventManagement.location'), t('eventManagement.capacity'), t('eventManagement.registered'), t('common.status')];
  const csv = [headers.join(','), ...data.map((row: EventItem) =>
    [
      `"${row.name || ''}"`,
      `"${row.type || ''}"`,
      `"${formatDate(row.date)}"`,
      `"${row.location || ''}"`,
      row.capacity || 0,
      row.registered || 0,
      `"${row.status || ''}"`
    ].join(',')
  )].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `events-export-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  ElMessage.success(t('common.exported'));
}

function saveAutomation() {
  ElMessage.success(t('eventManagement.automationSaved'));
}

function updateChart() {
  // Chart reactively updates via computed property
}

// ─── Init ─────────────────────────────────────────────────
onMounted(() => {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
  }, 500);
});
</script>

<style lang="scss" scoped>
.glass-card {
  background: var(--bg-elevated, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--border-default, rgba(255, 255, 255, 0.08));
  border-radius: 16px;
}
</style>
