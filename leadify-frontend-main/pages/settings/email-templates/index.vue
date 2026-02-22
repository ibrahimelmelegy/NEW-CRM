<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") 📧 Email Templates
      p.text-sm.mt-1(style="color: var(--text-muted);") Pre-built email templates for quick communication.
    el-button(type="primary" size="default" @click="showDialog = true" style="background: var(--bg-obsidian); border: none; border-radius: 12px;")
      Icon(name="ph:plus" size="16" style="margin-right: 4px;")
      | New Template

  .grid.grid-cols-3.gap-4.mb-8
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Total Templates
      p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ templates.length }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Categories
      p.text-3xl.font-black.mt-1(style="color: #7c3aed;") {{ new Set(templates.map(t => t.category)).size }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Times Used
      p.text-3xl.font-black.mt-1(style="color: #22c55e;") {{ templates.reduce((s, t) => s + t.usageCount, 0) }}

  .grid.grid-cols-2.gap-4
    .p-6.rounded-2xl.border.transition-all(
      v-for="tmpl in templates"
      :key="tmpl.id"
      style="border-color: var(--border-default); background: var(--bg-elevated);"
      class="hover:shadow-lg hover:border-violet-200"
    )
      .flex.items-center.justify-between.mb-3
        el-tag(size="small" round effect="plain") {{ tmpl.category }}
        span.text-xs.font-mono(style="color: var(--text-muted);") Used {{ tmpl.usageCount }}x
      h3.text-lg.font-bold.mb-1(style="color: var(--text-primary);") {{ tmpl.name }}
      p.text-sm.mb-2.font-semibold(style="color: var(--text-muted);") Subject: {{ tmpl.subject }}
      p.text-xs.line-clamp-3(style="color: var(--text-muted);") {{ tmpl.body }}
      .flex.items-center.gap-2.mt-4
        el-button(size="small" @click="copyTemplate(tmpl)" style="border-radius: 8px;")
          Icon(name="ph:copy" size="14" style="margin-right: 4px;")
          | Copy
        el-button(size="small" type="danger" plain @click="removeTemplate(tmpl.id)" style="border-radius: 8px;")
          Icon(name="ph:trash" size="14")

    //- Empty State
    .p-6.rounded-2xl.border-2.border-dashed.text-center.col-span-2(v-if="templates.length === 0" style="border-color: var(--border-default); color: var(--text-muted);")
      Icon(name="ph:envelope-open" size="48")
      p.text-sm.mt-3 Create your first email template

  el-dialog(v-model="showDialog" title="New Email Template" width="600px")
    el-form(label-position="top" size="large")
      .grid.grid-cols-2.gap-4
        el-form-item(label="Template Name")
          el-input(v-model="form.name" placeholder="Welcome Email")
        el-form-item(label="Category")
          el-select(v-model="form.category" class="w-full")
            el-option(label="Sales" value="Sales")
            el-option(label="Follow-up" value="Follow-up")
            el-option(label="Onboarding" value="Onboarding")
            el-option(label="Invoice" value="Invoice")
            el-option(label="Support" value="Support")
            el-option(label="Marketing" value="Marketing")
            el-option(label="General" value="General")
      el-form-item(label="Subject Line")
        el-input(v-model="form.subject" placeholder="Re: Your {{product}} Inquiry")
      el-form-item(label="Body")
        el-input(v-model="form.body" type="textarea" :rows="8" :placeholder="'Dear {{name}},\\n\\nThank you for your interest...'")
      p.text-xs.mt-1(style="color: var(--text-muted);") Use &#123;&#123;name&#125;&#125;, &#123;&#123;company&#125;&#125;, &#123;&#123;product&#125;&#125; as dynamic placeholders.
    template(#footer)
      el-button(@click="showDialog = false") Cancel
      el-button(type="primary" @click="saveTemplate" style="border-radius: 12px;") Save Template
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
definePageMeta({ layout: 'main', middleware: 'auth' });
interface EmailTemplate { id: string; name: string; category: string; subject: string; body: string; usageCount: number; }
const KEY = 'crm_email_templates';
const templates = ref<EmailTemplate[]>(JSON.parse(localStorage.getItem(KEY) || '[]'));
const showDialog = ref(false);
const form = reactive({ name: '', category: 'Sales', subject: '', body: '' });

function saveTemplate() {
  templates.value.unshift({ ...form, id: `et_${Date.now()}`, usageCount: 0 });
  localStorage.setItem(KEY, JSON.stringify(templates.value));
  Object.assign(form, { name: '', category: 'Sales', subject: '', body: '' });
  showDialog.value = false;
  ElMessage.success('Template created!');
}
function removeTemplate(id: string) { templates.value = templates.value.filter(t => t.id !== id); localStorage.setItem(KEY, JSON.stringify(templates.value)); }
function copyTemplate(tmpl: EmailTemplate) {
  navigator.clipboard.writeText(`Subject: ${tmpl.subject}\n\n${tmpl.body}`);
  tmpl.usageCount++;
  localStorage.setItem(KEY, JSON.stringify(templates.value));
  ElMessage.success('Template copied!');
}
</script>
