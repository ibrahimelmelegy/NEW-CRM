<template lang="pug">
.campaign-builder-page
  //- ═══════════════════════════════════════════════════════════
  //- Campaign Header
  //- ═══════════════════════════════════════════════════════════
  .glass-card.p-6.mb-6.animate-entrance
    .flex.flex-wrap.items-center.justify-between.gap-4
      .flex.items-center.gap-4
        el-button(text @click="useSafeBack('/marketing/campaigns')")
          Icon(name="ph:arrow-left-bold" size="18")
        div
          .flex.items-center.gap-3
            el-input.campaign-name-input(
              v-model="campaign.name"
              :placeholder="$t('campaignBuilder.campaignName')"
              size="large"
              style="max-width: 400px; font-size: 1.25rem; font-weight: 700"
            )
            el-tag(
              :type="statusTagType"
              size="default"
              effect="dark"
              round
            ) {{ campaign.status }}
          p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('campaignBuilder.subtitle') }}
      .flex.items-center.gap-2.flex-wrap
        el-button(size="large" @click="saveDraft" :loading="saving" class="!rounded-2xl")
          Icon(name="ph:floppy-disk-bold" size="16")
          span.ml-1 {{ $t('campaignBuilder.saveDraft') }}
        el-button(size="large" @click="showScheduleDialog = true" class="!rounded-2xl")
          Icon(name="ph:clock-bold" size="16")
          span.ml-1 {{ $t('campaignBuilder.schedule') }}
        el-button(size="large" type="primary" @click="confirmSendNow" :loading="sending" class="!rounded-2xl")
          Icon(name="ph:paper-plane-tilt-bold" size="16")
          span.ml-1 {{ $t('campaignBuilder.sendCampaign') }}
        el-button(size="large" @click="showPreview = true" class="!rounded-2xl")
          Icon(name="ph:eye-bold" size="16")
          span.ml-1 {{ $t('campaignBuilder.preview') }}

  //- ═══════════════════════════════════════════════════════════
  //- Step Wizard Navigation
  //- ═══════════════════════════════════════════════════════════
  .glass-card.p-4.mb-6
    el-steps(:active="currentStep" finish-status="success" align-center)
      el-step(:title="$t('campaignBuilder.audience')" :icon="StepAudienceIcon")
      el-step(:title="$t('campaignBuilder.content')" :icon="StepContentIcon")
      el-step(:title="$t('campaignBuilder.settings')" :icon="StepSettingsIcon")
      el-step(:title="$t('campaignBuilder.review')" :icon="StepReviewIcon")

  //- ═══════════════════════════════════════════════════════════
  //- STEP 1: Audience Selection
  //- ═══════════════════════════════════════════════════════════
  template(v-if="currentStep === 0")
    .grid.gap-6(class="grid-cols-1 lg:grid-cols-3")
      .col-span-1(class="lg:col-span-2")
        .glass-card.p-6.mb-6
          h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)")
            Icon.mr-2(name="ph:users-three-bold" size="20" style="color: var(--accent-color, #7849ff)")
            | {{ $t('campaignBuilder.audience') }}

          //- Recipient Type Selector
          .mb-6
            label.block.text-sm.font-medium.mb-2(style="color: var(--text-secondary)") {{ $t('campaignBuilder.recipientType') }}
            el-radio-group(v-model="audience.type" size="large")
              el-radio-button(value="all")
                Icon.mr-1(name="ph:globe-bold" size="14")
                | {{ $t('campaignBuilder.allContacts') }}
              el-radio-button(value="segment")
                Icon.mr-1(name="ph:funnel-bold" size="14")
                | {{ $t('campaignBuilder.segment') }}
              el-radio-button(value="tags")
                Icon.mr-1(name="ph:tag-bold" size="14")
                | {{ $t('campaignBuilder.tags') }}
              el-radio-button(value="csv")
                Icon.mr-1(name="ph:upload-bold" size="14")
                | {{ $t('campaignBuilder.manualUpload') }}

          //- Segment Selector
          .mb-4(v-if="audience.type === 'segment'")
            label.block.text-sm.font-medium.mb-2(style="color: var(--text-secondary)") {{ $t('campaignBuilder.selectSegment') }}
            el-select(
              v-model="audience.segmentId"
              :placeholder="$t('campaignBuilder.selectSegment')"
              size="large"
              style="width: 100%"
              filterable
            )
              el-option(
                v-for="seg in segments"
                :key="seg.id"
                :label="seg.name"
                :value="seg.id"
              )
                .flex.items-center.justify-between.w-full
                  span {{ seg.name }}
                  el-tag(size="small" type="info") {{ seg.count }} {{ $t('campaignBuilder.contacts') }}

          //- Tag Selector
          .mb-4(v-if="audience.type === 'tags'")
            label.block.text-sm.font-medium.mb-2(style="color: var(--text-secondary)") {{ $t('campaignBuilder.selectTags') }}
            el-select(
              v-model="audience.tags"
              :placeholder="$t('campaignBuilder.selectTags')"
              size="large"
              style="width: 100%"
              multiple
              filterable
              allow-create
            )
              el-option(v-for="tag in availableTags" :key="tag" :label="tag" :value="tag")

          //- CSV Upload
          .mb-4(v-if="audience.type === 'csv'")
            label.block.text-sm.font-medium.mb-2(style="color: var(--text-secondary)") {{ $t('campaignBuilder.manualUpload') }}
            el-upload(
              :auto-upload="false"
              accept=".csv"
              :limit="1"
              :on-change="handleCsvUpload"
              drag
            )
              .py-4.text-center
                Icon(name="ph:upload-bold" size="32" style="color: var(--text-muted)")
                p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('campaignBuilder.dragCsvHere') }}
            .mt-2(v-if="audience.csvContacts.length")
              el-tag(type="success" size="small") {{ audience.csvContacts.length }} {{ $t('campaignBuilder.contactsLoaded') }}

          //- Estimated Reach
          .p-4.rounded-xl.flex.items-center.gap-4(style="background: rgba(120, 73, 255, 0.08); border: 1px solid rgba(120, 73, 255, 0.2)")
            .w-12.h-12.rounded-full.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
              Icon(name="ph:users-bold" size="24" style="color: #7849ff")
            div
              p.text-2xl.font-bold(style="color: var(--text-primary)") {{ estimatedReach.toLocaleString() }}
              p.text-sm(style="color: var(--text-muted)") {{ $t('campaignBuilder.estimatedReach') }}

        //- Exclusion List
        .glass-card.p-6
          .flex.items-center.justify-between.mb-4
            h3.text-base.font-bold(style="color: var(--text-primary)")
              Icon.mr-2(name="ph:prohibit-bold" size="18" style="color: #ef4444")
              | {{ $t('campaignBuilder.exclusionList') }}
            el-button(text type="primary" size="small" @click="addExclusion")
              Icon.mr-1(name="ph:plus-bold" size="14")
              | {{ $t('common.add') }}
          .space-y-2
            .flex.items-center.gap-2(v-for="(email, idx) in audience.exclusions" :key="idx")
              el-input(v-model="audience.exclusions[idx]" :placeholder="$t('campaignBuilder.enterEmailToExclude')" size="default")
              el-button(text type="danger" size="small" @click="audience.exclusions.splice(idx, 1)")
                Icon(name="ph:x-bold" size="14")
          p.text-sm.mt-3(v-if="!audience.exclusions.length" style="color: var(--text-muted)") {{ $t('campaignBuilder.noExclusions') }}

      //- Audience Breakdown Chart
      .col-span-1
        .glass-card.p-6.h-full
          h3.text-base.font-bold.mb-4(style="color: var(--text-primary)")
            Icon.mr-2(name="ph:chart-pie-bold" size="18" style="color: var(--accent-color, #7849ff)")
            | {{ $t('campaignBuilder.audienceBreakdown') }}
          .chart-container(ref="audienceChartRef" style="width: 100%; height: 280px")
          .space-y-2.mt-4
            .flex.items-center.justify-between(v-for="(item, idx) in audienceBreakdownData" :key="idx")
              .flex.items-center.gap-2
                .w-3.h-3.rounded-full(:style="{ background: breakdownColors[idx % breakdownColors.length] }")
                span.text-sm(style="color: var(--text-primary)") {{ item.name }}
              span.text-sm.font-bold(style="color: var(--text-primary)") {{ item.value }}

  //- ═══════════════════════════════════════════════════════════
  //- STEP 2: Email Content Editor
  //- ═══════════════════════════════════════════════════════════
  template(v-if="currentStep === 1")
    .grid.gap-6(class="grid-cols-1 lg:grid-cols-3")
      .col-span-1(class="lg:col-span-2")
        //- Subject Line Section
        .glass-card.p-6.mb-6
          h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)")
            Icon.mr-2(name="ph:text-aa-bold" size="20" style="color: var(--accent-color, #7849ff)")
            | {{ $t('campaignBuilder.subjectLine') }}

          //- Subject Line A
          .mb-4
            .flex.items-center.justify-between.mb-2
              label.block.text-sm.font-medium(style="color: var(--text-secondary)") {{ $t('campaignBuilder.subjectLine') }} {{ abTestEnabled ? 'A' : '' }}
              span.text-xs(:style="{ color: campaign.subject.length > 60 ? '#ef4444' : 'var(--text-muted)' }") {{ campaign.subject.length }}/60
            el-input(
              v-model="campaign.subject"
              :placeholder="$t('campaignBuilder.subjectLinePlaceholder')"
              size="large"
              maxlength="100"
              show-word-limit
            )
              template(#suffix)
                el-dropdown(trigger="click" @command="insertToken('subject', $event)")
                  el-button(text size="small")
                    Icon(name="ph:user-bold" size="14")
                  template(#dropdown)
                    el-dropdown-menu
                      el-dropdown-item(v-for="token in personalizationTokens" :key="token.value" :command="token.value")
                        .flex.items-center.gap-2
                          Icon(name="ph:code-bold" size="14" style="color: var(--accent-color)")
                          span {{ token.label }}

          //- A/B Test Toggle
          .flex.items-center.gap-3.mb-4
            el-switch(v-model="abTestEnabled")
            span.text-sm.font-medium(style="color: var(--text-primary)") {{ $t('campaignBuilder.abTestSubject') }}

          //- Subject Line B
          .mb-4(v-if="abTestEnabled")
            .flex.items-center.justify-between.mb-2
              label.block.text-sm.font-medium(style="color: var(--text-secondary)") {{ $t('campaignBuilder.subjectLine') }} B
              span.text-xs(:style="{ color: campaign.subjectB.length > 60 ? '#ef4444' : 'var(--text-muted)' }") {{ campaign.subjectB.length }}/60
            el-input(
              v-model="campaign.subjectB"
              :placeholder="$t('campaignBuilder.subjectBPlaceholder')"
              size="large"
              maxlength="100"
              show-word-limit
            )
            .mt-3.p-3.rounded-lg(style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.2)")
              .flex.items-center.gap-2
                Icon(name="ph:info-bold" size="16" style="color: #3b82f6")
                p.text-xs(style="color: var(--text-secondary)") {{ $t('campaignBuilder.abTestInfo') }}

          //- Preview Text
          .mb-0
            label.block.text-sm.font-medium.mb-2(style="color: var(--text-secondary)") {{ $t('campaignBuilder.previewText') }}
            el-input(
              v-model="campaign.previewText"
              :placeholder="$t('campaignBuilder.previewTextPlaceholder')"
              size="large"
              maxlength="150"
              show-word-limit
            )

        //- Email Body Editor
        .glass-card.p-6.mb-6
          .flex.items-center.justify-between.mb-4
            h3.text-lg.font-bold(style="color: var(--text-primary)")
              Icon.mr-2(name="ph:article-bold" size="20" style="color: var(--accent-color, #7849ff)")
              | {{ $t('campaignBuilder.emailBody') }}
            .flex.items-center.gap-2
              el-dropdown(trigger="click" @command="insertToken('body', $event)")
                el-button(size="default" class="!rounded-lg")
                  Icon(name="ph:user-bold" size="14")
                  span.ml-1 {{ $t('campaignBuilder.personalization') }}
                template(#dropdown)
                  el-dropdown-menu
                    el-dropdown-item(v-for="token in personalizationTokens" :key="token.value" :command="token.value")
                      .flex.items-center.gap-2
                        Icon(name="ph:code-bold" size="14" style="color: var(--accent-color)")
                        span {{ token.label }}
              el-button(size="default" @click="showTemplateSelector = true" class="!rounded-lg")
                Icon(name="ph:file-text-bold" size="14")
                span.ml-1 {{ $t('campaignBuilder.templateSelector') }}

          //- Formatting Toolbar
          .toolbar.flex.items-center.gap-1.p-2.mb-3.rounded-lg(style="background: var(--bg-input, rgba(255,255,255,0.05)); border: 1px solid var(--border-default)")
            el-button-group
              el-button(text size="small" @click="execFormat('bold')")
                Icon(name="ph:text-bolder-bold" size="16")
              el-button(text size="small" @click="execFormat('italic')")
                Icon(name="ph:text-italic-bold" size="16")
              el-button(text size="small" @click="execFormat('underline')")
                Icon(name="ph:text-underline-bold" size="16")
              el-button(text size="small" @click="execFormat('strikethrough')")
                Icon(name="ph:text-strikethrough-bold" size="16")
            el-divider(direction="vertical")
            el-button-group
              el-button(text size="small" @click="execFormat('justifyLeft')")
                Icon(name="ph:text-align-left-bold" size="16")
              el-button(text size="small" @click="execFormat('justifyCenter')")
                Icon(name="ph:text-align-center-bold" size="16")
              el-button(text size="small" @click="execFormat('justifyRight')")
                Icon(name="ph:text-align-right-bold" size="16")
            el-divider(direction="vertical")
            el-button-group
              el-button(text size="small" @click="execFormat('insertUnorderedList')")
                Icon(name="ph:list-bullets-bold" size="16")
              el-button(text size="small" @click="execFormat('insertOrderedList')")
                Icon(name="ph:list-numbers-bold" size="16")
            el-divider(direction="vertical")
            el-button(text size="small" @click="insertLink")
              Icon(name="ph:link-bold" size="16")
            el-button(text size="small" @click="insertImagePlaceholder")
              Icon(name="ph:image-bold" size="16")

          //- Content Editable Area
          .email-editor-area.rounded-xl.p-4(
            ref="editorRef"
            contenteditable="true"
            @input="onEditorInput"
            @paste="onEditorPaste"
            :data-placeholder="$t('campaignBuilder.emailBodyPlaceholder')"
            style="min-height: 300px; border: 1px solid var(--border-default); background: var(--bg-input, rgba(255,255,255,0.03)); color: var(--text-primary); outline: none; line-height: 1.8; font-size: 14px"
          )

        //- CTA Button Builder
        .glass-card.p-6
          h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)")
            Icon.mr-2(name="ph:cursor-click-bold" size="20" style="color: var(--accent-color, #7849ff)")
            | {{ $t('campaignBuilder.ctaButton') }}

          .grid.gap-4(class="grid-cols-1 md:grid-cols-2")
            el-form-item(:label="$t('campaignBuilder.buttonText')")
              el-input(v-model="ctaButton.text" :placeholder="$t('campaignBuilder.buttonTextPlaceholder')" size="large")
            el-form-item(:label="$t('campaignBuilder.buttonUrl')")
              el-input(v-model="ctaButton.url" placeholder="https://" size="large")
            el-form-item(:label="$t('campaignBuilder.buttonColor')")
              el-color-picker(v-model="ctaButton.color" size="large" show-alpha)
            el-form-item(:label="$t('campaignBuilder.buttonStyle')")
              el-select(v-model="ctaButton.style" size="large" style="width: 100%")
                el-option(:label="$t('campaigns.filled')" value="filled")
                el-option(:label="$t('campaigns.outlined')" value="outlined")
                el-option(:label="$t('campaigns.rounded')" value="rounded")
                el-option(:label="$t('campaigns.pill')" value="pill")

          //- CTA Preview
          .mt-4.p-4.rounded-xl.text-center(style="background: var(--bg-input, rgba(255,255,255,0.03)); border: 1px dashed var(--border-default)")
            p.text-xs.mb-3(style="color: var(--text-muted)") {{ $t('campaignBuilder.ctaPreview') }}
            a.inline-block.px-6.py-3.font-bold.text-sm.cursor-pointer.transition-all(
              :href="ctaButton.url || '#'"
              target="_blank"
              :style="ctaButtonPreviewStyle"
            ) {{ ctaButton.text || 'Click Here' }}

      //- Right Sidebar — Personalization Tokens & Image Placeholders
      .col-span-1
        .glass-card.p-6.mb-6
          h3.text-base.font-bold.mb-4(style="color: var(--text-primary)")
            Icon.mr-2(name="ph:magic-wand-bold" size="18" style="color: var(--accent-color, #7849ff)")
            | {{ $t('campaignBuilder.personalization') }}
          .space-y-2
            .p-3.rounded-lg.cursor-pointer.transition-all(
              v-for="token in personalizationTokens"
              :key="token.value"
              style="background: var(--bg-input, rgba(255,255,255,0.03)); border: 1px solid var(--border-default)"
              @click="insertToken('body', token.value)"
              class="hover:border-[var(--accent-color,#7849ff)]"
            )
              .flex.items-center.gap-2
                Icon(name="ph:code-bold" size="14" style="color: var(--accent-color, #7849ff)")
                code.text-xs(style="color: var(--text-primary)") {{ token.value }}
              p.text-xs.mt-1(style="color: var(--text-muted)") {{ token.label }}

        .glass-card.p-6
          h3.text-base.font-bold.mb-4(style="color: var(--text-primary)")
            Icon.mr-2(name="ph:image-bold" size="18" style="color: var(--accent-color, #7849ff)")
            | {{ $t('campaignBuilder.imagePlaceholders') }}
          .space-y-3
            .p-4.rounded-xl.text-center.cursor-pointer.transition-all(
              v-for="(img, idx) in imagePlaceholders"
              :key="idx"
              style="background: var(--bg-input); border: 2px dashed var(--border-default); min-height: 80px"
              @click="triggerImageUpload(idx)"
              class="hover:border-[var(--accent-color,#7849ff)]"
            )
              template(v-if="img.url")
                img.max-h-20.mx-auto.rounded(:src="img.url" :alt="img.alt")
              template(v-else)
                Icon(name="ph:image-bold" size="32" style="color: var(--text-muted)")
                p.text-xs.mt-1(style="color: var(--text-muted)") {{ img.label }}
            el-button(text type="primary" size="small" @click="addImagePlaceholder")
              Icon.mr-1(name="ph:plus-bold" size="14")
              | {{ $t('campaignBuilder.addImage') }}

  //- ═══════════════════════════════════════════════════════════
  //- STEP 3: Send Settings
  //- ═══════════════════════════════════════════════════════════
  template(v-if="currentStep === 2")
    .grid.gap-6(class="grid-cols-1 lg:grid-cols-2")
      //- Schedule & Timezone
      .glass-card.p-6
        h3.text-lg.font-bold.mb-6(style="color: var(--text-primary)")
          Icon.mr-2(name="ph:clock-bold" size="20" style="color: var(--accent-color, #7849ff)")
          | {{ $t('campaignBuilder.schedule') }}

        .mb-6
          label.block.text-sm.font-medium.mb-2(style="color: var(--text-secondary)") {{ $t('campaignBuilder.sendWhen') }}
          el-radio-group(v-model="sendSettings.scheduleType" size="large")
            el-radio-button(value="now")
              Icon.mr-1(name="ph:paper-plane-tilt-bold" size="14")
              | {{ $t('campaignBuilder.sendNow') }}
            el-radio-button(value="later")
              Icon.mr-1(name="ph:calendar-bold" size="14")
              | {{ $t('campaignBuilder.sendLater') }}

        template(v-if="sendSettings.scheduleType === 'later'")
          .mb-4
            label.block.text-sm.font-medium.mb-2(style="color: var(--text-secondary)") {{ $t('campaignBuilder.scheduleDate') }}
            el-date-picker(
              v-model="sendSettings.scheduledDate"
              type="datetime"
              :placeholder="$t('campaignBuilder.pickDateTime')"
              size="large"
              style="width: 100%"
              value-format="YYYY-MM-DDTHH:mm:ss"
            )

        .mb-4
          label.block.text-sm.font-medium.mb-2(style="color: var(--text-secondary)") {{ $t('campaignBuilder.timezone') }}
          el-select(
            v-model="sendSettings.timezone"
            size="large"
            style="width: 100%"
            filterable
            :placeholder="$t('campaignBuilder.selectTimezone')"
          )
            el-option(:label="$t('campaigns.recipientTimezone')" value="recipient_local")
            el-option(v-for="tz in timezones" :key="tz" :label="tz" :value="tz")

      //- Throttling & Tracking
      .glass-card.p-6
        h3.text-lg.font-bold.mb-6(style="color: var(--text-primary)")
          Icon.mr-2(name="ph:gear-bold" size="20" style="color: var(--accent-color, #7849ff)")
          | {{ $t('campaignBuilder.deliverySettings') }}

        .mb-6
          label.block.text-sm.font-medium.mb-2(style="color: var(--text-secondary)") {{ $t('campaignBuilder.throttling') }}
          .flex.items-center.gap-3
            el-slider(v-model="sendSettings.throttle" :min="0" :max="1000" :step="50" style="flex: 1" show-stops)
            el-tag(size="default" type="info") {{ sendSettings.throttle || $t('campaignBuilder.noLimit') }} {{ sendSettings.throttle ? '/hr' : '' }}
          p.text-xs.mt-2(style="color: var(--text-muted)") {{ $t('campaignBuilder.throttlingHint') }}

        .mb-6
          label.block.text-sm.font-medium.mb-3(style="color: var(--text-secondary)") {{ $t('campaignBuilder.tracking') }}
          .space-y-3
            .flex.items-center.justify-between.p-3.rounded-lg(style="background: var(--bg-input, rgba(255,255,255,0.03)); border: 1px solid var(--border-default)")
              .flex.items-center.gap-2
                Icon(name="ph:envelope-open-bold" size="18" style="color: #3b82f6")
                span.text-sm(style="color: var(--text-primary)") {{ $t('campaignBuilder.openTracking') }}
              el-switch(v-model="sendSettings.openTracking")
            .flex.items-center.justify-between.p-3.rounded-lg(style="background: var(--bg-input, rgba(255,255,255,0.03)); border: 1px solid var(--border-default)")
              .flex.items-center.gap-2
                Icon(name="ph:cursor-click-bold" size="18" style="color: #22c55e")
                span.text-sm(style="color: var(--text-primary)") {{ $t('campaignBuilder.clickTracking') }}
              el-switch(v-model="sendSettings.clickTracking")

        .mb-0
          label.block.text-sm.font-medium.mb-2(style="color: var(--text-secondary)") {{ $t('campaignBuilder.replyTo') }}
          el-input(
            v-model="sendSettings.replyTo"
            placeholder="reply@company.com"
            size="large"
          )
            template(#prefix)
              Icon(name="ph:at-bold" size="16")

  //- ═══════════════════════════════════════════════════════════
  //- STEP 4: Review & Analytics
  //- ═══════════════════════════════════════════════════════════
  template(v-if="currentStep === 3")
    //- Review Summary (always shown)
    .grid.gap-6(class="grid-cols-1 lg:grid-cols-2").mb-6
      .glass-card.p-6
        h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)")
          Icon.mr-2(name="ph:check-circle-bold" size="20" style="color: #22c55e")
          | {{ $t('campaignBuilder.reviewSummary') }}
        .space-y-4
          .flex.items-center.justify-between.pb-3(style="border-bottom: 1px solid var(--border-default)")
            span.text-sm(style="color: var(--text-muted)") {{ $t('campaignBuilder.campaignName') }}
            span.text-sm.font-bold(style="color: var(--text-primary)") {{ campaign.name || '--' }}
          .flex.items-center.justify-between.pb-3(style="border-bottom: 1px solid var(--border-default)")
            span.text-sm(style="color: var(--text-muted)") {{ $t('campaignBuilder.subjectLine') }}
            span.text-sm.font-bold(style="color: var(--text-primary)") {{ campaign.subject || '--' }}
          .flex.items-center.justify-between.pb-3(v-if="abTestEnabled" style="border-bottom: 1px solid var(--border-default)")
            span.text-sm(style="color: var(--text-muted)") {{ $t('campaignBuilder.subjectLine') }} B
            span.text-sm.font-bold(style="color: var(--text-primary)") {{ campaign.subjectB || '--' }}
          .flex.items-center.justify-between.pb-3(style="border-bottom: 1px solid var(--border-default)")
            span.text-sm(style="color: var(--text-muted)") {{ $t('campaignBuilder.audience') }}
            span.text-sm.font-bold(style="color: var(--text-primary)") {{ audience.type === 'all' ? $t('campaignBuilder.allContacts') : audience.type }} ({{ estimatedReach }})
          .flex.items-center.justify-between.pb-3(style="border-bottom: 1px solid var(--border-default)")
            span.text-sm(style="color: var(--text-muted)") {{ $t('campaignBuilder.schedule') }}
            span.text-sm.font-bold(style="color: var(--text-primary)") {{ sendSettings.scheduleType === 'now' ? $t('campaignBuilder.sendNow') : sendSettings.scheduledDate || '--' }}
          .flex.items-center.justify-between
            span.text-sm(style="color: var(--text-muted)") {{ $t('campaignBuilder.tracking') }}
            .flex.items-center.gap-2
              el-tag(v-if="sendSettings.openTracking" type="success" size="small") {{ $t('campaignBuilder.openTracking') }}
              el-tag(v-if="sendSettings.clickTracking" type="success" size="small") {{ $t('campaignBuilder.clickTracking') }}

      //- Send Test Section
      .glass-card.p-6
        h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)")
          Icon.mr-2(name="ph:paper-plane-tilt-bold" size="20" style="color: var(--accent-color, #7849ff)")
          | {{ $t('campaignBuilder.sendTest') }}

        .mb-4
          label.block.text-sm.font-medium.mb-2(style="color: var(--text-secondary)") {{ $t('campaignBuilder.testEmailAddress') }}
          el-input(v-model="testEmailAddress" placeholder="test@company.com" size="large")
            template(#prefix)
              Icon(name="ph:envelope-bold" size="16")
        el-button(type="primary" @click="sendTestEmail" :loading="sendingTest" class="!rounded-2xl" size="large" style="width: 100%")
          Icon(name="ph:paper-plane-tilt-bold" size="16")
          span.ml-1 {{ $t('campaignBuilder.sendTest') }}

        el-divider

        //- Preview Mode Toggle
        h4.text-sm.font-bold.mb-3(style="color: var(--text-primary)") {{ $t('campaignBuilder.previewMode') }}
        .flex.items-center.gap-2.mb-4
          el-radio-group(v-model="previewMode" size="default")
            el-radio-button(value="desktop")
              Icon.mr-1(name="ph:desktop-bold" size="14")
              | {{ $t('campaignBuilder.desktopPreview') }}
            el-radio-button(value="mobile")
              Icon.mr-1(name="ph:device-mobile-bold" size="14")
              | {{ $t('campaignBuilder.mobilePreview') }}

        //- Sample Contact Data
        h4.text-sm.font-bold.mb-3(style="color: var(--text-primary)") {{ $t('campaignBuilder.sampleContact') }}
        .grid.gap-3(class="grid-cols-2")
          el-input(v-model="sampleContact.first_name" :placeholder="$t('campaignBuilder.firstName')" size="default")
          el-input(v-model="sampleContact.last_name" :placeholder="$t('campaignBuilder.lastName')" size="default")
          el-input(v-model="sampleContact.company_name" :placeholder="$t('campaignBuilder.companyName')" size="default")
          el-input(v-model="sampleContact.email" :placeholder="$t('common.email')" size="default")

    //- Campaign Analytics (shown when campaign.status === 'SENT')
    template(v-if="analyticsData")
      //- Stat Cards
      .grid.gap-4.mb-6(class="grid-cols-2 md:grid-cols-3 lg:grid-cols-6")
        .glass-card.p-4.text-center(v-for="stat in analyticStats" :key="stat.label")
          .w-10.h-10.rounded-full.flex.items-center.justify-center.mx-auto.mb-2(:style="{ background: stat.bgColor }")
            Icon(:name="stat.icon" size="20" :style="{ color: stat.color }")
          p.text-2xl.font-bold(style="color: var(--text-primary)") {{ stat.value }}
          p.text-xs(style="color: var(--text-muted)") {{ stat.label }}

      .grid.gap-6(class="grid-cols-1 lg:grid-cols-2")
        //- Open/Click Rate with Industry Average
        .glass-card.p-6
          h3.text-base.font-bold.mb-4(style="color: var(--text-primary)")
            Icon.mr-2(name="ph:chart-bar-bold" size="18" style="color: var(--accent-color, #7849ff)")
            | {{ $t('campaignBuilder.performanceComparison') }}
          .space-y-4
            div
              .flex.items-center.justify-between.mb-1
                span.text-sm(style="color: var(--text-primary)") {{ $t('campaignBuilder.openRate') }}
                span.text-sm.font-bold(style="color: #3b82f6") {{ analyticsData.openRate }}%
              el-progress(:percentage="analyticsData.openRate" :stroke-width="12" :show-text="false" color="#3b82f6")
              .flex.items-center.justify-between.mt-1
                span.text-xs(style="color: var(--text-muted)") {{ $t('campaignBuilder.industryAverage') }}: {{ industryAverage.openRate }}%
                span.text-xs(:style="{ color: analyticsData.openRate >= industryAverage.openRate ? '#22c55e' : '#ef4444' }")
                  | {{ analyticsData.openRate >= industryAverage.openRate ? '+' : '' }}{{ (analyticsData.openRate - industryAverage.openRate).toFixed(1) }}%
            div
              .flex.items-center.justify-between.mb-1
                span.text-sm(style="color: var(--text-primary)") {{ $t('campaignBuilder.clickRate') }}
                span.text-sm.font-bold(style="color: #22c55e") {{ analyticsData.clickRate }}%
              el-progress(:percentage="analyticsData.clickRate * 3" :stroke-width="12" :show-text="false" color="#22c55e")
              .flex.items-center.justify-between.mt-1
                span.text-xs(style="color: var(--text-muted)") {{ $t('campaignBuilder.industryAverage') }}: {{ industryAverage.clickRate }}%
                span.text-xs(:style="{ color: analyticsData.clickRate >= industryAverage.clickRate ? '#22c55e' : '#ef4444' }")
                  | {{ analyticsData.clickRate >= industryAverage.clickRate ? '+' : '' }}{{ (analyticsData.clickRate - industryAverage.clickRate).toFixed(1) }}%

        //- Click Heatmap
        .glass-card.p-6
          h3.text-base.font-bold.mb-4(style="color: var(--text-primary)")
            Icon.mr-2(name="ph:fire-bold" size="18" style="color: #f59e0b")
            | {{ $t('campaignBuilder.clickHeatmap') }}
          .space-y-3(v-if="analyticsData.linkClicks?.length")
            .flex.items-center.gap-3(v-for="(link, idx) in analyticsData.linkClicks" :key="idx")
              .flex-1
                .flex.items-center.justify-between.mb-1
                  span.text-sm.truncate(style="color: var(--text-primary); max-width: 250px") {{ link.url }}
                  span.text-sm.font-bold(style="color: var(--text-primary)") {{ link.clicks }}
                el-progress(:percentage="link.percentage" :stroke-width="8" :show-text="false" :color="heatmapColor(link.percentage)")
          .text-center.py-6(v-else)
            Icon(name="ph:cursor-click" size="32" style="color: var(--text-muted)")
            p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('campaignBuilder.noClickData') }}

      //- Timeline Chart
      .glass-card.p-6.mt-6
        h3.text-base.font-bold.mb-4(style="color: var(--text-primary)")
          Icon.mr-2(name="ph:chart-line-bold" size="18" style="color: var(--accent-color, #7849ff)")
          | {{ $t('campaignBuilder.engagementTimeline') }}
        .chart-container(ref="timelineChartRef" style="width: 100%; height: 300px")

  //- ═══════════════════════════════════════════════════════════
  //- Step Navigation Buttons
  //- ═══════════════════════════════════════════════════════════
  .glass-card.p-4.mt-6.flex.items-center.justify-between
    el-button(size="large" @click="prevStep" :disabled="currentStep === 0" class="!rounded-2xl")
      Icon(name="ph:arrow-left-bold" size="16")
      span.ml-1 {{ $t('campaignBuilder.previous') }}
    .flex.items-center.gap-2
      span.text-sm(style="color: var(--text-muted)") {{ $t('campaignBuilder.step') }} {{ currentStep + 1 }} / 4
    el-button(size="large" type="primary" @click="nextStep" :disabled="currentStep === 3" class="!rounded-2xl")
      span.mr-1 {{ $t('campaignBuilder.next') }}
      Icon(name="ph:arrow-right-bold" size="16")

  //- ═══════════════════════════════════════════════════════════
  //- Schedule Dialog
  //- ═══════════════════════════════════════════════════════════
  el-dialog(v-model="showScheduleDialog" :title="$t('campaignBuilder.scheduleCampaign')" width="500px")
    .space-y-4
      el-form-item(:label="$t('campaignBuilder.scheduleDate')")
        el-date-picker(
          v-model="sendSettings.scheduledDate"
          type="datetime"
          :placeholder="$t('campaignBuilder.pickDateTime')"
          size="large"
          style="width: 100%"
          value-format="YYYY-MM-DDTHH:mm:ss"
        )
      el-form-item(:label="$t('campaignBuilder.timezone')")
        el-select(v-model="sendSettings.timezone" size="large" style="width: 100%" filterable)
          el-option(:label="$t('campaigns.recipientTimezone')" value="recipient_local")
          el-option(v-for="tz in timezones" :key="tz" :label="tz" :value="tz")
    template(#footer)
      el-button(@click="showScheduleDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="scheduleCampaign" :loading="scheduling" class="!rounded-2xl") {{ $t('campaignBuilder.schedule') }}

  //- ═══════════════════════════════════════════════════════════
  //- Preview Dialog
  //- ═══════════════════════════════════════════════════════════
  el-dialog(v-model="showPreview" :title="$t('campaignBuilder.preview')" width="800px" top="5vh")
    .flex.items-center.justify-center.gap-2.mb-4
      el-radio-group(v-model="previewMode" size="default")
        el-radio-button(value="desktop")
          Icon.mr-1(name="ph:desktop-bold" size="14")
          | {{ $t('campaignBuilder.desktopPreview') }}
        el-radio-button(value="mobile")
          Icon.mr-1(name="ph:device-mobile-bold" size="14")
          | {{ $t('campaignBuilder.mobilePreview') }}
    .preview-frame-wrapper.flex.justify-center
      .preview-frame.rounded-xl.overflow-hidden(
        :style="{ width: previewMode === 'mobile' ? '375px' : '100%', border: '1px solid var(--border-default)', background: '#ffffff', transition: 'width 0.3s ease' }"
      )
        //- Email Header Preview
        .p-4(style="background: #f8f9fa; border-bottom: 1px solid #e9ecef")
          p.text-xs(style="color: #6c757d") {{ $t('campaignBuilder.from') }}: {{ sendSettings.replyTo || 'noreply@company.com' }}
          p.text-sm.font-bold(style="color: #212529") {{ resolveTokens(campaign.subject) }}
          p.text-xs(style="color: #6c757d") {{ resolveTokens(campaign.previewText) }}
        //- Email Body Preview
        .p-6(v-html="resolveTokens(campaign.htmlContent || '')" style="color: #212529; line-height: 1.6; font-size: 14px")

  //- ═══════════════════════════════════════════════════════════
  //- Template Selector Dialog
  //- ═══════════════════════════════════════════════════════════
  el-dialog(v-model="showTemplateSelector" :title="$t('campaignBuilder.templateSelector')" width="600px")
    .flex.items-center.justify-center.py-8(v-if="loadingTemplates")
      el-icon.is-loading(:size="24" style="color: var(--accent-color, #7849ff)")
    template(v-else-if="templates.length")
      .space-y-3
        .p-4.rounded-xl.cursor-pointer.transition-all(
          v-for="tmpl in templates"
          :key="tmpl.id"
          style="background: var(--bg-input); border: 1px solid var(--border-default)"
          @click="applyTemplate(tmpl)"
          class="hover:border-[var(--accent-color,#7849ff)]"
        )
          .flex.items-center.justify-between
            div
              h4.font-bold(style="color: var(--text-primary)") {{ tmpl.name }}
              p.text-sm(style="color: var(--text-muted)") {{ tmpl.subject }}
            el-button(type="primary" size="small" class="!rounded-lg")
              Icon(name="ph:check-bold" size="14")
              span.ml-1 {{ $t('campaignBuilder.useTemplate') }}
    template(v-else)
      .text-center.py-8
        Icon(name="ph:file-text" size="48" style="color: var(--text-muted)")
        p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('campaigns.noTemplates') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick, markRaw, h, shallowRef } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as echarts from 'echarts/core';
import { useSafeBack } from '~/composables/useSafeBack';
import {
  fetchCampaigns,
  fetchCampaign,
  createCampaign,
  updateCampaign,
  sendCampaign,
  fetchCampaignAnalytics,
  addRecipients,
  fetchTemplates,
  type Campaign,
  type EmailTemplate
} from '~/composables/useCampaigns';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;
const route = useRoute();
const router = useRouter();

// ── Step Icons (rendered as raw functional components) ──
const StepAudienceIcon = markRaw({
  render() {
    return h('span', { class: 'flex items-center justify-center' }, [h(resolveComponent('Icon'), { name: 'ph:users-three-bold', size: '18' })]);
  }
});
const StepContentIcon = markRaw({
  render() {
    return h('span', { class: 'flex items-center justify-center' }, [h(resolveComponent('Icon'), { name: 'ph:article-bold', size: '18' })]);
  }
});
const StepSettingsIcon = markRaw({
  render() {
    return h('span', { class: 'flex items-center justify-center' }, [h(resolveComponent('Icon'), { name: 'ph:gear-bold', size: '18' })]);
  }
});
const StepReviewIcon = markRaw({
  render() {
    return h('span', { class: 'flex items-center justify-center' }, [h(resolveComponent('Icon'), { name: 'ph:check-circle-bold', size: '18' })]);
  }
});

// ── State ──
const currentStep = ref(0);
const saving = ref(false);
const sending = ref(false);
const scheduling = ref(false);
const sendingTest = ref(false);
const loadingTemplates = ref(false);
const showScheduleDialog = ref(false);
const showPreview = ref(false);
const showTemplateSelector = ref(false);
const previewMode = ref<'desktop' | 'mobile'>('desktop');
const abTestEnabled = ref(false);
const editorRef = ref<HTMLElement | null>(null);
const audienceChartRef = ref<HTMLElement | null>(null);
const timelineChartRef = ref<HTMLElement | null>(null);
const templates = ref<EmailTemplate[]>([]);
const testEmailAddress = ref('');
const campaignId = ref<string | null>(null);

// ── Campaign Data ──
const campaign = reactive({
  name: '',
  subject: '',
  subjectB: '',
  previewText: '',
  htmlContent: '',
  status: 'Draft'
});

// ── Audience ──
const audience = reactive({
  type: 'all' as 'all' | 'segment' | 'tags' | 'csv',
  segmentId: '',
  tags: [] as string[],
  csvContacts: [] as { email: string; name: string }[],
  exclusions: [] as string[]
});

const segments = ref([
  { id: 'seg-1', name: 'Active Customers', count: 2450 },
  { id: 'seg-2', name: 'New Leads (30 days)', count: 890 },
  { id: 'seg-3', name: 'High Value Clients', count: 340 },
  { id: 'seg-4', name: 'Inactive (90+ days)', count: 1200 },
  { id: 'seg-5', name: 'Newsletter Subscribers', count: 5600 },
  { id: 'seg-6', name: 'Trial Users', count: 420 }
]);

const availableTags = ref([
  'VIP',
  'Prospect',
  'Warm Lead',
  'Hot Lead',
  'Decision Maker',
  'Influencer',
  'Enterprise',
  'SMB',
  'Startup',
  'Partner',
  'Churned',
  'Re-engaged',
  'Demo Requested'
]);

const estimatedReach = computed(() => {
  const exclusionCount = audience.exclusions.filter(e => e.trim()).length;
  let base = 0;
  switch (audience.type) {
    case 'all':
      base = 10880;
      break;
    case 'segment':
      base = segments.value.find(s => s.id === audience.segmentId)?.count || 0;
      break;
    case 'tags':
      base = audience.tags.length * 320;
      break;
    case 'csv':
      base = audience.csvContacts.length;
      break;
  }
  return Math.max(0, base - exclusionCount);
});

// ── Audience Breakdown ──
const breakdownColors = ['#7849ff', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

const audienceBreakdownData = computed(() => {
  if (audience.type === 'tags' && audience.tags.length) {
    return audience.tags.map((tag, i) => ({ name: tag, value: Math.floor(Math.random() * 400) + 100 }));
  }
  return [
    { name: 'Website', value: 3200 },
    { name: 'Import', value: 2100 },
    { name: 'Manual', value: 1800 },
    { name: 'API', value: 1400 },
    { name: 'Referral', value: 980 },
    { name: 'Social', value: 640 }
  ];
});

// ── CTA Button ──
const ctaButton = reactive({
  text: 'Get Started',
  url: '',
  color: '#7849ff',
  style: 'filled' as 'filled' | 'outlined' | 'rounded' | 'pill'
});

const ctaButtonPreviewStyle = computed(() => {
  const base: Record<string, string> = {
    color: ctaButton.style === 'outlined' ? ctaButton.color || '#7849ff' : '#ffffff',
    'text-decoration': 'none',
    'letter-spacing': '0.5px',
    transition: 'all 0.2s ease'
  };
  switch (ctaButton.style) {
    case 'filled':
      return { ...base, background: ctaButton.color || '#7849ff', 'border-radius': '8px', border: 'none' };
    case 'outlined':
      return { ...base, background: 'transparent', border: `2px solid ${ctaButton.color || '#7849ff'}`, 'border-radius': '8px' };
    case 'rounded':
      return { ...base, background: ctaButton.color || '#7849ff', 'border-radius': '12px', border: 'none' };
    case 'pill':
      return { ...base, background: ctaButton.color || '#7849ff', 'border-radius': '50px', border: 'none' };
    default:
      return { ...base, background: ctaButton.color || '#7849ff', 'border-radius': '8px', border: 'none' };
  }
});

// ── Personalization Tokens ──
const personalizationTokens = [
  { value: '{{first_name}}', label: 'First Name' },
  { value: '{{last_name}}', label: 'Last Name' },
  { value: '{{full_name}}', label: 'Full Name' },
  { value: '{{email}}', label: 'Email Address' },
  { value: '{{company_name}}', label: 'Company Name' },
  { value: '{{phone}}', label: 'Phone Number' },
  { value: '{{city}}', label: 'City' },
  { value: '{{country}}', label: 'Country' },
  { value: '{{unsubscribe_link}}', label: 'Unsubscribe Link' }
];

// ── Image Placeholders ──
const imagePlaceholders = ref([
  { label: 'Header Image (600x200)', url: '', alt: 'Header' },
  { label: 'Body Image (600x400)', url: '', alt: 'Content' }
]);

function addImagePlaceholder() {
  imagePlaceholders.value.push({ label: `Image ${imagePlaceholders.value.length + 1}`, url: '', alt: '' });
}

function triggerImageUpload(_idx: number) {
  // Placeholder for image upload trigger
  ElMessage.info(t('campaignBuilder.imageUploadHint'));
}

// ── Send Settings ──
const sendSettings = reactive({
  scheduleType: 'now' as 'now' | 'later',
  scheduledDate: '',
  timezone: 'recipient_local',
  throttle: 0,
  openTracking: true,
  clickTracking: true,
  replyTo: ''
});

const timezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Riyadh',
  'Australia/Sydney',
  'Pacific/Auckland',
  'Africa/Cairo',
  'America/Sao_Paulo'
];

// ── Sample Contact for Preview ──
const sampleContact = reactive({
  first_name: 'John',
  last_name: 'Doe',
  company_name: 'Acme Corp',
  email: 'john.doe@acme.com'
});

// ── Analytics Data (populated when campaign is sent) ──
const analyticsData = ref<any>(null);
const industryAverage = { openRate: 21.5, clickRate: 2.6 };

const analyticStats = computed(() => {
  if (!analyticsData.value) return [];
  const d = analyticsData.value;
  return [
    {
      label: t('campaignBuilder.sent'),
      value: d.totalSent?.toLocaleString() || '0',
      icon: 'ph:paper-plane-tilt-bold',
      color: '#3b82f6',
      bgColor: 'rgba(59,130,246,0.12)'
    },
    {
      label: t('campaignBuilder.delivered'),
      value: d.delivered?.toLocaleString() || '0',
      icon: 'ph:check-circle-bold',
      color: '#22c55e',
      bgColor: 'rgba(34,197,94,0.12)'
    },
    {
      label: t('campaignBuilder.opened'),
      value: d.opened?.toLocaleString() || '0',
      icon: 'ph:envelope-open-bold',
      color: '#8b5cf6',
      bgColor: 'rgba(139,92,246,0.12)'
    },
    {
      label: t('campaignBuilder.clicked'),
      value: d.clicked?.toLocaleString() || '0',
      icon: 'ph:cursor-click-bold',
      color: '#f59e0b',
      bgColor: 'rgba(245,158,11,0.12)'
    },
    {
      label: t('campaignBuilder.bounced'),
      value: d.bounced?.toLocaleString() || '0',
      icon: 'ph:arrow-u-up-left-bold',
      color: '#ef4444',
      bgColor: 'rgba(239,68,68,0.12)'
    },
    {
      label: t('campaignBuilder.unsubscribed'),
      value: d.unsubscribed?.toLocaleString() || '0',
      icon: 'ph:user-minus-bold',
      color: '#64748b',
      bgColor: 'rgba(100,116,139,0.12)'
    }
  ];
});

// ── Status Tag Color ──
const statusTagType = computed(() => {
  const map: Record<string, string> = {
    Draft: 'info',
    Scheduled: 'warning',
    Sending: '',
    Sent: 'success',
    Paused: 'danger'
  };
  return (map[campaign.status] || 'info') as any;
});

// ── Step Navigation ──
function nextStep() {
  if (currentStep.value < 3) {
    currentStep.value++;
    if (currentStep.value === 3 && campaign.status === 'Sent') {
      loadAnalytics();
    }
  }
}

function prevStep() {
  if (currentStep.value > 0) currentStep.value--;
}

// ── Editor Functions ──
function execFormat(command: string) {
  document.execCommand(command, false);
  editorRef.value?.focus();
}

function insertLink() {
  const url = prompt('Enter URL:');
  if (url) {
    document.execCommand('createLink', false, url);
    editorRef.value?.focus();
  }
}

function insertImagePlaceholder() {
  document.execCommand(
    'insertHTML',
    false,
    '<div style="padding: 20px; margin: 10px 0; border: 2px dashed #ccc; text-align: center; color: #999; border-radius: 8px;">[Image Placeholder]</div>'
  );
  editorRef.value?.focus();
}

function insertToken(target: 'subject' | 'body', token: string) {
  if (target === 'subject') {
    campaign.subject += ` ${token}`;
  } else if (editorRef.value) {
    editorRef.value.focus();
    document.execCommand('insertText', false, token);
  }
}

function onEditorInput() {
  if (editorRef.value) {
    campaign.htmlContent = editorRef.value.innerHTML;
  }
}

function onEditorPaste(event: ClipboardEvent) {
  event.preventDefault();
  const text = event.clipboardData?.getData('text/plain') || '';
  document.execCommand('insertText', false, text);
}

// ── CSV Upload ──
function handleCsvUpload(file: any) {
  const reader = new FileReader();
  reader.onload = e => {
    const text = e.target?.result as string;
    if (!text) return;
    const lines = text.split('\n').filter(l => l.trim());
    const contacts: { email: string; name: string }[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i]!.split(',');
      const email = parts[0]?.trim();
      const name = parts[1]?.trim() || email?.split('@')[0] || '';
      if (email && email.includes('@')) {
        contacts.push({ email, name });
      }
    }
    audience.csvContacts = contacts;
    ElMessage.success(`${contacts.length} ${t('campaignBuilder.contactsLoaded')}`);
  };
  reader.readAsText(file.raw);
}

