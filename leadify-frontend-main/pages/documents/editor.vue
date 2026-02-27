<template lang="pug">
.p-6.animate-entrance.w-full.mx-auto(class="max-w-[1800px]")
  //- Header
  .flex.items-center.justify-between.mb-8
    .flex.items-center.gap-4
      el-button(circle plain @click="goBack" class="!w-11 !h-11")
        Icon(name="ph:arrow-left-bold" size="18")
      div
        h2.text-3xl.font-black(style="color: var(--text-primary)") {{ $t('documentEditor.title') }}
        p.text-sm.mt-1(style="color: var(--text-muted)") {{ $t('documentEditor.subtitle') }}
    .flex.items-center.gap-3(v-if="selectedType")
      el-tag(size="large" :type="currentTypeConfig.tagType" effect="dark" round)
        Icon(:name="currentTypeConfig.icon" size="16" class="mr-1")
        | {{ $t(currentTypeConfig.label) }}
      el-button(text @click="resetType")
        Icon(name="ph:arrow-counter-clockwise-bold" size="16" class="mr-1")
        | {{ $t('documentEditor.changeType') }}

  //- Document Type Selector
  template(v-if="!selectedType")
    .mb-6
      h3.text-lg.font-semibold.mb-2(style="color: var(--text-primary)") {{ $t('documentEditor.selectType') }}
      p.text-sm(style="color: var(--text-muted)") {{ $t('documentEditor.selectTypeDesc') }}
    .grid.gap-5(v-loading="initialLoading" class="grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6")
      .glass-card.p-6.cursor-pointer.text-center.transition-all.rounded-2xl(
        v-for="dt in documentTypes"
        :key="dt.type"
        @click="selectType(dt.type)"
        class="hover:scale-[1.03] hover:shadow-lg"
        :class="{ 'ring-2 ring-purple-500/50': selectedType === dt.type }"
      )
        .w-14.h-14.rounded-2xl.flex.items-center.justify-center.mx-auto.mb-4(
          :style="{ backgroundColor: dt.color + '18' }"
        )
          Icon(:name="dt.icon" size="28" :style="{ color: dt.color }")
        .font-bold.text-base.mb-1(style="color: var(--text-primary)") {{ $t(dt.label) }}
        .text-xs.leading-relaxed(style="color: var(--text-muted)") {{ $t(dt.description) }}

  //- Editor Area
  template(v-if="selectedType")
    .grid.grid-cols-12.gap-6
      //- Main Form (8 cols)
      .space-y-6(class="col-span-12 xl:col-span-8")

        //- Template Picker
        .glass-card.p-6.rounded-3xl(v-if="templates.length > 0")
          .flex.items-center.gap-3.mb-4
            .rounded-xl(class="p-2.5" style="background: rgba(168, 85, 247, 0.12)")
              Icon(name="ph:layout-bold" size="22" style="color: #a855f7")
            h3.font-bold(style="color: var(--text-primary)") {{ $t('documentEditor.templatePicker') }}
          el-select(
            v-model="form.templateId"
            :placeholder="$t('documentEditor.selectTemplate')"
            clearable
            style="width: 100%"
            size="large"
          )
            el-option(
              v-for="tmpl in templates"
              :key="tmpl.id"
              :label="tmpl.name"
              :value="tmpl.id"
            )
              .flex.items-center.gap-2
                Icon(name="ph:file-text-bold" size="16" style="color: #a855f7")
                span {{ tmpl.name }}
                el-tag(v-if="tmpl.isDefault" size="small" type="success" effect="plain" round class="ml-2") Default

        //- Smart Header - Invoice
        .glass-card.p-8.rounded-3xl(v-if="selectedType === 'INVOICE' || selectedType === 'PROFORMA_INVOICE'")
          .flex.items-center.gap-3.mb-6
            .rounded-xl(class="p-2.5" style="background: rgba(120, 73, 255, 0.12)")
              Icon(name="ph:file-text-bold" size="22" style="color: #7849ff")
            h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('documentEditor.headerFields.details') }}
          .grid.gap-4(class="md:grid-cols-2 grid-cols-1")
            el-form-item(:label="$t('documentEditor.headerFields.deal')")
              el-select(
                v-model="form.dealId"
                filterable
                :placeholder="$t('documentEditor.headerFields.selectDeal')"
                style="width: 100%"
                @change="onDealChange"
              )
                el-option(v-for="d in deals" :key="d.id" :label="d.name" :value="d.id")
            el-form-item(:label="$t('documentEditor.headerFields.salesOrder')" v-if="selectedType === 'INVOICE'")
              el-select(
                v-model="form.salesOrderId"
                filterable
                clearable
                :placeholder="$t('documentEditor.headerFields.importFromOrder')"
                style="width: 100%"
              )
                el-option(v-for="o in salesOrders" :key="o.id" :label="o.orderNumber" :value="o.id")
            el-form-item(:label="$t('documentEditor.headerFields.invoiceDate')")
              el-date-picker(v-model="form.invoiceDate" type="date" style="width: 100%")
            el-form-item(:label="$t('documentEditor.headerFields.paymentTerms')")
              el-select(v-model="form.paymentTerms" style="width: 100%" @change="calculateDueDate")
                el-option(v-for="t in paymentTermsOptions" :key="t.value" :label="t.label" :value="t.value")
            el-form-item(:label="$t('documentEditor.headerFields.dueDate')")
              el-date-picker(v-model="form.dueDate" type="date" style="width: 100%")

        //- Smart Header - Purchase Order
        .glass-card.p-8.rounded-3xl(v-if="selectedType === 'PURCHASE_ORDER'")
          .flex.items-center.gap-3.mb-6
            .rounded-xl(class="p-2.5" style="background: rgba(249, 115, 22, 0.12)")
              Icon(name="ph:shopping-cart-bold" size="22" style="color: #f97316")
            h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('documentEditor.headerFields.details') }}
          .grid.gap-4(class="md:grid-cols-2 grid-cols-1")
            el-form-item(:label="$t('documentEditor.headerFields.vendor')")
              el-select(
                v-model="form.vendorId"
                filterable
                :placeholder="$t('documentEditor.headerFields.selectVendor')"
                style="width: 100%"
              )
                el-option(v-for="v in vendors" :key="v.id" :label="v.name || v.companyName" :value="v.id")
            el-form-item(:label="$t('documentEditor.headerFields.project')")
              el-select(
                v-model="form.projectId"
                filterable
                clearable
                :placeholder="$t('documentEditor.headerFields.selectProject')"
                style="width: 100%"
              )
                el-option(v-for="p in projects" :key="p.id" :label="p.name" :value="p.id")
            el-form-item(:label="$t('documentEditor.headerFields.paymentMethod')")
              el-select(v-model="form.paymentMethod" style="width: 100%")
                el-option(label="Cash" value="Cash")
                el-option(label="Credit" value="Credit")
                el-option(label="Bank Transfer" value="Bank Transfer")
            el-form-item(:label="$t('documentEditor.headerFields.deliveryDate')")
              el-date-picker(v-model="form.deliveryDate" type="date" style="width: 100%")
            el-form-item(:label="$t('documentEditor.headerFields.paymentTerms')")
              el-select(v-model="form.paymentTerms" style="width: 100%")
                el-option(v-for="t in paymentTermsOptions" :key="t.value" :label="t.label" :value="t.value")

        //- Smart Header - Sales Order
        .glass-card.p-8.rounded-3xl(v-if="selectedType === 'SALES_ORDER'")
          .flex.items-center.gap-3.mb-6
            .rounded-xl(class="p-2.5" style="background: rgba(34, 197, 94, 0.12)")
              Icon(name="ph:clipboard-text-bold" size="22" style="color: #22c55e")
            h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('documentEditor.headerFields.details') }}
          .grid.gap-4(class="md:grid-cols-2 grid-cols-1")
            el-form-item(:label="$t('documentEditor.headerFields.client')")
              el-select(
                v-model="form.clientId"
                filterable
                :placeholder="$t('documentEditor.headerFields.selectClient')"
                style="width: 100%"
              )
                el-option(v-for="c in clients" :key="c.id" :label="c.name || c.companyName" :value="c.id")
            el-form-item(:label="$t('documentEditor.headerFields.deal')")
              el-select(
                v-model="form.dealId"
                filterable
                clearable
                :placeholder="$t('documentEditor.headerFields.selectDeal')"
                style="width: 100%"
              )
                el-option(v-for="d in deals" :key="d.id" :label="d.name" :value="d.id")
            el-form-item(:label="$t('documentEditor.headerFields.paymentTerms')")
              el-select(v-model="form.paymentTerms" style="width: 100%")
                el-option(v-for="t in paymentTermsOptions" :key="t.value" :label="t.label" :value="t.value")
            el-form-item(:label="$t('documentEditor.headerFields.currency')")
              el-select(v-model="form.currency" style="width: 100%")
                el-option(label="SAR" value="SAR")
                el-option(label="USD" value="USD")
                el-option(label="EUR" value="EUR")
                el-option(label="GBP" value="GBP")
            el-form-item(:label="$t('documentEditor.headerFields.shippingAddress')" class="md:col-span-2")
              el-input(v-model="form.shippingAddress" type="textarea" :rows="2" :placeholder="$t('documentEditor.headerFields.shippingPlaceholder')")

        //- Smart Header - Credit Note
        .glass-card.p-8.rounded-3xl(v-if="selectedType === 'CREDIT_NOTE'")
          .flex.items-center.gap-3.mb-6
            .rounded-xl(class="p-2.5" style="background: rgba(239, 68, 68, 0.12)")
              Icon(name="ph:arrow-u-down-left-bold" size="22" style="color: #ef4444")
            h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('documentEditor.headerFields.details') }}
          .grid.gap-4(class="md:grid-cols-2 grid-cols-1")
            el-form-item(:label="$t('documentEditor.headerFields.invoice')")
              el-select(
                v-model="form.invoiceId"
                filterable
                :placeholder="$t('documentEditor.headerFields.selectInvoice')"
                style="width: 100%"
              )
                el-option(v-for="inv in invoicesList" :key="inv.id" :label="inv.invoiceNumber + ' - ' + fmtCurrency(inv.amount)" :value="inv.id")
            el-form-item(:label="$t('documentEditor.headerFields.creditDate')")
              el-date-picker(v-model="form.date" type="date" style="width: 100%")
            el-form-item(:label="$t('documentEditor.headerFields.creditAmount')")
              el-input-number(v-model="form.creditAmount" :min="0" :precision="2" :controls="false" style="width: 100%")
            el-form-item(:label="$t('documentEditor.headerFields.reason')" class="md:col-span-2")
              el-input(v-model="form.creditReason" type="textarea" :rows="3" :placeholder="$t('documentEditor.headerFields.reasonPlaceholder')")

        //- Smart Header - Delivery Note
        .glass-card.p-8.rounded-3xl(v-if="selectedType === 'DELIVERY_NOTE'")
          .flex.items-center.gap-3.mb-6
            .rounded-xl(class="p-2.5" style="background: rgba(59, 130, 246, 0.12)")
              Icon(name="ph:truck-bold" size="22" style="color: #3b82f6")
            h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('documentEditor.headerFields.details') }}
          .grid.gap-4(class="md:grid-cols-2 grid-cols-1")
            el-form-item(:label="$t('documentEditor.headerFields.salesOrder')")
              el-select(
                v-model="form.salesOrderId"
                filterable
                :placeholder="$t('documentEditor.headerFields.selectSalesOrder')"
                style="width: 100%"
              )
                el-option(v-for="o in salesOrders" :key="o.id" :label="o.orderNumber" :value="o.id")
            el-form-item(:label="$t('documentEditor.headerFields.trackingNumber')")
              el-input(v-model="form.trackingNumber" :placeholder="$t('documentEditor.headerFields.trackingPlaceholder')")
            el-form-item(:label="$t('documentEditor.headerFields.carrier')")
              el-input(v-model="form.carrier" :placeholder="$t('documentEditor.headerFields.carrierPlaceholder')")
            el-form-item(:label="$t('documentEditor.headerFields.shippedDate')")
              el-date-picker(v-model="form.shippedDate" type="date" style="width: 100%")

        //- Line Items (shared across all types except Credit Note)
        .glass-card.p-8.rounded-3xl(v-if="selectedType !== 'CREDIT_NOTE'")
          .flex.items-center.justify-between.mb-6
            .flex.items-center.gap-3
              .rounded-xl(class="p-2.5" style="background: rgba(120, 73, 255, 0.12)")
                Icon(name="ph:list-bullets-bold" size="22" style="color: #7849ff")
              h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('documentEditor.lineItems') }}
          InvoiceInvoiceLineItems(
            :items="form.lineItems"
            :editable="true"
            @update:items="onLineItemsUpdate"
          )

        //- Totals (except Credit Note)
        .glass-card.p-8.rounded-3xl(v-if="selectedType !== 'CREDIT_NOTE'")
          h3.text-lg.font-bold.mb-4(style="color: var(--text-primary)") {{ $t('documentEditor.summary') }}
          .max-w-md.ml-auto
            .flex.justify-between.py-2(style="border-bottom: 1px solid var(--glass-border)")
              span(style="color: var(--text-muted)") {{ $t('documentEditor.subtotal') }}
              span.font-semibold(style="color: var(--text-primary)") {{ fmtCurrency(computedTotals.subtotal) }}
            .flex.justify-between.py-2(style="border-bottom: 1px solid var(--glass-border)")
              span(style="color: var(--text-muted)") {{ $t('documentEditor.tax') }}
              span(style="color: var(--text-primary)") + {{ fmtCurrency(computedTotals.tax) }}
            .flex.justify-between.py-2(style="border-bottom: 1px solid var(--glass-border)")
              span(style="color: var(--text-muted)") {{ $t('documentEditor.discount') }}
              span(style="color: #ef4444") - {{ fmtCurrency(computedTotals.discount) }}
            .flex.justify-between.py-3
              span.font-bold.text-lg(style="color: var(--text-primary)") {{ $t('documentEditor.total') }}
              span.font-bold.text-xl(style="color: #7849ff") {{ fmtCurrency(computedTotals.total) }}

        //- Notes & Terms
        .glass-card.p-8.rounded-3xl(v-if="selectedType !== 'CREDIT_NOTE'")
          .grid.gap-4(class="md:grid-cols-2 grid-cols-1")
            el-form-item(:label="$t('documentEditor.notes')")
              el-input(v-model="form.notes" type="textarea" :rows="4" :placeholder="$t('documentEditor.notesPlaceholder')")
            el-form-item(:label="$t('documentEditor.terms')")
              el-input(v-model="form.terms" type="textarea" :rows="4" :placeholder="$t('documentEditor.termsPlaceholder')")

        //- Action Bar
        .glass-card.p-6.rounded-3xl
          .flex.justify-between.items-center.flex-wrap.gap-3
            .flex.gap-2
              el-button(size="large" plain @click="showPreviewDialog = true")
                Icon(name="ph:eye-bold" size="16" class="mr-1")
                | {{ $t('documentEditor.preview') }}
              el-button(size="large" plain @click="printDocument")
                Icon(name="ph:printer-bold" size="16" class="mr-1")
                | {{ $t('documentEditor.print') }}
            .flex.gap-2
              el-button(size="large" @click="goBack") {{ $t('documentEditor.cancel') }}
              el-button(size="large" type="info" plain @click="handleSaveDraft" :loading="saving")
                | {{ $t('documentEditor.saveDraft') }}
              el-button(size="large" type="primary" @click="handleSaveAndSend" :loading="saving")
                Icon(name="ph:paper-plane-right-bold" size="16" class="mr-1")
                | {{ $t('documentEditor.saveAndSend') }}

      //- Right Sidebar (4 cols)
      .space-y-6(class="col-span-12 xl:col-span-4")
        //- Document Summary Card
        .glass-card.p-6.rounded-3xl
          .flex.items-center.gap-3.mb-5
            .rounded-xl(class="p-2.5" :style="{ backgroundColor: currentTypeConfig.color + '18' }")
              Icon(:name="currentTypeConfig.icon" size="22" :style="{ color: currentTypeConfig.color }")
            h3.font-bold(style="color: var(--text-primary)") {{ $t('documentEditor.docSummary') }}
          .space-y-3
            .flex.justify-between.items-center
              span.text-sm(style="color: var(--text-muted)") {{ $t('documentEditor.docType') }}
              el-tag(:type="currentTypeConfig.tagType" size="small" effect="plain" round) {{ $t(currentTypeConfig.label) }}
            .flex.justify-between.items-center
              span.text-sm(style="color: var(--text-muted)") {{ $t('documentEditor.docNumber') }}
              span.text-sm.font-mono(style="color: var(--text-primary)") {{ currentTypeConfig.prefix }}AUTO
            .flex.justify-between.items-center(v-if="selectedType !== 'CREDIT_NOTE'")
              span.text-sm(style="color: var(--text-muted)") {{ $t('documentEditor.itemCount') }}
              span.text-sm.font-semibold(style="color: var(--text-primary)") {{ validItemCount }}
            .flex.justify-between.items-center
              span.text-sm(style="color: var(--text-muted)") {{ $t('documentEditor.totalAmount') }}
              span.font-bold.text-lg(style="color: #7849ff") {{ selectedType === 'CREDIT_NOTE' ? fmtCurrency(form.creditAmount || 0) : fmtCurrency(computedTotals.total) }}
            .flex.justify-between.items-center
              span.text-sm(style="color: var(--text-muted)") {{ $t('documentEditor.status') }}
              el-tag(type="info" size="small" effect="plain" round) Draft

        //- Quick Tips
        .glass-card.p-6.rounded-3xl
          .flex.items-center.gap-3.mb-4
            .rounded-xl(class="p-2.5" style="background: rgba(234, 179, 8, 0.12)")
              Icon(name="ph:lightbulb-bold" size="22" style="color: #eab308")
            h3.font-bold(style="color: var(--text-primary)") {{ $t('documentEditor.quickTips') }}
          .space-y-3
            .flex.items-start.gap-2(v-for="(tip, i) in currentTips" :key="i")
              Icon(name="ph:check-circle-bold" size="16" style="color: #22c55e; margin-top: 2px; flex-shrink: 0")
              span.text-sm(style="color: var(--text-muted)") {{ tip }}

        //- Recent Documents
        .glass-card.p-6.rounded-3xl
          .flex.items-center.gap-3.mb-4
            .rounded-xl(class="p-2.5" style="background: rgba(120, 73, 255, 0.12)")
              Icon(name="ph:clock-counter-clockwise-bold" size="22" style="color: #7849ff")
            h3.font-bold(style="color: var(--text-primary)") {{ $t('documentEditor.recentDocuments') }}
          .space-y-2(v-if="recentDocs.length")
            .flex.items-center.justify-between.p-3.rounded-xl.cursor-pointer.transition-all(
              v-for="doc in recentDocs"
              :key="doc.id"
              style="background: var(--glass-bg)"
              class="hover:bg-purple-500/10"
              @click="navigateToDoc(doc)"
            )
              .flex.items-center.gap-2
                Icon(:name="currentTypeConfig.icon" size="16" :style="{ color: currentTypeConfig.color }")
                span.text-sm.font-medium(style="color: var(--text-primary)") {{ doc.number }}
              span.text-xs(style="color: var(--text-muted)") {{ doc.date }}
          .text-center.py-4(v-else)
            Icon(name="ph:folder-open-bold" size="32" style="color: var(--text-muted)")
            p.text-sm.mt-2(style="color: var(--text-muted)") {{ $t('documentEditor.noRecentDocs') }}

  //- Preview Dialog
  el-dialog(
    v-model="showPreviewDialog"
    :title="$t('documentEditor.preview')"
    width="800px"
    top="3vh"
  )
    .preview-container.p-8.bg-white.rounded-xl.text-gray-800.min-h-96
      //- Company Header
      .flex.justify-between.items-start.mb-8.pb-6(style="border-bottom: 2px solid #e5e7eb")
        div
          h1.text-2xl.font-bold.text-gray-900 {{ $t(currentTypeConfig.label) }}
          p.text-sm.text-gray-500.mt-1 {{ currentTypeConfig.prefix }}DRAFT
        div.text-right
          p.font-semibold.text-gray-900 Your Company
          p.text-sm.text-gray-500 {{ new Date().toLocaleDateString() }}
      //- Entity Info
      .mb-6(v-if="previewEntity")
        p.text-sm.font-semibold.text-gray-600.uppercase.mb-1 {{ selectedType === 'PURCHASE_ORDER' ? 'Vendor' : 'Client' }}
        p.text-base.text-gray-900 {{ previewEntity }}
      //- Line Items Table
      table.w-full.mb-6(v-if="selectedType !== 'CREDIT_NOTE'" style="border-collapse: collapse")
        thead
          tr(style="background: #f3f4f6")
            th.p-3.text-left.text-sm.font-semibold.text-gray-700 Description
            th.p-3.text-center.text-sm.font-semibold.text-gray-700 Qty
            th.p-3.text-right.text-sm.font-semibold.text-gray-700 Price
            th.p-3.text-right.text-sm.font-semibold.text-gray-700 Total
        tbody
          tr(v-for="(item, i) in form.lineItems.filter(li => li.description.trim())" :key="i" style="border-bottom: 1px solid #e5e7eb")
            td.p-3.text-sm.text-gray-800 {{ item.description }}
            td.p-3.text-center.text-sm.text-gray-600 {{ item.quantity }}
            td.p-3.text-right.text-sm.text-gray-600 {{ Number(item.unitPrice).toFixed(2) }}
            td.p-3.text-right.text-sm.font-semibold.text-gray-800 {{ Number(item.lineTotal).toFixed(2) }}
      //- Totals
      .flex.justify-end(v-if="selectedType !== 'CREDIT_NOTE'")
        .w-64
          .flex.justify-between.py-1
            span.text-sm.text-gray-600 Subtotal
            span.text-sm.font-medium {{ fmtCurrency(computedTotals.subtotal) }}
          .flex.justify-between.py-1
            span.text-sm.text-gray-600 Tax
            span.text-sm {{ fmtCurrency(computedTotals.tax) }}
          .flex.justify-between.py-1
            span.text-sm.text-gray-600 Discount
            span.text-sm.text-red-500 -{{ fmtCurrency(computedTotals.discount) }}
          .flex.justify-between.py-2.mt-2(style="border-top: 2px solid #111827")
            span.font-bold.text-gray-900 Total
            span.font-bold.text-lg.text-gray-900 {{ fmtCurrency(computedTotals.total) }}
      //- Credit Note Preview
      .text-center.py-8(v-if="selectedType === 'CREDIT_NOTE'")
        p.text-gray-600 Credit Amount
        p.text-3xl.font-bold.text-red-600 {{ fmtCurrency(form.creditAmount || 0) }}
        p.text-sm.text-gray-500.mt-2(v-if="form.creditReason") Reason: {{ form.creditReason }}
      //- Notes
      .mt-6.pt-4(v-if="form.notes" style="border-top: 1px solid #e5e7eb")
        p.text-xs.font-semibold.text-gray-500.uppercase.mb-1 Notes
        p.text-sm.text-gray-600 {{ form.notes }}
    template(#footer)
      el-button(@click="showPreviewDialog = false") {{ $t('documentEditor.close') }}
      el-button(type="primary" @click="printDocument") {{ $t('documentEditor.print') }}
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import {
  createInvoice,
  createCreditNote,
  markInvoiceSent,
  PAYMENT_TERMS_OPTIONS,
  formatCurrency,
  type InvoiceLineItem
} from '~/composables/useInvoiceBilling';
import { createSalesOrder } from '~/composables/useSalesOrders';

definePageMeta({ layout: 'default', middleware: 'permissions' });

const { t } = useI18n();
const router = useRouter();
const route = useRoute();

// --- Types ---
type DocumentType = 'INVOICE' | 'PURCHASE_ORDER' | 'SALES_ORDER' | 'CREDIT_NOTE' | 'DELIVERY_NOTE' | 'PROFORMA_INVOICE';

interface DocTypeConfig {
  type: DocumentType;
  label: string;
  description: string;
  icon: string;
  color: string;
  prefix: string;
  tagType: '' | 'success' | 'warning' | 'danger' | 'info';
}

// --- Document Types ---
const documentTypes: DocTypeConfig[] = [
  {
    type: 'INVOICE',
    label: 'documentEditor.types.invoice',
    description: 'documentEditor.types.invoiceDesc',
    icon: 'ph:file-text-bold',
    color: '#7849ff',
    prefix: 'INV-',
    tagType: ''
  },
  {
    type: 'PURCHASE_ORDER',
    label: 'documentEditor.types.purchaseOrder',
    description: 'documentEditor.types.purchaseOrderDesc',
    icon: 'ph:shopping-cart-bold',
    color: '#f97316',
    prefix: 'PO-',
    tagType: 'warning'
  },
  {
    type: 'SALES_ORDER',
    label: 'documentEditor.types.salesOrder',
    description: 'documentEditor.types.salesOrderDesc',
    icon: 'ph:clipboard-text-bold',
    color: '#22c55e',
    prefix: 'SO-',
    tagType: 'success'
  },
  {
    type: 'CREDIT_NOTE',
    label: 'documentEditor.types.creditNote',
    description: 'documentEditor.types.creditNoteDesc',
    icon: 'ph:arrow-u-down-left-bold',
    color: '#ef4444',
    prefix: 'CN-',
    tagType: 'danger'
  },
  {
    type: 'DELIVERY_NOTE',
    label: 'documentEditor.types.deliveryNote',
    description: 'documentEditor.types.deliveryNoteDesc',
    icon: 'ph:truck-bold',
    color: '#3b82f6',
    prefix: 'DN-',
    tagType: 'info'
  },
  {
    type: 'PROFORMA_INVOICE',
    label: 'documentEditor.types.proformaInvoice',
    description: 'documentEditor.types.proformaInvoiceDesc',
    icon: 'ph:file-dashed-bold',
    color: '#8b5cf6',
    prefix: 'PI-',
    tagType: 'info'
  }
];

// --- State ---
const selectedType = ref<DocumentType | null>(null);
const saving = ref(false);
const showPreviewDialog = ref(false);
const initialLoading = ref(true);

const deals = ref<Array<{ id: string; name: string }>>([]);
const clients = ref<Array<{ id: string; name?: string; companyName?: string }>>([]);
const vendors = ref<Array<{ id: string; name?: string; companyName?: string }>>([]);
const projects = ref<Array<{ id: string; name: string }>>([]);
const salesOrders = ref<Array<{ id: string; orderNumber: string }>>([]);
const invoicesList = ref<Array<{ id: number; invoiceNumber: string; amount: number }>>([]);
const recentDocs = ref<Array<{ id: string; number: string; date: string; link: string }>>([]);
const templates = ref<Array<{ id: string; name: string; type: string; isDefault: boolean }>>([]);

const paymentTermsOptions = PAYMENT_TERMS_OPTIONS;

const form = ref({
  // Common
  templateId: '' as string,
  date: new Date(),
  currency: 'SAR',
  notes: '',
  terms: '',
  lineItems: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 0, discountRate: 0, lineTotal: 0 }] as InvoiceLineItem[],
  // Invoice / Proforma
  dealId: '',
  salesOrderId: '',
  invoiceDate: new Date(),
  paymentTerms: 'NET_30',
  dueDate: null as Date | null,
  // Purchase Order
  vendorId: '',
  projectId: '',
  paymentMethod: 'Cash',
  deliveryDate: null as Date | null,
  // Sales Order
  clientId: '',
  shippingAddress: '',
  // Credit Note
  invoiceId: '' as string | number,
  creditAmount: 0,
  creditReason: '',
  // Delivery Note
  trackingNumber: '',
  carrier: '',
  shippedDate: null as Date | null
});

