<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") {{ $t('meetingNotes.title') || 'Meeting Notes' }}
      p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('meetingNotes.subtitle') || 'Record meeting minutes linked to clients and deals.' }}
    el-button(type="primary" size="default" @click="showDialog = true" style="background: var(--bg-obsidian); border: none; border-radius: 12px;")
      Icon(name="ph:note-pencil" size="16" style="margin-right: 4px;")
      | {{ $t('meetingNotes.new') || 'New Meeting Note' }}

  el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);" v-loading="loading")
    .divide-y(style="border-color: var(--border-default);")
      .flex.items-start.gap-4.px-6.py-5(v-for="note in notes" :key="note.id" class="hover:bg-gray-50/50")
        .w-10.h-10.rounded-xl.flex.items-center.justify-center.flex-shrink-0(style="background: rgba(124, 58, 237, 0.1);")
          Icon(name="ph:notebook" size="20" style="color: #7c3aed;")
        .flex-1.min-w-0
          .flex.items-center.gap-2.mb-1
            h3.text-sm.font-bold(style="color: var(--text-primary);") {{ note.title }}
            el-tag(size="small" round effect="plain") {{ note.type || 'INTERNAL' }}
          p.text-xs.mb-2(style="color: var(--text-muted);")
            | {{ note.creator?.name || '' }} · {{ new Date(note.date || note.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }}
          p.text-sm.line-clamp-3(style="color: var(--text-secondary, var(--text-muted));") {{ note.minutes }}
          .flex.items-center.gap-2.mt-2(v-if="note.actionItems && note.actionItems.length")
            el-tag(v-for="item in note.actionItems.slice(0, 3)" :key="item.task" size="small" effect="plain" round) {{ item.task }}
        el-button(text circle size="small" type="danger" @click="removeNote(note.id)")
          Icon(name="ph:trash" size="14")

    .text-center.py-16(v-if="!loading && notes.length === 0")
      Icon(name="ph:notebook" size="48" style="color: var(--text-muted);")
      p.text-sm.mt-3(style="color: var(--text-muted);") {{ $t('meetingNotes.empty') || 'No meeting notes yet' }}

  el-dialog(v-model="showDialog" :title="$t('meetingNotes.new') || 'New Meeting Note'" width="600px")
    el-form(label-position="top" size="large")
      el-form-item(:label="$t('meetingNotes.meetingTitle') || 'Meeting Title'")
        el-input(v-model="form.title" placeholder="Quarterly Review")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('meetingNotes.type') || 'Type'")
          el-select(v-model="form.type" class="w-full")
            el-option(label="Internal" value="INTERNAL")
            el-option(label="Client Meeting" value="CLIENT")
            el-option(label="Team" value="TEAM")
            el-option(label="Board" value="BOARD")
        el-form-item(:label="$t('meetingNotes.date') || 'Date'")
          el-date-picker(v-model="form.date" type="datetime" class="!w-full")
      el-form-item(:label="$t('meetingNotes.attendees') || 'Attendees'")
        el-input(v-model="form.attendees" placeholder="Names, comma-separated")
      el-form-item(:label="$t('meetingNotes.minutes') || 'Minutes / Notes'")
        el-input(v-model="form.minutes" type="textarea" :rows="6" placeholder="Meeting discussion points...")
      el-form-item(:label="$t('meetingNotes.actionItems') || 'Action Items (one per line)'")
        el-input(v-model="form.actionItemsText" type="textarea" :rows="3" placeholder="Follow up with client\nSend proposal")
    template(#footer)
      el-button(@click="showDialog = false") {{ $t('common.cancel') || 'Cancel' }}
      el-button(type="primary" :loading="saving" @click="saveNote" style="border-radius: 12px;") {{ $t('common.save') || 'Save Note' }}
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';

definePageMeta({});

interface MeetingNoteItem {
  id: string;
  title: string;
  type: string;
  date: string;
  attendees?: string[];
  minutes?: string;
  actionItems?: Array<{ task: string; assignee: string; dueDate: string; completed: boolean }>;
  creator?: { id: number; name: string; email: string };
  createdAt: string;
}

const notes = ref<MeetingNoteItem[]>([]);
const loading = ref(false);
const saving = ref(false);
const showDialog = ref(false);
const form = reactive({
  title: '',
  type: 'CLIENT',
  date: '',
  attendees: '',
  minutes: '',
  actionItemsText: ''
});

onMounted(() => {
  fetchNotes();
});

async function fetchNotes() {
  loading.value = true;
  try {
    const { body, success } = await useApiFetch('meeting-notes?limit=100');
    if (success && body) {
      const data = body as any;
      notes.value = data.docs || [];
    }
  } finally {
    loading.value = false;
  }
}

async function saveNote() {
  saving.value = true;
  try {
    const actionItems = form.actionItemsText
      .split('\n')
      .filter(Boolean)
      .map((task: string) => ({ task, assignee: '', dueDate: '', completed: false }));
    const attendees = form.attendees
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);
    const payload = {
      title: form.title,
      type: form.type,
      date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
      attendees,
      minutes: form.minutes,
      actionItems
    };
    const { success } = await useApiFetch('meeting-notes', 'POST', payload);
    if (success) {
      Object.assign(form, {
        title: '',
        type: 'CLIENT',
        date: '',
        attendees: '',
        minutes: '',
        actionItemsText: ''
      });
      showDialog.value = false;
      ElMessage.success('Meeting note saved!');
      await fetchNotes();
    }
  } finally {
    saving.value = false;
  }
}

async function removeNote(id: string) {
  const { success } = await useApiFetch(`meeting-notes/${id}`, 'DELETE');
  if (success) {
    notes.value = notes.value.filter((n) => n.id !== id);
  }
}
</script>