function addExclusion() {
  audience.exclusions.push('');
}

// ── Token Resolution for Preview ──
function resolveTokens(text: string): string {
  if (!text) return '';
  return text
    .replace(/\{\{first_name\}\}/g, sampleContact.first_name)
    .replace(/\{\{last_name\}\}/g, sampleContact.last_name)
    .replace(/\{\{full_name\}\}/g, `${sampleContact.first_name} ${sampleContact.last_name}`)
    .replace(/\{\{company_name\}\}/g, sampleContact.company_name)
    .replace(/\{\{email\}\}/g, sampleContact.email)
    .replace(/\{\{phone\}\}/g, '+1 (555) 123-4567')
    .replace(/\{\{city\}\}/g, 'San Francisco')
    .replace(/\{\{country\}\}/g, 'United States')
    .replace(/\{\{unsubscribe_link\}\}/g, '#unsubscribe');
}

// ── Heatmap Color ──
function heatmapColor(percentage: number): string {
  if (percentage >= 70) return '#ef4444';
  if (percentage >= 40) return '#f59e0b';
  return '#3b82f6';
}

// ── API Actions ──
async function saveDraft() {
  if (!campaign.name.trim()) {
    ElMessage.warning(t('campaignBuilder.enterCampaignName'));
    return;
  }
  saving.value = true;
  try {
    const payload: any = {
      name: campaign.name,
      subject: campaign.subject,
      htmlContent: campaign.htmlContent,
      status: 'DRAFT'
    };
    let res;
    if (campaignId.value) {
      res = await updateCampaign(campaignId.value, payload);
    } else {
      res = await createCampaign(payload);
      if (res.success && res.body?.id) {
        campaignId.value = res.body.id;
      }
    }
  } finally {
    saving.value = false;
  }
}

