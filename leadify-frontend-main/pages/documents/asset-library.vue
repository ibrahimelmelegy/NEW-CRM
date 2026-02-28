<template lang="pug">
.asset-library-page.p-6(class="md:p-8")
  //- ════════════════════════════════════════════════════════
  //- Page Header
  //- ════════════════════════════════════════════════════════
  .flex.items-center.justify-between.mb-8(class="flex-col md:flex-row gap-4")
    .flex.items-center.gap-4
      .header-icon-wrapper
        Icon(name="ph:images-bold" size="26" style="color: white")
      div
        h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary)") {{ t('assetLibrary.title') }}
        p.text-sm.mt-1(style="color: var(--text-muted)") {{ t('assetLibrary.subtitle') }}

    .flex.items-center.gap-3
      .flex.items-center.gap-1.p-1.rounded-xl(style="background: var(--bg-elevated); border: 1px solid var(--border-default)")
        el-button(
          :type="viewMode === 'grid' ? 'primary' : ''"
          size="small"
          class="!rounded-lg"
          @click="viewMode = 'grid'"
        )
          Icon(name="ph:squares-four-bold" size="16")
        el-button(
          :type="viewMode === 'list' ? 'primary' : ''"
          size="small"
          class="!rounded-lg"
          @click="viewMode = 'list'"
        )
          Icon(name="ph:list-bold" size="16")
      el-button(
        type="primary"
        size="large"
        class="!bg-[#7849ff] !border-none !rounded-xl hover:!bg-[#6730e3]"
        @click="showUploadDialog = true"
      )
        Icon(name="ph:upload-simple-bold" size="16")
        span.ml-2 {{ t('assetLibrary.upload') }}

  //- ════════════════════════════════════════════════════════
  //- Loading Skeleton
  //- ════════════════════════════════════════════════════════
  .flex.items-center.justify-center.py-20(v-if="loading")
    el-skeleton(:rows="8" animated)

  template(v-else)
    //- ════════════════════════════════════════════════════════
    //- KPI Cards
    //- ════════════════════════════════════════════════════════
    .grid.gap-5.mb-8(class="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4")
      .kpi-card(v-for="(kpi, idx) in kpiCards" :key="idx")
        .flex.items-start.justify-between
          div
            p.text-sm.font-medium.mb-1(style="color: var(--text-muted)") {{ kpi.label }}
            p.text-2xl.font-bold(:style="{ color: kpi.color }") {{ kpi.value }}
            .flex.items-center.gap-1.mt-2
              Icon(:name="kpi.trend >= 0 ? 'ph:trend-up-bold' : 'ph:trend-down-bold'" size="14" :style="{ color: kpi.trend >= 0 ? '#22c55e' : '#ef4444' }")
              span.text-xs.font-semibold(:style="{ color: kpi.trend >= 0 ? '#22c55e' : '#ef4444' }") {{ `${kpi.trend >= 0 ? '+' : ''}${kpi.trend}%` }}
          .kpi-icon-wrapper(:style="{ background: kpi.color + '18' }")
            Icon(:name="kpi.icon" size="24" :style="{ color: kpi.color }")

    //- ════════════════════════════════════════════════════════
    //- Tabs
    //- ════════════════════════════════════════════════════════
    el-tabs(v-model="activeTab" class="asset-tabs")

      //- ──────────────────────────────────────────────────────
      //- Tab 1: Library
      //- ──────────────────────────────────────────────────────
      el-tab-pane(:label="t('assetLibrary.library')" name="library")
        //- Upload Zone
        .upload-zone.mb-6(
          :class="{ 'drag-over': isDragOver }"
          @dragover.prevent="isDragOver = true"
          @dragleave="isDragOver = false"
          @drop.prevent="handleDrop"
          @click="triggerUpload"
        )
          Icon(name="ph:cloud-arrow-up-bold" size="40" style="color: #7849ff; opacity: 0.6")
          p.text-sm.font-semibold.mt-3(style="color: var(--text-primary)") {{ t('assetLibrary.dropFilesHere') }}
          p.text-xs.mt-1(style="color: var(--text-muted)") {{ t('assetLibrary.orClickToUpload') }}

        //- Filters
        .flex.items-center.gap-4.mb-6(class="flex-col md:flex-row")
          el-input(
            v-model="assetSearch"
            :placeholder="t('assetLibrary.search')"
            prefix-icon="Search"
            clearable
            size="large"
            class="max-w-xs"
          )
          el-select(
            v-model="typeFilter"
            :placeholder="t('assetLibrary.allTypes')"
            clearable
            size="large"
            style="width: 180px"
          )
            el-option(:label="t('assetLibrary.allTypes')" value="")
            el-option(:label="t('assetLibrary.images')" value="Image")
            el-option(:label="t('assetLibrary.documents')" value="Document")
            el-option(:label="t('assetLibrary.videos')" value="Video")
            el-option(:label="t('assetLibrary.spreadsheets')" value="Spreadsheet")
            el-option(:label="t('assetLibrary.other')" value="Other")
          el-select(
            v-model="tagFilter"
            :placeholder="t('assetLibrary.tags')"
            clearable
            size="large"
            style="width: 160px"
          )
            el-option(v-for="tag in allTags" :key="tag" :label="tag" :value="tag")
          .flex-1
          .text-sm(style="color: var(--text-muted)") {{ `${filteredAssets.length} ${t('assetLibrary.totalAssets').toLowerCase()}` }}

        //- Grid View
        .grid.gap-5(v-if="viewMode === 'grid'" class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4")
          .asset-card(v-for="asset in filteredAssets" :key="asset.id")
            .asset-thumbnail
              Icon(:name="getAssetIcon(asset.type)" size="40" :style="{ color: getAssetColor(asset.type), opacity: 0.7 }")
              .asset-overlay
                el-button(circle size="small" @click.stop="previewAsset(asset)")
                  Icon(name="ph:eye-bold" size="14")
                el-button(circle size="small" @click.stop="downloadAsset(asset)")
                  Icon(name="ph:download-simple-bold" size="14")
                el-button(circle size="small" @click.stop="shareAsset(asset)")
                  Icon(name="ph:share-bold" size="14")
                el-button(circle size="small" type="danger" @click.stop="deleteAsset(asset)")
                  Icon(name="ph:trash-bold" size="14")
            .p-4
              .flex.items-center.justify-between.mb-2
                p.text-sm.font-semibold.truncate(style="color: var(--text-primary)") {{ asset.name }}
                el-tag(size="small" effect="plain" round :type="getTagType(asset.type)") {{ asset.type }}
              .flex.items-center.gap-2.mb-2
                span.text-xs(style="color: var(--text-muted)") {{ asset.size }}
                span.text-xs(style="color: var(--text-muted)") &middot;
                span.text-xs(style="color: var(--text-muted)") {{ asset.uploadedBy }}
                span.text-xs(style="color: var(--text-muted)") &middot;
                span.text-xs(style="color: var(--text-muted)") {{ asset.date }}
              .flex.flex-wrap.gap-1
                el-tag(v-for="tag in asset.tags" :key="tag" size="small" effect="plain" round class="!text-xs") {{ tag }}

        //- List View
        .glass-card.rounded-2xl.overflow-hidden(v-else)
          el-table(:data="filteredAssets" style="width: 100%" stripe)
            el-table-column(width="60" align="center")
              template(#default="{ row }")
                Icon(:name="getAssetIcon(row.type)" size="22" :style="{ color: getAssetColor(row.type) }")
            el-table-column(:label="t('assetLibrary.fileName')" min-width="200")
              template(#default="{ row }")
                span.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.name }}
            el-table-column(:label="t('assetLibrary.type')" width="130")
              template(#default="{ row }")
                el-tag(size="small" effect="plain" round :type="getTagType(row.type)") {{ row.type }}
            el-table-column(:label="t('assetLibrary.size')" width="100")
              template(#default="{ row }")
                span.text-xs {{ row.size }}
            el-table-column(:label="t('assetLibrary.uploadedBy')" width="140")
              template(#default="{ row }")
                span.text-xs {{ row.uploadedBy }}
            el-table-column(:label="t('assetLibrary.date')" width="120")
              template(#default="{ row }")
                span.text-xs {{ row.date }}
            el-table-column(:label="t('assetLibrary.tags')" min-width="160")
              template(#default="{ row }")
                .flex.flex-wrap.gap-1
                  el-tag(v-for="tag in row.tags" :key="tag" size="small" effect="plain" round class="!text-xs") {{ tag }}
            el-table-column(:label="t('assetLibrary.actions')" width="160" align="center")
              template(#default="{ row }")
                .flex.items-center.justify-center.gap-1
                  el-button(link size="small" @click="previewAsset(row)")
                    Icon(name="ph:eye-bold" size="16" style="color: #7849ff")
                  el-button(link size="small" @click="downloadAsset(row)")
                    Icon(name="ph:download-simple-bold" size="16" style="color: #3b82f6")
                  el-button(link size="small" @click="shareAsset(row)")
                    Icon(name="ph:share-bold" size="16" style="color: #22c55e")
                  el-button(link size="small" @click="deleteAsset(row)")
                    Icon(name="ph:trash-bold" size="16" style="color: #ef4444")

      //- ──────────────────────────────────────────────────────
      //- Tab 2: Collections
      //- ──────────────────────────────────────────────────────
      el-tab-pane(:label="t('assetLibrary.collections')" name="collections")
        .flex.items-center.justify-between.mb-6
          h3.text-sm.font-bold.uppercase(style="color: var(--text-muted)") {{ t('assetLibrary.collections') }}
          el-button(
            type="primary"
            size="default"
            class="!bg-[#7849ff] !border-none !rounded-xl"
            @click="showCollectionDialog = true"
          )
            Icon(name="ph:plus-bold" size="14")
            span.ml-2 {{ t('assetLibrary.createCollection') }}

        .grid.gap-5(class="grid-cols-1 md:grid-cols-2 lg:grid-cols-3")
          .collection-card(v-for="collection in collections" :key="collection.id")
            //- Cover mosaic
            .grid.grid-cols-2.gap-1.mb-3.rounded-xl.overflow-hidden(style="height: 120px")
              .bg-center.bg-cover(
                v-for="(thumb, tIdx) in collection.thumbnails"
                :key="tIdx"
                :style="{ background: thumb.bg }"
                class="flex items-center justify-center"
              )
                Icon(:name="thumb.icon" size="20" :style="{ color: thumb.color, opacity: 0.6 }")

            .flex.items-start.justify-between.mb-2
              div
                h4.text-sm.font-bold(style="color: var(--text-primary)") {{ collection.name }}
                .flex.items-center.gap-2.mt-1
                  el-tag(size="small" effect="plain" round) {{ `${collection.assetCount} ${t('assetLibrary.assetCount')}` }}
                  span.text-xs(style="color: var(--text-muted)") {{ `${t('assetLibrary.sharedWith')}: ${collection.sharedWith}` }}

            .flex.items-center.justify-between.mt-3
              span.text-xs(style="color: var(--text-muted)") {{ `${t('assetLibrary.lastUpdated')}: ${collection.lastUpdated}` }}
              .flex.items-center.gap-1
                el-button(link size="small" @click="openCollection(collection)")
                  Icon(name="ph:folder-open-bold" size="16" style="color: #7849ff")
                el-button(link size="small" @click="shareCollection(collection)")
                  Icon(name="ph:share-bold" size="16" style="color: #22c55e")
                el-button(link size="small" @click="editCollection(collection)")
                  Icon(name="ph:pencil-simple-bold" size="16" style="color: #3b82f6")
                el-button(link size="small" @click="deleteCollection(collection)")
                  Icon(name="ph:trash-bold" size="16" style="color: #ef4444")

        //- Create Collection Dialog
        el-dialog(
          v-model="showCollectionDialog"
          :title="t('assetLibrary.createCollection')"
          width="520"
          class="!rounded-2xl"
        )
          .space-y-4
            div
              label.text-sm.font-semibold.mb-2.block(style="color: var(--text-primary)") {{ t('assetLibrary.collectionName') }}
              el-input(v-model="newCollection.name" :placeholder="t('assetLibrary.collectionName')" size="large")
            div
              label.text-sm.font-semibold.mb-2.block(style="color: var(--text-primary)") {{ t('assetLibrary.description') }}
              el-input(v-model="newCollection.description" type="textarea" :rows="3" :placeholder="t('assetLibrary.description')")
            div
              label.text-sm.font-semibold.mb-2.block(style="color: var(--text-primary)") {{ t('assetLibrary.privacy') }}
              el-radio-group(v-model="newCollection.privacy")
                el-radio(value="private") {{ t('assetLibrary.private') }}
                el-radio(value="team") {{ t('assetLibrary.team') }}
                el-radio(value="public") {{ t('assetLibrary.public') }}
          template(#footer)
            el-button(@click="showCollectionDialog = false" class="!rounded-lg") {{ t('common.cancel') }}
            el-button(type="primary" @click="createCollection" class="!bg-[#7849ff] !border-none !rounded-lg") {{ t('assetLibrary.createCollection') }}

      //- ──────────────────────────────────────────────────────
      //- Tab 3: Usage & Analytics
      //- ──────────────────────────────────────────────────────
      el-tab-pane(:label="t('assetLibrary.usageAnalytics')" name="analytics")
        //- Most downloaded/viewed table
        .glass-card.rounded-2xl.overflow-hidden.mb-6.p-6
          h4.text-sm.font-bold.uppercase.mb-4(style="color: var(--text-muted)")
            Icon.mr-2(name="ph:chart-line-up-bold" size="16" style="color: #7849ff")
            | {{ t('assetLibrary.mostDownloaded') }}
          el-table(:data="mostDownloadedAssets" style="width: 100%" stripe)
            el-table-column(:label="t('assetLibrary.fileName')" min-width="200")
              template(#default="{ row }")
                .flex.items-center.gap-2
                  Icon(:name="getAssetIcon(row.type)" size="18" :style="{ color: getAssetColor(row.type) }")
                  span.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.name }}
            el-table-column(:label="t('assetLibrary.type')" width="120")
              template(#default="{ row }")
                el-tag(size="small" effect="plain" round :type="getTagType(row.type)") {{ row.type }}
            el-table-column(:label="t('assetLibrary.downloads')" width="120" align="center")
              template(#default="{ row }")
                span.text-sm.font-bold(style="color: #7849ff") {{ row.downloads }}
            el-table-column(:label="t('assetLibrary.views')" width="120" align="center")
              template(#default="{ row }")
                span.text-sm {{ row.views }}
            el-table-column(:label="t('assetLibrary.lastAccessed')" width="140")
              template(#default="{ row }")
                span.text-xs(style="color: var(--text-muted)") {{ row.lastAccessed }}

        //- Charts Grid
        .grid.gap-6(class="grid-cols-1 lg:grid-cols-2")
          //- Storage Breakdown Doughnut
          .glass-card.rounded-2xl.p-6
            h4.text-sm.font-bold.uppercase.mb-4(style="color: var(--text-muted)")
              Icon.mr-2(name="ph:chart-donut-bold" size="16" style="color: #3b82f6")
              | {{ t('assetLibrary.storageBreakdown') }}
            ClientOnly
              VChart.w-full(:option="storageBreakdownOption" :style="{ height: '320px' }" autoresize)

          //- Upload Trend Line Chart
          .glass-card.rounded-2xl.p-6
            h4.text-sm.font-bold.uppercase.mb-4(style="color: var(--text-muted)")
              Icon.mr-2(name="ph:trend-up-bold" size="16" style="color: #22c55e")
              | {{ t('assetLibrary.uploadTrend') }}
            ClientOnly
              VChart.w-full(:option="uploadTrendOption" :style="{ height: '320px' }" autoresize)

          //- Usage by Department Bar Chart
          .glass-card.rounded-2xl.p-6.col-span-1(class="lg:col-span-2")
            h4.text-sm.font-bold.uppercase.mb-4(style="color: var(--text-muted)")
              Icon.mr-2(name="ph:buildings-bold" size="16" style="color: #f59e0b")
              | {{ t('assetLibrary.usageByDepartment') }}
            ClientOnly
              VChart.w-full(:option="usageByDepartmentOption" :style="{ height: '340px' }" autoresize)

      //- ──────────────────────────────────────────────────────
      //- Tab 4: Versions
      //- ──────────────────────────────────────────────────────
      el-tab-pane(:label="t('assetLibrary.versions')" name="versions")
        //- Version History Table
        .glass-card.rounded-2xl.overflow-hidden.mb-6.p-6
          h4.text-sm.font-bold.uppercase.mb-4(style="color: var(--text-muted)")
            Icon.mr-2(name="ph:clock-counter-clockwise-bold" size="16" style="color: #7849ff")
            | {{ t('assetLibrary.versionHistory') }}
          el-table(
            :data="versionEntries"
            style="width: 100%"
            stripe
            highlight-current-row
            @current-change="onVersionSelect"
          )
            el-table-column(:label="t('assetLibrary.fileName')" min-width="180")
              template(#default="{ row }")
                .flex.items-center.gap-2
                  Icon(:name="getAssetIcon(row.type)" size="18" :style="{ color: getAssetColor(row.type) }")
                  span.text-sm.font-semibold(style="color: var(--text-primary)") {{ row.assetName }}
            el-table-column(:label="t('assetLibrary.version')" width="100" align="center")
              template(#default="{ row }")
                el-tag(size="small" effect="dark" round :type="row.isCurrent ? 'success' : 'info'") {{ row.version }}
            el-table-column(:label="t('assetLibrary.uploadedBy')" width="140")
              template(#default="{ row }")
                span.text-sm {{ row.uploadedBy }}
            el-table-column(:label="t('assetLibrary.date')" width="130")
              template(#default="{ row }")
                span.text-xs(style="color: var(--text-muted)") {{ row.date }}
            el-table-column(:label="t('assetLibrary.size')" width="100")
              template(#default="{ row }")
                span.text-xs {{ row.size }}
            el-table-column(:label="t('assetLibrary.changes')" min-width="200")
              template(#default="{ row }")
                span.text-xs(style="color: var(--text-muted)") {{ row.changes }}
            el-table-column(:label="t('assetLibrary.actions')" width="100" align="center")
              template(#default="{ row }")
                el-button(
                  v-if="!row.isCurrent"
                  type="primary"
                  size="small"
                  text
                  @click="restoreVersion(row)"
                )
                  Icon(name="ph:arrow-counter-clockwise-bold" size="14" class="mr-1")
                  | {{ t('assetLibrary.restore') }}
                el-tag(v-else size="small" effect="plain" type="success" round) {{ t('assetLibrary.currentVersion') }}

        //- Diff Preview
        .glass-card.rounded-2xl.p-6(v-if="selectedVersion")
          h4.text-sm.font-bold.uppercase.mb-4(style="color: var(--text-muted)")
            Icon.mr-2(name="ph:git-diff-bold" size="16" style="color: #7849ff")
            | {{ t('assetLibrary.diffPreview') }}
          .grid.gap-6(class="grid-cols-1 md:grid-cols-2")
            .p-4.rounded-xl(style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2)")
              p.text-xs.font-bold.uppercase.mb-3(style="color: #ef4444") {{ `${t('assetLibrary.version')} ${selectedVersion.previousVersion}` }}
              .space-y-2
                .flex.items-center.justify-between
                  span.text-xs(style="color: var(--text-muted)") {{ t('assetLibrary.fileName') }}
                  span.text-xs.font-semibold(style="color: var(--text-primary)") {{ selectedVersion.assetName }}
                .flex.items-center.justify-between
                  span.text-xs(style="color: var(--text-muted)") {{ t('assetLibrary.size') }}
                  span.text-xs.font-semibold(style="color: var(--text-primary)") {{ selectedVersion.previousSize }}
                .flex.items-center.justify-between
                  span.text-xs(style="color: var(--text-muted)") {{ t('assetLibrary.date') }}
                  span.text-xs.font-semibold(style="color: var(--text-primary)") {{ selectedVersion.previousDate }}
                .flex.items-center.justify-between
                  span.text-xs(style="color: var(--text-muted)") {{ t('assetLibrary.uploadedBy') }}
                  span.text-xs.font-semibold(style="color: var(--text-primary)") {{ selectedVersion.previousUploader }}
            .p-4.rounded-xl(style="background: rgba(34, 197, 94, 0.05); border: 1px solid rgba(34, 197, 94, 0.2)")
              p.text-xs.font-bold.uppercase.mb-3(style="color: #22c55e") {{ `${t('assetLibrary.version')} ${selectedVersion.version}` }}
              .space-y-2
                .flex.items-center.justify-between
                  span.text-xs(style="color: var(--text-muted)") {{ t('assetLibrary.fileName') }}
                  span.text-xs.font-semibold(style="color: var(--text-primary)") {{ selectedVersion.assetName }}
                .flex.items-center.justify-between
                  span.text-xs(style="color: var(--text-muted)") {{ t('assetLibrary.size') }}
                  span.text-xs.font-semibold(style="color: var(--text-primary)") {{ selectedVersion.size }}
                .flex.items-center.justify-between
                  span.text-xs(style="color: var(--text-muted)") {{ t('assetLibrary.date') }}
                  span.text-xs.font-semibold(style="color: var(--text-primary)") {{ selectedVersion.date }}
                .flex.items-center.justify-between
                  span.text-xs(style="color: var(--text-muted)") {{ t('assetLibrary.uploadedBy') }}
                  span.text-xs.font-semibold(style="color: var(--text-primary)") {{ selectedVersion.uploadedBy }}
                .flex.items-center.justify-between
                  span.text-xs(style="color: var(--text-muted)") {{ t('assetLibrary.changes') }}
                  span.text-xs.font-semibold(style="color: #22c55e") {{ selectedVersion.changes }}

  //- Upload Dialog
  el-dialog(
    v-model="showUploadDialog"
    :title="t('assetLibrary.upload')"
    width="480"
    class="!rounded-2xl"
  )
    .upload-zone.mb-4(
      :class="{ 'drag-over': isDialogDragOver }"
      @dragover.prevent="isDialogDragOver = true"
      @dragleave="isDialogDragOver = false"
      @drop.prevent="handleDialogDrop"
    )
      Icon(name="ph:cloud-arrow-up-bold" size="48" style="color: #7849ff; opacity: 0.5")
      p.text-sm.font-semibold.mt-3(style="color: var(--text-primary)") {{ t('assetLibrary.dropFilesHere') }}
      p.text-xs.mt-1(style="color: var(--text-muted)") {{ t('assetLibrary.orClickToUpload') }}
    template(#footer)
      el-button(@click="showUploadDialog = false" class="!rounded-lg") {{ t('common.cancel') }}
      el-button(type="primary" class="!bg-[#7849ff] !border-none !rounded-lg") {{ t('assetLibrary.upload') }}
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import VChart from 'vue-echarts';
import { useApiFetch } from '~/composables/useApiFetch';

definePageMeta({ title: 'Asset Library' });

const { t } = useI18n();

// ─── State ──────────────────────────────────────────────────
const loading = ref(true);
const activeTab = ref('library');
const viewMode = ref<'grid' | 'list'>('grid');
const assetSearch = ref('');
const typeFilter = ref('');
const tagFilter = ref('');
const isDragOver = ref(false);
const isDialogDragOver = ref(false);
const showUploadDialog = ref(false);
const showCollectionDialog = ref(false);
const selectedVersion = ref<VersionDiff | null>(null);

// ─── Types ──────────────────────────────────────────────────
interface Asset {
  id: number;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  date: string;
  tags: string[];
  downloads?: number;
  views?: number;
  lastAccessed?: string;
}

interface Collection {
  id: number;
  name: string;
  assetCount: number;
  sharedWith: number;
  lastUpdated: string;
  thumbnails: { icon: string; color: string; bg: string }[];
}

interface VersionEntry {
  id: number;
  assetName: string;
  type: string;
  version: string;
  uploadedBy: string;
  date: string;
  size: string;
  changes: string;
  isCurrent: boolean;
  previousVersion?: string;
  previousSize?: string;
  previousDate?: string;
  previousUploader?: string;
}

interface VersionDiff extends VersionEntry {
  previousVersion: string;
  previousSize: string;
  previousDate: string;
  previousUploader: string;
}

// ─── KPI Cards ──────────────────────────────────────────────
const kpiCards = computed(() => [
  {
    label: t('assetLibrary.totalAssets'),
    value: '2,847',
    icon: 'ph:folder-bold',
    color: '#7849ff',
    trend: 6.2,
  },
  {
    label: t('assetLibrary.storageUsed'),
    value: '48.2 GB',
    icon: 'ph:hard-drives-bold',
    color: '#3b82f6',
    trend: 3.8,
  },
  {
    label: t('assetLibrary.assetsThisMonth'),
    value: '156',
    icon: 'ph:upload-bold',
    color: '#22c55e',
    trend: 18.4,
  },
  {
    label: t('assetLibrary.sharedAssets'),
    value: '412',
    icon: 'ph:share-network-bold',
    color: '#f59e0b',
    trend: 9.1,
  },
]);

// ─── Mock Assets (fallback data) ─────────────────────────────
const assetsFallback: Asset[] = [
  { id: 1, name: 'Brand Guidelines 2026.pdf', type: 'Document', size: '4.2 MB', uploadedBy: 'Sarah Ahmed', date: '2026-02-25', tags: ['Brand', 'Guidelines'] },
  { id: 2, name: 'Product Hero Shot.png', type: 'Image', size: '8.7 MB', uploadedBy: 'Omar Hassan', date: '2026-02-24', tags: ['Product', 'Marketing'] },
  { id: 3, name: 'Q4 Revenue Report.xlsx', type: 'Spreadsheet', size: '1.8 MB', uploadedBy: 'Fatima Ali', date: '2026-02-23', tags: ['Finance', 'Report'] },
  { id: 4, name: 'Customer Onboarding.mp4', type: 'Video', size: '245 MB', uploadedBy: 'Khalid Ibrahim', date: '2026-02-22', tags: ['Training', 'Onboarding'] },
  { id: 5, name: 'Logo Package.zip', type: 'Other', size: '12.4 MB', uploadedBy: 'Sarah Ahmed', date: '2026-02-21', tags: ['Brand', 'Logo'] },
  { id: 6, name: 'Social Media Banner.jpg', type: 'Image', size: '3.1 MB', uploadedBy: 'Layla Mansour', date: '2026-02-20', tags: ['Social', 'Marketing'] },
  { id: 7, name: 'Sales Deck H1 2026.pdf', type: 'Document', size: '6.9 MB', uploadedBy: 'Omar Hassan', date: '2026-02-19', tags: ['Sales', 'Presentation'] },
  { id: 8, name: 'Team Photo Retreat.jpg', type: 'Image', size: '5.4 MB', uploadedBy: 'Nour Saleh', date: '2026-02-18', tags: ['HR', 'Culture'] },
  { id: 9, name: 'Annual Budget Template.xlsx', type: 'Spreadsheet', size: '820 KB', uploadedBy: 'Fatima Ali', date: '2026-02-17', tags: ['Finance', 'Template'] },
  { id: 10, name: 'Product Demo Walkthrough.mp4', type: 'Video', size: '189 MB', uploadedBy: 'Khalid Ibrahim', date: '2026-02-16', tags: ['Product', 'Demo'] },
  { id: 11, name: 'Privacy Policy Draft.pdf', type: 'Document', size: '1.2 MB', uploadedBy: 'Sarah Ahmed', date: '2026-02-15', tags: ['Legal', 'Policy'] },
  { id: 12, name: 'Newsletter Header.png', type: 'Image', size: '2.8 MB', uploadedBy: 'Layla Mansour', date: '2026-02-14', tags: ['Marketing', 'Email'] },
  { id: 13, name: 'Client Contacts Export.csv', type: 'Spreadsheet', size: '340 KB', uploadedBy: 'Omar Hassan', date: '2026-02-13', tags: ['CRM', 'Export'] },
  { id: 14, name: 'Webinar Recording Feb.mp4', type: 'Video', size: '512 MB', uploadedBy: 'Nour Saleh', date: '2026-02-12', tags: ['Marketing', 'Webinar'] },
  { id: 15, name: 'Employee Handbook.pdf', type: 'Document', size: '3.5 MB', uploadedBy: 'Fatima Ali', date: '2026-02-11', tags: ['HR', 'Handbook'] },
  { id: 16, name: 'App Wireframes.fig', type: 'Other', size: '18.3 MB', uploadedBy: 'Khalid Ibrahim', date: '2026-02-10', tags: ['Design', 'Product'] },
];

const assets = ref<Asset[]>([]);

// ─── All Tags ───────────────────────────────────────────────
const allTags = computed(() => {
  const tagSet = new Set<string>();
  assets.value.forEach((a) => a.tags.forEach((tag) => tagSet.add(tag)));
  return Array.from(tagSet).sort();
});

// ─── Filtered Assets ────────────────────────────────────────
const filteredAssets = computed(() => {
  return assets.value.filter((a) => {
    const matchSearch = !assetSearch.value || a.name.toLowerCase().includes(assetSearch.value.toLowerCase());
    const matchType = !typeFilter.value || a.type === typeFilter.value;
    const matchTag = !tagFilter.value || a.tags.includes(tagFilter.value);
    return matchSearch && matchType && matchTag;
  });
});

// ─── Asset Helpers ──────────────────────────────────────────
function getAssetIcon(type: string): string {
  const icons: Record<string, string> = {
    Image: 'ph:image-bold',
    Document: 'ph:file-pdf-bold',
    Video: 'ph:video-camera-bold',
    Spreadsheet: 'ph:table-bold',
    Other: 'ph:file-bold',
  };
  return icons[type] || 'ph:file-bold';
}

function getAssetColor(type: string): string {
  const colors: Record<string, string> = {
    Image: '#7849ff',
    Document: '#ef4444',
    Video: '#3b82f6',
    Spreadsheet: '#22c55e',
    Other: '#f59e0b',
  };
  return colors[type] || '#6b7280';
}

function getTagType(type: string): string {
  const types: Record<string, string> = {
    Image: '',
    Document: 'danger',
    Video: 'warning',
    Spreadsheet: 'success',
    Other: 'info',
  };
  return types[type] || 'info';
}

function previewAsset(asset: Asset) {
  ElMessage.info(`Previewing: ${asset.name}`);
}

function downloadAsset(asset: Asset) {
  ElMessage.success(`Downloading: ${asset.name}`);
}

function shareAsset(asset: Asset) {
  ElMessage.info(`Sharing: ${asset.name}`);
}

function deleteAsset(asset: Asset) {
  ElMessageBox.confirm(`Delete ${asset.name}?`, t('assetLibrary.delete'), {
    confirmButtonText: t('assetLibrary.delete'),
    cancelButtonText: t('common.cancel'),
    type: 'warning',
  }).then(() => {
    assets.value = assets.value.filter((a) => a.id !== asset.id);
    ElMessage.success(`Deleted: ${asset.name}`);
  }).catch(() => {});
}

function triggerUpload() {
  showUploadDialog.value = true;
}

function handleDrop() {
  isDragOver.value = false;
  ElMessage.info('File upload simulation triggered');
}

function handleDialogDrop() {
  isDialogDragOver.value = false;
  ElMessage.info('File upload simulation triggered');
}

// ─── Collections ────────────────────────────────────────────
const newCollection = ref({
  name: '',
  description: '',
  privacy: 'private',
});

const collections = ref<Collection[]>([
  {
    id: 1,
    name: 'Brand Assets',
    assetCount: 34,
    sharedWith: 8,
    lastUpdated: '2026-02-26',
    thumbnails: [
      { icon: 'ph:image-bold', color: '#7849ff', bg: 'rgba(120, 73, 255, 0.08)' },
      { icon: 'ph:file-pdf-bold', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)' },
      { icon: 'ph:image-bold', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)' },
      { icon: 'ph:file-bold', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' },
    ],
  },
  {
    id: 2,
    name: 'Marketing Campaign Q1',
    assetCount: 22,
    sharedWith: 5,
    lastUpdated: '2026-02-24',
    thumbnails: [
      { icon: 'ph:video-camera-bold', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)' },
      { icon: 'ph:image-bold', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.08)' },
      { icon: 'ph:file-pdf-bold', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)' },
      { icon: 'ph:image-bold', color: '#7849ff', bg: 'rgba(120, 73, 255, 0.08)' },
    ],
  },
  {
    id: 3,
    name: 'Sales Presentations',
    assetCount: 15,
    sharedWith: 12,
    lastUpdated: '2026-02-22',
    thumbnails: [
      { icon: 'ph:file-pdf-bold', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)' },
      { icon: 'ph:table-bold', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.08)' },
      { icon: 'ph:file-pdf-bold', color: '#7849ff', bg: 'rgba(120, 73, 255, 0.08)' },
      { icon: 'ph:image-bold', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' },
    ],
  },
  {
    id: 4,
    name: 'Product Screenshots',
    assetCount: 48,
    sharedWith: 3,
    lastUpdated: '2026-02-20',
    thumbnails: [
      { icon: 'ph:image-bold', color: '#7849ff', bg: 'rgba(120, 73, 255, 0.08)' },
      { icon: 'ph:image-bold', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)' },
      { icon: 'ph:image-bold', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.08)' },
      { icon: 'ph:image-bold', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)' },
    ],
  },
  {
    id: 5,
    name: 'HR Documents',
    assetCount: 19,
    sharedWith: 4,
    lastUpdated: '2026-02-18',
    thumbnails: [
      { icon: 'ph:file-pdf-bold', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)' },
      { icon: 'ph:file-pdf-bold', color: '#7849ff', bg: 'rgba(120, 73, 255, 0.08)' },
      { icon: 'ph:table-bold', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.08)' },
      { icon: 'ph:file-bold', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' },
    ],
  },
  {
    id: 6,
    name: 'Training Videos',
    assetCount: 11,
    sharedWith: 15,
    lastUpdated: '2026-02-15',
    thumbnails: [
      { icon: 'ph:video-camera-bold', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)' },
      { icon: 'ph:video-camera-bold', color: '#7849ff', bg: 'rgba(120, 73, 255, 0.08)' },
      { icon: 'ph:video-camera-bold', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.08)' },
      { icon: 'ph:file-pdf-bold', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)' },
    ],
  },
]);

function openCollection(collection: Collection) {
  ElMessage.info(`Opening: ${collection.name}`);
}

function shareCollection(collection: Collection) {
  ElMessage.info(`Sharing: ${collection.name}`);
}

function editCollection(collection: Collection) {
  ElMessage.info(`Editing: ${collection.name}`);
}

function deleteCollection(collection: Collection) {
  ElMessageBox.confirm(`Delete collection "${collection.name}"?`, t('assetLibrary.delete'), {
    confirmButtonText: t('assetLibrary.delete'),
    cancelButtonText: t('common.cancel'),
    type: 'warning',
  }).then(() => {
    collections.value = collections.value.filter((c) => c.id !== collection.id);
    ElMessage.success('Collection deleted');
  }).catch(() => {});
}

function createCollection() {
  ElMessage.success(`Collection "${newCollection.value.name}" created`);
  showCollectionDialog.value = false;
  newCollection.value = { name: '', description: '', privacy: 'private' };
}

// ─── Usage & Analytics ──────────────────────────────────────
const mostDownloadedAssets = ref<Asset[]>([
  { id: 1, name: 'Brand Guidelines 2026.pdf', type: 'Document', size: '4.2 MB', uploadedBy: 'Sarah Ahmed', date: '2026-02-25', tags: [], downloads: 347, views: 1204, lastAccessed: '2026-02-28' },
  { id: 2, name: 'Product Hero Shot.png', type: 'Image', size: '8.7 MB', uploadedBy: 'Omar Hassan', date: '2026-02-24', tags: [], downloads: 289, views: 982, lastAccessed: '2026-02-27' },
  { id: 3, name: 'Sales Deck H1 2026.pdf', type: 'Document', size: '6.9 MB', uploadedBy: 'Omar Hassan', date: '2026-02-19', tags: [], downloads: 234, views: 876, lastAccessed: '2026-02-28' },
  { id: 4, name: 'Social Media Banner.jpg', type: 'Image', size: '3.1 MB', uploadedBy: 'Layla Mansour', date: '2026-02-20', tags: [], downloads: 198, views: 654, lastAccessed: '2026-02-26' },
  { id: 5, name: 'Q4 Revenue Report.xlsx', type: 'Spreadsheet', size: '1.8 MB', uploadedBy: 'Fatima Ali', date: '2026-02-23', tags: [], downloads: 156, views: 543, lastAccessed: '2026-02-25' },
  { id: 6, name: 'Customer Onboarding.mp4', type: 'Video', size: '245 MB', uploadedBy: 'Khalid Ibrahim', date: '2026-02-22', tags: [], downloads: 142, views: 487, lastAccessed: '2026-02-27' },
  { id: 7, name: 'Employee Handbook.pdf', type: 'Document', size: '3.5 MB', uploadedBy: 'Fatima Ali', date: '2026-02-11', tags: [], downloads: 128, views: 412, lastAccessed: '2026-02-24' },
  { id: 8, name: 'Newsletter Header.png', type: 'Image', size: '2.8 MB', uploadedBy: 'Layla Mansour', date: '2026-02-14', tags: [], downloads: 115, views: 378, lastAccessed: '2026-02-23' },
]);

// ─── Chart Tooltip Style ────────────────────────────────────
const tooltipStyle = {
  backgroundColor: 'rgba(30, 30, 45, 0.92)',
  borderColor: 'rgba(120, 73, 255, 0.3)',
  borderWidth: 1,
  padding: [12, 16],
  textStyle: { color: '#fff', fontSize: 12 },
  extraCssText: 'backdrop-filter: blur(12px); border-radius: 12px;',
};

// ─── Storage Breakdown Chart ────────────────────────────────
const storageBreakdownOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    ...tooltipStyle,
  },
  legend: {
    orient: 'vertical',
    right: '5%',
    top: 'center',
    textStyle: { color: 'var(--text-muted)', fontSize: 12 },
  },
  series: [
    {
      name: t('assetLibrary.storageBreakdown'),
      type: 'pie',
      radius: ['45%', '72%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 8,
        borderColor: 'var(--bg-elevated)',
        borderWidth: 3,
      },
      label: {
        show: false,
        position: 'center',
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      labelLine: { show: false },
      data: [
        { value: 18.4, name: t('assetLibrary.images'), itemStyle: { color: '#7849ff' } },
        { value: 12.6, name: t('assetLibrary.documents'), itemStyle: { color: '#ef4444' } },
        { value: 10.8, name: t('assetLibrary.videos'), itemStyle: { color: '#3b82f6' } },
        { value: 4.2, name: t('assetLibrary.spreadsheets'), itemStyle: { color: '#22c55e' } },
        { value: 2.2, name: t('assetLibrary.other'), itemStyle: { color: '#f59e0b' } },
      ],
    },
  ],
}));

// ─── Upload Trend Chart ─────────────────────────────────────
const uploadTrendOption = computed(() => {
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(2026, 1, i + 1);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });
  const values = [12, 8, 15, 6, 18, 22, 10, 14, 9, 20, 16, 11, 25, 13, 7, 19, 23, 17, 8, 14, 21, 10, 16, 12, 28, 15, 9, 18, 24, 11];

  return {
    tooltip: {
      trigger: 'axis',
      ...tooltipStyle,
    },
    grid: {
      top: 20,
      right: 20,
      bottom: 30,
      left: 45,
    },
    xAxis: {
      type: 'category',
      data: days,
      axisLine: { lineStyle: { color: 'var(--border-default)' } },
      axisLabel: { color: 'var(--text-muted)', fontSize: 10, interval: 4 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { color: 'var(--text-muted)', fontSize: 10 },
      splitLine: { lineStyle: { color: 'var(--border-default)', type: 'dashed' } },
    },
    series: [
      {
        name: t('assetLibrary.uploadTrend'),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#22c55e', width: 3 },
        itemStyle: { color: '#22c55e' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(34, 197, 94, 0.25)' },
              { offset: 1, color: 'rgba(34, 197, 94, 0.02)' },
            ],
          },
        },
        data: values,
      },
    ],
  };
});

// ─── Usage by Department Chart ──────────────────────────────
const usageByDepartmentOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    ...tooltipStyle,
  },
  grid: {
    top: 20,
    right: 30,
    bottom: 30,
    left: 100,
  },
  xAxis: {
    type: 'value',
    axisLine: { show: false },
    axisLabel: { color: 'var(--text-muted)', fontSize: 11 },
    splitLine: { lineStyle: { color: 'var(--border-default)', type: 'dashed' } },
  },
  yAxis: {
    type: 'category',
    data: ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Legal'],
    axisLine: { lineStyle: { color: 'var(--border-default)' } },
    axisLabel: { color: 'var(--text-muted)', fontSize: 11 },
  },
  series: [
    {
      name: t('assetLibrary.downloads'),
      type: 'bar',
      barWidth: 14,
      itemStyle: {
        color: '#7849ff',
        borderRadius: [0, 6, 6, 0],
      },
      data: [482, 396, 354, 218, 186, 142, 98],
    },
    {
      name: t('assetLibrary.views'),
      type: 'bar',
      barWidth: 14,
      itemStyle: {
        color: '#3b82f6',
        borderRadius: [0, 6, 6, 0],
      },
      data: [1240, 1084, 892, 564, 432, 324, 210],
    },
  ],
}));

// ─── Versions ───────────────────────────────────────────────
const versionEntries = ref<VersionEntry[]>([
  { id: 1, assetName: 'Brand Guidelines 2026.pdf', type: 'Document', version: 'v3.2', uploadedBy: 'Sarah Ahmed', date: '2026-02-25', size: '4.2 MB', changes: 'Updated logo usage section and color palette', isCurrent: true, previousVersion: 'v3.1', previousSize: '4.0 MB', previousDate: '2026-02-18', previousUploader: 'Sarah Ahmed' },
  { id: 2, assetName: 'Brand Guidelines 2026.pdf', type: 'Document', version: 'v3.1', uploadedBy: 'Sarah Ahmed', date: '2026-02-18', size: '4.0 MB', changes: 'Added digital-first brand voice guidelines', isCurrent: false, previousVersion: 'v3.0', previousSize: '3.8 MB', previousDate: '2026-02-10', previousUploader: 'Omar Hassan' },
  { id: 3, assetName: 'Brand Guidelines 2026.pdf', type: 'Document', version: 'v3.0', uploadedBy: 'Omar Hassan', date: '2026-02-10', size: '3.8 MB', changes: 'Major revision for 2026 rebrand', isCurrent: false, previousVersion: 'v2.4', previousSize: '3.2 MB', previousDate: '2025-12-15', previousUploader: 'Sarah Ahmed' },
  { id: 4, assetName: 'Sales Deck H1 2026.pdf', type: 'Document', version: 'v2.1', uploadedBy: 'Omar Hassan', date: '2026-02-19', size: '6.9 MB', changes: 'Updated pricing slides and case studies', isCurrent: true, previousVersion: 'v2.0', previousSize: '6.5 MB', previousDate: '2026-02-12', previousUploader: 'Omar Hassan' },
  { id: 5, assetName: 'Sales Deck H1 2026.pdf', type: 'Document', version: 'v2.0', uploadedBy: 'Omar Hassan', date: '2026-02-12', size: '6.5 MB', changes: 'Redesigned with new brand template', isCurrent: false, previousVersion: 'v1.3', previousSize: '5.8 MB', previousDate: '2026-01-28', previousUploader: 'Fatima Ali' },
  { id: 6, assetName: 'Product Hero Shot.png', type: 'Image', version: 'v1.4', uploadedBy: 'Layla Mansour', date: '2026-02-24', size: '8.7 MB', changes: 'Higher resolution export, adjusted lighting', isCurrent: true, previousVersion: 'v1.3', previousSize: '7.2 MB', previousDate: '2026-02-16', previousUploader: 'Layla Mansour' },
  { id: 7, assetName: 'Product Hero Shot.png', type: 'Image', version: 'v1.3', uploadedBy: 'Layla Mansour', date: '2026-02-16', size: '7.2 MB', changes: 'Color correction and background cleanup', isCurrent: false, previousVersion: 'v1.2', previousSize: '6.8 MB', previousDate: '2026-02-08', previousUploader: 'Khalid Ibrahim' },
  { id: 8, assetName: 'Employee Handbook.pdf', type: 'Document', version: 'v4.0', uploadedBy: 'Fatima Ali', date: '2026-02-11', size: '3.5 MB', changes: 'Updated remote work and leave policies', isCurrent: true, previousVersion: 'v3.8', previousSize: '3.3 MB', previousDate: '2026-01-22', previousUploader: 'Fatima Ali' },
  { id: 9, assetName: 'Employee Handbook.pdf', type: 'Document', version: 'v3.8', uploadedBy: 'Fatima Ali', date: '2026-01-22', size: '3.3 MB', changes: 'Added new benefits section', isCurrent: false, previousVersion: 'v3.7', previousSize: '3.1 MB', previousDate: '2025-12-30', previousUploader: 'Nour Saleh' },
  { id: 10, assetName: 'Q4 Revenue Report.xlsx', type: 'Spreadsheet', version: 'v1.2', uploadedBy: 'Fatima Ali', date: '2026-02-23', size: '1.8 MB', changes: 'Final audited figures and chart updates', isCurrent: true, previousVersion: 'v1.1', previousSize: '1.6 MB', previousDate: '2026-02-15', previousUploader: 'Fatima Ali' },
  { id: 11, assetName: 'Q4 Revenue Report.xlsx', type: 'Spreadsheet', version: 'v1.1', uploadedBy: 'Fatima Ali', date: '2026-02-15', size: '1.6 MB', changes: 'Updated with December actuals', isCurrent: false, previousVersion: 'v1.0', previousSize: '1.4 MB', previousDate: '2026-02-05', previousUploader: 'Omar Hassan' },
  { id: 12, assetName: 'Q4 Revenue Report.xlsx', type: 'Spreadsheet', version: 'v1.0', uploadedBy: 'Omar Hassan', date: '2026-02-05', size: '1.4 MB', changes: 'Initial draft with preliminary numbers', isCurrent: false, previousVersion: 'N/A', previousSize: 'N/A', previousDate: 'N/A', previousUploader: 'N/A' },
]);

function onVersionSelect(row: VersionEntry | null) {
  if (row && !row.isCurrent && row.previousVersion) {
    selectedVersion.value = row as VersionDiff;
  } else if (row && row.isCurrent && row.previousVersion) {
    selectedVersion.value = row as VersionDiff;
  } else {
    selectedVersion.value = null;
  }
}

function restoreVersion(entry: VersionEntry) {
  ElMessageBox.confirm(
    `Restore ${entry.assetName} to ${entry.version}?`,
    t('assetLibrary.restore'),
    {
      confirmButtonText: t('assetLibrary.restore'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    },
  ).then(() => {
    ElMessage.success(`Restored ${entry.assetName} to ${entry.version}`);
  }).catch(() => {});
}

// ─── Data Loading ───────────────────────────────────────────
async function loadData() {
  loading.value = true;
  try {
    const res = await useApiFetch('documents');
    if (res.success && Array.isArray(res.body)) {
      assets.value = res.body as any;
    } else {
      assets.value = assetsFallback;
    }
  } catch {
    assets.value = assetsFallback;
  }
  loading.value = false;
}

// ─── Lifecycle ──────────────────────────────────────────────
onMounted(() => { loadData(); });
</script>

<style lang="scss" scoped>
.asset-library-page {
  animation: fadeInUp 0.6s ease-out;
  min-height: 100vh;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

.glass-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  transition: box-shadow 0.3s ease;
  &:hover { box-shadow: 0 8px 32px rgba(120, 73, 255, 0.08); }
}

.kpi-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  cursor: default;
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(120, 73, 255, 0.12);
    border-color: rgba(120, 73, 255, 0.3);
  }
}

.kpi-icon-wrapper {
  width: 48px; height: 48px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
}

.header-icon-wrapper {
  width: 52px; height: 52px; border-radius: 14px;
  background: linear-gradient(135deg, #7849ff, #6730e3);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 24px rgba(120, 73, 255, 0.3);
}

.asset-tabs {
  :deep(.el-tabs__nav-wrap::after) { background: var(--border-default); }
  :deep(.el-tabs__item) {
    color: var(--text-muted); font-weight: 500;
    &.is-active { color: #7849ff; font-weight: 600; }
    &:hover { color: #7849ff; }
  }
  :deep(.el-tabs__active-bar) { background-color: #7849ff; }
}

.upload-zone {
  border: 2px dashed var(--border-default);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  &:hover, &.drag-over {
    border-color: #7849ff;
    background: rgba(120, 73, 255, 0.05);
  }
}

.asset-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(120, 73, 255, 0.12);
    .asset-overlay { opacity: 1; }
  }
}

.asset-thumbnail {
  height: 140px;
  background: rgba(120, 73, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.asset-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.collection-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  padding: 1rem;
  transition: all 0.3s ease;
  cursor: pointer;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(120, 73, 255, 0.1);
  }
}
</style>
