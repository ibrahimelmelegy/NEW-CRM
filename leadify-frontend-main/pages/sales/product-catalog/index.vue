<template lang="pug">
.p-6.animate-entrance
  ModuleHeader(:title="$t('productCatalog.title')" :subtitle="$t('productCatalog.subtitle')")
    template(#actions)
      el-button(type="primary" size="large" @click="openProductDialog()" class="premium-btn")
        Icon(name="ph:plus-bold" size="20")
        span.mx-1 {{ $t('productCatalog.addProduct') }}
      el-button(size="large" @click="exportCsv" class="premium-btn")
        Icon(name="ph:download-simple-bold" size="18")
        span.mx-1 {{ $t('productCatalog.exportCsv') }}

  //- KPI Cards
  StatCards(:stats="kpiStats")

  //- Main Tabs
  .glass-card.py-6.animate-entrance
    el-tabs(v-model="activeTab" class="px-4")

      //- ============ PRODUCT CATALOG TAB ============
      el-tab-pane(:label="$t('productCatalog.catalog')" name="catalog")
        //- Search, Filters & View Toggle
        .flex.items-center.justify-between.flex-wrap.gap-3.mb-4
          .flex.items-center.gap-2.flex-wrap
            el-input(v-model="searchQuery" :placeholder="$t('common.search')" clearable style="width: 220px" size="default")
              template(#prefix)
                Icon(name="ph:magnifying-glass" size="16")
            el-select(v-model="filterCategory" clearable :placeholder="$t('productCatalog.category')" style="width: 160px" size="default")
              el-option(v-for="cat in uniqueCategories" :key="cat" :label="cat" :value="cat")
            el-select(v-model="filterStatus" clearable :placeholder="$t('productCatalog.stockStatus')" style="width: 160px" size="default")
              el-option(:label="$t('productCatalog.active')" value="active")
              el-option(:label="$t('productCatalog.inactive')" value="inactive")
              el-option(:label="$t('productCatalog.discontinued')" value="discontinued")
            el-input-number(v-model="priceMin" :placeholder="$t('productCatalog.minPrice')" :min="0" :controls="false" style="width: 120px" size="default")
            span.text-sm(style="color: var(--text-muted)") —
            el-input-number(v-model="priceMax" :placeholder="$t('productCatalog.maxPrice')" :min="0" :controls="false" style="width: 120px" size="default")
          .flex.items-center.gap-2
            el-select(v-model="sortKey" style="width: 180px" size="default")
              el-option(:label="$t('productCatalog.sortByName')" value="name")
              el-option(:label="$t('productCatalog.sortByPriceAsc')" value="price_asc")
              el-option(:label="$t('productCatalog.sortByPriceDesc')" value="price_desc")
              el-option(:label="$t('productCatalog.sortByRecent')" value="recent")
            el-button-group
              el-button(:type="viewMode === 'grid' ? 'primary' : ''" @click="viewMode = 'grid'" size="default")
                Icon(name="ph:squares-four" size="16")
              el-button(:type="viewMode === 'list' ? 'primary' : ''" @click="viewMode = 'list'" size="default")
                Icon(name="ph:list-bullets" size="16")

        //- Bulk Actions Bar
        transition(name="el-fade-in")
          .glass-card.p-3.rounded-2xl.mb-4(v-if="selectedProducts.length")
            .flex.items-center.justify-between
              .flex.items-center.gap-2
                Icon(name="ph:check-square-bold" size="18" style="color: #7849ff")
                span.text-sm.font-semibold(style="color: var(--text-primary)") {{ selectedProducts.length }} {{ $t('productCatalog.selected') }}
              .flex.items-center.gap-2
                el-button(type="warning" size="small" @click="bulkDeactivate")
                  Icon(name="ph:prohibit" size="14" class="mr-1")
                  | {{ $t('productCatalog.bulkDeactivate') }}
                el-button(type="info" size="small" @click="showBulkPriceDialog = true")
                  Icon(name="ph:currency-dollar" size="14" class="mr-1")
                  | {{ $t('productCatalog.bulkPriceUpdate') }}

        //- Grid View
        .grid.grid-cols-1.gap-4(v-if="viewMode === 'grid'" class="md:grid-cols-2 lg:grid-cols-4" v-loading="loading")
          .rounded-2xl.border.overflow-hidden.transition-all.relative.group(
            v-for="prod in filteredProducts"
            :key="prod.id"
            style="border-color: var(--border-default); background: var(--bg-elevated);"
            class="hover:shadow-lg hover:border-violet-200"
          )
            //- Selection checkbox
            .absolute.top-2.left-2.z-10
              el-checkbox(:model-value="isSelected(prod.id)" @change="toggleSelection(prod)")

            //- Product image placeholder
            .h-36.flex.items-center.justify-center.relative(style="background: linear-gradient(135deg, #f3f4f6, #e5e7eb);")
              Icon(name="ph:package-bold" size="48" style="color: #7849ff;")
              //- Quick edit price overlay
              .absolute.inset-0.flex.items-center.justify-center.opacity-0.transition-opacity(
                class="group-hover:opacity-100"
                style="background: rgba(0,0,0,0.5);"
              )
                el-input-number(
                  :model-value="prod.unitPrice"
                  size="small"
                  :min="0"
                  :precision="2"
                  style="width: 140px"
                  @change="(val: number) => quickUpdatePrice(prod.id, val)"
                )

            .p-4
              .flex.items-center.justify-between.mb-1
                el-tag(size="small" round effect="plain") {{ prod.category || $t('productCatalog.general') }}
                el-tag(:type="getStatusTagType(prod.status)" size="small" round effect="dark") {{ getStatusLabel(prod.status) }}
              h3.text-sm.font-bold.mb-1.line-clamp-1(style="color: var(--text-primary);") {{ prod.name }}
              p.text-xs.line-clamp-2.mb-2(style="color: var(--text-muted);") {{ prod.description || '—' }}
              .flex.items-center.justify-between.mb-1
                span.text-lg.font-black(style="color: #7c3aed;") {{ formatCurrency(prod.unitPrice) }}
                  span.text-xs.font-normal.ml-1 {{ prod.currency || 'SAR' }}
                span.text-xs.font-mono(style="color: var(--text-muted);") {{ prod.sku || '—' }}
              .flex.items-center.gap-2.mt-3
                el-button(size="small" text @click="openProductDialog(prod)")
                  Icon(name="ph:pencil" size="14")
                el-button(size="small" text @click="cloneProduct(prod)")
                  Icon(name="ph:copy" size="14")
                el-button(size="small" text type="danger" @click="handleDelete(prod.id)")
                  Icon(name="ph:trash" size="14")

          //- Empty state
          .rounded-2xl.border-2.border-dashed.text-center.p-12.col-span-4(
            v-if="!loading && filteredProducts.length === 0"
            style="border-color: var(--border-default); color: var(--text-muted);"
          )
            Icon(name="ph:package" size="48")
            p.text-sm.mt-3 {{ $t('productCatalog.noProducts') }}

        //- List View
        el-card.rounded-2xl(v-else shadow="never" style="border: 1px solid var(--border-default);" v-loading="loading")
          el-table(:data="filteredProducts" style="width: 100%" @selection-change="handleSelectionChange")
            el-table-column(type="selection" width="55")
            el-table-column(:label="$t('productCatalog.productName')" min-width="220")
              template(#default="{ row }")
                .flex.items-center.gap-3
                  .w-10.h-10.rounded-lg.flex.items-center.justify-center.shrink-0(style="background: linear-gradient(135deg, #f3f4f6, #e5e7eb)")
                    Icon(name="ph:package-bold" size="20" style="color: #7849ff")
                  div
                    p.text-sm.font-bold(style="color: var(--text-primary)") {{ row.name }}
                    p.text-xs(style="color: var(--text-muted)") {{ row.sku || '—' }}
            el-table-column(:label="$t('productCatalog.category')" width="140")
              template(#default="{ row }")
                el-tag(size="small" round effect="plain") {{ row.category || $t('productCatalog.general') }}
            el-table-column(:label="$t('productCatalog.basePrice')" width="140" align="right" sortable)
              template(#default="{ row }")
                span.text-sm.font-bold(style="color: #7c3aed") {{ formatCurrency(row.unitPrice) }} {{ row.currency || 'SAR' }}
            el-table-column(:label="$t('productCatalog.costPrice')" width="130" align="right")
              template(#default="{ row }")
                span.text-sm {{ formatCurrency(row.costPrice || 0) }}
            el-table-column(:label="$t('productCatalog.marginPercent')" width="120" align="center")
              template(#default="{ row }")
                span.text-sm.font-bold(:style="{ color: getMarginColor(calcMargin(row)) }") {{ calcMargin(row) }}%
            el-table-column(:label="$t('productCatalog.stockStatus')" width="120" align="center")
              template(#default="{ row }")
                el-tag(:type="getStockTagType(row.stockQuantity)" size="small" round)
                  | {{ row.stockQuantity != null ? row.stockQuantity : '--' }}
            el-table-column(:label="$t('common.status')" width="120")
              template(#default="{ row }")
                el-tag(:type="getStatusTagType(row.status)" size="small" round effect="dark") {{ getStatusLabel(row.status) }}
            el-table-column(:label="$t('common.actions')" width="140" align="center" fixed="right")
              template(#default="{ row }")
                .flex.items-center.gap-1
                  el-tooltip(:content="$t('common.edit')")
                    el-button(text size="small" @click="openProductDialog(row)")
                      Icon(name="ph:pencil" size="14")
                  el-tooltip(:content="$t('productCatalog.clone')")
                    el-button(text size="small" @click="cloneProduct(row)")
                      Icon(name="ph:copy" size="14")
                  el-tooltip(:content="$t('productCatalog.deactivate')")
                    el-button(text size="small" type="warning" @click="deactivateProduct(row)")
                      Icon(name="ph:prohibit" size="14")
                  el-tooltip(:content="$t('common.delete')")
                    el-button(text size="small" type="danger" @click="handleDelete(row.id)")
                      Icon(name="ph:trash" size="14")
            template(#empty)
              el-empty(:description="$t('productCatalog.noProducts')")

          .flex.justify-end.mt-4
            el-pagination(
              :current-page="pagination.page"
              :page-size="pagination.limit"
              :total="pagination.total"
              layout="total, prev, pager, next"
              @current-change="(p: number) => { pagination.page = p; loadProducts() }"
            )

      //- ============ PRICE LISTS TAB ============
      el-tab-pane(:label="$t('productCatalog.priceLists')" name="priceLists")
        .flex.items-center.justify-between.mb-4
          p.text-sm(style="color: var(--text-muted)") {{ $t('productCatalog.priceListsDesc') }}
          el-button(type="primary" size="default" @click="openPriceListDialog()")
            Icon(name="ph:plus-bold" size="16")
            span.mx-1 {{ $t('productCatalog.createPriceList') }}

        //- Price List Accordion
        el-collapse(v-model="expandedPriceLists" v-loading="loadingPriceLists")
          el-collapse-item(
            v-for="pl in priceLists"
            :key="pl.id"
            :name="pl.id"
          )
            template(#title)
              .flex.items-center.gap-3.w-full.pr-4
                Icon(name="ph:list-bullets-bold" size="20" style="color: #7849ff")
                span.font-bold(style="color: var(--text-primary)") {{ pl.name }}
                el-tag(size="small" :type="pl.isActive ? 'success' : 'info'" round class="ml-2") {{ pl.isActive ? $t('productCatalog.active') : $t('productCatalog.inactive') }}
                span.text-xs.ml-auto(style="color: var(--text-muted)") {{ pl.segment || $t('productCatalog.allSegments') }}
                el-button(text size="small" @click.stop="openPriceListDialog(pl)" class="ml-2")
                  Icon(name="ph:pencil-simple" size="14")
                el-button(text size="small" type="danger" @click.stop="deletePriceList(pl.id)" class="ml-1")
                  Icon(name="ph:trash" size="14")

            el-table(:data="pl.items || []" size="small" style="width: 100%")
              el-table-column(:label="$t('productCatalog.productName')" min-width="180")
                template(#default="{ row }")
                  span.font-semibold {{ row.productName || '—' }}
              el-table-column(:label="$t('productCatalog.standardPrice')" width="140" align="right")
                template(#default="{ row }")
                  span {{ formatCurrency(row.standardPrice) }}
              el-table-column(:label="$t('productCatalog.listPrice')" width="140" align="right")
                template(#default="{ row }")
                  span.font-bold(style="color: #7c3aed") {{ formatCurrency(row.listPrice) }}
              el-table-column(:label="$t('productCatalog.discountPercent')" width="120" align="center")
                template(#default="{ row }")
                  el-tag(v-if="row.discountPercent" size="small" type="success" round) -{{ row.discountPercent }}%
                  span(v-else) —
              el-table-column(:label="$t('productCatalog.effectivePrice')" width="140" align="right")
                template(#default="{ row }")
                  span.font-bold(style="color: #22c55e") {{ formatCurrency(row.effectivePrice || row.listPrice) }}
              el-table-column(:label="$t('productCatalog.validFrom')" width="120")
                template(#default="{ row }")
                  span.text-xs.font-mono {{ row.validFrom ? formatDate(row.validFrom) : '—' }}
              el-table-column(:label="$t('productCatalog.validTo')" width="120")
                template(#default="{ row }")
                  span.text-xs.font-mono {{ row.validTo ? formatDate(row.validTo) : '—' }}
              template(#empty)
                el-empty(:description="$t('common.noData')" :image-size="60")

          .text-center.py-8(v-if="!loadingPriceLists && priceLists.length === 0")
            Icon(name="ph:list-bullets" size="48" style="color: var(--text-muted); opacity: 0.4")
            p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('productCatalog.noPriceLists') }}

      //- ============ PRODUCT CATEGORIES TAB ============
      el-tab-pane(:label="$t('productCatalog.productCategories')" name="categories")
        .flex.items-center.justify-between.mb-4
          p.text-sm(style="color: var(--text-muted)") {{ $t('productCatalog.categoriesDesc') }}
          el-button(type="primary" size="default" @click="openCategoryDialog()")
            Icon(name="ph:plus-bold" size="16")
            span.mx-1 {{ $t('productCatalog.addCategory') }}

        .grid.grid-cols-1.gap-6(class="lg:grid-cols-2")
          //- Category Tree
          .glass-card.p-5.rounded-2xl(v-loading="loadingCategories")
            h4.text-sm.font-bold.mb-4(style="color: var(--text-primary)")
              Icon(name="ph:tree-structure-bold" size="18" class="mr-2" style="color: #7849ff")
              | {{ $t('productCatalog.categoryTree') }}

            el-tree(
              :data="categoryTree"
              :props="{ label: 'name', children: 'children' }"
              node-key="id"
              default-expand-all
              draggable
              @node-drop="handleCategoryDrop"
              :expand-on-click-node="false"
            )
              template(#default="{ node, data }")
                .flex.items-center.justify-between.w-full.py-1
                  .flex.items-center.gap-2
                    Icon(name="ph:folder-bold" size="16" style="color: #7849ff")
                    span.text-sm.font-medium(style="color: var(--text-primary)") {{ data.name }}
                    el-tag(size="small" round class="ml-1") {{ data.productCount || 0 }}
                  .flex.items-center.gap-1
                    el-button(text size="small" @click.stop="openCategoryDialog(data)")
                      Icon(name="ph:pencil-simple" size="12")
                    el-button(text size="small" type="danger" @click.stop="deleteCategory(data.id)")
                      Icon(name="ph:trash" size="12")

            .text-center.py-6(v-if="!loadingCategories && categoryTree.length === 0")
              Icon(name="ph:folder-dashed" size="48" style="color: var(--text-muted); opacity: 0.4")
              p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('productCatalog.noCategories') }}

          //- Margin Distribution Chart
          .glass-card.p-5.rounded-2xl
            h4.text-sm.font-bold.mb-4(style="color: var(--text-primary)")
              Icon(name="ph:chart-pie-bold" size="18" class="mr-2" style="color: #7849ff")
              | {{ $t('productCatalog.marginDistribution') }}
            .h-72
              client-only
                div(ref="marginChartRef" style="width: 100%; height: 100%")

      //- ============ BUNDLE BUILDER TAB ============
      el-tab-pane(:label="$t('productCatalog.bundleBuilder')" name="bundles")
        .flex.items-center.justify-between.mb-4
          p.text-sm(style="color: var(--text-muted)") {{ $t('productCatalog.bundleDesc') }}
          el-button(type="primary" size="default" @click="openBundleDialog()")
            Icon(name="ph:plus-bold" size="16")
            span.mx-1 {{ $t('productCatalog.createBundle') }}

        .grid.grid-cols-1.gap-4(class="md:grid-cols-2 lg:grid-cols-3" v-loading="loadingBundles")
          .glass-card.p-5.rounded-2xl(
            v-for="bundle in bundles"
            :key="bundle.id"
            style="border: 1px solid var(--border-default)"
          )
            .flex.items-center.justify-between.mb-3
              .flex.items-center.gap-2
                Icon(name="ph:gift-bold" size="22" style="color: #7849ff")
                h4.text-sm.font-bold(style="color: var(--text-primary)") {{ bundle.name }}
              .flex.items-center.gap-1
                el-button(text size="small" @click="openBundleDialog(bundle)")
                  Icon(name="ph:pencil-simple" size="14")
                el-button(text size="small" type="danger" @click="deleteBundle(bundle.id)")
                  Icon(name="ph:trash" size="14")

            p.text-xs.mb-3(style="color: var(--text-muted)") {{ bundle.description || '—' }}

            //- Included products
            .space-y-2.mb-3
              .flex.items-center.justify-between.text-xs(v-for="item in bundle.items" :key="item.productId")
                .flex.items-center.gap-2
                  Icon(name="ph:package" size="14" style="color: var(--text-muted)")
                  span(style="color: var(--text-primary)") {{ item.productName }}
                .flex.items-center.gap-2
                  span(style="color: var(--text-muted)") x{{ item.quantity }}
                  span.font-mono {{ formatCurrency(item.unitPrice * item.quantity) }}

            //- Pricing comparison
            .border-t.pt-3(style="border-color: var(--border-default)")
              .flex.justify-between.text-xs.mb-1
                span(style="color: var(--text-muted)") {{ $t('productCatalog.individualTotal') }}
                span.line-through(style="color: var(--text-muted)") {{ formatCurrency(calcBundleIndividualTotal(bundle)) }}
              .flex.justify-between.text-sm.font-bold
                span(style="color: var(--text-primary)") {{ $t('productCatalog.bundlePrice') }}
                span(style="color: #22c55e") {{ formatCurrency(bundle.bundlePrice) }}
              .flex.justify-between.text-xs.mt-1
                span(style="color: var(--text-muted)") {{ $t('productCatalog.bundleDiscount') }}
                el-tag(size="small" type="success" round) {{ $t('productCatalog.save') }} {{ calcBundleSavingsPercent(bundle) }}%

          .rounded-2xl.border-2.border-dashed.text-center.p-12.col-span-3(
            v-if="!loadingBundles && bundles.length === 0"
            style="border-color: var(--border-default); color: var(--text-muted);"
          )
            Icon(name="ph:gift" size="48")
            p.text-sm.mt-3 {{ $t('productCatalog.noBundles') }}

  //- ============ PRODUCT ADD/EDIT DIALOG ============
  el-dialog(v-model="showProductDialog" :title="editingProductId ? $t('productCatalog.editProduct') : $t('productCatalog.addProduct')" width="600px" destroy-on-close)
    el-form(label-position="top" size="large")
      el-form-item(:label="$t('productCatalog.productName')" required)
        el-input(v-model="productForm.name" :placeholder="$t('productCatalog.productNamePlaceholder')")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('productCatalog.sku')")
          el-input(v-model="productForm.sku" placeholder="SKU-001")
        el-form-item(:label="$t('productCatalog.category')")
          el-select(v-model="productForm.category" class="w-full" allow-create filterable)
            el-option(v-for="cat in allCategoryNames" :key="cat" :label="cat" :value="cat")
      .grid.grid-cols-3.gap-4
        el-form-item(:label="$t('productCatalog.basePrice')" required)
          el-input-number(v-model="productForm.unitPrice" :min="0" :precision="2" class="w-full")
        el-form-item(:label="$t('productCatalog.costPrice')")
          el-input-number(v-model="productForm.costPrice" :min="0" :precision="2" class="w-full")
        el-form-item(:label="$t('productCatalog.currency')")
          el-select(v-model="productForm.currency" class="w-full")
            el-option(:label="$t('common.currencySAR')" value="SAR")
            el-option(:label="$t('common.currencyUSD')" value="USD")
            el-option(:label="$t('common.currencyEUR')" value="EUR")
            el-option(:label="$t('common.currencyGBP')" value="GBP")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('productCatalog.stockQuantity')")
          el-input-number(v-model="productForm.stockQuantity" :min="0" class="w-full")
        el-form-item(:label="$t('common.status')")
          el-select(v-model="productForm.status" class="w-full")
            el-option(:label="$t('productCatalog.active')" value="active")
            el-option(:label="$t('productCatalog.inactive')" value="inactive")
            el-option(:label="$t('productCatalog.discontinued')" value="discontinued")
      el-form-item(:label="$t('productCatalog.description')")
        el-input(v-model="productForm.description" type="textarea" :rows="3")
    template(#footer)
      el-button(@click="showProductDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="savingProduct" @click="saveProduct") {{ $t('common.save') }}

  //- ============ PRICE LIST DIALOG ============
  el-dialog(v-model="showPriceListDialog" :title="editingPriceListId ? $t('productCatalog.editPriceList') : $t('productCatalog.createPriceList')" width="700px" destroy-on-close)
    el-form(label-position="top" size="large")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('productCatalog.priceListName')" required)
          el-input(v-model="priceListForm.name" :placeholder="$t('productCatalog.priceListNamePlaceholder')")
        el-form-item(:label="$t('productCatalog.segment')")
          el-select(v-model="priceListForm.segment" class="w-full" clearable :placeholder="$t('productCatalog.selectSegment')")
            el-option(:label="$t('productCatalog.segmentStandard')" value="Standard")
            el-option(:label="$t('productCatalog.segmentEnterprise')" value="Enterprise")
            el-option(:label="$t('productCatalog.segmentPartner')" value="Partner")
            el-option(:label="$t('productCatalog.segmentVolumeDiscount')" value="Volume Discount")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('productCatalog.validFrom')")
          el-date-picker(v-model="priceListForm.validFrom" type="date" class="w-full" format="DD/MM/YYYY" value-format="YYYY-MM-DD")
        el-form-item(:label="$t('productCatalog.validTo')")
          el-date-picker(v-model="priceListForm.validTo" type="date" class="w-full" format="DD/MM/YYYY" value-format="YYYY-MM-DD")
      el-form-item
        el-checkbox(v-model="priceListForm.isActive") {{ $t('productCatalog.active') }}

      //- Price list line items
      .flex.items-center.justify-between.mb-3
        h4.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('productCatalog.priceListItems') }}
        el-button(type="primary" text size="small" @click="addPriceListItem")
          Icon(name="ph:plus-bold" size="14")
          span.ml-1 {{ $t('productCatalog.addItem') }}

      .space-y-3
        .grid.grid-cols-12.gap-3.items-end(v-for="(item, idx) in priceListForm.items" :key="idx")
          .col-span-4
            el-form-item(:label="idx === 0 ? $t('productCatalog.product') : ''" class="!mb-0")
              el-select(v-model="item.productId" class="w-full" filterable :placeholder="$t('productCatalog.selectProduct')" @change="onPriceListProductSelect(item)")
                el-option(v-for="p in products" :key="p.id" :label="p.name" :value="p.id")
          .col-span-2
            el-form-item(:label="idx === 0 ? $t('productCatalog.standardPrice') : ''" class="!mb-0")
              el-input-number(v-model="item.standardPrice" :min="0" :precision="2" :controls="false" class="w-full" disabled)
          .col-span-2
            el-form-item(:label="idx === 0 ? $t('productCatalog.listPrice') : ''" class="!mb-0")
              el-input-number(v-model="item.listPrice" :min="0" :precision="2" :controls="false" class="w-full")
          .col-span-2
            el-form-item(:label="idx === 0 ? $t('productCatalog.discountPercent') : ''" class="!mb-0")
              el-input-number(v-model="item.discountPercent" :min="0" :max="100" :precision="1" :controls="false" class="w-full")
          .col-span-2.flex.items-center.gap-1
            el-form-item(:label="idx === 0 ? ' ' : ''" class="!mb-0 flex-1")
              span.text-xs.font-bold(style="color: #22c55e") {{ formatCurrency(calcEffectivePrice(item)) }}
            el-button(v-if="priceListForm.items.length > 1" text circle size="small" type="danger" @click="priceListForm.items.splice(idx, 1)")
              Icon(name="ph:x-bold" size="14")

    template(#footer)
      el-button(@click="showPriceListDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="savingPriceList" @click="savePriceList") {{ $t('common.save') }}

  //- ============ CATEGORY DIALOG ============
  el-dialog(v-model="showCategoryDialog" :title="editingCategoryId ? $t('productCatalog.editCategory') : $t('productCatalog.addCategory')" width="480px" destroy-on-close)
    el-form(label-position="top" size="large")
      el-form-item(:label="$t('productCatalog.categoryName')" required)
        el-input(v-model="categoryForm.name" :placeholder="$t('productCatalog.categoryNamePlaceholder')")
      el-form-item(:label="$t('productCatalog.parentCategory')")
        el-tree-select(
          v-model="categoryForm.parentId"
          :data="categoryTree"
          :props="{ label: 'name', children: 'children', value: 'id' }"
          clearable
          :placeholder="$t('productCatalog.noParent')"
          class="w-full"
        )
      el-form-item(:label="$t('productCatalog.description')")
        el-input(v-model="categoryForm.description" type="textarea" :rows="2")
    template(#footer)
      el-button(@click="showCategoryDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="savingCategory" @click="saveCategory") {{ $t('common.save') }}

  //- ============ BUNDLE DIALOG ============
  el-dialog(v-model="showBundleDialog" :title="editingBundleId ? $t('productCatalog.editBundle') : $t('productCatalog.createBundle')" width="650px" destroy-on-close)
    el-form(label-position="top" size="large")
      el-form-item(:label="$t('productCatalog.bundleName')" required)
        el-input(v-model="bundleForm.name" :placeholder="$t('productCatalog.bundleNamePlaceholder')")
      el-form-item(:label="$t('productCatalog.description')")
        el-input(v-model="bundleForm.description" type="textarea" :rows="2")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('productCatalog.bundlePrice')" required)
          el-input-number(v-model="bundleForm.bundlePrice" :min="0" :precision="2" class="w-full")
        el-form-item(:label="$t('productCatalog.bundleDiscount')")
          el-input-number(v-model="bundleForm.discountPercent" :min="0" :max="100" :precision="1" class="w-full")

      //- Bundle items
      .flex.items-center.justify-between.mb-3
        h4.text-sm.font-bold(style="color: var(--text-primary)") {{ $t('productCatalog.includedProducts') }}
        el-button(type="primary" text size="small" @click="addBundleItem")
          Icon(name="ph:plus-bold" size="14")
          span.ml-1 {{ $t('productCatalog.addItem') }}

      .space-y-3
        .grid.grid-cols-12.gap-3.items-end(v-for="(item, idx) in bundleForm.items" :key="idx")
          .col-span-6
            el-form-item(:label="idx === 0 ? $t('productCatalog.product') : ''" class="!mb-0")
              el-select(v-model="item.productId" class="w-full" filterable :placeholder="$t('productCatalog.selectProduct')" @change="onBundleProductSelect(item)")
                el-option(v-for="p in products" :key="p.id" :label="p.name" :value="p.id")
          .col-span-3
            el-form-item(:label="idx === 0 ? $t('productCatalog.quantity') : ''" class="!mb-0")
              el-input-number(v-model="item.quantity" :min="1" class="w-full")
          .col-span-3.flex.items-center.gap-1
            el-form-item(:label="idx === 0 ? ' ' : ''" class="!mb-0 flex-1")
              span.text-xs.font-bold(style="color: var(--text-secondary)") {{ formatCurrency((item.unitPrice || 0) * item.quantity) }}
            el-button(v-if="bundleForm.items.length > 1" text circle size="small" type="danger" @click="bundleForm.items.splice(idx, 1)")
              Icon(name="ph:x-bold" size="14")

      //- Bundle pricing summary
      .glass-card.p-4.rounded-xl.mt-4(v-if="bundleForm.items.some(i => i.productId)")
        .flex.justify-between.text-sm.mb-1
          span(style="color: var(--text-muted)") {{ $t('productCatalog.individualTotal') }}
          span.line-through(style="color: var(--text-muted)") {{ formatCurrency(calcFormBundleTotal()) }}
        .flex.justify-between.text-sm.font-bold
          span(style="color: var(--text-primary)") {{ $t('productCatalog.bundlePrice') }}
          span(style="color: #22c55e") {{ formatCurrency(bundleForm.bundlePrice) }}

    template(#footer)
      el-button(@click="showBundleDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="savingBundle" @click="saveBundle") {{ $t('common.save') }}

  //- ============ BULK PRICE UPDATE DIALOG ============
  el-dialog(v-model="showBulkPriceDialog" :title="$t('productCatalog.bulkPriceUpdate')" width="450px" destroy-on-close)
    el-form(label-position="top" size="large")
      p.text-sm.mb-4(style="color: var(--text-muted)") {{ $t('productCatalog.bulkPriceUpdateDesc', { count: selectedProducts.length }) }}
      el-form-item(:label="$t('productCatalog.adjustmentType')")
        el-radio-group(v-model="bulkPriceForm.type")
          el-radio(value="percent") {{ $t('productCatalog.percentageChange') }}
          el-radio(value="fixed") {{ $t('productCatalog.fixedAmount') }}
      el-form-item(:label="$t('productCatalog.adjustmentValue')")
        el-input-number(v-model="bulkPriceForm.value" class="w-full" :precision="2")
    template(#footer)
      el-button(@click="showBulkPriceDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="savingBulkPrice" @click="applyBulkPriceUpdate") {{ $t('productCatalog.applyUpdate') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import * as echarts from 'echarts/core';
import {
  fetchProducts as apiFetchProducts,
  createProduct as apiCreateProduct,
  updateProduct as apiUpdateProduct,
  deleteProduct as apiDeleteProduct,
  type CatalogProduct
} from '~/composables/useProductCatalog';

definePageMeta({ middleware: 'permissions' });

const { $i18n } = useNuxtApp();
const t = $i18n.t;

// ──────────────────────────────────────────
// State
// ──────────────────────────────────────────
const activeTab = ref('catalog');
const viewMode = ref<'grid' | 'list'>('grid');
const loading = ref(false);
const products = ref<Record<string, unknown>[]>([]);
const pagination = reactive({ page: 1, limit: 20, total: 0 });

// Filters
const searchQuery = ref('');
const filterCategory = ref('');
const filterStatus = ref('');
const priceMin = ref<number | undefined>(undefined);
const priceMax = ref<number | undefined>(undefined);
const sortKey = ref('name');

// Selection
const selectedProducts = ref<Record<string, unknown>[]>([]);

// Product dialog
const showProductDialog = ref(false);
const savingProduct = ref(false);
const editingProductId = ref<string | null>(null);

const defaultProductForm = () => ({
  name: '',
  sku: '',
  category: '',
  unitPrice: 0,
  costPrice: 0,
  currency: 'SAR',
  stockQuantity: 0,
  status: 'active' as string,
  description: ''
});
const productForm = reactive(defaultProductForm());

// Price Lists
const loadingPriceLists = ref(false);
const showPriceListDialog = ref(false);
const savingPriceList = ref(false);
const editingPriceListId = ref<string | null>(null);
const priceLists = ref<Record<string, unknown>[]>([]);
const expandedPriceLists = ref<string[]>([]);

const defaultPriceListForm = () => ({
  name: '',
  segment: '',
  validFrom: '',
  validTo: '',
  isActive: true,
  items: [{ productId: '', productName: '', standardPrice: 0, listPrice: 0, discountPercent: 0 }] as unknown[]
});
const priceListForm = reactive(defaultPriceListForm());

// Categories
const loadingCategories = ref(false);
const showCategoryDialog = ref(false);
const savingCategory = ref(false);
const editingCategoryId = ref<string | null>(null);
const categoryTree = ref<Record<string, unknown>[]>([]);

const defaultCategoryForm = () => ({
  name: '',
  parentId: null as string | null,
  description: ''
});
const categoryForm = reactive(defaultCategoryForm());

// Bundles
const loadingBundles = ref(false);
const showBundleDialog = ref(false);
const savingBundle = ref(false);
const editingBundleId = ref<string | null>(null);
const bundles = ref<Record<string, unknown>[]>([]);

const defaultBundleForm = () => ({
  name: '',
  description: '',
  bundlePrice: 0,
  discountPercent: 0,
  items: [{ productId: '', productName: '', unitPrice: 0, quantity: 1 }] as unknown[]
});
const bundleForm = reactive(defaultBundleForm());

// Bulk price
const showBulkPriceDialog = ref(false);
const savingBulkPrice = ref(false);
const bulkPriceForm = reactive({ type: 'percent' as 'percent' | 'fixed', value: 0 });

// Chart
const marginChartRef = ref<HTMLElement>();

// ──────────────────────────────────────────
// Computed
// ──────────────────────────────────────────
const uniqueCategories = computed(() => {
  return Array.from(new Set(products.value.map(p => p.category).filter(Boolean))) as string[];
});

const allCategoryNames = computed(() => {
  const names = new Set<string>();
  const walk = (nodes: Record<string, unknown>[]) => {
    for (const n of nodes) {
      names.add(n.name);
      if (n.children?.length) walk(n.children);
    }
  };
  walk(categoryTree.value);
  // Also include from products
  products.value.forEach(p => {
    if (p.category) names.add(p.category);
  });
  return Array.from(names).sort();
});

const kpiStats = computed(() => {
  const total = products.value.length;
  const active = products.value.filter(p => p.status === 'active' || p.isActive).length;
  const cats = uniqueCategories.value.length;
  const avgMargin =
    total > 0
      ? Math.round(
          products.value.reduce((s, p) => {
            const unit = Number(p.unitPrice || 0);
            const cost = Number(p.costPrice || 0);
            return s + (unit > 0 ? ((unit - cost) / unit) * 100 : 0);
          }, 0) / total
        )
      : 0;
  return [
    { label: t('productCatalog.totalProducts'), value: total, icon: 'ph:package-bold', color: '#7849ff' },
    { label: t('productCatalog.activeProducts'), value: active, icon: 'ph:check-circle-bold', color: '#22c55e' },
    { label: t('productCatalog.categories'), value: cats, icon: 'ph:folder-bold', color: '#3b82f6' },
    { label: t('productCatalog.avgMargin'), value: avgMargin + '%', icon: 'ph:chart-line-up-bold', color: '#f59e0b' }
  ];
});

const filteredProducts = computed(() => {
  let result = [...products.value];

  // Search
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      p => (p.name || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
    );
  }

  // Category
  if (filterCategory.value) {
    result = result.filter(p => p.category === filterCategory.value);
  }

  // Status
  if (filterStatus.value) {
    result = result.filter(p => {
      const status = p.status || (p.isActive ? 'active' : 'inactive');
      return status === filterStatus.value;
    });
  }

  // Price range
  if (priceMin.value !== null && priceMin.value !== undefined) {
    result = result.filter(p => (p.unitPrice || 0) >= (priceMin.value || 0));
  }
  if (priceMax.value !== null && priceMax.value !== undefined) {
    result = result.filter(p => (p.unitPrice || 0) <= (priceMax.value || 0));
  }

  // Sort
  switch (sortKey.value) {
    case 'name':
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      break;
    case 'price_asc':
      result.sort((a, b) => (a.unitPrice || 0) - (b.unitPrice || 0));
      break;
    case 'price_desc':
      result.sort((a, b) => (b.unitPrice || 0) - (a.unitPrice || 0));
      break;
    case 'recent':
      result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      break;
  }

  return result;
});

// ──────────────────────────────────────────
// Lifecycle
// ──────────────────────────────────────────
onMounted(() => {
  loadProducts();
  loadPriceLists();
  loadCategories();
  loadBundles();
});

// ──────────────────────────────────────────
// Product CRUD
// ──────────────────────────────────────────
async function loadProducts() {
  loading.value = true;
  try {
    const result = await apiFetchProducts({ page: String(pagination.page), limit: String(pagination.limit) });
    products.value = (result.docs || []).map(p => ({
      ...p,
      status: p.status || (p.isActive === false ? 'inactive' : 'active'),
      costPrice: p.costPrice || 0
    }));
    pagination.total = result.pagination?.totalItems || products.value.length;
  } finally {
    loading.value = false;
  }
}

function openProductDialog(prod?: unknown) {
  if (prod) {
    editingProductId.value = prod.id;
    Object.assign(productForm, {
      name: prod.name || '',
      sku: prod.sku || '',
      category: prod.category || '',
      unitPrice: prod.unitPrice || 0,
      costPrice: prod.costPrice || 0,
      currency: prod.currency || 'SAR',
      stockQuantity: prod.stockQuantity ?? 0,
      status: prod.status || 'active',
      description: prod.description || ''
    });
  } else {
    editingProductId.value = null;
    Object.assign(productForm, defaultProductForm());
  }
  showProductDialog.value = true;
}

async function saveProduct() {
  if (!productForm.name?.trim()) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  savingProduct.value = true;
  try {
    const payload = {
      ...productForm,
      isActive: productForm.status === 'active'
    };
    if (editingProductId.value) {
      const res = await apiUpdateProduct(editingProductId.value, payload);
      if (res.success) {
        showProductDialog.value = false;
        ElMessage.success(t('common.saved'));
        await loadProducts();
      }
    } else {
      const res = await apiCreateProduct(payload);
      if (res.success) {
        showProductDialog.value = false;
        ElMessage.success(t('common.saved'));
        await loadProducts();
      }
    }
  } finally {
    savingProduct.value = false;
  }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm(t('productCatalog.confirmDelete'), t('common.warning'), {
      type: 'warning',
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel')
    });
    const res = await apiDeleteProduct(id);
    if (res.success) {
      ElMessage.success(t('common.deleted'));
      await loadProducts();
    }
  } catch {
    // cancelled
  }
}

async function cloneProduct(prod: unknown) {
  const cloneData = {
    name: prod.name + ' (Copy)',
    sku: prod.sku ? prod.sku + '-COPY' : '',
    category: prod.category,
    unitPrice: prod.unitPrice,
    costPrice: prod.costPrice || 0,
    currency: prod.currency,
    description: prod.description,
    isActive: true,
    stockQuantity: 0
  };
  const res = await apiCreateProduct(cloneData);
  if (res.success) {
    ElMessage.success(t('common.saved'));
    await loadProducts();
  }
}

async function deactivateProduct(prod: unknown) {
  const res = await apiUpdateProduct(prod.id, { isActive: false, status: 'inactive' } as unknown);
  if (res.success) {
    ElMessage.success(t('common.saved'));
    await loadProducts();
  }
}

async function quickUpdatePrice(id: string, price: number) {
  if (price === null || price === undefined || price < 0) return;
  const res = await apiUpdateProduct(id, { unitPrice: price } as unknown);
  if (res.success) {
    const p = products.value.find(pr => pr.id === id);
    if (p) p.unitPrice = price;
    ElMessage.success(t('common.saved'));
  }
}

// ──────────────────────────────────────────
// Selection & Bulk
// ──────────────────────────────────────────
function isSelected(id: string) {
  return selectedProducts.value.some(p => p.id === id);
}

function toggleSelection(prod: unknown) {
  const idx = selectedProducts.value.findIndex(p => p.id === prod.id);
  if (idx >= 0) {
    selectedProducts.value.splice(idx, 1);
  } else {
    selectedProducts.value.push(prod);
  }
}

function handleSelectionChange(val: Record<string, unknown>[]) {
  selectedProducts.value = val;
}

async function bulkDeactivate() {
  if (!selectedProducts.value.length) return;
  try {
    await ElMessageBox.confirm(t('productCatalog.confirmBulkDeactivate'), t('common.warning'), {
      type: 'warning',
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel')
    });
    for (const prod of selectedProducts.value) {
      await apiUpdateProduct(prod.id, { isActive: false, status: 'inactive' } as unknown);
    }
    ElMessage.success(t('common.saved'));
    selectedProducts.value = [];
    await loadProducts();
  } catch {
    // cancelled
  }
}

async function applyBulkPriceUpdate() {
  if (!selectedProducts.value.length) return;
  savingBulkPrice.value = true;
  try {
    for (const prod of selectedProducts.value) {
      let newPrice = prod.unitPrice || 0;
      if (bulkPriceForm.type === 'percent') {
        newPrice = newPrice * (1 + bulkPriceForm.value / 100);
      } else {
        newPrice = newPrice + bulkPriceForm.value;
      }
      newPrice = Math.max(0, Math.round(newPrice * 100) / 100);
      await apiUpdateProduct(prod.id, { unitPrice: newPrice } as unknown);
    }
    ElMessage.success(t('common.saved'));
    showBulkPriceDialog.value = false;
    selectedProducts.value = [];
    bulkPriceForm.value = 0;
    await loadProducts();
  } finally {
    savingBulkPrice.value = false;
  }
}

// ──────────────────────────────────────────
// Price Lists
// ──────────────────────────────────────────
async function loadPriceLists() {
  loadingPriceLists.value = true;
  try {
    const { body, success } = await useApiFetch('catalog/price-lists');
    if (success && body) {
      const data = body as unknown;
      priceLists.value = data.docs || data.rows || (Array.isArray(data) ? data : []);
    }
  } finally {
    loadingPriceLists.value = false;
  }
}

function openPriceListDialog(pl?: unknown) {
  if (pl) {
    editingPriceListId.value = pl.id;
    Object.assign(priceListForm, {
      name: pl.name || '',
      segment: pl.segment || '',
      validFrom: pl.validFrom || '',
      validTo: pl.validTo || '',
      isActive: pl.isActive ?? true,
      items: pl.items?.length
        ? pl.items.map(i => ({ ...i }))
        : [{ productId: '', productName: '', standardPrice: 0, listPrice: 0, discountPercent: 0 }]
    });
  } else {
    editingPriceListId.value = null;
    Object.assign(priceListForm, defaultPriceListForm());
  }
  showPriceListDialog.value = true;
}

function addPriceListItem() {
  priceListForm.items.push({ productId: '', productName: '', standardPrice: 0, listPrice: 0, discountPercent: 0 });
}

function onPriceListProductSelect(item: unknown) {
  const prod = products.value.find(p => p.id === item.productId);
  if (prod) {
    item.productName = prod.name;
    item.standardPrice = prod.unitPrice || 0;
    item.listPrice = prod.unitPrice || 0;
  }
}

function calcEffectivePrice(item: unknown) {
  const lp = item.listPrice || 0;
  const disc = item.discountPercent || 0;
  return lp * (1 - disc / 100);
}

async function savePriceList() {
  if (!priceListForm.name?.trim()) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  savingPriceList.value = true;
  try {
    const payload = {
      ...priceListForm,
      items: priceListForm.items
        .filter(i => i.productId)
        .map(i => ({
          ...i,
          effectivePrice: calcEffectivePrice(i)
        }))
    };
    if (editingPriceListId.value) {
      const { success } = await useApiFetch(`catalog/price-lists/${editingPriceListId.value}`, 'PUT', payload);
      if (success) {
        showPriceListDialog.value = false;
        ElMessage.success(t('common.saved'));
        await loadPriceLists();
      }
    } else {
      const { success } = await useApiFetch('catalog/price-lists', 'POST', payload);
      if (success) {
        showPriceListDialog.value = false;
        ElMessage.success(t('common.saved'));
        await loadPriceLists();
      }
    }
  } finally {
    savingPriceList.value = false;
  }
}

async function deletePriceList(id: string) {
  try {
    await ElMessageBox.confirm(t('productCatalog.confirmDelete'), t('common.warning'), {
      type: 'warning',
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel')
    });
    const { success } = await useApiFetch(`catalog/price-lists/${id}`, 'DELETE');
    if (success) {
      ElMessage.success(t('common.deleted'));
      await loadPriceLists();
    }
  } catch {
    // cancelled
  }
}

// ──────────────────────────────────────────
// Categories
// ──────────────────────────────────────────
async function loadCategories() {
  loadingCategories.value = true;
  try {
    const { body, success } = await useApiFetch('catalog/categories');
    if (success && body) {
      const data = body as unknown;
      categoryTree.value = data.tree || data.docs || (Array.isArray(data) ? data : []);
    }
  } finally {
    loadingCategories.value = false;
    await nextTick();
    initMarginChart();
  }
}

function openCategoryDialog(cat?: unknown) {
  if (cat) {
    editingCategoryId.value = cat.id;
    Object.assign(categoryForm, {
      name: cat.name || '',
      parentId: cat.parentId || null,
      description: cat.description || ''
    });
  } else {
    editingCategoryId.value = null;
    Object.assign(categoryForm, defaultCategoryForm());
  }
  showCategoryDialog.value = true;
}

async function saveCategory() {
  if (!categoryForm.name?.trim()) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  savingCategory.value = true;
  try {
    if (editingCategoryId.value) {
      const { success } = await useApiFetch(`catalog/categories/${editingCategoryId.value}`, 'PUT', { ...categoryForm });
      if (success) {
        showCategoryDialog.value = false;
        ElMessage.success(t('common.saved'));
        await loadCategories();
      }
    } else {
      const { success } = await useApiFetch('catalog/categories', 'POST', { ...categoryForm });
      if (success) {
        showCategoryDialog.value = false;
        ElMessage.success(t('common.saved'));
        await loadCategories();
      }
    }
  } finally {
    savingCategory.value = false;
  }
}

async function deleteCategory(id: string) {
  try {
    await ElMessageBox.confirm(t('productCatalog.confirmDeleteCategory'), t('common.warning'), {
      type: 'warning',
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel')
    });
    const { success } = await useApiFetch(`catalog/categories/${id}`, 'DELETE');
    if (success) {
      ElMessage.success(t('common.deleted'));
      await loadCategories();
    }
  } catch {
    // cancelled
  }
}

async function handleCategoryDrop(draggingNode: unknown, dropNode: unknown, dropType: string) {
  try {
    const newParentId = dropType === 'inner' ? dropNode.data.id : dropNode.data.parentId || null;
    await useApiFetch(`catalog/categories/${draggingNode.data.id}`, 'PUT', {
      parentId: newParentId
    });
    ElMessage.success(t('common.saved'));
    await loadCategories();
  } catch {
    ElMessage.error(t('common.error'));
  }
}

// ──────────────────────────────────────────
// Bundles
// ──────────────────────────────────────────
async function loadBundles() {
  loadingBundles.value = true;
  try {
    const { body, success } = await useApiFetch('catalog/bundles');
    if (success && body) {
      const data = body as unknown;
      bundles.value = data.docs || data.rows || (Array.isArray(data) ? data : []);
    }
  } finally {
    loadingBundles.value = false;
  }
}

function openBundleDialog(bundle?: unknown) {
  if (bundle) {
    editingBundleId.value = bundle.id;
    Object.assign(bundleForm, {
      name: bundle.name || '',
      description: bundle.description || '',
      bundlePrice: bundle.bundlePrice || 0,
      discountPercent: bundle.discountPercent || 0,
      items: bundle.items?.length ? bundle.items.map(i => ({ ...i })) : [{ productId: '', productName: '', unitPrice: 0, quantity: 1 }]
    });
  } else {
    editingBundleId.value = null;
    Object.assign(bundleForm, defaultBundleForm());
  }
  showBundleDialog.value = true;
}

function addBundleItem() {
  bundleForm.items.push({ productId: '', productName: '', unitPrice: 0, quantity: 1 });
}

function onBundleProductSelect(item: unknown) {
  const prod = products.value.find(p => p.id === item.productId);
  if (prod) {
    item.productName = prod.name;
    item.unitPrice = prod.unitPrice || 0;
  }
}

function calcBundleIndividualTotal(bundle: unknown) {
  return (bundle.items || []).reduce((s, i) => s + (i.unitPrice || 0) * (i.quantity || 1), 0);
}

function calcBundleSavingsPercent(bundle: unknown) {
  const individual = calcBundleIndividualTotal(bundle);
  if (!individual) return 0;
  return Math.round(((individual - (bundle.bundlePrice || 0)) / individual) * 100);
}

function calcFormBundleTotal() {
  return bundleForm.items.reduce((s, i) => s + (i.unitPrice || 0) * (i.quantity || 1), 0);
}

async function saveBundle() {
  if (!bundleForm.name?.trim()) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  savingBundle.value = true;
  try {
    const payload = {
      ...bundleForm,
      items: bundleForm.items.filter(i => i.productId)
    };
    if (editingBundleId.value) {
      const { success } = await useApiFetch(`catalog/bundles/${editingBundleId.value}`, 'PUT', payload);
      if (success) {
        showBundleDialog.value = false;
        ElMessage.success(t('common.saved'));
        await loadBundles();
      }
    } else {
      const { success } = await useApiFetch('catalog/bundles', 'POST', payload);
      if (success) {
        showBundleDialog.value = false;
        ElMessage.success(t('common.saved'));
        await loadBundles();
      }
    }
  } finally {
    savingBundle.value = false;
  }
}

async function deleteBundle(id: string) {
  try {
    await ElMessageBox.confirm(t('productCatalog.confirmDelete'), t('common.warning'), {
      type: 'warning',
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel')
    });
    const { success } = await useApiFetch(`catalog/bundles/${id}`, 'DELETE');
    if (success) {
      ElMessage.success(t('common.deleted'));
      await loadBundles();
    }
  } catch {
    // cancelled
  }
}

// ──────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────
function formatCurrency(val: number | string) {
  return Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(date: string) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

function calcMargin(row: unknown): number {
  const unit = Number(row.unitPrice || 0);
  const cost = Number(row.costPrice || 0);
  if (unit <= 0) return 0;
  return Math.round(((unit - cost) / unit) * 100);
}

function getMarginColor(margin: number): string {
  if (margin >= 40) return '#22c55e';
  if (margin >= 20) return '#f59e0b';
  return '#ef4444';
}

function getStatusTagType(status: string) {
  if (status === 'active') return 'success';
  if (status === 'discontinued') return 'danger';
  return 'info';
}

function getStatusLabel(status: string) {
  if (status === 'active') return t('productCatalog.active');
  if (status === 'discontinued') return t('productCatalog.discontinued');
  return t('productCatalog.inactive');
}

function getStockTagType(stock: number | null | undefined): string {
  if (stock === null || stock === undefined) return 'info';
  if (stock === 0) return 'danger';
  if (stock <= 10) return 'warning';
  return 'success';
}

// ──────────────────────────────────────────
// CSV Export
// ──────────────────────────────────────────
function exportCsv() {
  const headers = ['Name', 'SKU', 'Category', 'Base Price', 'Cost Price', 'Margin %', 'Status', 'Stock'];
  const rows = filteredProducts.value.map(p => [
    p.name,
    p.sku || '',
    p.category || '',
    p.unitPrice || 0,
    p.costPrice || 0,
    calcMargin(p),
    p.status || 'active',
    p.stockQuantity ?? ''
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `product-catalog-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  ElMessage.success(t('productCatalog.exportSuccess'));
}

// ──────────────────────────────────────────
// Margin Chart (ECharts)
// ──────────────────────────────────────────
function initMarginChart() {
  if (!marginChartRef.value) return;

  const categoryMargins: Record<string, { total: number; count: number }> = {};
  products.value.forEach(p => {
    const cat = p.category || t('productCatalog.general');
    if (!categoryMargins[cat]) categoryMargins[cat] = { total: 0, count: 0 };
    categoryMargins[cat].total += calcMargin(p);
    categoryMargins[cat].count += 1;
  });

  const data = Object.entries(categoryMargins).map(([name, v]) => ({
    name,
    value: v.count > 0 ? Math.round(v.total / v.count) : 0
  }));

  const chart = echarts.init(marginChartRef.value);
  chart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
    color: ['#7849ff', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 8, borderColor: 'var(--bg-elevated)', borderWidth: 2 },
        label: { show: true, formatter: '{b}\n{c}%', fontSize: 11 },
        data
      }
    ]
  });

  // Resize handling
  const resizeObserver = new ResizeObserver(() => chart.resize());
  resizeObserver.observe(marginChartRef.value);
}
</script>