async function confirmSendNow() {
  try {
    await ElMessageBox.confirm(t('campaignBuilder.confirmSend'), t('common.warning'), {
      type: 'warning',
      confirmButtonText: t('campaignBuilder.sendCampaign'),
      cancelButtonText: t('common.cancel')
    });
    sending.value = true;
    await saveDraft();
    if (campaignId.value) {
      const res = await sendCampaign(campaignId.value);
      if (res.success) {
        campaign.status = 'Sent';
        currentStep.value = 3;
        await loadAnalytics();
      }
    }
  } catch {
    // User cancelled
  } finally {
    sending.value = false;
  }
}

async function scheduleCampaign() {
  if (!sendSettings.scheduledDate) {
    ElMessage.warning(t('campaignBuilder.pickDateTime'));
    return;
  }
  scheduling.value = true;
  try {
    await saveDraft();
    if (campaignId.value) {
      const res = await updateCampaign(campaignId.value, {
        status: 'SCHEDULED',
        scheduledAt: sendSettings.scheduledDate
      } as any);
      if (res.success) {
        campaign.status = 'Scheduled';
        showScheduleDialog.value = false;
        ElMessage.success(t('campaignBuilder.campaignScheduled'));
      }
    }
  } finally {
    scheduling.value = false;
  }
}

