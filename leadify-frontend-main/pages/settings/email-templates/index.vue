<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") {{ $t('emailTemplates.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('emailTemplates.subtitle') }}
    el-button(type="primary" size="default" @click="showDialog = true" style="background: var(--bg-obsidian); border: none; border-radius: 12px;")
      Icon(name="ph:plus" size="16" style="margin-right: 4px;")
      | {{ $t('emailTemplates.newTemplate') }}

  .grid.grid-cols-3.gap-4.mb-8
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('emailTemplates.totalTemplates') }}
      p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ templates.length }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('emailTemplates.categories') }}
      p.text-3xl.font-black.mt-1(style="color: #7c3aed;") {{ new Set(templates.map(t => t.category)).size }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('emailTemplates.timesUsed') }}
      p.text-3xl.font-black.mt-1(style="color: #22c55e;") {{ templates.reduce((s, t) => s + (t.usageCount || 0), 0) }}

  div(v-loading="loading")
    .grid.grid-cols-2.gap-4
      .p-6.rounded-2xl.border.transition-all(
        v-for="tmpl in templates"
        :key="tmpl.id"
        style="border-color: var(--border-default); background: var(--bg-elevated);"
        class="hover:shadow-lg hover:border-violet-200"
      )
        .flex.items-center.justify-between.mb-3
          el-tag(size="small" round effect="plain") {{ tmpl.category }}
          span.text-xs.font-mono(style="color: var(--text-muted);") {{ $t('emailTemplates.used') }} {{ tmpl.usageCount || 0 }}x
        h3.text-lg.font-bold.mb-1(style="color: var(--text-primary);") {{ tmpl.name }}
        p.text-sm.mb-2.font-semibold(style="color: var(--text-muted);") {{ $t('emailTemplates.subject') }}: {{ tmpl.subject }}
        p.text-xs.line-clamp-3(style="color: var(--text-muted);") {{ tmpl.body }}
        .flex.items-center.gap-2.mt-4
          el-button(size="small" @click="copyTemplate(tmpl)" style="border-radius: 8px;")
            Icon(name="ph:copy" size="14" style="margin-right: 4px;")
            | {{ $t('emailTemplates.copy') }}
          el-button(size="small" type="danger" plain @click="removeTemplate(tmpl.id)" style="border-radius: 8px;")
            Icon(name="ph:trash" size="14")

      //- Empty State
      .p-6.rounded-2xl.border-2.border-dashed.text-center.col-span-2(v-if="templates.length === 0 && !loading" style="border-color: var(--border-default); color: var(--text-muted);")
        Icon(name="ph:envelope-open" size="48")
        p.text-sm.mt-3 {{ $t('emailTemplates.createFirst') }}

  el-dialog(v-model="showDialog" :title="$t('emailTemplates.newTemplate')" width="600px")
    el-form(label-position="top" size="large")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('emailTemplates.templateName')")
          el-input(v-model="form.name" placeholder="Welcome Email")
        el-form-item(:label="$t('emailTemplates.category')")
          el-select(v-model="form.category" class="w-full")
            el-option(label="Sales" value="Sales")
            el-option(label="Follow-up" value="Follow-up")
            el-option(label="Onboarding" value="Onboarding")
            el-option(label="Invoice" value="Invoice")
            el-option(label="Support" value="Support")
            el-option(label="Marketing" value="Marketing")
            el-option(label="General" value="General")
      el-form-item(:label="$t('emailTemplates.subjectLine')")
        el-input(v-model="form.subject" placeholder="Re: Your {{product}} Inquiry")
      el-form-item(:label="$t('emailTemplates.body')")
        el-input(v-model="form.body" type="textarea" :rows="8" :placeholder="'Dear {{name}},\\n\\nThank you for your interest...'")
      p.text-xs.mt-1(style="color: var(--text-muted);") {{ $t('emailTemplates.placeholderHint') }}
    template(#footer)
      el-button(@click="showDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="saveTemplate" :loading="saving" style="border-radius: 12px;") {{ $t('emailTemplates.saveTemplate') }}
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

definePageMeta({});

const { $t } = useNuxtApp();

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  usageCount: number;
}

const templates = ref<EmailTemplate[]>([]);
const showDialog = ref(false);
const loading = ref(false);
const saving = ref(false);
const form = reactive({ name: '', category: 'Sales', subject: '', body: '' });

async function fetchTemplates() {
  loading.value = true;
  try {
    const { body, success } = await useApiFetch('document-templates?type=EMAIL', 'GET');
    if (success && body) {
      const docs = (body as any).docs || (Array.isArray(body) ? body : []);
      templates.value = docs.map((d: any) => ({
        id: d.id,
        name: d.name || '',
        category: d.category || d.emailCategory || '',
        subject: d.subject || '',
        body: d.body || d.emailBody || '',
        usageCount: d.usageCount || 0
      }));
    }
  } catch (e) {
    console.error('Failed to fetch email templates:', e);
    ElMessage.error($t('common.error'));
  } finally {
    loading.value = false;
  }
}

async function saveTemplate() {
  if (!form.name.trim()) {
    ElMessage.warning($t('common.fillRequired') || 'Please fill required fields');
    return;
  }
  saving.value = true;
  try {
    const payload = {
      name: form.name,
      subject: form.subject,
      body: form.body,
      category: form.category,
      type: 'EMAIL',
      usageCount: 0
    };
    const { body, success } = await useApiFetch('document-templates', 'POST', payload);
    if (success) {
      // Reload from server to get consistent data
      await fetchTemplates();
      Object.assign(form, { name: '', category: 'Sales', subject: '', body: '' });
      showDialog.value = false;
      ElMessage.success($t('emailTemplates.templateCreated'));
    } else {
      ElMessage.error((body as any)?.message || $t('common.error'));
    }
  } catch (e) {
    console.error('Failed to save template:', e);
    ElMessage.error($t('common.error'));
  } finally {
    saving.value = false;
  }
}

async function removeTemplate(id: string) {
  try {
    const { success } = await useApiFetch(`document-templates/${id}`, 'DELETE');
    if (success) {
      templates.value = templates.value.filter(t => t.id !== id);
      ElMessage.success($t('emailTemplates.templateDeleted'));
    } else {
      ElMessage.error($t('common.error'));
    }
  } catch (e) {
    console.error('Failed to delete template:', e);
    ElMessage.error($t('common.error'));
  }
}

async function copyTemplate(tmpl: EmailTemplate) {
  try {
    await navigator.clipboard.writeText(`Subject: ${tmpl.subject}\n\n${tmpl.body}`);
  } catch {
    // Fallback: clipboard might not be available
  }
  tmpl.usageCount = (tmpl.usageCount || 0) + 1;
  try {
    await useApiFetch(`document-templates/${tmpl.id}`, 'PUT', { usageCount: tmpl.usageCount, type: 'EMAIL' });
  } catch (e) {
    console.error('Failed to update usage count:', e);
  }
  ElMessage.success($t('emailTemplates.templateCopied'));
}

onMounted(() => {
  fetchTemplates();
});
</script>