// --- Computed ---
const currentTypeConfig = computed<DocTypeConfig>(() => {
  return documentTypes.find(dt => dt.type === selectedType.value) || (documentTypes[0] as any);
});

const computedTotals = computed(() => {
  let subtotal = 0;
  let tax = 0;
  let discount = 0;
  for (const item of form.value.lineItems) {
    const itemSubtotal = item.quantity * item.unitPrice;
    const itemDiscount = itemSubtotal * (item.discountRate / 100);
    const taxable = itemSubtotal - itemDiscount;
    const itemTax = taxable * (item.taxRate / 100);
    subtotal += itemSubtotal;
    discount += itemDiscount;
    tax += itemTax;
  }
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    total: Math.round((subtotal - discount + tax) * 100) / 100
  };
});

const validItemCount = computed(() => {
  return form.value.lineItems.filter(li => li.description.trim()).length;
});

const previewEntity = computed(() => {
  if (selectedType.value === 'PURCHASE_ORDER') {
    const vendor = vendors.value.find(v => v.id === form.value.vendorId);
    return vendor?.name || vendor?.companyName || '';
  }
  if (selectedType.value === 'SALES_ORDER') {
    const client = clients.value.find(c => c.id === form.value.clientId);
    return client?.name || client?.companyName || '';
  }
  if (selectedType.value === 'INVOICE' || selectedType.value === 'PROFORMA_INVOICE') {
    const deal = deals.value.find(d => d.id === form.value.dealId);
    return deal?.name || '';
  }
  return '';
});