async function sendTestEmail() {
  if (!testEmailAddress.value.trim()) {
    ElMessage.warning(t('campaignBuilder.enterTestEmail'));
    return;
  }
  sendingTest.value = true;
  try {
    await saveDraft();
    if (campaignId.value) {
      await addRecipients(campaignId.value, [{ email: testEmailAddress.value, name: 'Test' }]);
      ElMessage.success(t('campaignBuilder.testEmailSent'));
    }
  } finally {
    sendingTest.value = false;
  }
}

async function loadAnalytics() {
  if (!campaignId.value) return;
  const data = await fetchCampaignAnalytics(campaignId.value);
  if (data) {
    analyticsData.value = {
      totalSent: data.totalSent || 0,
      delivered: data.delivered || Math.round((data.totalSent || 0) * 0.97),
      opened: data.opened || Math.round((data.totalSent || 0) * 0.24),
      clicked: data.clicked || Math.round((data.totalSent || 0) * 0.035),
      bounced: data.bounced || Math.round((data.totalSent || 0) * 0.03),
      unsubscribed: data.unsubscribed || Math.round((data.totalSent || 0) * 0.005),
      openRate: data.openRate || 24.2,
      clickRate: data.clickRate || 3.5,
      linkClicks: data.linkClicks || [
        { url: 'https://example.com/pricing', clicks: 245, percentage: 100 },
        { url: 'https://example.com/features', clicks: 189, percentage: 77 },
        { url: 'https://example.com/demo', clicks: 134, percentage: 55 },
        { url: 'https://example.com/blog', clicks: 67, percentage: 27 }
      ],
      timeline: data.timeline || []
    };
    await nextTick();
    initTimelineChart();
  }
}

