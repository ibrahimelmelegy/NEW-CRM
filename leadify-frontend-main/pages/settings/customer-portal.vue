<template lang="pug">
.customer-portal-page.p-8
  //- Header
  .flex.items-center.justify-between.mb-8
    .flex.items-center.gap-4
      el-button(circle plain @click="goBack()" :aria-label="$t('errors.goBack')" class="!w-11 !h-11")
        Icon(name="ph:arrow-left-bold" size="18")
      div
        h2.text-3xl.font-black(style="color: var(--text-primary)") {{ $t('customerPortal.title') }}
        p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('customerPortal.subtitle') }}
    .flex.items-center.gap-3
      el-button(
        size="large"
        @click="handleReset"
        class="!rounded-xl !px-6"
      )
        Icon.mr-2(name="ph:arrow-counter-clockwise-bold" size="16")
        | {{ $t('common.reset') }}
      el-button(
        type="primary"
        size="large"
        :loading="saving"
        @click="handleSave"
        class="!rounded-xl !px-8"
      )
        Icon.mr-2(name="ph:floppy-disk-bold" size="16")
        | {{ $t('common.save') }}

  //- Loading
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-icon.is-loading(:size="32" style="color: var(--accent-color, #7849ff)")

  //- Main Tabs
  template(v-else)
    el-tabs(v-model="activeTab" class="portal-tabs")

      //- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //- TAB 1: Configuration
      //- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      el-tab-pane(:label="$t('customerPortal.configuration')" name="configuration")
        .grid.gap-6(class="grid-cols-1 lg:grid-cols-2")

          //- General Settings Card
          .glass-card.rounded-2xl.p-6
            .flex.items-center.gap-3.mb-6
              .icon-box(style="background: rgba(120, 73, 255, 0.1)")
                Icon(name="ph:gear-bold" size="24" style="color: #7849ff")
              div
                h3.text-sm.font-semibold(style="color: var(--text-primary)") {{ $t('customerPortal.generalSettings') }}
                p.text-xs(style="color: var(--text-muted)") {{ $t('customerPortal.generalSettingsDesc') }}

            .space-y-5
              div
                label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('customerPortal.portalUrl') }}
                el-input(v-model="config.portalUrl" placeholder="portal.yourcompany.com" size="large")
                  template(#prefix)
                    Icon(name="ph:globe-bold" size="16")
                  template(#prepend) https://

              div
                label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('customerPortal.portalTitle') }}
                el-input(v-model="config.portalTitle" :placeholder="$t('customerPortal.portalTitlePlaceholder')" size="large")
                  template(#prefix)
                    Icon(name="ph:text-aa-bold" size="16")

              div
                label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('customerPortal.welcomeMessage') }}
                el-input(
                  v-model="config.welcomeMessage"
                  type="textarea"
                  :rows="3"
                  :placeholder="$t('customerPortal.welcomeMessagePlaceholder')"
                )

              div
                label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('customerPortal.companyLogo') }}
                .logo-upload-area.rounded-xl.p-4.text-center.cursor-pointer.transition-all(
                  @click="triggerLogoUpload"
                  @dragover.prevent
                  @drop.prevent="onLogoDrop"
                )
                  .mb-2(v-if="logoPreview")
                    img.mx-auto.object-contain(:src="logoPreview" alt="Portal logo" style="max-height: 56px")
                  div(v-else)
                    Icon.mx-auto.mb-1(name="ph:image-bold" size="32" style="color: var(--text-muted)")
                  p.text-xs(style="color: var(--text-muted)") {{ $t('customerPortal.logoHint') }}
                input.hidden(ref="logoInputRef" type="file" accept="image/png,image/jpeg,image/svg+xml" @change="handleLogoUpload")

              //- Toggles
              .space-y-4
                .flex.items-center.justify-between
                  .flex.items-center.gap-3
                    Icon(name="ph:power-bold" size="18" style="color: var(--text-secondary)")
                    span.text-sm(style="color: var(--text-primary)") {{ $t('customerPortal.enablePortal') }}
                  el-switch(v-model="config.enabled" active-color="#7849ff")

                .flex.items-center.justify-between
                  .flex.items-center.gap-3
                    Icon(name="ph:user-plus-bold" size="18" style="color: var(--text-secondary)")
                    span.text-sm(style="color: var(--text-primary)") {{ $t('customerPortal.selfRegistration') }}
                  el-switch(v-model="config.selfRegistration" active-color="#7849ff")

                .flex.items-center.justify-between
                  .flex.items-center.gap-3
                    Icon(name="ph:envelope-simple-bold" size="18" style="color: var(--text-secondary)")
                    span.text-sm(style="color: var(--text-primary)") {{ $t('customerPortal.emailVerification') }}
                  el-switch(v-model="config.emailVerification" active-color="#7849ff")

          //- Branding Card
          .glass-card.rounded-2xl.p-6
            .flex.items-center.gap-3.mb-6
              .icon-box(style="background: rgba(34, 197, 94, 0.1)")
                Icon(name="ph:paint-brush-bold" size="24" style="color: #22c55e")
              div
                h3.text-sm.font-semibold(style="color: var(--text-primary)") {{ $t('customerPortal.branding') }}
                p.text-xs(style="color: var(--text-muted)") {{ $t('customerPortal.brandingDesc') }}

            .space-y-5
              .grid.gap-4(class="grid-cols-2")
                div
                  label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('customerPortal.primaryColor') }}
                  .flex.items-center.gap-3
                    el-color-picker(v-model="config.primaryColor" size="large")
                    span.text-xs.font-mono(style="color: var(--text-muted)") {{ config.primaryColor }}
                div
                  label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('customerPortal.backgroundColor') }}
                  .flex.items-center.gap-3
                    el-color-picker(v-model="config.backgroundColor" size="large")
                    span.text-xs.font-mono(style="color: var(--text-muted)") {{ config.backgroundColor }}

              div
                label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('customerPortal.fontFamily') }}
                el-select(v-model="config.fontFamily" size="large" style="width: 100%")
                  el-option(
                    v-for="font in fontOptions"
                    :key="font.value"
                    :label="font.label"
                    :value="font.value"
                  )
                    span(:style="{ fontFamily: font.value }") {{ font.label }}

              div
                label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('customerPortal.customCss') }}
                el-input(
                  v-model="config.customCss"
                  type="textarea"
                  :rows="5"
                  placeholder="/* Custom portal CSS */"
                  class="font-mono"
                )

            //- Portal Preview
            .mt-6
              label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('customerPortal.portalPreview') }}
              .portal-preview.rounded-xl.overflow-hidden
                .preview-header-bar.p-3.flex.items-center.gap-3(:style="{ background: config.primaryColor || '#7849ff' }")
                  img.object-contain.rounded(v-if="logoPreview" :src="logoPreview" style="max-height: 24px")
                  Icon(v-else name="ph:buildings-bold" size="18" style="color: #ffffff")
                  span.text-sm.font-semibold(style="color: #ffffff") {{ config.portalTitle || 'Customer Portal' }}
                .preview-body-area.p-4(:style="{ background: config.backgroundColor || '#f8fafc', fontFamily: config.fontFamily || 'Inter, sans-serif' }")
                  .text-sm.font-medium.mb-2(style="color: #1f2937") {{ config.welcomeMessage || $t('customerPortal.welcomeMessagePlaceholder') }}
                  .grid.gap-2(class="grid-cols-3")
                    .p-2.rounded-lg.text-center(v-for="i in 3" :key="i" style="background: rgba(0,0,0,0.04)")
                      .w-6.h-6.rounded-full.mx-auto.mb-1(:style="{ background: config.primaryColor || '#7849ff', opacity: 0.2 }")
                      .text-xs(style="color: #6b7280") {{ $t('customerPortal.featurePreview') }}

      //- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //- TAB 2: Features
      //- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      el-tab-pane(:label="$t('customerPortal.features')" name="features")
        p.text-sm.mb-6(style="color: var(--text-muted)") {{ $t('customerPortal.featuresDesc') }}

        .grid.gap-4(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-3")
          .feature-card.glass-card.rounded-2xl.p-5.transition-all(
            v-for="feature in portalFeatures"
            :key="feature.key"
            :class="{ 'feature-enabled': feature.enabled }"
          )
            .flex.items-center.justify-between.mb-4
              .flex.items-center.gap-3
                .w-10.h-10.rounded-xl.flex.items-center.justify-center(:style="{ background: feature.bgColor }")
                  Icon(:name="feature.icon" size="20" :style="{ color: feature.color }")
                div
                  .text-sm.font-semibold(style="color: var(--text-primary)") {{ feature.label }}
                  .text-xs(style="color: var(--text-muted)") {{ feature.description }}
              el-switch(v-model="featureEnabledState[feature.key]" active-color="#7849ff")

            //- Preview of what customers see
            .feature-preview.rounded-xl.p-3.mt-2(v-if="feature.enabled")
              .flex.items-center.gap-2.mb-2
                Icon(name="ph:eye-bold" size="14" style="color: var(--text-muted)")
                span.text-xs.font-medium(style="color: var(--text-muted)") {{ $t('customerPortal.customerView') }}
              .space-y-1
                .flex.items-center.gap-2(v-for="item in feature.previewItems" :key="item")
                  .w-1.h-1.rounded-full(style="background: var(--text-muted)")
                  span.text-xs(style="color: var(--text-secondary)") {{ item }}

      //- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //- TAB 3: Access Control
      //- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      el-tab-pane(:label="$t('customerPortal.accessControl')" name="access")
        .grid.gap-6(class="grid-cols-1 lg:grid-cols-2")

          //- Roles Card
          .glass-card.rounded-2xl.p-6
            .flex.items-center.gap-3.mb-6
              .icon-box(style="background: rgba(59, 130, 246, 0.1)")
                Icon(name="ph:users-three-bold" size="24" style="color: #3b82f6")
              div
                h3.text-sm.font-semibold(style="color: var(--text-primary)") {{ $t('customerPortal.roles') }}
                p.text-xs(style="color: var(--text-muted)") {{ $t('customerPortal.rolesDesc') }}

            .space-y-3
              .flex.items-center.gap-4.p-4.rounded-xl(
                v-for="role in customerRoles"
                :key="role.key"
                style="background: var(--glass-bg, rgba(255,255,255,0.04)); border: 1px solid var(--glass-border, rgba(255,255,255,0.08))"
              )
                .w-10.h-10.rounded-xl.flex.items-center.justify-center(:style="{ background: role.bgColor }")
                  Icon(:name="role.icon" size="20" :style="{ color: role.color }")
                .flex-1
                  .text-sm.font-semibold(style="color: var(--text-primary)") {{ role.label }}
                  .text-xs(style="color: var(--text-muted)") {{ role.description }}
                el-tag(:type="role.tagType" size="small" round) {{ role.badge }}

          //- Security Settings Card
          .glass-card.rounded-2xl.p-6
            .flex.items-center.gap-3.mb-6
              .icon-box(style="background: rgba(239, 68, 68, 0.1)")
                Icon(name="ph:shield-check-bold" size="24" style="color: #ef4444")
              div
                h3.text-sm.font-semibold(style="color: var(--text-primary)") {{ $t('customerPortal.securitySettings') }}
                p.text-xs(style="color: var(--text-muted)") {{ $t('customerPortal.securitySettingsDesc') }}

            .space-y-5
              //- IP Whitelist
              div
                label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('customerPortal.ipWhitelist') }}
                el-input(
                  v-model="config.ipWhitelist"
                  type="textarea"
                  :rows="3"
                  :placeholder="$t('customerPortal.ipWhitelistPlaceholder')"
                )
                p.text-xs.mt-1(style="color: var(--text-muted)") {{ $t('customerPortal.ipWhitelistHint') }}

              //- Session Timeout
              div
                label.block.text-xs.font-medium.mb-2(style="color: var(--text-muted)") {{ $t('customerPortal.sessionTimeout') }}
                .flex.items-center.gap-3
                  el-slider(
                    v-model="config.sessionTimeout"
                    :min="5"
                    :max="480"
                    :step="5"
                    show-input
                    :show-input-controls="false"
                    input-size="small"
                    style="flex: 1"
                  )
                  span.text-xs.whitespace-nowrap(style="color: var(--text-muted)") {{ $t('customerPortal.minutes') }}

              //- Password Policy
              div
                label.block.text-xs.font-medium.mb-4(style="color: var(--text-muted)") {{ $t('customerPortal.passwordPolicy') }}
                .space-y-3
                  .flex.items-center.justify-between
                    span.text-sm(style="color: var(--text-primary)") {{ $t('customerPortal.minPasswordLength') }}
                    el-input-number(v-model="config.minPasswordLength" :min="6" :max="32" size="small")

                  .flex.items-center.justify-between
                    span.text-sm(style="color: var(--text-primary)") {{ $t('customerPortal.requireUppercase') }}
                    el-switch(v-model="config.requireUppercase" active-color="#7849ff")

                  .flex.items-center.justify-between
                    span.text-sm(style="color: var(--text-primary)") {{ $t('customerPortal.requireNumbers') }}
                    el-switch(v-model="config.requireNumbers" active-color="#7849ff")

                  .flex.items-center.justify-between
                    span.text-sm(style="color: var(--text-primary)") {{ $t('customerPortal.requireSpecialChars') }}
                    el-switch(v-model="config.requireSpecialChars" active-color="#7849ff")

                  .flex.items-center.justify-between
                    span.text-sm(style="color: var(--text-primary)") {{ $t('customerPortal.enforce2FA') }}
                    el-switch(v-model="config.enforce2FA" active-color="#7849ff")

      //- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //- TAB 4: Content Management
      //- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      el-tab-pane(:label="$t('customerPortal.content')" name="content")
        el-tabs(v-model="contentSubTab" type="border-card" class="content-sub-tabs")

          //- Knowledge Base Articles
          el-tab-pane(:label="$t('customerPortal.articles')" name="articles")
            .flex.items-center.justify-between.mb-4
              h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('customerPortal.articles') }}
              el-button(type="primary" @click="openArticleDialog()" class="!rounded-xl")
                Icon.mr-1(name="ph:plus-bold" size="16")
                | {{ $t('customerPortal.addArticle') }}

            //- Articles List
            .space-y-3(v-if="articles.length")
              .glass-card.p-4.flex.items-center.gap-4.cursor-move(
                v-for="(article, idx) in articles"
                :key="article.id"
                draggable="true"
                @dragstart="articleDragStart(idx)"
                @dragover.prevent
                @drop="articleDrop(idx)"
              )
                .flex.items-center.gap-2(style="min-width: 32px")
                  Icon(name="ph:dots-six-vertical-bold" size="20" style="color: var(--text-muted)")
                .flex-1
                  .flex.items-center.gap-3
                    Icon(name="ph:article-bold" size="18" style="color: var(--accent-color, #7849ff)")
                    span.text-sm.font-semibold(style="color: var(--text-primary)") {{ article.title }}
                    el-tag(:type="article.status === 'published' ? 'success' : 'info'" size="small" round) {{ article.status === 'published' ? $t('customerPortal.published') : $t('customerPortal.draft') }}
                  .text-xs.mt-1(style="color: var(--text-muted)") {{ article.category }}
                .flex.items-center.gap-2
                  el-button(size="small" @click="openArticleDialog(article)" :aria-label="$t('common.edit')" class="!rounded-lg")
                    Icon(name="ph:pencil-bold" size="14")
                  el-button(size="small" type="danger" plain @click="deleteArticle(idx)" :aria-label="$t('common.delete')" class="!rounded-lg")
                    Icon(name="ph:trash-bold" size="14")

            .text-center.py-12(v-else)
              Icon(name="ph:book-open-bold" size="48" style="color: var(--text-muted)")
              p.text-sm.mt-3(style="color: var(--text-muted)") {{ $t('customerPortal.noArticles') }}

          //- FAQ Manager
          el-tab-pane(:label="$t('customerPortal.faqs')" name="faqs")
            .flex.items-center.justify-between.mb-4
              h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('customerPortal.faqs') }}
              el-button(type="primary" @click="openFaqDialog()" class="!rounded-xl")
                Icon.mr-1(name="ph:plus-bold" size="16")
                | {{ $t('customerPortal.addFaq') }}

            .space-y-3(v-if="faqs.length")
              .glass-card.p-4(v-for="(faq, idx) in faqs" :key="faq.id")
                .flex.items-center.justify-between
                  .flex-1
                    .flex.items-center.gap-3
                      Icon(name="ph:question-bold" size="18" style="color: #f59e0b")
                      span.text-sm.font-semibold(style="color: var(--text-primary)") {{ faq.question }}
                      el-tag(size="small" round) {{ faq.category }}
                    p.text-xs.mt-2.ml-8(style="color: var(--text-muted)") {{ faq.answer }}
                  .flex.items-center.gap-2.ml-4
                    el-switch(v-model="faq.visible" active-color="#7849ff" size="small")
                    el-button(size="small" @click="openFaqDialog(faq)" :aria-label="$t('common.edit')" class="!rounded-lg")
                      Icon(name="ph:pencil-bold" size="14")
                    el-button(size="small" type="danger" plain @click="deleteFaq(idx)" :aria-label="$t('common.delete')" class="!rounded-lg")
                      Icon(name="ph:trash-bold" size="14")

            .text-center.py-12(v-else)
              Icon(name="ph:chat-circle-dots-bold" size="48" style="color: var(--text-muted)")
              p.text-sm.mt-3(style="color: var(--text-muted)") {{ $t('customerPortal.noFaqs') }}

      //- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //- TAB 5: Analytics
      //- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      el-tab-pane(:label="$t('customerPortal.analytics')" name="analytics")
        //- KPI Cards
        .grid.gap-4.mb-8(class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")
          .stat-card.glass-card.p-5(v-for="stat in analyticsStats" :key="stat.label")
            .flex.items-center.justify-between
              div
                .text-xs.font-medium.mb-1(style="color: var(--text-muted)") {{ stat.label }}
                .text-2xl.font-bold(style="color: var(--text-primary)") {{ stat.value }}
                .text-xs.mt-1(:style="{ color: stat.trendColor }")
                  Icon(:name="stat.trendIcon" size="12" class="inline")
                  |  {{ stat.trend }}
              .stat-icon(:style="{ background: stat.bgColor }")
                Icon(:name="stat.icon" size="24" :style="{ color: stat.color }")

        //- Usage Chart
        .glass-card.rounded-2xl.p-6
          .flex.items-center.justify-between.mb-6
            .flex.items-center.gap-3
              .icon-box(style="background: rgba(120, 73, 255, 0.1)")
                Icon(name="ph:chart-line-bold" size="24" style="color: #7849ff")
              div
                h3.text-sm.font-semibold(style="color: var(--text-primary)") {{ $t('customerPortal.portalUsageOverTime') }}
                p.text-xs(style="color: var(--text-muted)") {{ $t('customerPortal.last30Days') }}
            el-radio-group(v-model="chartPeriod" size="small" @change="updateChart")
              el-radio-button(value="7d") 7D
              el-radio-button(value="30d") 30D
              el-radio-button(value="90d") 90D
          .chart-container(ref="chartRef" style="height: 320px; width: 100%")

  //- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //- Article Dialog
  //- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  el-dialog(v-model="articleDialogVisible" :title="editingArticle ? $t('customerPortal.editArticle') : $t('customerPortal.addArticle')" width="640px")
    el-form(:model="articleForm" label-position="top")
      el-form-item(:label="$t('customerPortal.articleTitle')" required)
        el-input(v-model="articleForm.title" :placeholder="$t('customerPortal.articleTitlePlaceholder')")
      .grid.gap-4(class="grid-cols-2")
        el-form-item(:label="$t('customerPortal.articleCategory')")
          el-select(v-model="articleForm.category" style="width: 100%" allow-create filterable)
            el-option(v-for="cat in articleCategories" :key="cat" :label="cat" :value="cat")
        el-form-item(:label="$t('customerPortal.articleStatus')")
          el-select(v-model="articleForm.status" style="width: 100%")
            el-option(:label="$t('customerPortal.published')" value="published")
            el-option(:label="$t('customerPortal.draft')" value="draft")
      el-form-item(:label="$t('customerPortal.articleContent')" required)
        el-input(v-model="articleForm.content" type="textarea" :rows="8" :placeholder="$t('customerPortal.articleContentPlaceholder')")
    template(#footer)
      el-button(@click="articleDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="saveArticle" :loading="savingArticle") {{ $t('common.save') }}

  //- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //- FAQ Dialog
  //- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  el-dialog(v-model="faqDialogVisible" :title="editingFaq ? $t('customerPortal.editFaq') : $t('customerPortal.addFaq')" width="560px")
    el-form(:model="faqForm" label-position="top")
      el-form-item(:label="$t('customerPortal.faqQuestion')" required)
        el-input(v-model="faqForm.question" :placeholder="$t('customerPortal.faqQuestionPlaceholder')")
      el-form-item(:label="$t('customerPortal.faqAnswer')" required)
        el-input(v-model="faqForm.answer" type="textarea" :rows="4" :placeholder="$t('customerPortal.faqAnswerPlaceholder')")
      el-form-item(:label="$t('customerPortal.faqCategory')")
        el-select(v-model="faqForm.category" style="width: 100%" allow-create filterable)
          el-option(v-for="cat in faqCategories" :key="cat" :label="cat" :value="cat")
    template(#footer)
      el-button(@click="faqDialogVisible = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="saveFaq" :loading="savingFaq") {{ $t('common.save') }}
</template>

<script setup lang="ts">
/* eslint-disable require-await */
import { ref, reactive, computed, onMounted, nextTick, watch, onBeforeUnmount } from 'vue';
import { ElNotification, ElMessageBox, ElMessage } from 'element-plus';
import { useApiFetch } from '~/composables/useApiFetch';
import logger from '~/utils/logger'

const { goBack } = useSafeBack('/settings');
const { t } = useI18n();

definePageMeta({ middleware: 'permissions' });

// ── State ──
const loading = ref(true);
const saving = ref(false);
const activeTab = ref('configuration');
const contentSubTab = ref('articles');
const chartPeriod = ref('30d');
const chartRef = ref<HTMLElement | null>(null);
let chartInstance: unknown = null;
const logoInputRef = ref<HTMLInputElement | null>(null);
const logoPreview = ref('');

// ── Configuration ──
const config = reactive({
  portalUrl: '',
  portalTitle: '',
  welcomeMessage: '',
  companyLogo: '',
  enabled: false,
  selfRegistration: true,
  emailVerification: true,
  primaryColor: '#7849ff',
  backgroundColor: '#f8fafc',
  fontFamily: 'Inter, sans-serif',
  customCss: '',
  ipWhitelist: '',
  sessionTimeout: 30,
  minPasswordLength: 8,
  requireUppercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
  enforce2FA: false
});

const fontOptions = [
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Open Sans', value: "'Open Sans', sans-serif" },
  { label: 'Poppins', value: 'Poppins, sans-serif' },
  { label: 'Lato', value: 'Lato, sans-serif' },
  { label: 'Montserrat', value: 'Montserrat, sans-serif' },
  { label: 'Cairo (Arabic)', value: 'Cairo, sans-serif' },
  { label: 'System Default', value: 'system-ui, -apple-system, sans-serif' }
];

// ── Portal Features ──
const featureEnabledState = reactive<Record<string, boolean>>({
  viewDeals: true,
  viewInvoices: true,
  submitTickets: true,
  knowledgeBase: true,
  updateProfile: true,
  signContracts: false,
  documentLibrary: false,
  submitForms: false,
  liveChat: false
});

const portalFeatures = computed(() => [
  {
    key: 'viewDeals',
    label: t('customerPortal.viewDeals'),
    description: t('customerPortal.viewDealsDesc'),
    icon: 'ph:handshake-bold',
    color: '#7849ff',
    bgColor: 'rgba(120, 73, 255, 0.1)',
    enabled: featureEnabledState.viewDeals,
    previewItems: [t('customerPortal.dealPipeline'), t('customerPortal.dealAmount'), t('customerPortal.dealStage')]
  },
  {
    key: 'viewInvoices',
    label: t('customerPortal.viewInvoices'),
    description: t('customerPortal.viewInvoicesDesc'),
    icon: 'ph:receipt-bold',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    enabled: featureEnabledState.viewInvoices,
    previewItems: [t('customerPortal.invoiceList'), t('customerPortal.downloadPdf'), t('customerPortal.paymentStatus')]
  },
  {
    key: 'submitTickets',
    label: t('customerPortal.submitTickets'),
    description: t('customerPortal.submitTicketsDesc'),
    icon: 'ph:ticket-bold',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    enabled: featureEnabledState.submitTickets,
    previewItems: [t('customerPortal.createTicket'), t('customerPortal.trackStatus'), t('customerPortal.addComments')]
  },
  {
    key: 'knowledgeBase',
    label: t('customerPortal.knowledgeBase'),
    description: t('customerPortal.knowledgeBaseDesc'),
    icon: 'ph:book-open-bold',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.1)',
    enabled: featureEnabledState.knowledgeBase,
    previewItems: [t('customerPortal.browseArticles'), t('customerPortal.searchKb'), t('customerPortal.helpfulVotes')]
  },
  {
    key: 'updateProfile',
    label: t('customerPortal.updateProfile'),
    description: t('customerPortal.updateProfileDesc'),
    icon: 'ph:user-circle-bold',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    enabled: featureEnabledState.updateProfile,
    previewItems: [t('customerPortal.editDetails'), t('customerPortal.changePassword'), t('customerPortal.managePrefs')]
  },
  {
    key: 'signContracts',
    label: t('customerPortal.signContracts'),
    description: t('customerPortal.signContractsDesc'),
    icon: 'ph:signature-bold',
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.1)',
    enabled: featureEnabledState.signContracts,
    previewItems: [t('customerPortal.viewContracts'), t('customerPortal.eSign'), t('customerPortal.downloadSigned')]
  },
  {
    key: 'documentLibrary',
    label: t('customerPortal.documentLibrary'),
    description: t('customerPortal.documentLibraryDesc'),
    icon: 'ph:folder-open-bold',
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.1)',
    enabled: featureEnabledState.documentLibrary,
    previewItems: [t('customerPortal.sharedDocs'), t('customerPortal.uploadFiles'), t('customerPortal.versionHistory')]
  },
  {
    key: 'submitForms',
    label: t('customerPortal.submitForms'),
    description: t('customerPortal.submitFormsDesc'),
    icon: 'ph:textbox-bold',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    enabled: featureEnabledState.submitForms,
    previewItems: [t('customerPortal.availableForms'), t('customerPortal.formSubmissions'), t('customerPortal.formHistory')]
  },
  {
    key: 'liveChat',
    label: t('customerPortal.liveChat'),
    description: t('customerPortal.liveChatDesc'),
    icon: 'ph:chats-bold',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    enabled: featureEnabledState.liveChat,
    previewItems: [t('customerPortal.startChat'), t('customerPortal.chatHistory'), t('customerPortal.fileSharing')]
  }
]);

// ── Customer Roles ──
const customerRoles = computed(() => [
  {
    key: 'admin',
    label: t('customerPortal.admin'),
    description: t('customerPortal.adminDesc'),
    icon: 'ph:crown-bold',
    color: '#7849ff',
    bgColor: 'rgba(120, 73, 255, 0.1)',
    tagType: 'danger' as const,
    badge: t('customerPortal.fullAccess')
  },
  {
    key: 'member',
    label: t('customerPortal.member'),
    description: t('customerPortal.memberDesc'),
    icon: 'ph:user-bold',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    tagType: '' as const,
    badge: t('customerPortal.standardAccess')
  },
  {
    key: 'readOnly',
    label: t('customerPortal.readOnly'),
    description: t('customerPortal.readOnlyDesc'),
    icon: 'ph:eye-bold',
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.1)',
    tagType: 'info' as const,
    badge: t('customerPortal.viewOnly')
  }
]);

// ── Articles ──
interface Article {
  id: string;
  title: string;
  category: string;
  status: 'published' | 'draft';
  content: string;
  order: number;
}

const articles = ref<Article[]>([]);
const articleDialogVisible = ref(false);
const editingArticle = ref<Article | null>(null);
const savingArticle = ref(false);
let articleDragIdx = -1;

const articleForm = reactive({
  title: '',
  category: '',
  status: 'draft' as 'published' | 'draft',
  content: ''
});

const articleCategories = computed(() => {
  const defaults = [
    t('customerPortal.categories.gettingStarted'),
    t('customerPortal.categories.account'),
    t('customerPortal.categories.billing'),
    t('customerPortal.categories.technical')
  ];
  const cats = new Set(articles.value.map(a => a.category).filter(Boolean));
  return [...defaults, ...Array.from(cats).filter(c => !defaults.includes(c))];
});

function openArticleDialog(article?: Article) {
  if (article) {
    editingArticle.value = article;
    articleForm.title = article.title;
    articleForm.category = article.category;
    articleForm.status = article.status;
    articleForm.content = article.content;
  } else {
    editingArticle.value = null;
    articleForm.title = '';
    articleForm.category = '';
    articleForm.status = 'draft';
    articleForm.content = '';
  }
  articleDialogVisible.value = true;
}

async function saveArticle() {
  if (!articleForm.title.trim() || !articleForm.content.trim()) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('common.fillRequired') });
    return;
  }
  savingArticle.value = true;
  try {
    if (editingArticle.value) {
      const idx = articles.value.findIndex(a => a.id === editingArticle.value!.id);
      if (idx >= 0) {
        articles.value[idx] = { ...articles.value[idx], ...articleForm } as unknown;
      }
    } else {
      articles.value.push({
        id: 'art_' + Date.now(),
        title: articleForm.title,
        category: articleForm.category,
        status: articleForm.status,
        content: articleForm.content,
        order: articles.value.length + 1
      });
    }
    articleDialogVisible.value = false;
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
  } finally {
    savingArticle.value = false;
  }
}