const currentTips = computed(() => {
  const tipsMap: Record<string, string[]> = {
    INVOICE: [
      'Select a deal to link the invoice to a client',
      'Payment terms auto-calculate the due date',
      'Add VAT at 15% using the Tax % column',
      'Document number is auto-generated on save'
    ],
    PURCHASE_ORDER: [
      'Select a vendor and optional project',
      'All items will be included in the PO total',
      'PO number is auto-generated (PO-YYYY-XXXX)',
      'Attach supporting documents after saving'
    ],
    SALES_ORDER: [
      'Link to a deal for automatic client association',
      'Set shipping address for delivery fulfillment',
      'Orders can be converted to invoices later',
      'Track fulfillment status after confirmation'
    ],
    CREDIT_NOTE: [
      'Select the invoice to issue a credit against',
      'Credit amount cannot exceed invoice total',
      'Include a clear reason for the credit',
      'Credit note number is auto-generated (CN-XXXX)'
    ],
    DELIVERY_NOTE: [
      'Select the sales order being fulfilled',
      'Add tracking number for shipment monitoring',
      'Specify carrier for logistics tracking',
      'Items list shows what is being delivered'
    ],
    PROFORMA_INVOICE: [
      'Proforma invoices are preliminary estimates',
      'Can be converted to a final invoice later',
      'Same format as invoice but non-binding',
      'Useful for customs and pre-payment requests'
    ]
  };
  return tipsMap[selectedType.value || 'INVOICE'] || [];
});

