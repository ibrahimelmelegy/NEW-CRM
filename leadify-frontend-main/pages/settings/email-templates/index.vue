<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") {{ $t('emailTemplates.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('emailTemplates.subtitle') }}
    .flex.items-center.gap-2
      el-input(v-model="searchQuery" :placeholder="$t('emailTemplates.searchTemplates')" clearable style="width: 280px;" size="default")
        template(#prefix)
          Icon(name="ph:magnifying-glass" size="16")
      el-select(v-model="filterCategory" :placeholder="$t('emailTemplates.filterByCategory')" clearable style="width: 200px;" size="default")
        el-option(v-for="cat in categoryList" :key="cat" :label="cat" :value="cat")
      el-button(type="primary" size="default" @click="openCreateDialog" style="background: var(--bg-obsidian); border: none; border-radius: 12px;")
        Icon(name="ph:plus" size="16" style="margin-right: 4px;")
        | {{ $t('emailTemplates.newTemplate') }}

  .grid.gap-4.mb-8(class="grid-cols-2 md:grid-cols-4")
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('emailTemplates.totalTemplates') }}
      p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ templates.length }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('emailTemplates.categories') }}
      p.text-3xl.font-black.mt-1(style="color: #7c3aed;") {{ new Set(templates.map(t => t.category)).size }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('emailTemplates.timesUsed') }}
      p.text-3xl.font-black.mt-1(style="color: #22c55e;") {{ templates.reduce((s, t) => s + (t.usageCount || 0), 0) }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('emailTemplates.mostUsed') }}
      p.text-lg.font-black.mt-1.truncate(style="color: #f59e0b;") {{ mostUsedTemplate }}

  div(v-loading="loading")
    .grid.grid-cols-2.gap-4
      .p-6.rounded-2xl.border.transition-all.cursor-pointer(
        v-for="tmpl in filteredTemplates"
        :key="tmpl.id"
        style="border-color: var(--border-default); background: var(--bg-elevated);"
        class="hover:shadow-lg hover:border-violet-200"
        @click="openEditDialog(tmpl)"
      )
        .flex.items-center.justify-between.mb-3
          el-tag(size="small" round effect="plain") {{ tmpl.category }}
          .flex.items-center.gap-2
            span.text-xs.font-mono(style="color: var(--text-muted);") {{ $t('emailTemplates.used') }} {{ tmpl.usageCount || 0 }}x
            el-tag(v-if="tmpl.lastUsed" type="info" size="small" effect="plain")
              Icon(name="ph:clock" size="12" class="mr-1")
              | {{ formatLastUsed(tmpl.lastUsed) }}
        h3.text-lg.font-bold.mb-1(style="color: var(--text-primary);") {{ tmpl.name }}
        p.text-sm.mb-2.font-semibold(style="color: var(--text-muted);") {{ $t('emailTemplates.subject') }}: {{ tmpl.subject }}
        p.text-xs.line-clamp-3.mb-3(style="color: var(--text-muted);") {{ stripHtml(tmpl.body) }}
        .flex.items-center.gap-2.mt-4(@click.stop)
          el-button(size="small" @click.stop="openPreview(tmpl)" style="border-radius: 8px;")
            Icon(name="ph:eye" size="14" style="margin-right: 4px;")
            | {{ $t('emailTemplates.preview') }}
          el-button(size="small" @click.stop="copyTemplate(tmpl)" style="border-radius: 8px;")
            Icon(name="ph:copy" size="14" style="margin-right: 4px;")
            | {{ $t('emailTemplates.copy') }}
          el-button(size="small" @click.stop="openSendTestDialog(tmpl)" style="border-radius: 8px;")
            Icon(name="ph:paper-plane-tilt" size="14" style="margin-right: 4px;")
            | {{ $t('emailTemplates.sendTest') }}
          el-button(size="small" type="danger" plain @click.stop="removeTemplate(tmpl.id)" style="border-radius: 8px;")
            Icon(name="ph:trash" size="14")

      //- Empty State
      .p-6.rounded-2xl.border-2.border-dashed.text-center.col-span-2(v-if="filteredTemplates.length === 0 && !loading" style="border-color: var(--border-default); color: var(--text-muted);")
        Icon(name="ph:envelope-open" size="48")
        p.text-sm.mt-3 {{ templates.length === 0 ? $t('emailTemplates.createFirst') : $t('emailTemplates.noMatchingTemplates') }}

  el-dialog(
    v-model="showDialog"
    :title="editingId ? $t('emailTemplates.editTemplate') : $t('emailTemplates.newTemplate')"
    width="900px"
    destroy-on-close
  )
    el-form(label-position="top" size="large")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('emailTemplates.templateName')")
          el-input(v-model="form.name" :placeholder="$t('emailTemplates.namePlaceholder')")
        el-form-item(:label="$t('emailTemplates.category')")
          el-select(v-model="form.category" class="w-full" allow-create filterable)
            el-option(label="Sales" value="Sales")
            el-option(label="Follow-up" value="Follow-up")
            el-option(label="Onboarding" value="Onboarding")
            el-option(label="Invoice" value="Invoice")
            el-option(label="Support" value="Support")
            el-option(label="Marketing" value="Marketing")
            el-option(label="General" value="General")
      el-form-item(:label="$t('emailTemplates.subjectLine')")
        el-input(v-model="form.subject" :placeholder="subjectPlaceholder")

      .grid.gap-4(class="grid-cols-1 md:grid-cols-3")
        .col-span-2
          el-form-item(:label="bodyEditorLabel")
            .flex.items-center.gap-2.mb-2
              el-button-group
                el-button(size="small" :type="editorMode === 'rich' ? 'primary' : ''" @click="editorMode = 'rich'") {{ $t('emailTemplates.richText') }}
                el-button(size="small" :type="editorMode === 'html' ? 'primary' : ''" @click="editorMode = 'html'") {{ $t('emailTemplates.html') }}
                el-button(size="small" :type="editorMode === 'preview' ? 'primary' : ''" @click="editorMode = 'preview'") {{ $t('emailTemplates.preview') }}

            el-input(
              v-if="editorMode === 'rich' || editorMode === 'html'"
              v-model="form.body"
              type="textarea"
              :rows="12"
              :placeholder="bodyPlaceholder"
            )

            div(class="border rounded-lg p-4 min-h-[300px]"
              v-if="editorMode === 'preview'"
              style="border-color: var(--border-default); background: white;"
              v-html="form.body"
            )

          p.text-xs.mt-1(style="color: var(--text-muted);") {{ $t('emailTemplates.placeholderHint') }}

        .col-span-1
          el-form-item(:label="$t('emailTemplates.templateVariables')")
            .p-4.rounded-lg.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
              p.text-xs.font-semibold.mb-3.uppercase.tracking-wider(style="color: var(--text-muted);") {{ $t('emailTemplates.availableVariables') }}
              .space-y-2
                .p-2.rounded.cursor-pointer.transition-all(
                  v-for="variable in availableVariables"
                  :key="variable.key"
                  style="background: var(--bg-base);"
                  class="hover:bg-violet-50"
                  @click="insertVariable(variable.key)"
                )
                  .flex.items-center.justify-between
                    code.text-xs.font-mono(style="color: #7c3aed;") {{ formatVariableKey(variable.key) }}
                    Icon(name="ph:copy" size="14" style="color: var(--text-muted);")
                  p.text-xs.mt-1(style="color: var(--text-muted);") {{ variable.description }}

    template(#footer)
      el-button(@click="showDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="saveTemplate" :loading="saving" style="border-radius: 12px;") {{ $t('emailTemplates.saveTemplate') }}

  //- Preview Dialog
  el-dialog(v-model="showPreviewDialog" :title="previewTemplateTitle" width="700px" destroy-on-close)
    .mb-4(v-if="previewTemplate")
      p.text-sm.font-semibold.mb-1(style="color: var(--text-muted);") {{ $t('emailTemplates.subject') }}:
      p.text-base.font-bold.mb-4(style="color: var(--text-primary);") {{ previewTemplate.subject }}
      .border.rounded-lg.p-6(style="border-color: var(--border-default); background: white;" v-html="previewTemplate.body")
    template(#footer)
      el-button(@click="showPreviewDialog = false") {{ $t('common.close') }}

  //- Send Test Email Dialog
  el-dialog(v-model="showSendTestDialog" :title="$t('emailTemplates.sendTestEmail')" width="500px" destroy-on-close)
    el-form(label-position="top")
      el-form-item(:label="$t('emailTemplates.recipientEmail')")
        el-input(v-model="testEmailRecipient" :placeholder="$t('emailTemplates.enterEmail')" type="email")
      p.text-xs.mt-2(style="color: var(--text-muted);") {{ $t('emailTemplates.testEmailHint') }}
    template(#footer)
      el-button(@click="showSendTestDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" @click="sendTestEmail" :loading="sendingTest" style="border-radius: 12px;") {{ $t('emailTemplates.send') }}
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

definePageMeta({});

const { t: $t } = useI18n();

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  usageCount: number;
  lastUsed?: string;
}

const templates = ref<EmailTemplate[]>([]);
const showDialog = ref(false);
const showPreviewDialog = ref(false);
const showSendTestDialog = ref(false);
const loading = ref(false);
const saving = ref(false);
const sendingTest = ref(false);
const editingId = ref<string | null>(null);
const previewTemplate = ref<EmailTemplate | null>(null);
const currentTestTemplate = ref<EmailTemplate | null>(null);
const testEmailRecipient = ref('');
const searchQuery = ref('');
const filterCategory = ref('');
const editorMode = ref<'rich' | 'html' | 'preview'>('rich');
const form = reactive({ name: '', category: 'Sales', subject: '', body: '' });

const availableVariables = [
  { key: 'name', description: $t('emailTemplates.varName') },
  { key: 'email', description: $t('emailTemplates.varEmail') },
  { key: 'company', description: $t('emailTemplates.varCompany') },
  { key: 'product', description: $t('emailTemplates.varProduct') },
  { key: 'deal', description: $t('emailTemplates.varDeal') },
  { key: 'value', description: $t('emailTemplates.varValue') },
  { key: 'date', description: $t('emailTemplates.varDate') },
  { key: 'senderName', description: $t('emailTemplates.varSenderName') },
  { key: 'senderEmail', description: $t('emailTemplates.varSenderEmail') }
];

const categoryList = computed(() => {
  const cats = new Set(templates.value.map(t => t.category).filter(Boolean));
  return Array.from(cats).sort();
});

const filteredTemplates = computed(() => {
  let result = templates.value;

  if (filterCategory.value) {
    result = result.filter(t => t.category === filterCategory.value);
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      t =>
        (t.name || '').toLowerCase().includes(q) ||
        (t.subject || '').toLowerCase().includes(q) ||
        (t.body || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q)
    );
  }

  return result.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
});

const mostUsedTemplate = computed(() => {
  if (templates.value.length === 0) return '--';
  const sorted = [...templates.value].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
  return sorted[0]?.name || '--';
});

const subjectPlaceholder = computed(() => {
  return $t('emailTemplates.subjectPlaceholder');
});

const bodyPlaceholder = computed(() => {
  return $t('emailTemplates.bodyPlaceholder');
});

const bodyEditorLabel = computed(() => {
  return $t('emailTemplates.body');
});

const previewTemplateTitle = computed(() => {
  return previewTemplate.value ? previewTemplate.value.name : $t('emailTemplates.preview');
});

function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

function formatVariableKey(key: string): string {
  return `{{${key}}}`;
}

function formatLastUsed(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return $t('emailTemplates.today');
    if (diffDays === 1) return $t('emailTemplates.yesterday');
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return '';
  }
}

function insertVariable(key: string) {
  const variable = `{{${key}}}`;
  const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
  if (textarea) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = form.body;
    form.body = text.substring(0, start) + variable + text.substring(end);
    nextTick(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    });
  } else {
    form.body += variable;
  }
  ElMessage.success($t('emailTemplates.variableInserted'));
}