function deleteArticle(idx: number) {
  ElMessageBox.confirm(t('common.confirmAction'), t('common.warning'), { type: 'warning' })
    .then(() => {
      articles.value.splice(idx, 1);
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
    })
    .catch((error: unknown) => {
      logger.error('Operation failed:', error);
    });
}

function articleDragStart(idx: number) {
  articleDragIdx = idx;
}

function articleDrop(idx: number) {
  if (articleDragIdx === idx || articleDragIdx < 0) return;
  const item = articles.value.splice(articleDragIdx, 1)[0]!;
  articles.value.splice(idx, 0, item);
  articles.value.forEach((a, i) => {
    a.order = i + 1;
  });
  articleDragIdx = -1;
}

// ── FAQs ──
interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  visible: boolean;
}

const faqs = ref<Faq[]>([]);
const faqDialogVisible = ref(false);
const editingFaq = ref<Faq | null>(null);
const savingFaq = ref(false);

const faqForm = reactive({
  question: '',
  answer: '',
  category: ''
});

const faqCategories = computed(() => {
  const defaults = [
    t('customerPortal.categories.general'),
    t('customerPortal.categories.billing'),
    t('customerPortal.categories.technical'),
    t('customerPortal.categories.account')
  ];
  const cats = new Set(faqs.value.map(f => f.category).filter(Boolean));
  return [...defaults, ...Array.from(cats).filter(c => !defaults.includes(c))];
});

