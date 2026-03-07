<template lang="pug">
.p-6.animate-entrance
  ModuleHeader(:title="$t('salesEnablement.title')" :subtitle="$t('salesEnablement.subtitle')")
    template(#actions)
      el-button(type="primary" size="large" @click="handlePrimaryAction" class="premium-btn")
        Icon(name="ph:plus-bold" size="20")
        span.mx-1 {{ primaryActionLabel }}

  //- KPI Stat Cards
  StatCards(:stats="kpiStats")

  //- Main Tabs
  .glass-card.py-6.animate-entrance
    el-tabs(v-model="activeTab" class="px-4")

      //- ============ TAB 1: BATTLE CARDS ============
      el-tab-pane(:label="$t('salesEnablement.battleCards')" name="battleCards")
        .flex.items-center.justify-between.mb-4
          .flex.items-center.gap-2
            el-input(v-model="battleCardSearch" :placeholder="$t('common.search')" clearable style="width: 220px" size="default")
              template(#prefix)
                Icon(name="ph:magnifying-glass" size="16")
          el-button(type="primary" size="default" @click="openBattleCardDialog()")
            Icon(name="ph:plus-bold" size="16")
            span.mx-1 {{ $t('salesEnablement.addBattleCard') }}

        el-table(:data="filteredBattleCards" style="width: 100%" size="default" v-loading="loading")
          el-table-column(type="index" width="50")
          el-table-column(:label="$t('salesEnablement.competitorName')" min-width="180")
            template(#default="{ row }")
              .flex.items-center.gap-2
                .w-8.h-8.rounded-lg.flex.items-center.justify-center.shrink-0(style="background: rgba(120,73,255,0.12)")
                  Icon(name="ph:shield-bold" size="16" style="color: #7849ff")
                span.font-bold(style="color: var(--text-primary)") {{ row.competitorName }}
          el-table-column(:label="$t('salesEnablement.lastUpdated')" width="140")
            template(#default="{ row }")
              span.text-xs.font-mono(style="color: var(--text-muted)") {{ formatDate(row.lastUpdated) }}
          el-table-column(:label="$t('salesEnablement.strengthAreas')" min-width="200")
            template(#default="{ row }")
              .flex.flex-wrap.gap-1
                el-tag(v-for="s in row.strengths" :key="s" size="small" type="danger" effect="plain" round) {{ s }}
          el-table-column(:label="$t('salesEnablement.weaknessAreas')" min-width="200")
            template(#default="{ row }")
              .flex.flex-wrap.gap-1
                el-tag(v-for="w in row.weaknesses" :key="w" size="small" type="success" effect="plain" round) {{ w }}
          el-table-column(:label="$t('salesEnablement.winRateAgainst')" width="140" align="center")
            template(#default="{ row }")
              .flex.items-center.justify-center.gap-1
                el-progress(:percentage="row.winRate" :stroke-width="6" :color="winRateColor(row.winRate)" :show-text="false" style="width: 60px")
                span.text-sm.font-bold(:style="{ color: winRateColor(row.winRate) }") {{ row.winRate }}%
          el-table-column(:label="$t('common.action')" width="100" fixed="right")
            template(#default="{ row }")
              el-button(text circle size="small" type="primary" :aria-label="$t('common.edit')" @click="openBattleCardDialog(row)")
                Icon(name="ph:pencil-simple" size="14")
              el-button(text circle size="small" type="danger" :aria-label="$t('common.delete')" @click="deleteBattleCard(row.id)")
                Icon(name="ph:trash" size="14")
          template(#empty)
            el-empty(:description="$t('common.noData')")

      //- ============ TAB 2: OBJECTION HANDLING ============
      el-tab-pane(:label="$t('salesEnablement.objectionHandling')" name="objections")
        .flex.items-center.justify-between.mb-4
          .flex.items-center.gap-2.flex-wrap
            el-input(v-model="objectionSearch" :placeholder="$t('common.search')" clearable style="width: 220px" size="default")
              template(#prefix)
                Icon(name="ph:magnifying-glass" size="16")
            el-select(v-model="objectionCategoryFilter" clearable :placeholder="$t('salesEnablement.allCategories')" style="width: 160px" size="default")
              el-option(:label="$t('salesEnablement.allCategories')" value="")
              el-option(:label="$t('salesEnablement.catPricing')" value="pricing")
              el-option(:label="$t('salesEnablement.catProduct')" value="product")
              el-option(:label="$t('salesEnablement.catCompetitor')" value="competitor")
              el-option(:label="$t('salesEnablement.catTiming')" value="timing")
          el-button(type="primary" size="default" @click="openObjectionDialog()")
            Icon(name="ph:plus-bold" size="16")
            span.mx-1 {{ $t('salesEnablement.addObjection') }}

        .grid.gap-4(class="grid-cols-1 md:grid-cols-2" v-loading="loading")
          .glass-card.p-5.rounded-2xl.transition-all(
            v-for="obj in filteredObjections"
            :key="obj.id"
            style="border: 1px solid var(--border-default)"
            class="hover:shadow-lg"
          )
            .flex.items-start.justify-between.mb-3
              .flex.items-center.gap-2
                .w-8.h-8.rounded-lg.flex.items-center.justify-center.shrink-0(:style="{ background: objectionCategoryBg(obj.category) }")
                  Icon(:name="objectionCategoryIcon(obj.category)" size="16" :style="{ color: objectionCategoryColor(obj.category) }")
                el-tag(size="small" :type="objectionCategoryTagType(obj.category)" effect="dark" round) {{ $t(`salesEnablement.cat${capitalize(obj.category)}`) }}
              .flex.items-center.gap-1
                el-button(text circle size="small" type="primary" :aria-label="$t('common.edit')" @click="openObjectionDialog(obj)")
                  Icon(name="ph:pencil-simple" size="14")
                el-button(text circle size="small" type="danger" :aria-label="$t('common.delete')" @click="deleteObjection(obj.id)")
                  Icon(name="ph:trash" size="14")

            //- Objection text
            .mb-3
              p.text-xs.font-bold.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('salesEnablement.objection') }}
              p.text-sm.font-semibold(style="color: var(--text-primary)") {{ obj.objectionText }}

            //- Recommended response
            .mb-3.p-3.rounded-xl(style="background: rgba(120,73,255,0.06); border-left: 3px solid #7849ff")
              p.text-xs.font-bold.uppercase.tracking-wider.mb-1(style="color: var(--text-muted)") {{ $t('salesEnablement.recommendedResponse') }}
              p.text-sm(style="color: var(--text-secondary)") {{ obj.response }}

            //- Success rate
            .flex.items-center.justify-between
              .flex.items-center.gap-2
                Icon(name="ph:chart-line-up-bold" size="14" style="color: var(--text-muted)")
                span.text-xs(style="color: var(--text-muted)") {{ $t('salesEnablement.successRate') }}
              .flex.items-center.gap-2
                el-progress(:percentage="obj.successRate" :stroke-width="6" :color="successRateColor(obj.successRate)" :show-text="false" style="width: 80px")
                span.text-sm.font-bold(:style="{ color: successRateColor(obj.successRate) }") {{ obj.successRate }}%

          //- Empty state
          .text-center.py-12.col-span-2(v-if="filteredObjections.length === 0 && !loading")
            Icon(name="ph:chat-circle-text" size="48" style="color: var(--text-muted); opacity: 0.4")
            p.text-sm.mt-3(style="color: var(--text-muted)") {{ $t('salesEnablement.noObjections') }}

      //- ============ TAB 3: PITCH DECKS & RESOURCES ============
      el-tab-pane(:label="$t('salesEnablement.pitchDecks')" name="resources")
        .flex.items-center.justify-between.mb-4
          .flex.items-center.gap-2.flex-wrap
            el-input(v-model="resourceSearch" :placeholder="$t('common.search')" clearable style="width: 220px" size="default")
              template(#prefix)
                Icon(name="ph:magnifying-glass" size="16")
            el-select(v-model="resourceTypeFilter" clearable :placeholder="$t('salesEnablement.allTypes')" style="width: 160px" size="default")
              el-option(:label="$t('salesEnablement.allTypes')" value="")
              el-option(:label="$t('salesEnablement.typePitchDeck')" value="pitch_deck")
              el-option(:label="$t('salesEnablement.typeOnePager')" value="one_pager")
              el-option(:label="$t('salesEnablement.typeCaseStudy')" value="case_study")
              el-option(:label="$t('salesEnablement.typeRoiReport')" value="roi_report")
          el-button(type="primary" size="default" @click="showUploadDialog = true")
            Icon(name="ph:upload-simple-bold" size="16")
            span.mx-1 {{ $t('salesEnablement.uploadResource') }}

        .grid.gap-4(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" v-loading="loading")
          .glass-card.rounded-2xl.overflow-hidden.transition-all(
            v-for="res in filteredResources"
            :key="res.id"
            style="border: 1px solid var(--border-default)"
            class="hover:shadow-lg"
          )
            //- Resource header visual
            .h-32.flex.items-center.justify-center.relative(:style="{ background: resourceGradient(res.type) }")
              Icon(:name="resourceIcon(res.type)" size="48" style="color: rgba(255,255,255,0.9)")
              .absolute.top-3.right-3
                el-tag(size="small" effect="dark" round :color="resourceTagColor(res.type)" style="border: none; color: #fff") {{ resourceTypeLabel(res.type) }}

            .p-4
              h3.text-sm.font-bold.mb-1.line-clamp-1(style="color: var(--text-primary)") {{ res.title }}
              p.text-xs.line-clamp-2.mb-3(style="color: var(--text-muted)") {{ res.description || '—' }}

              .grid.grid-cols-2.gap-2.mb-3
                .flex.items-center.gap-1
                  Icon(name="ph:file-bold" size="12" style="color: var(--text-muted)")
                  span.text-xs(style="color: var(--text-muted)") {{ res.fileSize }}
                .flex.items-center.gap-1
                  Icon(name="ph:calendar-bold" size="12" style="color: var(--text-muted)")
                  span.text-xs(style="color: var(--text-muted)") {{ formatDate(res.lastUpdated) }}
                .flex.items-center.gap-1
                  Icon(name="ph:download-simple-bold" size="12" style="color: var(--text-muted)")
                  span.text-xs(style="color: var(--text-muted)") {{ res.downloadCount }} {{ $t('salesEnablement.downloads') }}
                .flex.items-center.gap-1
                  Icon(name="ph:eye-bold" size="12" style="color: var(--text-muted)")
                  span.text-xs(style="color: var(--text-muted)") {{ res.viewCount }} {{ $t('salesEnablement.views') }}

              .flex.items-center.justify-between.pt-3(style="border-top: 1px solid var(--border-default)")
                .flex.items-center.gap-1
                  el-button(text size="small" type="primary" @click="downloadResource(res)")
                    Icon(name="ph:download-simple" size="14")
                    span.ml-1 {{ $t('salesEnablement.download') }}
                .flex.items-center.gap-1
                  el-button(text circle size="small" type="primary" :aria-label="$t('common.edit')" @click="openResourceEditDialog(res)")
                    Icon(name="ph:pencil-simple" size="14")
                  el-button(text circle size="small" type="danger" :aria-label="$t('common.delete')" @click="deleteResource(res.id)")
                    Icon(name="ph:trash" size="14")

          //- Empty state
          .text-center.py-12.col-span-3(v-if="filteredResources.length === 0 && !loading")
            Icon(name="ph:files" size="48" style="color: var(--text-muted); opacity: 0.4")
            p.text-sm.mt-3(style="color: var(--text-muted)") {{ $t('salesEnablement.noResources') }}

      //- ============ TAB 4: WIN/LOSS ANALYSIS ============
      el-tab-pane(:label="$t('salesEnablement.winLossAnalysis')" name="winLoss")
        //- Summary Stats Row
        .grid.gap-4.mb-6(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-4")
          .p-4.rounded-xl.border.text-center(style="border-color: var(--border-default); background: var(--bg-elevated)")
            p.text-xs.font-bold.uppercase.tracking-widest.mb-1(style="color: var(--text-muted)") {{ $t('salesEnablement.overallWinRate') }}
            p.text-2xl.font-bold(style="color: #22c55e") {{ winLossSummary.winRate }}%
          .p-4.rounded-xl.border.text-center(style="border-color: var(--border-default); background: var(--bg-elevated)")
            p.text-xs.font-bold.uppercase.tracking-widest.mb-1(style="color: var(--text-muted)") {{ $t('salesEnablement.avgDealSizeWon') }}
            p.text-2xl.font-bold(style="color: #7849ff") {{ formatCurrency(winLossSummary.avgDealSizeWon) }}
          .p-4.rounded-xl.border.text-center(style="border-color: var(--border-default); background: var(--bg-elevated)")
            p.text-xs.font-bold.uppercase.tracking-widest.mb-1(style="color: var(--text-muted)") {{ $t('salesEnablement.avgDealSizeLost') }}
            p.text-2xl.font-bold(style="color: #ef4444") {{ formatCurrency(winLossSummary.avgDealSizeLost) }}
          .p-4.rounded-xl.border.text-center(style="border-color: var(--border-default); background: var(--bg-elevated)")
            p.text-xs.font-bold.uppercase.tracking-widest.mb-1(style="color: var(--text-muted)") {{ $t('salesEnablement.totalDealsAnalyzed') }}
            p.text-2xl.font-bold(style="color: #3b82f6") {{ winLossSummary.totalDeals }}

        //- Top Reasons Charts
        .grid.gap-4.mb-6(class="grid-cols-1 md:grid-cols-2")
          .glass-card.p-5.rounded-2xl
            .flex.items-center.gap-2.mb-4
              .w-8.h-8.rounded-xl.flex.items-center.justify-center(style="background: rgba(34,197,94,0.15)")
                Icon(name="ph:trophy-bold" size="16" style="color: #22c55e")
              h3.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('salesEnablement.topWinReasons') }}
            .space-y-3
              .flex.items-center.gap-3(v-for="reason in winLossSummary.topWinReasons" :key="reason.label")
                .flex-1
                  .flex.items-center.justify-between.mb-1
                    span.text-xs.font-semibold(style="color: var(--text-primary)") {{ reason.label }}
                    span.text-xs.font-bold(style="color: #22c55e") {{ reason.count }}
                  el-progress(:percentage="reason.pct" :stroke-width="6" color="#22c55e" :show-text="false")

          .glass-card.p-5.rounded-2xl
            .flex.items-center.gap-2.mb-4
              .w-8.h-8.rounded-xl.flex.items-center.justify-center(style="background: rgba(239,68,68,0.15)")
                Icon(name="ph:x-circle-bold" size="16" style="color: #ef4444")
              h3.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('salesEnablement.topLossReasons') }}
            .space-y-3
              .flex.items-center.gap-3(v-for="reason in winLossSummary.topLossReasons" :key="reason.label")
                .flex-1
                  .flex.items-center.justify-between.mb-1
                    span.text-xs.font-semibold(style="color: var(--text-primary)") {{ reason.label }}
                    span.text-xs.font-bold(style="color: #ef4444") {{ reason.count }}
                  el-progress(:percentage="reason.pct" :stroke-width="6" color="#ef4444" :show-text="false")

        //- Recent Deals Table
        .glass-card.p-5.rounded-2xl
          .flex.items-center.gap-2.mb-4
            .w-8.h-8.rounded-xl.flex.items-center.justify-center(style="background: rgba(59,130,246,0.15)")
              Icon(name="ph:list-magnifying-glass-bold" size="16" style="color: #3b82f6")
            h3.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('salesEnablement.recentDeals') }}

          el-table(:data="recentDeals" style="width: 100%" size="default")
            el-table-column(:label="$t('salesEnablement.dealName')" min-width="180")
              template(#default="{ row }")
                span.font-bold(style="color: var(--text-primary)") {{ row.dealName }}
            el-table-column(:label="$t('salesEnablement.status')" width="120" align="center")
              template(#default="{ row }")
                el-tag(:type="row.status === 'won' ? 'success' : 'danger'" size="small" effect="dark" round)
                  Icon(:name="row.status === 'won' ? 'ph:trophy-bold' : 'ph:x-circle-bold'" size="12" class="mr-1")
                  | {{ row.status === 'won' ? $t('salesEnablement.won') : $t('salesEnablement.lost') }}
            el-table-column(:label="$t('salesEnablement.amount')" width="140" align="right")
              template(#default="{ row }")
                span.text-sm.font-bold(:style="{ color: row.status === 'won' ? '#22c55e' : '#ef4444' }") {{ formatCurrency(row.amount) }}
            el-table-column(:label="$t('salesEnablement.reason')" min-width="200")
              template(#default="{ row }")
                span.text-sm(style="color: var(--text-secondary)") {{ row.reason }}
            el-table-column(:label="$t('salesEnablement.competitorInvolved')" width="160")
              template(#default="{ row }")
                el-tag(v-if="row.competitor" size="small" effect="plain" round)
                  Icon(name="ph:shield-bold" size="12" class="mr-1")
                  | {{ row.competitor }}
                span(v-else style="color: var(--text-muted)") —
            el-table-column(:label="$t('salesEnablement.closedDate')" width="130")
              template(#default="{ row }")
                span.text-xs.font-mono(style="color: var(--text-muted)") {{ formatDate(row.closedDate) }}
            template(#empty)
              el-empty(:description="$t('common.noData')")

  //- ============ BATTLE CARD DIALOG ============
  el-dialog(v-model="showBattleCardDialog" :title="editingBattleCardId ? $t('salesEnablement.editBattleCard') : $t('salesEnablement.addBattleCard')" width="650px" destroy-on-close)
    el-form(:model="battleCardForm" label-position="top" size="large")
      el-form-item(:label="$t('salesEnablement.competitorName')" required)
        el-input(v-model="battleCardForm.competitorName" :placeholder="$t('salesEnablement.competitorNamePlaceholder')")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('salesEnablement.winRateAgainst')")
          el-input-number(v-model="battleCardForm.winRate" :min="0" :max="100" :precision="0" class="w-full")
        el-form-item(:label="$t('salesEnablement.lastUpdated')")
          el-date-picker(v-model="battleCardForm.lastUpdated" type="date" class="w-full" format="DD/MM/YYYY" value-format="YYYY-MM-DD")
      el-form-item(:label="$t('salesEnablement.strengthAreas')")
        el-select(v-model="battleCardForm.strengths" multiple filterable allow-create default-first-option :placeholder="$t('salesEnablement.strengthsPlaceholder')" class="w-full")
      el-form-item(:label="$t('salesEnablement.weaknessAreas')")
        el-select(v-model="battleCardForm.weaknesses" multiple filterable allow-create default-first-option :placeholder="$t('salesEnablement.weaknessesPlaceholder')" class="w-full")
      el-form-item(:label="$t('salesEnablement.keyTalkingPoints')")
        el-input(v-model="battleCardForm.talkingPoints" type="textarea" :rows="3" :placeholder="$t('salesEnablement.talkingPointsPlaceholder')")
      el-form-item(:label="$t('salesEnablement.pricingComparison')")
        el-input(v-model="battleCardForm.pricingNotes" type="textarea" :rows="2" :placeholder="$t('salesEnablement.pricingComparisonPlaceholder')")
    template(#footer)
      el-button(@click="showBattleCardDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="saveBattleCard") {{ $t('common.save') }}

  //- ============ OBJECTION DIALOG ============
  el-dialog(v-model="showObjectionDialog" :title="editingObjectionId ? $t('salesEnablement.editObjection') : $t('salesEnablement.addObjection')" width="600px" destroy-on-close)
    el-form(:model="objectionForm" label-position="top" size="large")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('salesEnablement.category')" required)
          el-select(v-model="objectionForm.category" class="w-full")
            el-option(:label="$t('salesEnablement.catPricing')" value="pricing")
            el-option(:label="$t('salesEnablement.catProduct')" value="product")
            el-option(:label="$t('salesEnablement.catCompetitor')" value="competitor")
            el-option(:label="$t('salesEnablement.catTiming')" value="timing")
        el-form-item(:label="$t('salesEnablement.successRate')")
          el-input-number(v-model="objectionForm.successRate" :min="0" :max="100" :precision="0" class="w-full")
      el-form-item(:label="$t('salesEnablement.objectionText')" required)
        el-input(v-model="objectionForm.objectionText" type="textarea" :rows="2" :placeholder="$t('salesEnablement.objectionTextPlaceholder')")
      el-form-item(:label="$t('salesEnablement.recommendedResponse')" required)
        el-input(v-model="objectionForm.response" type="textarea" :rows="4" :placeholder="$t('salesEnablement.responsePlaceholder')")
    template(#footer)
      el-button(@click="showObjectionDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="saveObjection") {{ $t('common.save') }}

  //- ============ UPLOAD RESOURCE DIALOG ============
  el-dialog(v-model="showUploadDialog" :title="$t('salesEnablement.uploadResource')" width="550px" destroy-on-close)
    el-form(:model="resourceForm" label-position="top" size="large")
      el-form-item(:label="$t('salesEnablement.resourceTitle')" required)
        el-input(v-model="resourceForm.title" :placeholder="$t('salesEnablement.resourceTitlePlaceholder')")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('salesEnablement.resourceType')" required)
          el-select(v-model="resourceForm.type" class="w-full")
            el-option(:label="$t('salesEnablement.typePitchDeck')" value="pitch_deck")
            el-option(:label="$t('salesEnablement.typeOnePager')" value="one_pager")
            el-option(:label="$t('salesEnablement.typeCaseStudy')" value="case_study")
            el-option(:label="$t('salesEnablement.typeRoiReport')" value="roi_report")
        el-form-item(:label="$t('salesEnablement.fileSize')")
          el-input(v-model="resourceForm.fileSize" placeholder="2.4 MB")
      el-form-item(:label="$t('salesEnablement.description')")
        el-input(v-model="resourceForm.description" type="textarea" :rows="3" :placeholder="$t('salesEnablement.resourceDescPlaceholder')")
      el-form-item(:label="$t('salesEnablement.uploadFile')")
        el-upload(drag :auto-upload="false" :limit="1" accept=".pdf,.pptx,.docx,.xlsx")
          .py-4
            Icon(name="ph:cloud-arrow-up-bold" size="40" style="color: var(--text-muted)")
            p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('salesEnablement.dragOrClick') }}
    template(#footer)
      el-button(@click="showUploadDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="saveResource") {{ $t('common.save') }}

  //- ============ EDIT RESOURCE DIALOG ============
  el-dialog(v-model="showResourceEditDialog" :title="$t('salesEnablement.editResource')" width="550px" destroy-on-close)
    el-form(:model="resourceForm" label-position="top" size="large")
      el-form-item(:label="$t('salesEnablement.resourceTitle')" required)
        el-input(v-model="resourceForm.title" :placeholder="$t('salesEnablement.resourceTitlePlaceholder')")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('salesEnablement.resourceType')" required)
          el-select(v-model="resourceForm.type" class="w-full")
            el-option(:label="$t('salesEnablement.typePitchDeck')" value="pitch_deck")
            el-option(:label="$t('salesEnablement.typeOnePager')" value="one_pager")
            el-option(:label="$t('salesEnablement.typeCaseStudy')" value="case_study")
            el-option(:label="$t('salesEnablement.typeRoiReport')" value="roi_report")
        el-form-item(:label="$t('salesEnablement.fileSize')")
          el-input(v-model="resourceForm.fileSize" placeholder="2.4 MB")
      el-form-item(:label="$t('salesEnablement.description')")
        el-input(v-model="resourceForm.description" type="textarea" :rows="3")
    template(#footer)
      el-button(@click="showResourceEditDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="updateResource") {{ $t('common.save') }}
</template>

<script setup lang="ts">
interface BattleCard {
  id: number;
  competitorName: string;
  lastUpdated: string;
  strengths: string[];
  weaknesses: string[];
  winRate: number;
  talkingPoints: string;
  pricingNotes: string;
}

interface Objection {
  id: number;
  category: string;
  objectionText: string;
  response: string;
  successRate: number;
}

interface Resource {
  id: number;
  title: string;
  type: string;
  fileSize: string;
  lastUpdated: string;
  downloadCount: number;
  viewCount: number;
  description: string;
}

interface Deal {
  id: number;
  dealName: string;
  status: string;
  amount: number;
  reason: string;
  competitor: string;
  closedDate: string;
}

definePageMeta({ middleware: 'permissions' });

const { t, locale } = useI18n();

// ──────────────────────────────────────────
// State
// ──────────────────────────────────────────
const activeTab = ref('battleCards');
const loading = ref(false);
const saving = ref(false);

// Battle Cards
const battleCardSearch = ref('');
const showBattleCardDialog = ref(false);
const editingBattleCardId = ref<number | null>(null);

// Objections
const objectionSearch = ref('');
const objectionCategoryFilter = ref('');
const showObjectionDialog = ref(false);
const editingObjectionId = ref<number | null>(null);

// Resources
const resourceSearch = ref('');
const resourceTypeFilter = ref('');
const showUploadDialog = ref(false);
const showResourceEditDialog = ref(false);
const editingResourceId = ref<number | null>(null);

// ──────────────────────────────────────────
// Demo Data — Battle Cards
// ──────────────────────────────────────────
const battleCards = ref<BattleCard[]>([]);

// ──────────────────────────────────────────
// Demo Data — Objections
// ──────────────────────────────────────────
const objections = ref<Objection[]>([]);

// ──────────────────────────────────────────
// Demo Data — Resources
// ──────────────────────────────────────────
const resources = ref<Resource[]>([]);

// ──────────────────────────────────────────
// Demo Data — Win/Loss
// ──────────────────────────────────────────
const recentDeals = ref<Deal[]>([]);

const winLossSummary = computed(() => {
  const deals = recentDeals.value;
  const won = deals.filter(d => d.status === 'won');
  const lost = deals.filter(d => d.status === 'lost');
  const totalDeals = deals.length;
  const winRate = totalDeals > 0 ? Math.round((won.length / totalDeals) * 100) : 0;
  const avgDealSizeWon = won.length > 0 ? Math.round(won.reduce((s, d) => s + d.amount, 0) / won.length) : 0;
  const avgDealSizeLost = lost.length > 0 ? Math.round(lost.reduce((s, d) => s + d.amount, 0) / lost.length) : 0;

  const winReasonCounts: Record<string, number> = {};
  won.forEach(d => {
    winReasonCounts[d.reason] = (winReasonCounts[d.reason] || 0) + 1;
  });
  const maxWin = Math.max(...Object.values(winReasonCounts), 1);
  const topWinReasons = Object.entries(winReasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label: label.slice(0, 50), count, pct: Math.round((count / maxWin) * 100) }));

  const lossReasonCounts: Record<string, number> = {};
  lost.forEach(d => {
    lossReasonCounts[d.reason] = (lossReasonCounts[d.reason] || 0) + 1;
  });
  const maxLoss = Math.max(...Object.values(lossReasonCounts), 1);
  const topLossReasons = Object.entries(lossReasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label: label.slice(0, 50), count, pct: Math.round((count / maxLoss) * 100) }));

  return { winRate, avgDealSizeWon, avgDealSizeLost, totalDeals, topWinReasons, topLossReasons };
});

// ──────────────────────────────────────────
// Forms
// ──────────────────────────────────────────
const defaultBattleCardForm = () => ({
  competitorName: '',
  winRate: 50,
  lastUpdated: new Date().toISOString().slice(0, 10),
  strengths: [] as string[],
  weaknesses: [] as string[],
  talkingPoints: '',
  pricingNotes: ''
});
const battleCardForm = reactive(defaultBattleCardForm());

const defaultObjectionForm = () => ({
  category: 'pricing',
  objectionText: '',
  response: '',
  successRate: 70
});
const objectionForm = reactive(defaultObjectionForm());

const defaultResourceForm = () => ({
  title: '',
  type: 'pitch_deck',
  fileSize: '',
  description: ''
});
const resourceForm = reactive(defaultResourceForm());

// ──────────────────────────────────────────
// KPI Stats
// ──────────────────────────────────────────
const kpiStats = computed(() => {
  const totalResources = resources.value.length;
  const totalBattleCards = battleCards.value.length;
  const avgWin = battleCards.value.length > 0 ? Math.round(battleCards.value.reduce((s, b) => s + b.winRate, 0) / battleCards.value.length) : 0;
  const wonDeals = recentDeals.value.filter(d => d.status === 'won');
  const avgDealSize = wonDeals.length > 0 ? Math.round(wonDeals.reduce((s, d) => s + d.amount, 0) / wonDeals.length) : 0;

  return [
    { label: t('salesEnablement.totalResources'), value: totalResources, icon: 'ph:files-bold', color: '#7849ff' },
    { label: t('salesEnablement.battleCardsCount'), value: totalBattleCards, icon: 'ph:shield-bold', color: '#3b82f6' },
    { label: t('salesEnablement.winRate'), value: avgWin + '%', icon: 'ph:trophy-bold', color: '#22c55e' },
    { label: t('salesEnablement.avgDealSize'), value: formatCurrency(avgDealSize), icon: 'ph:currency-dollar-bold', color: '#f59e0b' }
  ];
});

// ──────────────────────────────────────────
// Computed — Filtered Lists
// ──────────────────────────────────────────
const filteredBattleCards = computed(() => {
  if (!battleCardSearch.value) return battleCards.value;
  const q = battleCardSearch.value.toLowerCase();
  return battleCards.value.filter(
    bc =>
      bc.competitorName.toLowerCase().includes(q) ||
      bc.strengths.some(s => s.toLowerCase().includes(q)) ||
      bc.weaknesses.some(w => w.toLowerCase().includes(q))
  );
});

const filteredObjections = computed(() => {
  let result = [...objections.value];
  if (objectionCategoryFilter.value) {
    result = result.filter(o => o.category === objectionCategoryFilter.value);
  }
  if (objectionSearch.value) {
    const q = objectionSearch.value.toLowerCase();
    result = result.filter(o => o.objectionText.toLowerCase().includes(q) || o.response.toLowerCase().includes(q));
  }
  return result;
});

const filteredResources = computed(() => {
  let result = [...resources.value];
  if (resourceTypeFilter.value) {
    result = result.filter(r => r.type === resourceTypeFilter.value);
  }
  if (resourceSearch.value) {
    const q = resourceSearch.value.toLowerCase();
    result = result.filter(r => r.title.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q));
  }
  return result;
});

// ──────────────────────────────────────────
// Primary Action (context-aware)
// ──────────────────────────────────────────
const primaryActionLabel = computed(() => {
  const map: Record<string, string> = {
    battleCards: t('salesEnablement.addBattleCard'),
    objections: t('salesEnablement.addObjection'),
    resources: t('salesEnablement.uploadResource'),
    winLoss: t('salesEnablement.exportReport')
  };
  return map[activeTab.value] || t('salesEnablement.addBattleCard');
});

function handlePrimaryAction() {
  switch (activeTab.value) {
    case 'battleCards':
      openBattleCardDialog();
      break;
    case 'objections':
      openObjectionDialog();
      break;
    case 'resources':
      showUploadDialog.value = true;
      break;
    case 'winLoss':
      exportWinLossReport();
      break;
  }
}

// ──────────────────────────────────────────
// Battle Card CRUD
// ──────────────────────────────────────────
function openBattleCardDialog(card?: BattleCard) {
  if (card) {
    editingBattleCardId.value = card.id;
    Object.assign(battleCardForm, {
      competitorName: card.competitorName,
      winRate: card.winRate,
      lastUpdated: card.lastUpdated,
      strengths: [...card.strengths],
      weaknesses: [...card.weaknesses],
      talkingPoints: card.talkingPoints || '',
      pricingNotes: card.pricingNotes || ''
    });
  } else {
    editingBattleCardId.value = null;
    Object.assign(battleCardForm, defaultBattleCardForm());
  }
  showBattleCardDialog.value = true;
}

function saveBattleCard() {
  if (!battleCardForm.competitorName?.trim()) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  saving.value = true;
  setTimeout(() => {
    if (editingBattleCardId.value) {
      const idx = battleCards.value.findIndex(b => b.id === editingBattleCardId.value);
      if (idx >= 0) {
        battleCards.value[idx] = {
          id: editingBattleCardId.value,
          ...battleCardForm,
          strengths: [...battleCardForm.strengths],
          weaknesses: [...battleCardForm.weaknesses]
        };
      }
    } else {
      const newId = Math.max(0, ...battleCards.value.map(b => b.id)) + 1;
      battleCards.value.push({ id: newId, ...battleCardForm, strengths: [...battleCardForm.strengths], weaknesses: [...battleCardForm.weaknesses] });
    }
    showBattleCardDialog.value = false;
    saving.value = false;
    ElMessage.success(t('common.saved'));
  }, 400);
}

function deleteBattleCard(id: number) {
  ElMessageBox.confirm(t('salesEnablement.confirmDelete'), t('common.warning'), { type: 'warning' })
    .then(() => {
      battleCards.value = battleCards.value.filter(b => b.id !== id);
      ElMessage.success(t('common.deleted'));
    })
    .catch(() => {
      /* cancelled */
    });
}

// ──────────────────────────────────────────
// Objection CRUD
// ──────────────────────────────────────────
function openObjectionDialog(obj?: Objection) {
  if (obj) {
    editingObjectionId.value = obj.id;
    Object.assign(objectionForm, {
      category: obj.category,
      objectionText: obj.objectionText,
      response: obj.response,
      successRate: obj.successRate
    });
  } else {
    editingObjectionId.value = null;
    Object.assign(objectionForm, defaultObjectionForm());
  }
  showObjectionDialog.value = true;
}

function saveObjection() {
  if (!objectionForm.objectionText?.trim() || !objectionForm.response?.trim()) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  saving.value = true;
  setTimeout(() => {
    if (editingObjectionId.value) {
      const idx = objections.value.findIndex(o => o.id === editingObjectionId.value);
      if (idx >= 0) {
        objections.value[idx] = { id: editingObjectionId.value, ...objectionForm };
      }
    } else {
      const newId = Math.max(0, ...objections.value.map(o => o.id)) + 1;
      objections.value.push({ id: newId, ...objectionForm });
    }
    showObjectionDialog.value = false;
    saving.value = false;
    ElMessage.success(t('common.saved'));
  }, 400);
}

function deleteObjection(id: number) {
  ElMessageBox.confirm(t('salesEnablement.confirmDelete'), t('common.warning'), { type: 'warning' })
    .then(() => {
      objections.value = objections.value.filter(o => o.id !== id);
      ElMessage.success(t('common.deleted'));
    })
    .catch(() => {
      /* cancelled */
    });
}

// ──────────────────────────────────────────
// Resource CRUD
// ──────────────────────────────────────────
function saveResource() {
  if (!resourceForm.title?.trim()) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  saving.value = true;
  setTimeout(() => {
    const newId = Math.max(0, ...resources.value.map(r => r.id)) + 1;
    resources.value.push({
      id: newId,
      title: resourceForm.title,
      type: resourceForm.type,
      fileSize: resourceForm.fileSize || '1.0 MB',
      lastUpdated: new Date().toISOString().slice(0, 10),
      downloadCount: 0,
      viewCount: 0,
      description: resourceForm.description
    });
    showUploadDialog.value = false;
    saving.value = false;
    ElMessage.success(t('common.saved'));
  }, 400);
}

function openResourceEditDialog(res: Resource) {
  editingResourceId.value = res.id;
  Object.assign(resourceForm, {
    title: res.title,
    type: res.type,
    fileSize: res.fileSize,
    description: res.description || ''
  });
  showResourceEditDialog.value = true;
}

function updateResource() {
  if (!resourceForm.title?.trim()) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  saving.value = true;
  setTimeout(() => {
    const idx = resources.value.findIndex(r => r.id === editingResourceId.value);
    if (idx >= 0) {
      resources.value[idx] = {
        ...resources.value[idx],
        title: resourceForm.title,
        type: resourceForm.type,
        fileSize: resourceForm.fileSize,
        description: resourceForm.description
      } as unknown;
    }
    showResourceEditDialog.value = false;
    saving.value = false;
    ElMessage.success(t('common.saved'));
  }, 400);
}

function deleteResource(id: number) {
  ElMessageBox.confirm(t('salesEnablement.confirmDelete'), t('common.warning'), { type: 'warning' })
    .then(() => {
      resources.value = resources.value.filter(r => r.id !== id);
      ElMessage.success(t('common.deleted'));
    })
    .catch(() => {
      /* cancelled */
    });
}

function downloadResource(res: Resource) {
  res.downloadCount++;
  ElMessage.success(t('salesEnablement.downloadStarted'));
}

// ──────────────────────────────────────────
// Win/Loss Export
// ──────────────────────────────────────────
function exportWinLossReport() {
  const headers = [
    t('salesEnablement.dealName'),
    t('salesEnablement.status'),
    t('salesEnablement.amount'),
    t('salesEnablement.reason'),
    t('salesEnablement.competitorInvolved'),
    t('salesEnablement.closedDate')
  ];
  const rows = recentDeals.value.map(d => [d.dealName, d.status, d.amount, d.reason, d.competitor || 'N/A', d.closedDate]);
  const csv = [headers, ...rows].map(r => r.map((c: string | number) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `win-loss-analysis-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  ElMessage.success(t('salesEnablement.exportSuccess'));
}

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────
function formatDate(date: string): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString(locale.value, { day: '2-digit', month: 'short', year: '2-digit' });
}

function formatNumber(num: number): string {
  return num.toLocaleString(locale.value);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(
    value
  );
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function winRateColor(rate: number): string {
  if (rate >= 70) return '#22c55e';
  if (rate >= 50) return '#f59e0b';
  return '#ef4444';
}

function successRateColor(rate: number): string {
  if (rate >= 75) return '#22c55e';
  if (rate >= 50) return '#3b82f6';
  return '#f59e0b';
}

function objectionCategoryIcon(category: string): string {
  const map: Record<string, string> = {
    pricing: 'ph:currency-dollar-bold',
    product: 'ph:package-bold',
    competitor: 'ph:shield-bold',
    timing: 'ph:clock-bold'
  };
  return map[category] || 'ph:chat-circle-text-bold';
}

function objectionCategoryColor(category: string): string {
  const map: Record<string, string> = {
    pricing: '#f59e0b',
    product: '#3b82f6',
    competitor: '#ef4444',
    timing: '#7849ff'
  };
  return map[category] || '#6b7280';
}

function objectionCategoryBg(category: string): string {
  const map: Record<string, string> = {
    pricing: 'rgba(245,158,11,0.12)',
    product: 'rgba(59,130,246,0.12)',
    competitor: 'rgba(239,68,68,0.12)',
    timing: 'rgba(120,73,255,0.12)'
  };
  return map[category] || 'rgba(107,114,128,0.12)';
}

function objectionCategoryTagType(category: string): string {
  const map: Record<string, string> = {
    pricing: 'warning',
    product: '',
    competitor: 'danger',
    timing: 'info'
  };
  return map[category] || 'info';
}

function resourceIcon(type: string): string {
  const map: Record<string, string> = {
    pitch_deck: 'ph:presentation-chart-bold',
    one_pager: 'ph:file-text-bold',
    case_study: 'ph:book-bookmark-bold',
    roi_report: 'ph:chart-line-up-bold'
  };
  return map[type] || 'ph:file-bold';
}

function resourceGradient(type: string): string {
  const map: Record<string, string> = {
    pitch_deck: 'linear-gradient(135deg, #7849ff 0%, #5a2fd4 100%)',
    one_pager: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    case_study: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
    roi_report: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
  };
  return map[type] || 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
}

function resourceTagColor(type: string): string {
  const map: Record<string, string> = {
    pitch_deck: '#7849ff',
    one_pager: '#3b82f6',
    case_study: '#22c55e',
    roi_report: '#f59e0b'
  };
  return map[type] || '#6b7280';
}

function resourceTypeLabel(type: string): string {
  const map: Record<string, string> = {
    pitch_deck: t('salesEnablement.typePitchDeck'),
    one_pager: t('salesEnablement.typeOnePager'),
    case_study: t('salesEnablement.typeCaseStudy'),
    roi_report: t('salesEnablement.typeRoiReport')
  };
  return map[type] || type;
}
</script>

<style lang="scss" scoped>
.premium-btn {
  background: linear-gradient(135deg, #7849ff 0%, #5a2fd4 100%);
  border: none;
  color: #fff;
  font-weight: 600;
  &:hover {
    background: linear-gradient(135deg, #8b5cf6 0%, #7849ff 100%);
  }
}

.glass-card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  &:hover {
    transform: translateY(-1px);
  }
}

.animate-entrance {
  animation: slideUp 0.4s ease-out;
}

// Resource card hover effect
.glass-card.rounded-2xl.overflow-hidden {
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
}

// Objection card styling
.glass-card.p-5.rounded-2xl {
  &:hover {
    border-color: rgba(120, 73, 255, 0.3) !important;
  }
}

// Win/Loss stat cards
.p-4.rounded-xl.border.text-center {
  transition: transform 0.2s ease;
  &:hover {
    transform: translateY(-2px);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background: var(--border-default);
}

:deep(.el-tabs__active-bar) {
  background: #7849ff;
}

:deep(.el-tabs__item.is-active) {
  color: #7849ff;
  font-weight: 600;
}

:deep(.el-tabs__item:hover) {
  color: #7849ff;
}
</style>
