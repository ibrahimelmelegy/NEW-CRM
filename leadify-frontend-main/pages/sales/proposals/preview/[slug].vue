<template lang="pug">
.proposal-viewer
  //- Loading State
  .loading-container(v-if="loading")
    .loading-spinner
    p.loading-text Loading Proposal...

  //- Error State
  .error-container(v-else-if="error")
    Icon(name="heroicons:exclamation-circle" size="48" class="text-red-500")
    h2.error-title Proposal Not Found
    p.error-message {{ error }}
    el-button(type="primary" @click="$router.push('/sales/proposals')") Back to Proposals

  //- Main Content
  template(v-else)
    //- Floating Action Bar
    .action-bar
      .action-bar-left
        el-button(circle @click="$router.back()")
          Icon(name="heroicons:arrow-left" size="20")
        .proposal-meta
          h1.proposal-title {{ proposal?.title || 'Untitled Proposal' }}
          span.proposal-ref REF: {{ proposal?.reference }}
      .action-bar-right
        el-button(@click="handlePrint" :icon="Printer") Print
        el-button(type="primary" @click="handleDownloadPDF" :loading="downloading" :icon="Download") Download PDF
        el-dropdown(trigger="click")
          el-button(:icon="More")
          template(#dropdown)
            el-dropdown-menu
              el-dropdown-item(@click="$router.push(`/sales/proposals/${proposal?.id}`)") 
                Icon(name="heroicons:eye" size="16" class="mr-2")
                span View Details
              el-dropdown-item(@click="$router.push(`/sales/proposals/add-table/${proposal?.id}`)")
                Icon(name="heroicons:table-cells" size="16" class="mr-2")
                span Finance Table

    //- Print Container
    #proposal-print-container.print-container(ref="printContainer")
      //- Cover Page
      .page.cover-page(:style="coverStyles")
        .cover-overlay
        .cover-content
          .cover-header
            img.company-logo(v-if="proposal?.companyLogo" :src="getLogoUrl(proposal.companyLogo)" alt="Company Logo")
            .company-placeholder(v-else)
              Icon(name="heroicons:building-office-2" size="48")
          .cover-title-section
            .cover-badge {{ formatType(proposal?.type) }}
            h1.cover-title {{ proposal?.title }}
            p.cover-subtitle Prepared for {{ proposal?.proposalFor || 'Valued Client' }}
          .cover-footer
            .cover-meta
              .meta-item
                Icon(name="heroicons:calendar" size="18")
                span {{ formatDate(proposal?.proposalDate) }}
              .meta-item
                Icon(name="heroicons:hashtag" size="18")
                span {{ proposal?.reference }}
              .meta-item
                Icon(name="heroicons:document-text" size="18")
                span Version {{ proposal?.version }}

      //- Executive Summary Page
      .page.content-page(v-if="proposal?.notes || parsedContent?.sections?.executiveSummary")
        .page-header
          .section-number 01
          h2.section-title Executive Summary
        .page-content
          .summary-card
            .summary-icon
              Icon(name="heroicons:light-bulb" size="32")
            .summary-text(v-html="proposal?.notes || parsedContent?.sections?.executiveSummary || 'No executive summary provided.'")

      //- Solution & Scope Page
      .page.content-page(v-if="parsedContent?.sections?.solutionScope")
        .page-header
          .section-number 02
          h2.section-title Solution & Scope
        .page-content
          .prose-content(v-html="parsedContent?.sections?.solutionScope")

      //- Financial Summary Page
      .page.content-page(v-if="financeTables?.length")
        .page-header
          .section-number 03
          h2.section-title Investment Summary
        .page-content
          .finance-overview
            .finance-stat
              .stat-label Total Investment
              .stat-value {{ formatCurrency(calculateGrandTotal()) }}
            .finance-stat
              .stat-label VAT (15%)
              .stat-value {{ formatCurrency(calculateTotalVat()) }}
            .finance-stat.highlight
              .stat-label Grand Total
              .stat-value {{ formatCurrency(calculateGrandTotal() + calculateTotalVat()) }}

          .finance-table(v-for="table in financeTables" :key="table.id")
            .table-header
              h3.table-name {{ table.name || 'Finance Table' }}
            table.styled-table
              thead
                tr
                  th Description
                  th.center Qty
                  th.center Unit
                  th.right Unit Price
                  th.right Total
              tbody
                tr(v-for="item in table.items" :key="item.id")
                  td.description {{ item.description }}
                  td.center {{ item.quantity }}
                  td.center {{ item.unit }}
                  td.right {{ formatCurrency(item.unitPrice) }}
                  td.right.bold {{ formatCurrency(item.totalPrice) }}
              tfoot
                tr.subtotal-row
                  td(colspan="4") Subtotal
                  td.right {{ formatCurrency(table.subtotal) }}
                tr.vat-row(v-if="table.vat")
                  td(colspan="4") VAT ({{ table.vat }}%)
                  td.right {{ formatCurrency(table.subtotal * (table.vat / 100)) }}
                tr.discount-row(v-if="table.discount")
                  td(colspan="4") Discount
                  td.right -{{ formatCurrency(table.discount) }}
                tr.total-row
                  td(colspan="4") Total
                  td.right {{ formatCurrency(table.total) }}

      //- Terms & Conditions Page
      .page.content-page(v-if="parsedContent?.terms")
        .page-header
          .section-number 04
          h2.section-title Terms & Conditions
        .page-content
          .terms-content(v-html="parsedContent?.terms")

      //- Assigned Users & Attachments
      .page.content-page(v-if="proposal?.users?.length || proposal?.fileAttachments?.length")
        .page-header
          .section-number 05
          h2.section-title Additional Information
        .page-content
          //- Assigned Team
          .info-section(v-if="proposal?.users?.length")
            h3.info-title Assigned Team
            .team-grid
              .team-member(v-for="user in proposal.users" :key="user.id")
                .member-avatar
                  Icon(name="heroicons:user-circle" size="40")
                .member-info
                  p.member-name {{ user.name }}
                  p.member-role Team Member

          //- Attachments
          .info-section(v-if="proposal?.fileAttachments?.length")
            h3.info-title Attachments
            .attachments-grid
              .attachment-card(v-for="file in proposal.fileAttachments" :key="file" @click="downloadFile(file)")
                .attachment-icon
                  Icon(:name="getFileIcon(file)" size="24")
                .attachment-info
                  p.attachment-name {{ getFileName(file) }}
                  p.attachment-action Click to download

      //- Thank You Page
      .page.thank-you-page(:style="coverStyles")
        .cover-overlay
        .thank-you-content
          Icon(name="heroicons:heart" size="64" class="thank-you-icon")
          h2.thank-you-title Thank You
          p.thank-you-message We look forward to working with you on this project.
          .contact-info(v-if="proposal?.users?.[0]")
            p Contact: {{ proposal.users[0].name }}
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Printer, Download, More } from '@element-plus/icons-vue'