function openFaqDialog(faq?: Faq) {
  if (faq) {
    editingFaq.value = faq;
    faqForm.question = faq.question;
    faqForm.answer = faq.answer;
    faqForm.category = faq.category;
  } else {
    editingFaq.value = null;
    faqForm.question = '';
    faqForm.answer = '';
    faqForm.category = '';
  }
  faqDialogVisible.value = true;
}

async function saveFaq() {
  if (!faqForm.question.trim() || !faqForm.answer.trim()) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('common.fillRequired') });
    return;
  }
  savingFaq.value = true;
  try {
    if (editingFaq.value) {
      const idx = faqs.value.findIndex(f => f.id === editingFaq.value!.id);
      if (idx >= 0) {
        faqs.value[idx] = { ...faqs.value[idx], ...faqForm } as unknown;
      }
    } else {
      faqs.value.push({
        id: 'faq_' + Date.now(),
        question: faqForm.question,
        answer: faqForm.answer,
        category: faqForm.category,
        visible: true
      });
    }
    faqDialogVisible.value = false;
    ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
  } finally {
    savingFaq.value = false;
  }
}

function deleteFaq(idx: number) {
  ElMessageBox.confirm(t('common.confirmAction'), t('common.warning'), { type: 'warning' })
    .then(() => {
      faqs.value.splice(idx, 1);
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.deleted') });
    })
    .catch((error: unknown) => {
      logger.error('Operation failed:', error);
    });
}

