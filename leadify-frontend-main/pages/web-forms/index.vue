<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") {{ $t('webForms.title') || 'Web Forms' }}
      p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('webForms.subtitle') || 'Create embeddable forms that capture leads automatically.' }}
    el-button(type="primary" size="default" @click="showDialog = true" style="background: var(--bg-obsidian); border: none; border-radius: 12px;")
      Icon(name="ph:plus" size="16" style="margin-right: 4px;")
      | {{ $t('webForms.newForm') || 'New Form' }}

  .grid.grid-cols-3.gap-4.mb-8
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('webForms.totalForms') || 'Total Forms' }}
      p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ stats.total }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('webForms.active') || 'Active' }}
      p.text-3xl.font-black.mt-1(style="color: #22c55e;") {{ stats.active }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") {{ $t('webForms.submissions') || 'Submissions' }}
      p.text-3xl.font-black.mt-1(style="color: #7c3aed;") {{ stats.totalSubmissions }}

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
          span.text-sm.font-bold {{ form.status === 'ACTIVE' ? 'Active' : 'Inactive' }}
        el-switch(:model-value="form.status === 'ACTIVE'" @change="toggleActive(form.id)" size="small")
      h3.text-lg.font-black.mb-1(style="color: var(--text-primary);") {{ form.name }}
      p.text-xs.mb-3(style="color: var(--text-muted);") {{ (form.fields || []).length }} fields · {{ form.submissionCount || 0 }} submissions
      .flex.items-center.gap-2
        el-button(size="small" @click="copyEmbed(form)" style="border-radius: 8px;")
          Icon(name="ph:code" size="14" style="margin-right: 2px;")
          | Embed
        el-button(size="small" type="danger" plain @click="removeForm(form.id)" style="border-radius: 8px;")
          Icon(name="ph:trash" size="14")

    .p-6.rounded-2xl.border-2.border-dashed.text-center.cursor-pointer.transition-colors(
      v-if="!formLoading && forms.length === 0"
      style="border-color: var(--border-default); color: var(--text-muted);"
      @click="showDialog = true"
    )
      Icon(name="ph:plus-circle" size="40")
      p.text-sm.mt-2 {{ $t('webForms.createFirst') || 'Create your first form' }}

  el-dialog(v-model="showDialog" :title="$t('webForms.createForm') || 'Create Web Form'" width="560px")
    el-form(label-position="top" size="large")
      el-form-item(:label="$t('webForms.formName') || 'Form Name'")
        el-input(v-model="newForm.name" placeholder="e.g. Contact Us Form")
      el-form-item(:label="$t('webForms.thankYou') || 'Thank You Message'")
        el-input(v-model="newForm.thankYouMessage" placeholder="Thank you for your submission!")
      .mb-4
        p.text-sm.font-bold.mb-2 {{ $t('webForms.fields') || 'Fields' }}
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
          | {{ $t('webForms.addField') || 'Add Field' }}
    template(#footer)
      el-button(@click="showDialog = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="primary" :loading="saving" @click="saveForm" style="border-radius: 12px;") {{ $t('common.create') || 'Create Form' }}
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useWebForms } from '~/composables/useWebForms';

definePageMeta({});

const { forms, stats, fetchForms, createForm, removeForm, toggleActive, loading: formLoading } = useWebForms();
const showDialog = ref(false);
const saving = ref(false);
const newForm = reactive({
  name: '',
  thankYouMessage: 'Thank you!',
  fields: [
    { name: 'fullName', label: 'Full Name', type: 'text' as const, required: true },
    { name: 'email', label: 'Email', type: 'email' as const, required: true },
    { name: 'phone', label: 'Phone', type: 'phone' as const, required: false },
    { name: 'message', label: 'Message', type: 'textarea' as const, required: false }
  ]
});

onMounted(() => {
  fetchForms();
});

function addField() {
  newForm.fields.push({
    name: `field_${Date.now()}`,
    label: '',
    type: 'text',
    required: false
  });
}

async function saveForm() {
  saving.value = true;
  try {
    const success = await createForm({
      name: newForm.name,
      fields: newForm.fields,
      thankYouMessage: newForm.thankYouMessage
    });
    if (success) {
      showDialog.value = false;
      ElMessage.success('Form created!');
    }
  } finally {
    saving.value = false;
  }
}

function copyEmbed(form: any) {
  const embedCode = `<iframe src="${window.location.origin}/portal/form/${form.id}" width="100%" height="600" frameborder="0"></iframe>`;
  navigator.clipboard.writeText(embedCode);
  ElMessage.success('Embed code copied!');
}
</script>
