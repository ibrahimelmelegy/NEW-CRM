<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") 📝 Meeting Notes
      p.text-sm.mt-1(style="color: var(--text-muted);") Record meeting minutes linked to clients and deals.
    el-button(type="primary" size="default" @click="showDialog = true" style="background: var(--bg-obsidian); border: none; border-radius: 12px;")
      Icon(name="ph:note-pencil" size="16" style="margin-right: 4px;")
      | New Meeting Note

  el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
    .divide-y(style="border-color: var(--border-default);")
      .flex.items-start.gap-4.px-6.py-5(v-for="note in notes" :key="note.id" class="hover:bg-gray-50/50")
        .w-10.h-10.rounded-xl.flex.items-center.justify-center.flex-shrink-0(style="background: rgba(124, 58, 237, 0.1);")
          Icon(name="ph:notebook" size="20" style="color: #7c3aed;")
        .flex-1.min-w-0
          .flex.items-center.gap-2.mb-1
            h3.text-sm.font-bold(style="color: var(--text-primary);") {{ note.title }}
            el-tag(size="small" round effect="plain") {{ note.meetingType }}
          p.text-xs.mb-2(style="color: var(--text-muted);")
            | 👥 {{ note.attendees }} · 📅 {{ new Date(note.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }}
          p.text-sm.line-clamp-3(style="color: var(--text-secondary, var(--text-muted));") {{ note.minutes }}
          .flex.items-center.gap-2.mt-2(v-if="note.actionItems.length")
            el-tag(v-for="item in note.actionItems.slice(0, 3)" :key="item" size="small" effect="plain" round) ✅ {{ item }}
        el-button(text circle size="small" type="danger" @click="removeNote(note.id)")
          Icon(name="ph:trash" size="14")

    .text-center.py-16(v-if="notes.length === 0")
      Icon(name="ph:notebook" size="48" style="color: var(--text-muted);")
      p.text-sm.mt-3(style="color: var(--text-muted);") No meeting notes yet

  el-dialog(v-model="showDialog" title="New Meeting Note" width="600px")
    el-form(label-position="top" size="large")
      el-form-item(label="Meeting Title")
        el-input(v-model="form.title" placeholder="Quarterly Review")
      .grid.grid-cols-2.gap-4
        el-form-item(label="Type")
          el-select(v-model="form.meetingType" class="w-full")
            el-option(label="Internal" value="Internal")
            el-option(label="Client Meeting" value="Client")
            el-option(label="Sales Call" value="Sales")
            el-option(label="Project Review" value="Review")
            el-option(label="Workshop" value="Workshop")
        el-form-item(label="Date")
          el-date-picker(v-model="form.date" type="datetime" class="!w-full")
      el-form-item(label="Attendees")
        el-input(v-model="form.attendees" placeholder="Names, comma-separated")
      el-form-item(label="Minutes / Notes")
        el-input(v-model="form.minutes" type="textarea" :rows="6" placeholder="Meeting discussion points...")
      el-form-item(label="Action Items (one per line)")
        el-input(v-model="form.actionItemsText" type="textarea" :rows="3" placeholder="Follow up with client\nSend proposal")
    template(#footer)
      el-button(@click="showDialog = false") Cancel
      el-button(type="primary" @click="saveNote" style="border-radius: 12px;") Save Note
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
definePageMeta({});
interface MeetingNote {
  id: string;
  title: string;
  meetingType: string;
  date: string;
  attendees: string;
  minutes: string;
  actionItems: string[];
}
const KEY = 'crm_meeting_notes';
const notes = ref<MeetingNote[]>(JSON.parse(localStorage.getItem(KEY) || '[]'));
const showDialog = ref(false);
const form = reactive({ title: '', meetingType: 'Client', date: '', attendees: '', minutes: '', actionItemsText: '' });

function saveNote() {
  notes.value.unshift({
    ...form,
    id: `mn_${Date.now()}`,
    date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
    actionItems: form.actionItemsText.split('\n').filter(Boolean)
  });
  localStorage.setItem(KEY, JSON.stringify(notes.value));
  Object.assign(form, { title: '', meetingType: 'Client', date: '', attendees: '', minutes: '', actionItemsText: '' });
  showDialog.value = false;
  ElMessage.success('Meeting note saved!');
}
function removeNote(id: string) {
  notes.value = notes.value.filter(n => n.id !== id);
  localStorage.setItem(KEY, JSON.stringify(notes.value));
}
</script>