// ── Analytics ──
const analyticsData = reactive({
  activeUsers: 247,
  ticketSubmissions: 83,
  kbViews: 1542,
  loginCount: 1893
});

const analyticsStats = computed(() => [
  {
    label: t('customerPortal.activeUsers'),
    value: analyticsData.activeUsers.toLocaleString(),
    icon: 'ph:users-bold',
    color: '#7849ff',
    bgColor: 'rgba(120, 73, 255, 0.1)',
    trend: '+12.5%',
    trendColor: '#22c55e',
    trendIcon: 'ph:trend-up-bold'
  },
  {
    label: t('customerPortal.ticketSubmissions'),
    value: analyticsData.ticketSubmissions.toLocaleString(),
    icon: 'ph:ticket-bold',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    trend: '+8.3%',
    trendColor: '#22c55e',
    trendIcon: 'ph:trend-up-bold'
  },
  {
    label: t('customerPortal.kbViews'),
    value: analyticsData.kbViews.toLocaleString(),
    icon: 'ph:book-open-bold',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.1)',
    trend: '+23.1%',
    trendColor: '#22c55e',
    trendIcon: 'ph:trend-up-bold'
  },
  {
    label: t('customerPortal.loginCount'),
    value: analyticsData.loginCount.toLocaleString(),
    icon: 'ph:sign-in-bold',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    trend: '+5.7%',
    trendColor: '#22c55e',
    trendIcon: 'ph:trend-up-bold'
  }
]);