// --- Methods ---
function fmtCurrency(amount: number): string {
  return formatCurrency(amount);
}

function goBack() {
  router.push('/documents');
}

function selectType(type: DocumentType) {
  selectedType.value = type;
  resetForm();
  loadRecentDocs();
  loadTemplates(type);
}

function resetType() {
  selectedType.value = null;
  resetForm();
}

async function loadTemplates(type: string) {
  templates.value = [];
  try {
    const { body, success } = await useApiFetch(`document-templates?type=${type.toUpperCase()}&limit=50`);
    if (success && body) {
      const data = body as any;
      templates.value = (data.docs || data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        type: t.type,
        isDefault: t.isDefault || false
      }));
    }
  } catch {
    /* silent — templates are optional */
  }
}

function resetForm() {
  form.value.lineItems = [{ description: '', quantity: 1, unitPrice: 0, taxRate: 0, discountRate: 0, lineTotal: 0 }];
  form.value.templateId = '';
  form.value.dealId = '';
  form.value.salesOrderId = '';
  form.value.invoiceDate = new Date();
  form.value.paymentTerms = 'NET_30';
  form.value.dueDate = null;
  form.value.vendorId = '';
  form.value.projectId = '';
  form.value.paymentMethod = 'Cash';
  form.value.deliveryDate = null;
  form.value.clientId = '';
  form.value.shippingAddress = '';
  form.value.invoiceId = '';
  form.value.creditAmount = 0;
  form.value.creditReason = '';
  form.value.trackingNumber = '';
  form.value.carrier = '';
  form.value.shippedDate = null;
  form.value.notes = '';
  form.value.terms = '';
  form.value.currency = 'SAR';
  form.value.date = new Date();
}