function openCreateDialog() {
  editingId.value = null;
  Object.assign(form, { name: '', category: 'Sales', subject: '', body: '' });
  editorMode.value = 'rich';
  showDialog.value = true;
}

function openEditDialog(tmpl: EmailTemplate) {
  editingId.value = tmpl.id;
  Object.assign(form, {
    name: tmpl.name,
    category: tmpl.category || 'Sales',
    subject: tmpl.subject,
    body: tmpl.body
  });
  editorMode.value = 'rich';
  showDialog.value = true;
}

function openPreview(tmpl: EmailTemplate) {
  previewTemplate.value = tmpl;
  showPreviewDialog.value = true;
}

function openSendTestDialog(tmpl: EmailTemplate) {
  currentTestTemplate.value = tmpl;
  testEmailRecipient.value = '';
  showSendTestDialog.value = true;
}

async function sendTestEmail() {
  if (!testEmailRecipient.value || !testEmailRecipient.value.includes('@')) {
    ElMessage.warning($t('emailTemplates.validEmailRequired'));
    return;
  }
  if (!currentTestTemplate.value) return;

  sendingTest.value = true;
  try {
    const { success } = await useApiFetch('document-templates/send-test', 'POST', {
      templateId: currentTestTemplate.value.id,
      recipientEmail: testEmailRecipient.value
    });
    if (success) {
      ElMessage.success($t('emailTemplates.testEmailSent'));
      showSendTestDialog.value = false;
    } else {
      ElMessage.error($t('common.error'));
    }
  } catch (e) {
    console.error('Failed to send test email:', e);
    ElMessage.error($t('common.error'));
  } finally {
    sendingTest.value = false;
  }
}

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
        usageCount: d.usageCount || 0,
        lastUsed: d.lastUsed || d.updatedAt
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
    ElMessage.warning($t('common.fillRequired'));
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
      usageCount: editingId.value ? undefined : 0
    };

    let success = false;
    if (editingId.value) {
      const res = await useApiFetch(`document-templates/${editingId.value}`, 'PUT', payload);
      success = res.success;
      if (success) {
        ElMessage.success($t('emailTemplates.templateUpdated'));
      }
    } else {
      const res = await useApiFetch('document-templates', 'POST', payload);
      success = res.success;
      if (success) {
        ElMessage.success($t('emailTemplates.templateCreated'));
      }
    }

    if (success) {
      await fetchTemplates();
      Object.assign(form, { name: '', category: 'Sales', subject: '', body: '' });
      showDialog.value = false;
      editingId.value = null;
    } else {
      ElMessage.error($t('common.error'));
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
    await navigator.clipboard.writeText(`Subject: ${tmpl.subject}\n\n${stripHtml(tmpl.body)}`);
  } catch {
    // Fallback: clipboard might not be available
  }
  tmpl.usageCount = (tmpl.usageCount || 0) + 1;
  tmpl.lastUsed = new Date().toISOString();
  try {
    await useApiFetch(`document-templates/${tmpl.id}`, 'PUT', {
      usageCount: tmpl.usageCount,
      lastUsed: tmpl.lastUsed,
      type: 'EMAIL'
    });
  } catch (e) {
    console.error('Failed to update usage count:', e);
  }
  ElMessage.success($t('emailTemplates.templateCopied'));
}

onMounted(() => {
  fetchTemplates();
});
</script>