// ── ECharts ──
async function initChart() {
  if (!chartRef.value) return;
  try {
    const echarts = await import('echarts');
    if (chartInstance) chartInstance.dispose();
    chartInstance = echarts.init(chartRef.value);

    const days = chartPeriod.value === '7d' ? 7 : chartPeriod.value === '90d' ? 90 : 30;
    const labels: string[] = [];
    const loginsData: number[] = [];
    const ticketsData: number[] = [];
    const kbData: number[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
      loginsData.push(0);
      ticketsData.push(0);
      kbData.push(0);
    }

    chartInstance.setOption({
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(30, 30, 40, 0.95)',
        borderColor: 'rgba(120, 73, 255, 0.3)',
        textStyle: { color: '#e4e4e7', fontSize: 12 }
      },
      legend: {
        data: [t('customerPortal.logins'), t('customerPortal.ticketsLabel'), t('customerPortal.kbViewsLabel')],
        textStyle: { color: '#a1a1aa', fontSize: 12 },
        bottom: 0
      },
      grid: { top: 20, right: 20, bottom: 50, left: 50 },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: {
          color: '#a1a1aa',
          fontSize: 11,
          rotate: days > 30 ? 45 : 0
        },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#a1a1aa', fontSize: 11 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } }
      },
      series: [
        {
          name: t('customerPortal.logins'),
          type: 'line',
          smooth: true,
          data: loginsData,
          lineStyle: { color: '#7849ff', width: 2 },
          itemStyle: { color: '#7849ff' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(120, 73, 255, 0.25)' },
                { offset: 1, color: 'rgba(120, 73, 255, 0)' }
              ]
            }
          }
        },
        {
          name: t('customerPortal.ticketsLabel'),
          type: 'bar',
          data: ticketsData,
          itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 12
        },
        {
          name: t('customerPortal.kbViewsLabel'),
          type: 'line',
          smooth: true,
          data: kbData,
          lineStyle: { color: '#22c55e', width: 2 },
          itemStyle: { color: '#22c55e' }
        }
      ]
    });
  } catch (err) {
    logger.error('Failed to init portal analytics chart', err);
  }
}