function onLineItemsUpdate(items: InvoiceLineItem[]) {
  form.value.lineItems = items;
}

function calculateDueDate() {
  const invoiceDate = form.value.invoiceDate ? new Date(form.value.invoiceDate) : new Date();
  const daysMap: Record<string, number> = { NET_15: 15, NET_30: 30, NET_60: 60, NET_90: 90, DUE_ON_RECEIPT: 0 };
  const days = daysMap[form.value.paymentTerms];
  if (days !== undefined) {
    const due = new Date(invoiceDate);
    due.setDate(due.getDate() + days);
    form.value.dueDate = due;
  }
}

async function onDealChange() {
  form.value.salesOrderId = '';
  if (form.value.dealId) {
    try {
      const { body, success } = await useApiFetch(`sales-orders?dealId=${form.value.dealId}&limit=100`);
      if (success && body) {
        const data = body as any;
        salesOrders.value = (data.docs || data || []).map((o: any) => ({ id: o.id, orderNumber: o.orderNumber }));
      }
    } catch {
      /* silent */
    }
  }
}

function validate(): boolean {
  const type = selectedType.value;
  if (type === 'INVOICE' || type === 'PROFORMA_INVOICE') {
    if (!form.value.dealId) {
      ElNotification({ type: 'warning', title: 'Validation', message: t('documentEditor.validation.selectDeal') });
      return false;
    }
  }
  if (type === 'PURCHASE_ORDER') {
    if (!form.value.vendorId) {
      ElNotification({ type: 'warning', title: 'Validation', message: t('documentEditor.validation.selectVendor') });
      return false;
    }
  }
  if (type === 'SALES_ORDER') {
    if (!form.value.clientId) {
      ElNotification({ type: 'warning', title: 'Validation', message: t('documentEditor.validation.selectClient') });
      return false;
    }
  }
  if (type === 'CREDIT_NOTE') {
    if (!form.value.invoiceId) {
      ElNotification({ type: 'warning', title: 'Validation', message: t('documentEditor.validation.selectInvoice') });
      return false;
    }
    if (!form.value.creditAmount || form.value.creditAmount <= 0) {
      ElNotification({ type: 'warning', title: 'Validation', message: t('documentEditor.validation.enterAmount') });
      return false;
    }
    return true;
  }
  if (type === 'DELIVERY_NOTE') {
    if (!form.value.salesOrderId) {
      ElNotification({ type: 'warning', title: 'Validation', message: t('documentEditor.validation.selectSalesOrder') });
      return false;
    }
  }
  const validItems = form.value.lineItems.filter(item => item.description.trim());
  if (validItems.length === 0) {
    ElNotification({ type: 'warning', title: 'Validation', message: t('documentEditor.validation.addLineItem') });
    return false;
  }
  return true;
}

