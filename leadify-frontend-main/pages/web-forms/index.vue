<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") {{ $t('webForms.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('webForms.subtitle') }}
    el-button(type="primary" size="default" @click="showCreateDialog = true" style="background: var(--bg-obsidian); border: none; border-radius: 12px;")
      Icon(name="ph:plus" size="16" style="margin-right: 4px;")
      | {{ $t('webForms.newForm') }}

  .grid.grid-cols-4.gap-4.mb-8
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('webForms.totalForms') }}
      p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ stats.total }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('webForms.active') }}
      p.text-3xl.font-black.mt-1(style="color: #22c55e;") {{ stats.active }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('webForms.submissions') }}
      p.text-3xl.font-black.mt-1(style="color: #7c3aed;") {{ stats.totalSubmissions }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('webForms.avgConversion') }}
      p.text-3xl.font-black.mt-1(style="color: #06b6d4;") {{ stats.avgConversion }}%

  .grid.grid-cols-1.gap-4(class="md:grid-cols-3" v-loading="formLoading")
    .p-6.rounded-2xl.border.transition-all(
      v-for="form in forms"
      :key="form.id"
      style="border-color: var(--border-default); background: var(--bg-elevated);"
      class="hover:shadow-lg hover:border-violet-200"
    )
      .flex.items-center.justify-between.mb-4
        .flex.items-center.gap-2
          .w-3.h-3.rounded-full(:style="{ backgroundColor: form.status === 'ACTIVE' ? '#22c55e' : '#ef4444' }")
          span.text-sm.font-bold {{ form.status === 'ACTIVE' ? $t('common.active') : $t('common.inactive') }}
        el-switch(:model-value="form.status === 'ACTIVE'" @change="toggleActive(form.id)" size="small")
      h3.text-lg.font-black.mb-1(style="color: var(--text-primary);") {{ form.name }}
      p.text-xs.mb-3(style="color: var(--text-muted);") {{ (form.fields || []).length }} {{ $t('webForms.fields') }} · {{ form.submissionCount || 0 }} {{ $t('webForms.submissions') }}
      .flex.items-center.gap-2.mb-3(v-if="form.viewCount")
        .text-xs(style="color: var(--text-muted);")
          | {{ form.viewCount }} {{ $t('webForms.views') }} · {{ calculateConversion(form) }}% {{ $t('webForms.conversion') }}
      .flex.items-center.gap-2.flex-wrap
        el-button(size="small" @click="showEmbedDialog(form)" style="border-radius: 8px;")
          Icon(name="ph:code" size="14" style="margin-right: 2px;")
          | {{ $t('webForms.embed') }}
        el-button(size="small" @click="showAnalytics(form)" style="border-radius: 8px;")
          Icon(name="ph:chart-line" size="14" style="margin-right: 2px;")
          | {{ $t('common.analytics') }}
        el-button(size="small" @click="editForm(form)" style="border-radius: 8px;")
          Icon(name="ph:pencil-simple" size="14" style="margin-right: 2px;")
          | {{ $t('common.edit') }}
        el-button(size="small" type="danger" plain @click="removeForm(form.id)" style="border-radius: 8px;")
          Icon(name="ph:trash" size="14")

    .p-6.rounded-2xl.border-2.border-dashed.text-center.cursor-pointer.transition-colors(
      v-if="!formLoading && forms.length === 0"
      style="border-color: var(--border-default); color: var(--text-muted);"
      @click="showCreateDialog = true"
    )
      Icon(name="ph:plus-circle" size="40")
      p.text-sm.mt-2 {{ $t('webForms.createFirst') }}

  //- Create/Edit Form Dialog
  el-dialog(v-model="showCreateDialog" :title="editingForm ? $t('webForms.editForm') : $t('webForms.createForm')" width="680px" :close-on-click-modal="false")
    el-form(label-position="top" size="large")
      el-form-item(:label="$t('webForms.formName')")
        el-input(v-model="formData.name" :placeholder="$t('webForms.formNamePlaceholder')")
      el-form-item(:label="$t('webForms.description')")
        el-input(v-model="formData.description" type="textarea" :rows="2" :placeholder="$t('webForms.descriptionPlaceholder')")

      el-divider {{ $t('webForms.fields') }}
      .space-y-2.mb-4
        .flex.items-center.gap-2(v-for="(field, i) in formData.fields" :key="i" class="p-3 rounded-lg border" style="border-color: var(--border-default);")
          el-input(v-model="field.label" :placeholder="$t('webForms.fieldLabel')" size="default")
          el-select(v-model="field.type" size="default" style="width: 140px;")
            el-option(:label="$t('webForms.fieldTypes.text')" value="text")
            el-option(:label="$t('webForms.fieldTypes.email')" value="email")
            el-option(:label="$t('webForms.fieldTypes.phone')" value="phone")
            el-option(:label="$t('webForms.fieldTypes.textarea')" value="textarea")
            el-option(:label="$t('webForms.fieldTypes.select')" value="select")
            el-option(:label="$t('webForms.fieldTypes.checkbox')" value="checkbox")
          el-checkbox(v-model="field.required") {{ $t('webForms.required') }}
          el-button(text circle size="small" @click="formData.fields.splice(i, 1)")
            Icon(name="ph:x" size="14")
      el-button(text size="small" @click="addField" class="mb-4")
        Icon(name="ph:plus" size="14" style="margin-right: 4px;")
        | {{ $t('webForms.addField') }}

      el-divider {{ $t('webForms.settings') }}
      el-form-item(:label="$t('webForms.thankYouMessage')")
        el-input(v-model="formData.thankYouMessage" :placeholder="$t('webForms.thankYouPlaceholder')")
      el-form-item(:label="$t('webForms.redirectUrl')")
        el-input(v-model="formData.redirectUrl" :placeholder="$t('webForms.redirectUrlPlaceholder')")

      .grid.grid-cols-2.gap-4
        el-form-item
          template(#label)
            .flex.items-center.gap-2
              span {{ $t('webForms.enableRecaptcha') }}
              el-tooltip(:content="$t('webForms.recaptchaTooltip')" placement="top")
                Icon(name="ph:info" size="16")
          el-switch(v-model="formData.enableRecaptcha")
        el-form-item
          template(#label)
            .flex.items-center.gap-2
              span {{ $t('webForms.enableHoneypot') }}
              el-tooltip(:content="$t('webForms.honeypotTooltip')" placement="top")
                Icon(name="ph:info" size="16")
          el-switch(v-model="formData.enableHoneypot")

      el-form-item(:label="$t('webForms.rateLimit')")
        el-input-number(v-model="formData.rateLimit" :min="1" :max="100" style="width: 100%;")
        template(#append) {{ $t('webForms.submissionsPerHour') }}

      el-divider {{ $t('webForms.autoResponse') }}
      el-form-item
        el-checkbox(v-model="formData.autoResponse.enabled") {{ $t('webForms.sendAutoResponse') }}
      template(v-if="formData.autoResponse.enabled")
        el-form-item(:label="$t('webForms.emailSubject')")
          el-input(v-model="formData.autoResponse.subject" :placeholder="$t('webForms.emailSubjectPlaceholder')")
        el-form-item(:label="$t('webForms.emailBody')")
          el-input(v-model="formData.autoResponse.body" type="textarea" :rows="4" :placeholder="$t('webForms.emailBodyPlaceholder')")

      el-divider {{ $t('webForms.styling') }}
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('webForms.primaryColor')")
          el-color-picker(v-model="formData.styling.primaryColor")
        el-form-item(:label="$t('webForms.buttonText')")
          el-input(v-model="formData.styling.buttonText" :placeholder="$t('webForms.buttonTextPlaceholder')")

    template(#footer)
      el-button(@click="showCreateDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="saveForm" style="border-radius: 12px;") {{ editingForm ? $t('common.update') : $t('common.create') }}

  //- Embed Code Dialog
  el-dialog(v-model="showEmbedCodeDialog" :title="$t('webForms.embedCode')" width="640px")
    .space-y-4
      div
        p.text-sm.font-bold.mb-2(style="color: var(--text-primary);") {{ $t('webForms.iframeEmbed') }}
        .p-4.rounded-lg.bg-gray-900.text-green-400.font-mono.text-xs.relative
          pre.overflow-x-auto {{ embedCode.iframe }}
          el-button.absolute.top-2.right-2(size="small" @click="copyToClipboard(embedCode.iframe)")
            Icon(name="ph:copy" size="14")
      div
        p.text-sm.font-bold.mb-2(style="color: var(--text-primary);") {{ $t('webForms.directLink') }}
        .p-4.rounded-lg.bg-gray-900.text-blue-400.font-mono.text-xs.relative
          pre.overflow-x-auto {{ embedCode.directLink }}
          el-button.absolute.top-2.right-2(size="small" @click="copyToClipboard(embedCode.directLink)")
            Icon(name="ph:copy" size="14")
      div
        p.text-sm.font-bold.mb-2(style="color: var(--text-primary);") {{ $t('webForms.embedToken') }}
        .p-4.rounded-lg(style="background: var(--bg-elevated); border: 1px solid var(--border-default);")
          code.text-xs {{ embedCode.token }}

  //- Analytics Dialog
  el-dialog(v-model="showAnalyticsDialog" :title="analyticsTitle" width="800px" v-loading="analyticsLoading")
    .grid.grid-cols-3.gap-4.mb-6
      .p-4.rounded-xl.border.text-center(style="border-color: var(--border-default); background: var(--bg-elevated);")
        .text-2xl.font-black(style="color: var(--text-primary);") {{ analytics.totalSubmissions }}
        .text-xs.mt-1(style="color: var(--text-muted);") {{ $t('webForms.totalSubmissions') }}
      .p-4.rounded-xl.border.text-center(style="border-color: var(--border-default); background: var(--bg-elevated);")
        .text-2xl.font-black(style="color: #06b6d4;") {{ analytics.totalViews }}
        .text-xs.mt-1(style="color: var(--text-muted);") {{ $t('webForms.totalViews') }}
      .p-4.rounded-xl.border.text-center(style="border-color: var(--border-default); background: var(--bg-elevated);")
        .text-2xl.font-black(style="color: #22c55e;") {{ analytics.conversionRate }}%
        .text-xs.mt-1(style="color: var(--text-muted);") {{ $t('webForms.conversionRate') }}

    .mb-6
      p.text-sm.font-bold.mb-3(style="color: var(--text-primary);") {{ $t('webForms.submissionTrend') }}
      div(ref="trendChartRef" style="height: 250px;")

    .mb-6
      p.text-sm.font-bold.mb-3(style="color: var(--text-primary);") {{ $t('webForms.sourceBreakdown') }}
      div(ref="sourceChartRef" style="height: 200px;")

    div
      p.text-sm.font-bold.mb-3(style="color: var(--text-primary);") {{ $t('webForms.fieldCompletion') }}
      el-progress(
        v-for="(field, key) in analytics.fieldCompletionRates"
        :key="key"
        :percentage="field.rate"
        :format="() => `${key}: ${field.rate}%`"
        class="mb-2"
      )
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue';
import { useWebForms } from '~/composables/useWebForms';
import { useI18n } from 'vue-i18n';
import * as echarts from 'echarts';

definePageMeta({});

const { t } = useI18n();
const { forms, stats, fetchForms, createForm, updateForm, removeForm, toggleActive, getFormAnalytics, loading: formLoading } = useWebForms();

const showCreateDialog = ref(false);
const showEmbedCodeDialog = ref(false);
const showAnalyticsDialog = ref(false);
const saving = ref(false);
const editingForm = ref<any>(null);
const analyticsLoading = ref(false);
const trendChartRef = ref<HTMLElement>();
const sourceChartRef = ref<HTMLElement>();

const formData = reactive({
  name: '',
  description: '',
  thankYouMessage: 'Thank you for your submission!',
  redirectUrl: '',
  enableRecaptcha: false,
  enableHoneypot: true,
  rateLimit: 10,
  autoResponse: { enabled: false, subject: '', body: '' },
  styling: { primaryColor: '#7c3aed', buttonText: 'Submit' },
  fields: [
    { name: 'fullName', label: 'Full Name', type: 'text' as const, required: true },
    { name: 'email', label: 'Email', type: 'email' as const, required: true },
    { name: 'phone', label: 'Phone', type: 'phone' as const, required: false },
    { name: 'message', label: 'Message', type: 'textarea' as const, required: false }
  ]
});

const embedCode = reactive({
  iframe: '',
  directLink: '',
  token: ''
});

const analytics = reactive<any>({
  totalSubmissions: 0,
  totalViews: 0,
  conversionRate: 0,
  dailySubmissions: [],
  sourceBreakdown: [],
  fieldCompletionRates: {}
});

const analyticsTitle = computed(() => editingForm.value ? `${t('common.analytics')} - ${editingForm.value.name}` : t('common.analytics'));

onMounted(() => {
  fetchForms();
});

function addField() {
  formData.fields.push({
    name: `field_${Date.now()}`,
    label: '',
    type: 'text',
    required: false
  });
}

function resetForm() {
  formData.name = '';
  formData.description = '';
  formData.thankYouMessage = 'Thank you for your submission!';
  formData.redirectUrl = '';
  formData.enableRecaptcha = false;
  formData.enableHoneypot = true;
  formData.rateLimit = 10;
  formData.autoResponse = { enabled: false, subject: '', body: '' };
  formData.styling = { primaryColor: '#7c3aed', buttonText: 'Submit' };
  formData.fields = [
    { name: 'fullName', label: 'Full Name', type: 'text' as const, required: true },
    { name: 'email', label: 'Email', type: 'email' as const, required: true },
    { name: 'phone', label: 'Phone', type: 'phone' as const, required: false },
    { name: 'message', label: 'Message', type: 'textarea' as const, required: false }
  ];
  editingForm.value = null;
}

function editForm(form: any) {
  editingForm.value = form;
  formData.name = form.name;
  formData.description = form.description || '';
  formData.thankYouMessage = form.thankYouMessage || 'Thank you!';
  formData.redirectUrl = form.redirectUrl || '';
  formData.enableRecaptcha = form.enableRecaptcha || false;
  formData.enableHoneypot = form.enableHoneypot !== false;
  formData.rateLimit = form.rateLimit || 10;
  formData.autoResponse = form.autoResponse || { enabled: false, subject: '', body: '' };
  formData.styling = form.styling || { primaryColor: '#7c3aed', buttonText: 'Submit' };
  formData.fields = form.fields || [];
  showCreateDialog.value = true;
}

async function saveForm() {
  if (!formData.name) {
    ElMessage.warning(t('webForms.formNameRequired'));
    return;
  }
  saving.value = true;
  try {
    const payload = {
      name: formData.name,
      description: formData.description,
      fields: formData.fields,
      thankYouMessage: formData.thankYouMessage,
      redirectUrl: formData.redirectUrl,
      enableRecaptcha: formData.enableRecaptcha,
      enableHoneypot: formData.enableHoneypot,
      rateLimit: formData.rateLimit,
      autoResponse: formData.autoResponse,
      styling: formData.styling
    };

    let success = false;
    if (editingForm.value) {
      success = await updateForm(editingForm.value.id, payload);
    } else {
      success = await createForm(payload);
    }

    if (success) {
      showCreateDialog.value = false;
      ElMessage.success(editingForm.value ? t('webForms.formUpdated') : t('webForms.formCreated'));
      resetForm();
    }
  } finally {
    saving.value = false;
  }
}

function showEmbedDialog(form: any) {
  const origin = window.location.origin;
  embedCode.iframe = `<iframe src="${origin}/portal/form/${form.embedToken || form.id}" width="100%" height="600" frameborder="0"></iframe>`;
  embedCode.directLink = `${origin}/portal/form/${form.embedToken || form.id}`;
  embedCode.token = form.embedToken || '';
  showEmbedCodeDialog.value = true;
}

async function showAnalytics(form: any) {
  editingForm.value = form;
  showAnalyticsDialog.value = true;
  analyticsLoading.value = true;
  try {
    const data = await getFormAnalytics(form.id);
    if (data) {
      Object.assign(analytics, data);
      await nextTick();
      renderCharts();
    }
  } finally {
    analyticsLoading.value = false;
  }
}

function renderCharts() {
  if (trendChartRef.value) {
    const chart = echarts.init(trendChartRef.value);
    chart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: analytics.dailySubmissions.map((d: any) => d.date) },
      yAxis: { type: 'value' },
      series: [{ data: analytics.dailySubmissions.map((d: any) => d.count), type: 'line', smooth: true, itemStyle: { color: '#7c3aed' } }]
    });
  }
  if (sourceChartRef.value && analytics.sourceBreakdown?.length) {
    const chart = echarts.init(sourceChartRef.value);
    chart.setOption({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: '60%',
        data: analytics.sourceBreakdown.map((s: any) => ({ name: s.source, value: s.count })),
        itemStyle: { borderRadius: 8 }
      }]
    });
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  ElMessage.success(t('common.copiedToClipboard'));
}

function calculateConversion(form: any): number {
  if (!form.viewCount || form.viewCount === 0) return 0;
  return Math.round((form.submissionCount / form.viewCount) * 100);
}
</script>