function updateChart() {
  nextTick(() => initChart());
}

// ── Resize handler ──
function handleResize() {
  chartInstance?.resize();
}

// ── Logo Upload ──
function triggerLogoUpload() {
  logoInputRef.value?.click();
}

function handleLogoUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  processLogo(file);
}

function onLogoDrop(event: DragEvent) {
  const file = event.dataTransfer?.files?.[0];
  if (file) processLogo(file);
}

function processLogo(file: File) {
  if (file.size > 2 * 1024 * 1024) {
    ElNotification({ type: 'warning', title: t('common.warning'), message: t('customerPortal.logoSizeError') });
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    const result = e.target?.result as string;
    logoPreview.value = result;
    config.companyLogo = result;
  };
  reader.readAsDataURL(file);
}

// ── Load / Save ──
async function loadPortalConfig() {
  loading.value = true;
  try {
    const res = await useApiFetch('customer-portal/config', 'GET', {}, true);
    if (res.success && res.body) {
      const data = res.body;
      Object.keys(config).forEach(key => {
        if (data[key] !== undefined) {
          (config as unknown)[key] = data[key];
        }
      });
      if (data.companyLogo) logoPreview.value = data.companyLogo;
      if (data.articles) articles.value = data.articles;
      if (data.faqs) faqs.value = data.faqs;
      if (data.features) {
        data.features.forEach(feat => {
          if (feat.key in featureEnabledState) {
            featureEnabledState[feat.key] = feat.enabled;
          }
        });
      }
      if (data.analytics) {
        Object.assign(analyticsData, data.analytics);
      }
    }
  } catch {
    // Silently handle - portal config may not exist yet (404)
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  saving.value = true;
  try {
    const payload = {
      ...config,
      features: portalFeatures.value.map(f => ({ key: f.key, enabled: f.enabled })),
      articles: articles.value,
      faqs: faqs.value
    };
    const res = await useApiFetch('customer-portal/config', 'PUT', payload);
    if (res.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: res.message || t('common.error') });
    }
  } catch {
    ElNotification({ type: 'error', title: t('common.error'), message: t('common.error') });
  } finally {
    saving.value = false;
  }
}

