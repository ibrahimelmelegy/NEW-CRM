<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") {{ $t('ecommerce.coupons.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('ecommerce.coupons.subtitle') }}
    el-button(type="primary" size="default" @click="openCreateDialog" style="background: var(--bg-obsidian); border: none; border-radius: 12px;")
      Icon(name="ph:ticket" size="16" style="margin-right: 4px;")
      | {{ $t('ecommerce.coupons.createCoupon') }}

  //- Stats Row
  .grid.grid-cols-2.gap-4.mb-8(class="md_grid-cols-4")
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(120, 73, 255, 0.15)")
          Icon(name="ph:ticket-bold" size="20" style="color: #7849ff")
        div
          p.text-2xl.font-black(style="color: var(--text-primary);") {{ coupons.length }}
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('ecommerce.coupons.totalCoupons') }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(34, 197, 94, 0.15)")
          Icon(name="ph:check-circle-bold" size="20" style="color: #22c55e")
        div
          p.text-2xl.font-black(style="color: #22c55e;") {{ activeCoupons }}
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('ecommerce.coupons.activeCoupons') }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(59, 130, 246, 0.15)")
          Icon(name="ph:chart-line-up-bold" size="20" style="color: #3b82f6")
        div
          p.text-2xl.font-black(style="color: #3b82f6;") {{ totalRedemptions }}
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('ecommerce.coupons.totalRedemptions') }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      .flex.items-center.gap-3
        .w-10.h-10.rounded-xl.flex.items-center.justify-center(style="background: rgba(245, 158, 11, 0.15)")
          Icon(name="ph:percent-bold" size="20" style="color: #f59e0b")
        div
          p.text-2xl.font-black(style="color: #f59e0b;") {{ averageDiscount }}
          p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('ecommerce.coupons.avgDiscount') }}

  //- Filter Bar
  .flex.flex-wrap.items-center.gap-3.mb-6
    el-input(
      v-model="searchQuery"
      :placeholder="$t('ecommerce.coupons.searchPlaceholder')"
      clearable
      class="!w-64"
      size="default"
    )
      template(#prefix)
        Icon(name="ph:magnifying-glass" size="16")
    el-select(v-model="filterType" :placeholder="$t('ecommerce.coupons.filterByType')" clearable size="default")
      el-option(:label="$t('ecommerce.coupons.allTypes')" value="")
      el-option(:label="$t('ecommerce.coupons.percentage')" value="PERCENTAGE")
      el-option(:label="$t('ecommerce.coupons.fixedAmount')" value="FIXED")
      el-option(:label="$t('ecommerce.coupons.freeShipping')" value="FREE_SHIPPING")
    el-select(v-model="filterStatus" :placeholder="$t('ecommerce.coupons.filterByStatus')" clearable size="default")
      el-option(:label="$t('ecommerce.coupons.allStatuses')" value="")
      el-option(:label="$t('common.active')" value="ACTIVE")
      el-option(:label="$t('ecommerce.coupons.expired')" value="EXPIRED")
      el-option(:label="$t('ecommerce.coupons.disabled')" value="DISABLED")

  //- Coupons Table
  el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);" v-loading="loading")
    el-table(:data="filteredCoupons" style="width: 100%;" @row-click="openEditDialog" class="cursor-pointer")
      el-table-column(:label="$t('ecommerce.coupons.code')" prop="code" min-width="140")
        template(#default="{ row }")
          span.font-mono.font-bold.text-sm(style="color: var(--text-primary);") {{ row.code }}
      el-table-column(:label="$t('ecommerce.coupons.type')" prop="type" min-width="130")
        template(#default="{ row }")
          el-tag(:type="getCouponTypeTag(row.type)" size="small" round effect="plain") {{ formatCouponType(row.type) }}
      el-table-column(:label="$t('ecommerce.coupons.value')" min-width="120")
        template(#default="{ row }")
          span.font-semibold {{ formatCouponValue(row) }}
      el-table-column(:label="$t('ecommerce.coupons.minOrder')" min-width="110")
        template(#default="{ row }")
          span(v-if="row.minOrderAmount") {{ row.minOrderAmount?.toLocaleString() }} {{ row.currency || 'SAR' }}
          span.text-xs(v-else style="color: var(--text-muted);") --
      el-table-column(:label="$t('ecommerce.coupons.usage')" min-width="120")
        template(#default="{ row }")
          span {{ row.usedCount || 0 }} / {{ row.maxUses ? row.maxUses : ($t('ecommerce.coupons.unlimited')) }}
      el-table-column(:label="$t('ecommerce.coupons.validPeriod')" min-width="180")
        template(#default="{ row }")
          template(v-if="row.validFrom || row.validTo")
            span.text-xs {{ row.validFrom ? new Date(row.validFrom).toLocaleDateString() : '...' }} - {{ row.validTo ? new Date(row.validTo).toLocaleDateString() : '...' }}
          span.text-xs(v-else style="color: var(--text-muted);") {{ $t('ecommerce.coupons.noExpiry') }}
      el-table-column(:label="$t('common.status')" prop="status" min-width="100")
        template(#default="{ row }")
          el-tag(:type="getCouponStatusTag(row.status)" size="small" round effect="dark") {{ row.status }}
      el-table-column(:label="$t('common.actions')" width="140" fixed="right")
        template(#default="{ row }")
          .flex.items-center.gap-1(@click.stop)
            el-tooltip(:content="$t('ecommerce.coupons.edit')" placement="top")
              el-button(size="small" text @click="openEditDialog(row)")
                Icon(name="ph:pencil" size="16")
            el-tooltip(:content="$t('ecommerce.coupons.copyCode')" placement="top")
              el-button(size="small" text @click="copyCode(row.code)")
                Icon(name="ph:copy" size="16")
            el-tooltip(:content="$t('common.delete')" placement="top")
              el-button(size="small" text type="danger" @click="handleDelete(row.id)")
                Icon(name="ph:trash" size="16")

    //- Empty State
    .text-center.py-12(v-if="!loading && filteredCoupons.length === 0")
      Icon(name="ph:ticket" size="48" style="color: var(--text-muted);")
      p.text-sm.mt-3(style="color: var(--text-muted);") {{ $t('ecommerce.coupons.noCoupons') }}

  //- Pagination
  .flex.justify-center.mt-6(v-if="totalPages > 1")
    el-pagination(
      v-model:current-page="currentPage"
      :page-size="pageSize"
      :total="totalItems"
      layout="prev, pager, next"
      background
    )

  //- Create / Edit Coupon Dialog
  el-dialog(v-model="showDialog" :title="editingId ? ($t('ecommerce.coupons.editCoupon')) : ($t('ecommerce.coupons.createCoupon'))" width="620px")
    el-form(label-position="top" size="large")
      .grid.grid-cols-1.gap-4(class="md_grid-cols-2")
        el-form-item(:label="$t('ecommerce.coupons.code')" required)
          .flex.gap-2
            el-input(v-model="form.code" :placeholder="$t('ecommerce.coupons.codePlaceholder')" style="text-transform: uppercase;")
            el-button(@click="form.code = generateCouponCode()" type="primary" plain style="border-radius: 12px;")
              Icon(name="ph:shuffle" size="16")
              | &nbsp;{{ $t('ecommerce.coupons.generate') }}
        el-form-item(:label="$t('common.status')")
          el-select(v-model="form.status" class="w-full")
            el-option(:label="$t('common.active')" value="ACTIVE")
            el-option(:label="$t('ecommerce.coupons.disabled')" value="DISABLED")

      el-form-item(:label="$t('ecommerce.coupons.description')")
        el-input(v-model="form.description" type="textarea" :rows="2" :placeholder="$t('ecommerce.coupons.descriptionPlaceholder')")

      el-form-item(:label="$t('ecommerce.coupons.type')" required)
        el-radio-group(v-model="form.type")
          el-radio-button(value="PERCENTAGE") {{ $t('ecommerce.coupons.percentage') }}
          el-radio-button(value="FIXED") {{ $t('ecommerce.coupons.fixedAmount') }}
          el-radio-button(value="FREE_SHIPPING") {{ $t('ecommerce.coupons.freeShipping') }}

      .grid.grid-cols-1.gap-4(class="md_grid-cols-2" v-if="form.type !== 'FREE_SHIPPING'")
        el-form-item(:label="form.type === 'PERCENTAGE' ? $t('ecommerce.coupons.percentageValue') : $t('ecommerce.coupons.fixedValue')" required)
          el-input-number(v-model="form.value" :min="0" :max="form.type === 'PERCENTAGE' ? 100 : 999999" class="!w-full")
        el-form-item(v-if="form.type === 'PERCENTAGE'" :label="$t('ecommerce.coupons.maxDiscount')")
          el-input-number(v-model="form.maxDiscountAmount" :min="0" class="!w-full")

      .grid.grid-cols-1.gap-4(class="md_grid-cols-2")
        el-form-item(:label="$t('ecommerce.coupons.minOrder')")
          el-input-number(v-model="form.minOrderAmount" :min="0" class="!w-full")
        el-form-item(:label="$t('ecommerce.coupons.maxUses')")
          el-input-number(v-model="form.maxUses" :min="0" class="!w-full")

      .grid.grid-cols-1.gap-4(class="md_grid-cols-2")
        el-form-item(:label="$t('ecommerce.coupons.maxUsesPerCustomer')")
          el-input-number(v-model="form.maxUsesPerCustomer" :min="0" class="!w-full")
        div

      .grid.grid-cols-1.gap-4(class="md_grid-cols-2")
        el-form-item(:label="$t('ecommerce.coupons.validFrom')")
          el-date-picker(v-model="form.validFrom" type="date" class="!w-full" :placeholder="$t('ecommerce.coupons.selectDate')")
        el-form-item(:label="$t('ecommerce.coupons.validTo')")
          el-date-picker(v-model="form.validTo" type="date" class="!w-full" :placeholder="$t('ecommerce.coupons.selectDate')")

    template(#footer)
      el-button(@click="showDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="saveCoupon" style="border-radius: 12px;") {{ $t('common.save') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
  fetchCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon
} from '~/composables/useEcommerce'

definePageMeta({ middleware: 'permissions' })

const { $i18n } = useNuxtApp()
const t = $i18n.t

const coupons = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const showDialog = ref(false)
const editingId = ref<string | null>(null)
const searchQuery = ref('')
const filterType = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const totalItems = ref(0)

const form = reactive({
  code: '',
  description: '',
  type: 'PERCENTAGE' as string,
  value: 0,
  minOrderAmount: 0,
  maxDiscountAmount: 0,
  maxUses: 0,
  maxUsesPerCustomer: 1,
  validFrom: null as string | null,
  validTo: null as string | null,
  status: 'ACTIVE'
})

// Computed stats
const activeCoupons = computed(() => coupons.value.filter(c => c.status === 'ACTIVE').length)
const totalRedemptions = computed(() => coupons.value.reduce((sum, c) => sum + (c.usedCount || 0), 0))
const averageDiscount = computed(() => {
  const discountCoupons = coupons.value.filter(c => c.value && c.type !== 'FREE_SHIPPING')
  if (!discountCoupons.length) return '0'
  const avg = discountCoupons.reduce((sum, c) => sum + (c.value || 0), 0) / discountCoupons.length
  return avg.toFixed(1)
})

const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))

// Filtered coupons
const filteredCoupons = computed(() => {
  let result = [...coupons.value]
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(c =>
      (c.code || '').toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q)
    )
  }
  if (filterType.value) {
    result = result.filter(c => c.type === filterType.value)
  }
  if (filterStatus.value) {
    result = result.filter(c => c.status === filterStatus.value)
  }
  return result
})

onMounted(() => {
  loadCoupons()
})

watch(currentPage, () => {
  loadCoupons()
})

async function loadCoupons() {
  loading.value = true
  try {
    const res = await fetchCoupons({ page: String(currentPage.value), limit: String(pageSize.value) })
    coupons.value = (res as any)?.body?.docs || res?.docs || []
    totalItems.value = (res as any)?.body?.totalDocs || (res as any)?.totalDocs || coupons.value.length
  } finally {
    loading.value = false
  }
}

function generateCouponCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
  return code
}

function formatCouponValue(coupon: any): string {
  if (coupon.type === 'PERCENTAGE') return `${coupon.value}%`
  if (coupon.type === 'FREE_SHIPPING') return 'Free Shipping'
  return `${coupon.value} ${coupon.currency || 'SAR'}`
}

function formatCouponType(type: string): string {
  if (type === 'PERCENTAGE') return 'Percentage'
  if (type === 'FIXED') return 'Fixed'
  if (type === 'FREE_SHIPPING') return 'Free Shipping'
  return type
}

function getCouponTypeTag(type: string): string {
  if (type === 'PERCENTAGE') return 'primary'
  if (type === 'FIXED') return 'success'
  if (type === 'FREE_SHIPPING') return 'info'
  return ''
}

function getCouponStatusTag(status: string): string {
  if (status === 'ACTIVE') return 'success'
  if (status === 'EXPIRED') return 'warning'
  if (status === 'DISABLED') return 'info'
  return ''
}

function copyCode(code: string) {
  navigator.clipboard.writeText(code)
  ElMessage.success(t('common.copiedToClipboard'))
}

function resetForm() {
  Object.assign(form, {
    code: '',
    description: '',
    type: 'PERCENTAGE',
    value: 0,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    maxUses: 0,
    maxUsesPerCustomer: 1,
    validFrom: null,
    validTo: null,
    status: 'ACTIVE'
  })
}

function openCreateDialog() {
  editingId.value = null
  resetForm()
  showDialog.value = true
}

function openEditDialog(row: any) {
  editingId.value = row.id
  Object.assign(form, {
    code: row.code || '',
    description: row.description || '',
    type: row.type || 'PERCENTAGE',
    value: row.value || 0,
    minOrderAmount: row.minOrderAmount || 0,
    maxDiscountAmount: row.maxDiscountAmount || 0,
    maxUses: row.maxUses || 0,
    maxUsesPerCustomer: row.maxUsesPerCustomer || 1,
    validFrom: row.validFrom || null,
    validTo: row.validTo || null,
    status: row.status || 'ACTIVE'
  })
  showDialog.value = true
}

async function saveCoupon() {
  if (!form.code.trim()) {
    ElMessage.warning(t('common.fillRequired'))
    return
  }
  if (form.type !== 'FREE_SHIPPING' && (!form.value || form.value <= 0)) {
    ElMessage.warning(t('common.fillRequired'))
    return
  }
  if (form.type === 'PERCENTAGE' && form.value > 100) {
    ElMessage.warning(t('common.fillRequired'))
    return
  }

  saving.value = true
  const payload = { ...form, code: form.code.toUpperCase() }

  try {
    if (editingId.value) {
      const res = await updateCoupon(editingId.value, payload as any)
      if (res?.success !== false) {
        showDialog.value = false
        await loadCoupons()
        ElMessage.success(t('common.saved'))
      }
    } else {
      const res = await createCoupon(payload as any)
      if (res?.success !== false) {
        showDialog.value = false
        resetForm()
        await loadCoupons()
        ElMessage.success(t('common.saved'))
      }
    }
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm(
      t('common.confirmAction'),
      t('common.warning'),
      { confirmButtonText: t('common.delete'), cancelButtonText: t('common.cancel'), type: 'warning' }
    )
    const res = await deleteCoupon(id)
    if (res?.success !== false) {
      await loadCoupons()
      ElMessage.success(t('common.deleted'))
    }
  } catch {
    // User cancelled
  }
}
</script>
