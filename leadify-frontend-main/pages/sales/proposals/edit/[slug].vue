<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Loading State -->
    <div v-if="loading" class="min-h-screen flex items-center justify-center bg-slate-50">
      <div class="text-center">
        <el-icon class="is-loading mb-4" :size="40" color="#7c3aed"><Loading /></el-icon>
        <p class="text-gray-500">{{ t('proposals.loadingDetails') || 'Loading proposal details...' }}</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="min-h-screen flex items-center justify-center bg-slate-50">
      <div class="text-center">
        <Icon name="ph:warning-circle" size="48" class="text-red-500 mx-auto mb-4" />
        <p class="text-red-500 mb-4">{{ errorMessage }}</p>
        <el-button type="default" class="!rounded-xl" @click="handleCancel">
          {{ t('common.goBack') || 'Go Back' }}
        </el-button>
      </div>
    </div>

    <!-- Editor -->
    <ProposalsProposalBuilder
      v-else-if="initialData"
      :initial-data="initialData"
      @save="handleSave"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Loading } from '@element-plus/icons-vue'

const { t } = useI18n()
const route = useRoute()

definePageMeta({
  layout: 'default',
  middleware: ['permissions'],
  permission: 'CREATE_PROPOSALS'
})

const id = computed(() => route.params.slug as string)
const loading = ref(true)
const errorMessage = ref('')
const initialData = ref<any>(null)

async function fetchProposal() {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await useApiFetch(`proposal/${id.value}`)
    if (response?.success && response.body) {
      initialData.value = transformApiToFormData(response.body)
    } else if (response?.body) {
      // Some API patterns return body directly
      initialData.value = transformApiToFormData(response.body)
    } else {
      errorMessage.value = response?.message || 'Proposal not found'
    }
  } catch (error: any) {
    console.error('Failed to load proposal:', error)
    errorMessage.value = error?.message || 'Error loading proposal'
  } finally {
    loading.value = false
  }
}

const handleSave = async (data: any) => {
  try {
    const payload = transformToApiPayload(data)
    const response = await useApiFetch(`proposal/${id.value}`, 'PUT', payload)
    if (response?.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('proposals.updateSuccess') || 'Proposal updated successfully' })
      navigateTo('/sales/proposals')
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: response?.message || 'Failed to update proposal' })
    }
  } catch (error: any) {
    console.error('Failed to update proposal:', error)
    ElNotification({ type: 'error', title: t('common.error'), message: error?.message || 'Failed to update proposal' })
  }
}

const handleCancel = () => navigateTo('/sales/proposals')

// Transform API data to form data for ProposalBuilder
function transformApiToFormData(apiData: any) {
  const content = apiData.content ? (typeof apiData.content === 'string' ? JSON.parse(apiData.content) : apiData.content) : {}

  return {
    id: apiData.id,
    title: apiData.title || 'New Project Proposal',
    refNumber: apiData.reference || '',
    date: apiData.proposalDate || apiData.date || new Date().toISOString().split('T')[0],
    clientName: apiData.proposalFor || apiData.relatedEntity?.name || '',
    clientCompany: content.client?.company || apiData.relatedEntity?.name || apiData.proposalFor || '',
    clientEmail: content.client?.email || '',
    clientPhone: content.client?.phone || '',
    logo: content.branding?.logo || apiData.companyLogo || '',
    clientLogo: content.branding?.clientLogo || '',
    themeColor: content.branding?.themeColor || '#7c3aed',
    font: content.branding?.font || 'sans',
    coverStyle: content.branding?.coverStyle || 'corporate',
    introduction: content.sections?.introduction || apiData.notes || '',
    objectives: content.sections?.objectives || '',
    scopeOfWork: content.sections?.scopeOfWork || '',
    methodology: content.sections?.methodology || '',
    customSections: content.sections?.customSections || [],
    stepLabels: content.sections?.stepLabels || {},
    stepOrder: content.sections?.stepOrder || ['branding', 'executive', 'solution', 'financial', 'legal'],
    items: content.finance?.items || [],
    discount: content.finance?.discount || 0,
    discountType: content.finance?.discountType || 'percent',
    taxRate: content.finance?.taxRate || 15,
    currency: content.finance?.currency || 'SAR',
    paymentTerms: content.finance?.paymentTerms || '',
    phases: content.timeline || [],
    termsAndConditions: content.terms || '',
    status: apiData.status || 'DRAFT',
    version: apiData.version || 1,
    type: apiData.type || 'MIXED',
    selectedEntity: apiData.relatedEntityType
      ? { type: apiData.relatedEntityType, id: apiData.relatedEntityId }
      : undefined,
    attachments: apiData.fileAttachments?.map((url: string) => ({ url })) || [],
    validUntil: '',
  }
}

// Transform form data to API payload
function transformToApiPayload(data: any) {
  return {
    title: data.title || 'New Proposal',
    version: String(data.version || '1'),
    date: data.date || new Date().toISOString().split('T')[0],
    type: data.type || 'MIXED',
    reference: data.refNumber || `REF-${Date.now()}`,
    proposalFor: data.clientName || 'Client',
    companyLogo: data.logo || '',
    users: data.users || [],
    notes: data.introduction || '',
    content: JSON.stringify({
      branding: {
        logo: data.logo,
        clientLogo: data.clientLogo,
        themeColor: data.themeColor,
        coverStyle: data.coverStyle,
        font: data.font,
      },
      client: {
        name: data.clientName,
        company: data.clientCompany,
        email: data.clientEmail,
      },
      sections: {
        introduction: data.introduction,
        objectives: data.objectives,
        scopeOfWork: data.scopeOfWork,
        methodology: data.methodology,
        customSections: data.customSections,
        stepLabels: data.stepLabels,
        stepOrder: data.stepOrder,
      },
      finance: {
        items: data.items,
        discount: data.discount,
        discountType: data.discountType,
        taxRate: data.taxRate,
        currency: data.currency,
        paymentTerms: data.paymentTerms,
      },
      timeline: data.phases,
      terms: data.termsAndConditions,
    }),
    relatedEntityType: data.selectedEntity?.type,
    relatedEntityId: data.selectedEntity?.id,
    fileAttachments: data.attachments?.map((f: any) => f.url) || [],
  }
}

onMounted(() => {
  fetchProposal()
})
</script>