async function handleReset() {
  try {
    await ElMessageBox.confirm(t('common.confirmAction'), t('common.warning'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    });
  } catch {
    return;
  }

  config.portalUrl = '';
  config.portalTitle = '';
  config.welcomeMessage = '';
  config.companyLogo = '';
  config.enabled = false;
  config.selfRegistration = true;
  config.emailVerification = true;
  config.primaryColor = '#7849ff';
  config.backgroundColor = '#f8fafc';
  config.fontFamily = 'Inter, sans-serif';
  config.customCss = '';
  config.ipWhitelist = '';
  config.sessionTimeout = 30;
  config.minPasswordLength = 8;
  config.requireUppercase = true;
  config.requireNumbers = true;
  config.requireSpecialChars = false;
  config.enforce2FA = false;
  logoPreview.value = '';
  ElNotification({ type: 'success', title: t('common.success'), message: t('common.saved') });
}

// ── Lifecycle ──
await loadPortalConfig().catch(() => {
  loading.value = false;
});

watch(activeTab, tab => {
  if (tab === 'analytics') {
    nextTick(() => initChart());
  }
});

onMounted(() => {
  window.addEventListener('resize', handleResize);
  if (activeTab.value === 'analytics') {
    nextTick(() => initChart());
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
});
</script>

<style lang="scss" scoped>
.customer-portal-page {
  animation: fadeIn 0.5s ease-out;
}

.icon-box {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
}

.stat-card {
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.feature-card {
  border: 1px solid transparent;

  &.feature-enabled {
    border-color: rgba(120, 73, 255, 0.2);
  }

  &:hover {
    transform: translateY(-1px);
  }
}

.feature-preview {
  background: var(--glass-bg, rgba(255, 255, 255, 0.04));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
}

.logo-upload-area {
  border: 2px dashed var(--glass-border, rgba(255, 255, 255, 0.12));
  transition:
    border-color 0.2s ease,
    background 0.2s ease;

  &:hover {
    border-color: var(--accent-color, #7849ff);
    background: rgba(120, 73, 255, 0.04);
  }
}

.portal-preview {
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.preview-header-bar {
  min-height: 40px;
}

.preview-body-area {
  min-height: 80px;
}

:deep(.portal-tabs) {
  .el-tabs__header {
    margin-bottom: 24px;
  }

  .el-tabs__item {
    font-size: 14px;
    font-weight: 500;
  }
}

:deep(.content-sub-tabs) {
  .el-tabs__header {
    margin-bottom: 16px;
  }
}

.chart-container {
  min-height: 320px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