function applyTemplate(tmpl: EmailTemplate) {
  campaign.subject = tmpl.subject;
  campaign.htmlContent = tmpl.htmlContent;
  if (editorRef.value) {
    editorRef.value.innerHTML = tmpl.htmlContent;
  }
  showTemplateSelector.value = false;
  ElMessage.success(t('campaignBuilder.templateApplied'));
}

// ── ECharts: Audience Breakdown ──
let audienceChart: echarts.ECharts | null = null;

function initAudienceChart() {
  if (!audienceChartRef.value) return;
  audienceChart = echarts.init(audienceChartRef.value);
  const option: echarts.EChartsOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: 'transparent', borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' }
        },
        data: audienceBreakdownData.value.map((item, idx) => ({
          name: item.name,
          value: item.value,
          itemStyle: { color: breakdownColors[idx % breakdownColors.length] }
        }))
      }
    ]
  };
  audienceChart.setOption(option);
}

// ── ECharts: Timeline Chart ──
let timelineChart: echarts.ECharts | null = null;

function initTimelineChart() {
  if (!timelineChartRef.value) return;
  timelineChart = echarts.init(timelineChartRef.value);
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const openData = hours.map(() => Math.floor(Math.random() * 100) + 10);
  const clickData = hours.map(() => Math.floor(Math.random() * 30) + 2);
  const option: echarts.EChartsOption = {
    tooltip: { trigger: 'axis' },
    legend: {
      data: [t('campaignBuilder.opened'), t('campaignBuilder.clicked')],
      textStyle: { color: 'var(--text-muted)' },
      bottom: 0
    },
    grid: { top: 10, right: 20, bottom: 40, left: 50 },
    xAxis: {
      type: 'category',
      data: hours,
      axisLabel: { color: 'var(--text-muted)', fontSize: 11 },
      axisLine: { lineStyle: { color: 'var(--border-default)' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: 'var(--text-muted)', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
    },
    series: [
      {
        name: t('campaignBuilder.opened'),
        type: 'line',
        smooth: true,
        data: openData,
        lineStyle: { color: '#8b5cf6', width: 2 },
        itemStyle: { color: '#8b5cf6' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(139, 92, 246, 0.3)' },
            { offset: 1, color: 'rgba(139, 92, 246, 0.02)' }
          ])
        }
      },
      {
        name: t('campaignBuilder.clicked'),
        type: 'line',
        smooth: true,
        data: clickData,
        lineStyle: { color: '#22c55e', width: 2 },
        itemStyle: { color: '#22c55e' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(34, 197, 94, 0.3)' },
            { offset: 1, color: 'rgba(34, 197, 94, 0.02)' }
          ])
        }
      }
    ]
  };
  timelineChart.setOption(option);
}