function sanitizeLineItems() {
  return form.value.lineItems.filter(item => item.description.trim()).map(({ lineTotal, id, ...item }) => item);
}

async function handleSaveDraft() {
  if (!validate()) return;
  saving.value = true;
  try {
    let result: any = null;
    switch (selectedType.value) {
      case 'INVOICE':
      case 'PROFORMA_INVOICE':
        result = await createInvoice({
          dealId: form.value.dealId,
          invoiceDate: form.value.invoiceDate ? new Date(form.value.invoiceDate).toISOString() : undefined,
          notes: form.value.notes || undefined,
          paymentTerms: form.value.paymentTerms,
          dueDate: form.value.dueDate ? new Date(form.value.dueDate).toISOString() : undefined,
          lineItems: sanitizeLineItems()
        });
        if (result) router.push(`/sales/invoices/${result.id}`);
        break;

      case 'PURCHASE_ORDER': {
        const poPayload = {
          vendorId: form.value.vendorId,
          projectId: form.value.projectId || undefined,
          paymentTerms: form.value.paymentTerms,
          paymentMethod: form.value.paymentMethod,
          dueDate: form.value.deliveryDate ? new Date(form.value.deliveryDate).toISOString() : undefined,
          items: form.value.lineItems
            .filter(li => li.description.trim())
            .map(li => ({
              description: li.description,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              tax: li.taxRate
            })),
          totalAmount: computedTotals.value.total
        };
        const poRes = await useApiFetch('procurement', 'POST', poPayload as any);
        if (poRes.success) {
          ElNotification({ type: 'success', title: 'Success', message: 'Purchase order created successfully' });
          router.push('/procurement/purchase-orders');
        } else {
          ElNotification({ type: 'error', title: 'Error', message: poRes.message || 'Failed to create purchase order' });
        }
        break;
      }

      case 'SALES_ORDER':
        result = await createSalesOrder({
          clientId: form.value.clientId,
          dealId: form.value.dealId || undefined,
          paymentTerms: form.value.paymentTerms,
          currency: form.value.currency,
          shippingAddress: form.value.shippingAddress || undefined,
          notes: form.value.notes || undefined,
          items: sanitizeLineItems()
        });
        if (result?.id) router.push(`/sales/sales-orders/${result.id}`);
        break;

      case 'CREDIT_NOTE':
        result = await createCreditNote(Number(form.value.invoiceId), {
          amount: form.value.creditAmount,
          reason: form.value.creditReason || undefined,
          date: form.value.date ? new Date(form.value.date).toISOString() : undefined
        });
        if (result) router.push(`/sales/invoices/${form.value.invoiceId}`);
        break;

      case 'DELIVERY_NOTE': {
        const dnRes = await useApiFetch(`sales-orders/${form.value.salesOrderId}/fulfillment`, 'POST', {
          trackingNumber: form.value.trackingNumber || undefined,
          carrier: form.value.carrier || undefined,
          shippedDate: form.value.shippedDate ? new Date(form.value.shippedDate).toISOString() : undefined,
          notes: form.value.notes || undefined
        } as any);
        if (dnRes.success) {
          ElNotification({ type: 'success', title: 'Success', message: 'Delivery note created successfully' });
          router.push(`/sales/sales-orders/${form.value.salesOrderId}`);
        } else {
          ElNotification({ type: 'error', title: 'Error', message: dnRes.message || 'Failed to create delivery note' });
        }
        break;
      }
    }
  } finally {
    saving.value = false;
  }
}

