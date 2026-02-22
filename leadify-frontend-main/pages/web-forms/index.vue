<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") 🌐 Web Forms
      p.text-sm.mt-1(style="color: var(--text-muted);") Create embeddable forms that capture leads automatically.
    el-button(type="primary" size="default" @click="showDialog = true" style="background: var(--bg-obsidian); border: none; border-radius: 12px;")
      Icon(name="ph:plus" size="16" style="margin-right: 4px;")
      | New Form

  .grid.grid-cols-3.gap-4.mb-8
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Total Forms
      p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ stats.total }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Active
      p.text-3xl.font-black.mt-1(style="color: #22c55e;") {{ stats.active }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Submissions
      p.text-3xl.font-black.mt-1(style="color: #7c3aed;") {{ stats.totalSubmissions }}

  .grid.grid-cols-3.gap-4
    .p-6.rounded-2xl.border.transition-all(
      v-for="form in forms"
      :key="form.id"
      style="border-color: var(--border-default); background: var(--bg-elevated);"
      class="hover:shadow-lg hover:border-violet-200"
    )
      .flex.items-center.justify-between.mb-4
        .flex.items-center.gap-2
          .w-3.h-3.rounded-full(:style="{ backgroundColor: form.isActive ? '#22c55e' : '#ef4444' }")
          span.text-sm.font-bold {{ form.isActive ? 'Active' : 'Inactive' }}
        el-switch(v-model="form.isActive" @change="toggleActive(form.id)" size="small")
      h3.text-lg.font-black.mb-1(style="color: var(--text-primary);") {{ form.name }}
      p.text-xs.mb-3(style="color: var(--text-muted);") {{ form.fields.length }} fields · {{ form.submissions }} submissions
      .flex.items-center.gap-2
        el-button(size="small" @click="copyEmbed(form)" style="border-radius: 8px;")
          Icon(name="ph:code" size="14" style="margin-right: 2px;")
          | Embed
        el-button(size="small" type="danger" plain @click="removeForm(form.id)" style="border-radius: 8px;")
          Icon(name="ph:trash" size="14")

    .p-6.rounded-2xl.border-2.border-dashed.text-center.cursor-pointer.transition-colors(
      v-if="forms.length === 0"
      style="border-color: var(--border-default); color: var(--text-muted);"
    )
      Icon(name="ph:plus-circle" size="40")
      p.text-sm.mt-2 Create your first form

  el-dialog(v-model="showDialog" title="Create Web Form" width="560px")
    el-form(label-position="top" size="large")
      el-form-item(label="Form Name")
        el-input(v-model="newForm.name" placeholder="e.g. Contact Us Form")
      el-form-item(label="Thank You Message")
        el-input(v-model="newForm.thankYouMessage" placeholder="Thank you for your submission!")
      .mb-4
        p.text-sm.font-bold.mb-2 Fields
        .space-y-2
          .flex.items-center.gap-2(v-for="(field, i) in newForm.fields" :key="i")
            el-input(v-model="field.label" placeholder="Field label" size="default")
            el-select(v-model="field.type" size="default" style="width: 120px;")
              el-option(label="Text" value="text")
              el-option(label="Email" value="email")
              el-option(label="Phone" value="phone")
              el-option(label="Textarea" value="textarea")
            el-checkbox(v-model="field.required") Required
            el-button(text circle size="small" @click="newForm.fields.splice(i, 1)")
              Icon(name="ph:x" size="14")
        el-button(text size="small" @click="addField" class="mt-2")
          Icon(name="ph:plus" size="14" style="margin-right: 4px;")
          | Add Field
    template(#footer)
      el-button(@click="showDialog = false") Cancel
      el-button(type="primary" @click="saveForm" style="border-radius: 12px;") Create Form
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useWebForms } from '~/composables/useWebForms';
definePageMeta({});
const { forms, stats, createForm, removeForm, toggleActive } = useWebForms();
const showDialog = ref(false);
const newForm = reactive({
  name: '', thankYouMessage: 'Thank you!', isActive: true,
  fields: [
    { id: '1', label: 'Full Name', type: 'text' as const, required: true },
    { id: '2', label: 'Email', type: 'email' as const, required: true },
    { id: '3', label: 'Phone', type: 'phone' as const, required: false },
    { id: '4', label: 'Message', type: 'textarea' as const, required: false },
  ],
});
function addField() { newForm.fields.push({ id: `f_${Date.now()}`, label: '', type: 'text', required: false }); }
function saveForm() {
  createForm({ name: newForm.name, fields: newForm.fields as any, thankYouMessage: newForm.thankYouMessage, isActive: true });
  showDialog.value = false;
  ElMessage.success('Form created!');
}
function copyEmbed(form: any) {
  navigator.clipboard.writeText(form.embedCode || '');
  ElMessage.success('Embed code copied!');
}
</script>