// ── Load campaign data if editing ──
async function loadExistingCampaign() {
  const id = route.query.id as string;
  if (id) {
    campaignId.value = id;
    const data = await fetchCampaign(id);
    if (data) {
      campaign.name = data.name || '';
      campaign.subject = data.subject || '';
      campaign.htmlContent = data.htmlContent || '';
      campaign.status = data.status || 'Draft';
      if (editorRef.value) {
        editorRef.value.innerHTML = data.htmlContent || '';
      }
      if (data.status === 'SENT') {
        campaign.status = 'Sent';
        currentStep.value = 3;
        await loadAnalytics();
      }
    }
  }
}

// ── Resize handler ──
function handleResize() {
  audienceChart?.resize();
  timelineChart?.resize();
}

// ── Lifecycle ──
onMounted(async () => {
  await loadExistingCampaign();

  // Load templates
  loadingTemplates.value = true;
  templates.value = await fetchTemplates();
  loadingTemplates.value = false;

  // Init audience chart on step 0
  await nextTick();
  if (currentStep.value === 0) {
    initAudienceChart();
  }

  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  audienceChart?.dispose();
  timelineChart?.dispose();
});

// Watch step changes to init charts
watch(currentStep, async step => {
  await nextTick();
  if (step === 0) initAudienceChart();
  if (step === 3 && analyticsData.value) initTimelineChart();
});