async function handleSaveAndSend() {
  if (!validate()) return;
  saving.value = true;
  try {
    if (selectedType.value === 'INVOICE' || selectedType.value === 'PROFORMA_INVOICE') {
      const result = await createInvoice({
        dealId: form.value.dealId,
        invoiceDate: form.value.invoiceDate ? new Date(form.value.invoiceDate).toISOString() : undefined,
        notes: form.value.notes || undefined,
        paymentTerms: form.value.paymentTerms,
        dueDate: form.value.dueDate ? new Date(form.value.dueDate).toISOString() : undefined,
        lineItems: sanitizeLineItems()
      });
      if (result) {
        await markInvoiceSent(result.id);
        ElNotification({ type: 'success', title: 'Success', message: 'Invoice created and marked as sent' });
        router.push(`/sales/invoices/${result.id}`);
      }
    } else {
      // For other types, save then notify (not recursive - inline the save logic)
      saving.value = false; // handleSaveDraft sets its own saving state
      await handleSaveDraft();
      // handleSaveDraft manages saving state
    }
  } finally {
    saving.value = false;
  }
}

function printDocument() {
  showPreviewDialog.value = false;
  nextTick(() => window.print());
}

function navigateToDoc(doc: { link: string }) {
  router.push(doc.link);
}