const route = useRoute()
const loading = ref(true)
const downloading = ref(false)
const error = ref('')
const proposal = ref<any>(null)
const financeTables = ref<any[]>([])
const printContainer = ref<HTMLElement | null>(null)

// Parse content JSON
const parsedContent = computed(() => {
  if (!proposal.value?.content) return null
  try {
    return typeof proposal.value.content === 'string' 
      ? JSON.parse(proposal.value.content) 
      : proposal.value.content
  } catch {
    return null
  }
})

// Dynamic cover styles based on branding
const coverStyles = computed(() => {
  const color = parsedContent.value?.branding?.themeColor || '#7c3aed'
  return {
    '--theme-color': color,
    '--theme-gradient': `linear-gradient(135deg, ${color} 0%, ${adjustColor(color, -30)} 100%)`
  }
})

// Fetch proposal data
const fetchProposal = async () => {
  try {
    loading.value = true
    proposal.value = await getProposal(route.params.slug as string)
    
    // Fetch finance tables
    const tables = await getProposalFinanceTable(route.params.slug as string)
    financeTables.value = tables || []
  } catch (err) {
    console.error('Error fetching proposal:', err)
    error.value = 'Failed to load proposal'
  } finally {
    loading.value = false
  }
}

onMounted(fetchProposal)