// Update audience chart when breakdown data changes
watch(
  audienceBreakdownData,
  () => {
    if (currentStep.value === 0 && audienceChart) {
      audienceChart.setOption({
        series: [
          {
            data: audienceBreakdownData.value.map((item, idx) => ({
              name: item.name,
              value: item.value,
              itemStyle: { color: breakdownColors[idx % breakdownColors.length] }
            }))
          }
        ]
      });
    }
  },
  { deep: true }
);
</script>

<style lang="scss" scoped>
.campaign-builder-page {
  padding: 24px;
  animation: fadeInUp 0.5s ease-out;
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

.campaign-name-input {
  :deep(.el-input__inner) {
    font-size: 1.25rem;
    font-weight: 700;
    border: none;
    background: transparent;
    padding-left: 0;
    color: var(--text-primary);

    &:focus {
      border-bottom: 2px solid var(--accent-color, #7849ff);
    }
  }
  :deep(.el-input__wrapper) {
    box-shadow: none;
    background: transparent;
    &.is-focus {
      box-shadow: none;
      border-bottom: 2px solid var(--accent-color, #7849ff);
    }
  }
}

.email-editor-area {
  cursor: text;
  word-wrap: break-word;
  overflow-y: auto;

  &:empty::before {
    content: attr(data-placeholder);
    color: var(--text-muted, #888);
    pointer-events: none;
  }

  &:focus {
    border-color: var(--accent-color, #7849ff) !important;
    box-shadow: 0 0 0 2px rgba(120, 73, 255, 0.1);
  }

  // Rich text styles
  :deep(h1),
  :deep(h2),
  :deep(h3) {
    color: var(--text-primary);
    margin-bottom: 8px;
  }

  :deep(a) {
    color: var(--accent-color, #7849ff);
    text-decoration: underline;
  }

  :deep(ul),
  :deep(ol) {
    padding-inline-start: 24px;
    margin-bottom: 12px;
  }

  :deep(img) {
    max-width: 100%;
    border-radius: 8px;
  }
}

.toolbar {
  :deep(.el-button) {
    padding: 6px 8px;
    color: var(--text-primary) !important;
    &:hover {
      background: rgba(120, 73, 255, 0.1);
    }
  }
}

.glass-card {
  border-radius: 16px;
}

.preview-frame-wrapper {
  max-height: 70vh;
  overflow-y: auto;
}

// Steps customization
:deep(.el-steps) {
  .el-step__head.is-finish {
    .el-step__icon {
      border-color: #22c55e;
      color: #22c55e;
    }
  }
  .el-step__head.is-process {
    .el-step__icon {
      border-color: var(--accent-color, #7849ff);
      color: var(--accent-color, #7849ff);
      background: rgba(120, 73, 255, 0.1);
    }
  }
  .el-step__title.is-process {
    color: var(--text-primary);
    font-weight: 700;
  }
  .el-step__title.is-finish {
    color: #22c55e;
  }
}

// Responsive
@media (max-width: 768px) {
  .campaign-builder-page {
    padding: 12px;
  }
}
</style>