// --- Data Loading ---
async function loadInitialData() {
  const safeApiFetch = async (url: string) => {
    try {
      return await useApiFetch(url, 'GET', {}, true);
    } catch {
      return { success: false, body: null };
    }
  };

  const [dealRes, clientRes, vendorRes, projectRes] = await Promise.all([
    safeApiFetch('deal?limit=200'),
    safeApiFetch('client?limit=500'),
    safeApiFetch('vendor/all'),
    safeApiFetch('project?limit=200')
  ]);

  if (dealRes.success && dealRes.body) {
    const data = dealRes.body as any;
    deals.value = (data.docs || data || []).map((d: any) => ({ id: d.id, name: d.name }));
  }
  if (clientRes.success && clientRes.body) {
    const data = clientRes.body as any;
    clients.value = (data.docs || data || []).map((c: any) => ({ id: c.id, name: c.name, companyName: c.companyName }));
  }
  if (vendorRes.success && vendorRes.body) {
    vendors.value = ((vendorRes.body as any[]) || []).map((v: any) => ({ id: v.id, name: v.name, companyName: v.companyName }));
  }
  if (projectRes.success && projectRes.body) {
    const data = projectRes.body as any;
    projects.value = (data.docs || data || []).map((p: any) => ({ id: p.id, name: p.name }));
  }
}

async function loadInvoices() {
  try {
    const { body, success } = await useApiFetch('invoices?limit=100', 'GET', {}, true);
    if (success && body) {
      const data = body as any;
      invoicesList.value = (data.docs || data || []).map((inv: any) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber || `INV-${inv.id}`,
        amount: inv.total || inv.amount || 0
      }));
    }
  } catch {
    /* silent */
  }
}

async function loadRecentDocs() {
  recentDocs.value = [];
  try {
    let endpoint = '';
    let mapFn: (item: any) => { id: string; number: string; date: string; link: string } = () => ({ id: '', number: '', date: '', link: '' });

    switch (selectedType.value) {
      case 'INVOICE':
      case 'PROFORMA_INVOICE':
        endpoint = 'invoices?limit=5';
        mapFn = (inv: any) => ({
          id: inv.id,
          number: inv.invoiceNumber || `INV-${inv.id}`,
          date: inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '',
          link: `/sales/invoices/${inv.id}`
        });
        break;
      case 'PURCHASE_ORDER':
        endpoint = 'procurement?limit=5';
        mapFn = (po: any) => ({
          id: po.id,
          number: po.poNumber || `PO-${po.id}`,
          date: po.createdAt ? new Date(po.createdAt).toLocaleDateString() : '',
          link: `/procurement/purchase-orders/${po.id}`
        });
        break;
      case 'SALES_ORDER':
        endpoint = 'sales-orders?limit=5';
        mapFn = (so: any) => ({
          id: so.id,
          number: so.orderNumber || `SO-${so.id}`,
          date: so.createdAt ? new Date(so.createdAt).toLocaleDateString() : '',
          link: `/sales/sales-orders/${so.id}`
        });
        break;
    }

    if (endpoint) {
      const { body, success } = await useApiFetch(endpoint);
      if (success && body) {
        const data = body as any;
        recentDocs.value = (data.docs || data || []).slice(0, 5).map(mapFn);
      }
    }
  } catch {
    /* silent */
  }
}

onMounted(async () => {
  try {
    await Promise.all([loadInitialData(), loadInvoices()]);
    calculateDueDate();

    // Handle query params for pre-selection
    const queryType = route.query.type as string;
    if (queryType && documentTypes.some(dt => dt.type === queryType)) {
      selectType(queryType as DocumentType);
    }
  } finally {
    initialLoading.value = false;
  }
});
</script>

<style scoped>
.glass-card {
  background: var(--glass-bg, rgba(255, 255, 255, 0.06));
  backdrop-filter: blur(var(--glass-blur, 12px));
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
}
.text-gradient {
  background: linear-gradient(135deg, #7849ff 0%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.animate-entrance {
  animation: entrance 0.4s ease-out;
}
@keyframes entrance {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.preview-container {
  max-height: 70vh;
  overflow-y: auto;
}
@media print {
  .glass-card,
  .el-button,
  .el-dialog__header,
  .el-dialog__footer {
    display: none !important;
  }
  .preview-container {
    display: block !important;
    max-height: none;
  }
}
</style>