// Helper functions
const formatDate = (date: string) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  })
}

const formatType = (type: string) => {
  const types: Record<string, string> = {
    'FINANCIAL': 'Financial Proposal',
    'TECHNICAL': 'Technical Proposal',
    'MIXED': 'Technical & Financial'
  }
  return types[type] || type
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-SA', { 
    style: 'currency', 
    currency: 'SAR',
    minimumFractionDigits: 2 
  }).format(amount || 0)
}

const adjustColor = (hex: string, amount: number) => {
  const clamp = (num: number) => Math.min(255, Math.max(0, num))
  hex = hex.replace('#', '')
  const r = clamp(parseInt(hex.substr(0, 2), 16) + amount)
  const g = clamp(parseInt(hex.substr(2, 2), 16) + amount)
  const b = clamp(parseInt(hex.substr(4, 2), 16) + amount)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

const getLogoUrl = (logo: string) => {
  if (logo.startsWith('http') || logo.startsWith('data:')) return logo
  return `https://staging-api.hp-tech.com/assets/${logo}`
}

const getFileName = (path: string) => path.split('/').pop() || path
const getFileIcon = (file: string) => {
  const ext = file.split('.').pop()?.toLowerCase()
  if (['pdf'].includes(ext || '')) return 'heroicons:document'
  if (['doc', 'docx'].includes(ext || '')) return 'heroicons:document-text'
  if (['xls', 'xlsx'].includes(ext || '')) return 'heroicons:table-cells'
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return 'heroicons:photo'
  return 'heroicons:paper-clip'
}

const downloadFile = (file: string) => {
  window.open(`https://staging-api.hp-tech.com/assets/${file}`, '_blank')
}

const calculateGrandTotal = () => {
  return financeTables.value.reduce((sum, table) => sum + (table.subtotal || 0), 0)
}

const calculateTotalVat = () => {
  return financeTables.value.reduce((sum, table) => {
    const vatPercent = table.vat || 15
    return sum + ((table.subtotal || 0) * (vatPercent / 100))
  }, 0)
}

const handlePrint = () => {
  window.print()
}

const handleDownloadPDF = async () => {
  downloading.value = true
  try {
    // Use browser print to PDF
    window.print()
  } finally {
    downloading.value = false
  }
}
</script>

<style scoped lang="scss">
// Variables
$theme-color: var(--theme-color, #7c3aed);
$page-width: 210mm;
$page-height: 297mm;

.proposal-viewer {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
}

// Loading & Error States
.loading-container, .error-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top-color: #7c3aed;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.error-message {
  color: #64748b;
}

// Action Bar (Floating Header)
.action-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);

  @media print {
    display: none !important;
  }
}

.action-bar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.proposal-meta {
  .proposal-title {
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
  }
  .proposal-ref {
    font-size: 13px;
    color: #64748b;
    font-weight: 500;
  }
}

.action-bar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

// Print Container
.print-container {
  max-width: 900px;
  margin: 32px auto;
  padding: 0 16px;

  @media print {
    max-width: none;
    margin: 0;
    padding: 0;
  }
}

// Page Styles
.page {
  background: white;
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
  overflow: hidden;
  
  @media print {
    border-radius: 0;
    box-shadow: none;
    margin-bottom: 0;
    page-break-after: always;
  }
}

// Cover Page
.cover-page {
  min-height: 600px;
  position: relative;
  background: var(--theme-gradient, linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%));
  display: flex;
  flex-direction: column;
  
  @media print {
    min-height: 100vh;
  }
}

.cover-overlay {
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.5;
}

.cover-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  padding: 48px;
  color: white;
}

.cover-header {
  .company-logo {
    max-height: 60px;
    max-width: 200px;
    object-fit: contain;
    filter: brightness(0) invert(1);
  }
  .company-placeholder {
    width: 80px;
    height: 80px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.cover-title-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 48px 0;
}

.cover-badge {
  display: inline-block;
  padding: 8px 20px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  border-radius: 100px;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 24px;
  width: fit-content;
}

.cover-title {
  font-size: 48px;
  font-weight: 800;
  line-height: 1.1;
  margin: 0 0 16px;
  max-width: 600px;
}

.cover-subtitle {
  font-size: 20px;
  opacity: 0.9;
  font-weight: 400;
}

.cover-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 24px;
}

