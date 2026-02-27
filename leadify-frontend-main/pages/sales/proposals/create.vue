<template>
  <div class="min-h-screen bg-slate-50">
    <ProposalsProposalBuilder
      @save="handleSave"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

definePageMeta({
  layout: 'default',
  middleware: ['permissions'],
  permission: 'CREATE_PROPOSALS'
})

const handleSave = async (data: any) => {
  try {
    const payload = transformToApiPayload(data)
    const response = await useApiFetch('proposal', 'POST', payload)
    if (response?.success) {
      ElNotification({ type: 'success', title: t('common.success'), message: t('proposals.createSuccess') })
      navigateTo('/sales/proposals')
    } else {
      ElNotification({ type: 'error', title: t('common.error'), message: response?.message || 'Failed to create' })
    }
  } catch (error: any) {
    ElNotification({ type: 'error', title: t('common.error'), message: error?.message || 'Failed to create' })
  }
}

const handleCancel = () => navigateTo('/sales/proposals')

// Transform form data to API payload (matches React's transformToApiPayload)
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
</script>