.cover-meta {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  opacity: 0.9;
}

// Content Pages
.content-page {
  padding: 48px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid #f1f5f9;
}

.section-number {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
  color: white;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  flex-shrink: 0;
}

.section-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

// Summary Card
.summary-card {
  display: flex;
  gap: 24px;
  padding: 32px;
  background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
  border-radius: 20px;
  border: 1px solid #e9d5ff;
}

.summary-icon {
  width: 64px;
  height: 64px;
  background: white;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7c3aed;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.15);
}

.summary-text {
  font-size: 16px;
  line-height: 1.8;
  color: #475569;
}

// Finance Overview
.finance-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.finance-stat {
  padding: 24px;
  background: #f8fafc;
  border-radius: 16px;
  text-align: center;
  
  &.highlight {
    background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
    color: white;
    
    .stat-label { color: rgba(255, 255, 255, 0.8); }
    .stat-value { color: white; }
  }
}

.stat-label {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

// Finance Table
.finance-table {
  margin-bottom: 32px;
  
  .table-header {
    margin-bottom: 16px;
  }
  
  .table-name {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
  }
}

.styled-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  
  th, td {
    padding: 16px 20px;
    text-align: left;
    font-size: 14px;
    
    &.center { text-align: center; }
    &.right { text-align: right; }
    &.bold { font-weight: 600; }
  }
  
  thead {
    background: #f8fafc;
    
    th {
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 0.5px;
    }
  }
  
  tbody {
    tr {
      border-bottom: 1px solid #f1f5f9;
      
      &:hover { background: #fafafa; }
    }
    
    td.description {
      max-width: 300px;
    }
  }
  
  tfoot {
    background: #f8fafc;
    
    .subtotal-row td { color: #64748b; }
    .vat-row td { color: #64748b; }
    .discount-row td { color: #059669; }
    .total-row td { 
      font-weight: 700; 
      font-size: 16px;
      color: #1e293b;
      background: #f1f5f9;
    }
  }
}

// Team & Attachments
.info-section {
  margin-bottom: 32px;
}

.info-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.team-member {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
}

.member-avatar {
  color: #7c3aed;
}

.member-name {
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.member-role {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.attachments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.attachment-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #f1f5f9;
    border-color: #7c3aed;
    transform: translateY(-2px);
  }
}

.attachment-icon {
  width: 44px;
  height: 44px;
  background: #e0e7ff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4f46e5;
}

.attachment-name {
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  word-break: break-all;
}

.attachment-action {
  font-size: 12px;
  color: #7c3aed;
  margin: 0;
}

// Thank You Page
.thank-you-page {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  
  @media print {
    min-height: 100vh;
  }
}

.thank-you-content {
  position: relative;
  z-index: 1;
  color: white;
}

.thank-you-icon {
  margin-bottom: 24px;
  opacity: 0.9;
}

.thank-you-title {
  font-size: 42px;
  font-weight: 700;
  margin: 0 0 16px;
}

.thank-you-message {
  font-size: 18px;
  opacity: 0.9;
  margin: 0 0 32px;
}

.contact-info {
  font-size: 14px;
  opacity: 0.8;
}

// Prose Content
.prose-content {
  font-size: 16px;
  line-height: 1.8;
  color: #475569;
  
  :deep(h1), :deep(h2), :deep(h3) {
    color: #1e293b;
    margin-top: 24px;
    margin-bottom: 12px;
  }
  
  :deep(ul), :deep(ol) {
    padding-left: 24px;
  }
  
  :deep(li) {
    margin-bottom: 8px;
  }
}

.terms-content {
  font-size: 14px;
  line-height: 1.8;
  color: #475569;
  white-space: pre-wrap;
}

// Print Styles
@media print {
  .proposal-viewer {
    background: white;
  }
  
  .page {
    box-shadow: none;
    border-radius: 0;
    margin: 0;
    page-break-after: always;
  }
  
  .cover-page, .thank-you-page {
    min-height: 100vh;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}
</style>
