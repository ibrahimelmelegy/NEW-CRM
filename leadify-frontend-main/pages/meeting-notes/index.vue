<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") {{ $t('meetingNotes.title') }}
      p.text-sm.mt-1(style="color: var(--text-muted);") {{ $t('meetingNotes.subtitle') }}
    .flex.gap-2
      el-button(size="default" @click="showTemplateDialog = true" style="border-radius: 12px;")
        Icon(name="ph:files" size="16" style="margin-right: 4px;")
        | {{ $t('meetingNotes.templates') }}
      el-button(type="primary" size="default" @click="openNewMeetingDialog" style="background: var(--bg-obsidian); border: none; border-radius: 12px;")
        Icon(name="ph:note-pencil" size="16" style="margin-right: 4px;")
        | {{ $t('meetingNotes.new') }}

  el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);" v-loading="loading")
    .divide-y(style="border-color: var(--border-default);")
      .flex.items-start.gap-4.px-6.py-5(
        v-for="note in notes"
        :key="note.id"
        class="hover:bg-gray-50/50 cursor-pointer"
        @click="viewNote(note)"
      )
        .w-10.h-10.rounded-xl.flex.items-center.justify-center.flex-shrink-0(style="background: rgba(124, 58, 237, 0.1);")
          Icon(name="ph:notebook" size="20" style="color: #7c3aed;")
        .flex-1.min-w-0
          .flex.items-center.gap-2.mb-1
            h3.text-sm.font-bold(style="color: var(--text-primary);") {{ note.title }}
            el-tag(size="small" round effect="plain") {{ $t('meetingNotes.types.' + (note.type || 'INTERNAL')) }}
            el-tag(
              v-if="note.followUps && note.followUps.length > 0"
              size="small"
              type="warning"
              round
              effect="plain"
            )
              Icon(name="ph:bell" size="12" style="margin-right: 2px;")
              | {{ note.followUps.filter((f: any) => f.status !== 'completed').length }} {{ $t('meetingNotes.followUps') }}
          p.text-xs.mb-2(style="color: var(--text-muted);")
            | {{ note.creator?.name || note.user?.name || '' }} · {{ formatDate(note.date || note.meetingDate || note.createdAt) }}
          p.text-sm.line-clamp-3(style="color: var(--text-secondary, var(--text-muted));") {{ note.minutes }}
          .flex.items-center.gap-2.mt-2.flex-wrap
            el-tag(
              v-for="(item, idx) in (note.actionItems || []).slice(0, 3)"
              :key="idx"
              size="small"
              :type="item.completed ? 'success' : 'info'"
              effect="plain"
              round
            )
              Icon(:name="item.completed ? 'ph:check-circle' : 'ph:circle'" size="12" style="margin-right: 2px;")
              | {{ item.task }}
            span.text-xs.text-gray-400(v-if="note.actionItems && note.actionItems.length > 3")
              | +{{ note.actionItems.length - 3 }} {{ $t('common.more') }}
          .flex.items-center.gap-2.mt-2(v-if="note.attachments && note.attachments.length > 0")
            Icon(name="ph:paperclip" size="14" style="color: var(--text-muted);")
            span.text-xs(style="color: var(--text-muted);") {{ note.attachments.length }} {{ $t('meetingNotes.attachments') }}
        .flex.gap-1
          el-button(text circle size="small" type="primary" @click.stop="editNote(note)")
            Icon(name="ph:pencil" size="14")
          el-button(text circle size="small" type="danger" @click.stop="removeNote(note.id)")
            Icon(name="ph:trash" size="14")

    .text-center.py-16(v-if="!loading && notes.length === 0")
      Icon(name="ph:notebook" size="48" style="color: var(--text-muted);")
      p.text-sm.mt-3(style="color: var(--text-muted);") {{ $t('meetingNotes.empty') }}

  //- New/Edit Meeting Note Dialog
  el-dialog(v-model="showDialog" :title="dialogTitle" width="800px")
    el-form(label-position="top" size="large")
      el-form-item(:label="$t('meetingNotes.meetingTitle')")
        el-input(v-model="form.title" :placeholder="$t('meetingNotes.titlePlaceholder')")
      .grid.grid-cols-2.gap-4
        el-form-item(:label="$t('meetingNotes.type')")
          el-select(v-model="form.meetingType" class="w-full")
            el-option(:label="$t('meetingNotes.types.INTERNAL')" value="INTERNAL")
            el-option(:label="$t('meetingNotes.types.CLIENT')" value="CLIENT")
            el-option(:label="$t('meetingNotes.types.TEAM')" value="TEAM")
            el-option(:label="$t('meetingNotes.types.BOARD')" value="BOARD")
            el-option(:label="$t('meetingNotes.types.SALES_CALL')" value="SALES_CALL")
            el-option(:label="$t('meetingNotes.types.SPRINT_REVIEW')" value="SPRINT_REVIEW")
            el-option(:label="$t('meetingNotes.types.CLIENT_ONBOARDING')" value="CLIENT_ONBOARDING")
            el-option(:label="$t('meetingNotes.types.ONE_ON_ONE')" value="ONE_ON_ONE")
            el-option(:label="$t('meetingNotes.types.STANDUP')" value="STANDUP")
        el-form-item(:label="$t('meetingNotes.date')")
          el-date-picker(v-model="form.meetingDate" type="datetime" class="!w-full" :placeholder="$t('meetingNotes.selectDate')")
      el-form-item(:label="$t('meetingNotes.participants')")
        el-select(
          v-model="form.attendees"
          multiple
          filterable
          remote
          :remote-method="searchParticipants"
          :loading="searchingParticipants"
          class="w-full"
          :placeholder="$t('meetingNotes.searchParticipants')"
        )
          el-option(
            v-for="p in participantOptions"
            :key="p.id"
            :label="participantLabel(p)"
            :value="p.id"
          )
            .flex.items-center.gap-2
              Icon(name="ph:user" size="16")
              div
                p.text-sm {{ p.name }}
                p.text-xs.text-gray-400 {{ p.email }}
      el-form-item(:label="$t('meetingNotes.minutes')")
        el-input(
          v-model="form.minutes"
          type="textarea"
          :rows="6"
          :placeholder="$t('meetingNotes.minutesPlaceholder')"
        )
      el-form-item(:label="$t('meetingNotes.actionItems')")
        .space-y-2
          .flex.items-start.gap-2(v-for="(item, idx) in form.actionItems" :key="idx")
            el-input(
              v-model="item.task"
              :placeholder="$t('meetingNotes.actionItemPlaceholder')"
              style="flex: 1;"
            )
            el-select(
              v-model="item.assigneeId"
              filterable
              remote
              :remote-method="searchParticipants"
              :loading="searchingParticipants"
              :placeholder="$t('meetingNotes.assignee')"
              style="width: 150px;"
              clearable
            )
              el-option(
                v-for="p in participantOptions"
                :key="p.id"
                :label="p.name"
                :value="p.id"
              )
            el-date-picker(
              v-model="item.dueDate"
              type="date"
              :placeholder="$t('meetingNotes.dueDate')"
              style="width: 150px;"
            )
            el-button(text circle type="danger" @click="removeActionItem(idx)")
              Icon(name="ph:trash" size="14")
          el-button(size="small" @click="addActionItem")
            Icon(name="ph:plus" size="14" style="margin-right: 4px;")
            | {{ $t('meetingNotes.addActionItem') }}
      el-form-item(:label="$t('meetingNotes.attachments')")
        .space-y-2
          .flex.items-center.gap-2(v-for="(att, idx) in form.attachments" :key="idx")
            el-input(v-model="att.name" :placeholder="$t('meetingNotes.attachmentName')" style="width: 200px;")
            el-input(v-model="att.url" :placeholder="$t('meetingNotes.attachmentUrl')" style="flex: 1;")
            el-button(text circle type="danger" @click="removeAttachment(idx)")
              Icon(name="ph:trash" size="14")
          el-button(size="small" @click="addAttachment")
            Icon(name="ph:paperclip" size="14" style="margin-right: 4px;")
            | {{ $t('meetingNotes.addAttachment') }}
      el-form-item(:label="$t('meetingNotes.calendarEventId')")
        el-input(v-model="form.calendarEventId" :placeholder="$t('meetingNotes.calendarPlaceholder')")
    template(#footer)
      el-button(@click="showDialog = false") {{ $t('common.cancel') }}
      el-button(type="primary" :loading="saving" @click="saveNote" style="border-radius: 12px;") {{ $t('common.save') }}

  //- View Note Dialog
  el-dialog(v-model="showViewDialog" :title="viewingNote?.title || ''" width="900px")
    div(v-if="viewingNote")
      .grid.grid-cols-2.gap-4.mb-4
        div
          p.text-xs.text-gray-500.mb-1 {{ $t('meetingNotes.type') }}
          el-tag(size="small" round) {{ $t('meetingNotes.types.' + (viewingNote.type || viewingNote.meetingType || 'INTERNAL')) }}
        div
          p.text-xs.text-gray-500.mb-1 {{ $t('meetingNotes.date') }}
          p.text-sm {{ formatDate(viewingNote.date || viewingNote.meetingDate || viewingNote.createdAt) }}
        div(v-if="viewingNote.calendarEventId")
          p.text-xs.text-gray-500.mb-1 {{ $t('meetingNotes.calendarEvent') }}
          p.text-sm.font-mono.text-xs {{ viewingNote.calendarEventId }}

      div(v-if="viewingNote.attendees && viewingNote.attendees.length > 0" class="mb-4")
        p.text-xs.text-gray-500.mb-2 {{ $t('meetingNotes.participants') }}
        .flex.flex-wrap.gap-2
          el-tag(v-for="att in viewingNote.attendees" :key="att.id || att.name" size="small" effect="plain")
            Icon(name="ph:user" size="12" style="margin-right: 4px;")
            | {{ att.name }}

      div(class="mb-4")
        p.text-xs.text-gray-500.mb-2 {{ $t('meetingNotes.minutes') }}
        .p-4.rounded-xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
          p.text-sm.whitespace-pre-wrap {{ viewingNote.minutes }}

      div(v-if="viewingNote.actionItems && viewingNote.actionItems.length > 0" class="mb-4")
        p.text-xs.text-gray-500.mb-2 {{ $t('meetingNotes.actionItems') }}
        .space-y-2
          .flex.items-center.gap-3.p-3.rounded-xl.border(
            v-for="(item, idx) in viewingNote.actionItems"
            :key="idx"
            style="border-color: var(--border-default); background: var(--bg-elevated);"
          )
            el-checkbox(
              v-model="item.completed"
              @change="toggleActionItem(viewingNote.id, idx, item)"
              size="large"
            )
            .flex-1
              p.text-sm(:class="{ 'line-through text-gray-400': item.completed }") {{ item.task }}
              p.text-xs.text-gray-400(v-if="item.assigneeName || item.dueDate")
                span(v-if="item.assigneeName")
                  Icon(name="ph:user" size="12" style="margin-right: 2px;")
                  | {{ item.assigneeName }}
                span(v-if="item.dueDate" class="ml-2")
                  Icon(name="ph:calendar" size="12" style="margin-right: 2px;")
                  | {{ formatDate(item.dueDate) }}

      div(v-if="viewingNote.attachments && viewingNote.attachments.length > 0" class="mb-4")
        p.text-xs.text-gray-500.mb-2 {{ $t('meetingNotes.attachments') }}
        .space-y-2
          a.flex.items-center.gap-2.p-3.rounded-xl.border.cursor-pointer(
            v-for="(att, idx) in viewingNote.attachments"
            :key="idx"
            :href="att.url"
            target="_blank"
            style="border-color: var(--border-default); background: var(--bg-elevated);"
            class="hover:bg-gray-50"
          )
            Icon(name="ph:file" size="20" style="color: #7c3aed;")
            div
              p.text-sm.font-medium {{ att.name }}
              p.text-xs.text-gray-400 {{ formatFileSize(att.size) }}

      div(v-if="viewingNote.followUps && viewingNote.followUps.length > 0")
        p.text-xs.text-gray-500.mb-2 {{ $t('meetingNotes.followUps') }}
        .space-y-2
          .flex.items-center.gap-3.p-3.rounded-xl.border(
            v-for="(followUp, idx) in viewingNote.followUps"
            :key="idx"
            style="border-color: var(--border-default); background: var(--bg-elevated);"
          )
            Icon(name="ph:bell" size="16" style="color: #f59e0b;")
            .flex-1
              p.text-sm {{ followUp.description }}
              p.text-xs.text-gray-400
                Icon(name="ph:calendar" size="12" style="margin-right: 2px;")
                | {{ formatDate(followUp.dueDate) }}
            el-tag(:type="followUp.status === 'completed' ? 'success' : 'warning'" size="small" round)
              | {{ $t('meetingNotes.followUpStatus.' + followUp.status) }}
    template(#footer)
      el-button(@click="showViewDialog = false") {{ $t('common.close') }}
      el-button(type="primary" @click="editNote(viewingNote)") {{ $t('common.edit') }}

  //- Templates Dialog
  el-dialog(v-model="showTemplateDialog" :title="$t('meetingNotes.templates')" width="600px")
    .space-y-2
      .p-4.rounded-xl.border.cursor-pointer(
        v-for="template in templates"
        :key="template.id"
        @click="applyTemplate(template)"
        style="border-color: var(--border-default); background: var(--bg-elevated);"
        class="hover:bg-gray-50"
      )
        .flex.items-center.gap-3
          Icon(name="ph:files" size="24" style="color: #7c3aed;")
          div
            p.text-sm.font-bold {{ template.name }}
            p.text-xs.text-gray-500 {{ template.description }}
    template(#footer)
      el-button(@click="showTemplateDialog = false") {{ $t('common.close') }}
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';

definePageMeta({});

const { t: $t } = useI18n();

interface MeetingNoteItem {
  id: string;
  title: string;
  type?: string;
  meetingType?: string;
  date?: string;
  meetingDate?: string;
  attendees?: Array<{ id?: number; name: string; email?: string; type: string }>;
  minutes?: string;
  actionItems?: Array<{
    task: string;
    assigneeId?: number;
    assigneeName?: string;
    dueDate?: string;
    completed: boolean;
    linkedTaskId?: number;
  }>;
  attachments?: Array<{ name: string; url: string; type: string; size: number }>;
  calendarEventId?: string;
  followUps?: Array<{ description: string; dueDate: string; status: string; reminderId?: number }>;
  creator?: { id: number; name: string; email: string };
  user?: { id: number; name: string; email: string };
  createdAt: string;
}

const notes = ref<MeetingNoteItem[]>([]);
const loading = ref(false);
const saving = ref(false);
const showDialog = ref(false);
const showViewDialog = ref(false);
const showTemplateDialog = ref(false);
const viewingNote = ref<MeetingNoteItem | null>(null);
const editingNoteId = ref<string | null>(null);
const searchingParticipants = ref(false);
const participantOptions = ref<Array<{ id: number; name: string; email: string; type: string }>>([]);

const form = reactive<{
  title: string;
  meetingType: string;
  meetingDate: Date | string | null;
  attendees: number[];
  minutes: string;
  actionItems: Array<{
    task: string;
    assigneeId?: number;
    assigneeName?: string;
    dueDate?: Date | string | null;
    completed: boolean;
  }>;
  attachments: Array<{ name: string; url: string; type: string; size: number }>;
  calendarEventId: string;
}>({
  title: '',
  meetingType: 'CLIENT',
  meetingDate: null,
  attendees: [],
  minutes: '',
  actionItems: [],
  attachments: [],
  calendarEventId: ''
});

const templates = [
  {
    id: 'sales-call',
    name: 'Sales Call',
    description: 'Template for client sales calls',
    meetingType: 'SALES_CALL',
    actionItems: ['Send proposal', 'Schedule follow-up', 'Update CRM']
  },
  {
    id: 'sprint-review',
    name: 'Sprint Review',
    description: 'Agile sprint review meeting',
    meetingType: 'SPRINT_REVIEW',
    actionItems: ['Demo completed stories', 'Gather feedback', 'Plan next sprint']
  },
  {
    id: 'client-onboarding',
    name: 'Client Onboarding',
    description: 'New client onboarding meeting',
    meetingType: 'CLIENT_ONBOARDING',
    actionItems: ['Collect requirements', 'Setup accounts', 'Schedule training']
  },
  {
    id: 'one-on-one',
    name: 'One-on-One',
    description: 'Manager-employee 1:1 meeting',
    meetingType: 'ONE_ON_ONE',
    actionItems: ['Discuss goals', 'Address concerns', 'Set action items']
  }
];

const dialogTitle = computed(() =>
  editingNoteId.value ? $t('meetingNotes.edit') : $t('meetingNotes.new')
);

onMounted(() => {
  fetchNotes();
});

async function fetchNotes() {
  loading.value = true;
  try {
    const { body, success } = await useApiFetch('communications/meeting-notes?limit=100');
    if (success && body) {
      const data = body as any;
      notes.value = data.docs || [];
    }
  } finally {
    loading.value = false;
  }
}

async function searchParticipants(query: string) {
  if (!query || query.length < 2) return;
  searchingParticipants.value = true;
  try {
    const { body, success } = await useApiFetch(
      `communications/participants/search?search=${encodeURIComponent(query)}&limit=10`
    );
    if (success && body) {
      participantOptions.value = body as any[];
    }
  } finally {
    searchingParticipants.value = false;
  }
}

function participantLabel(p: any): string {
  return `${p.name} (${p.email})`;
}

function openNewMeetingDialog() {
  editingNoteId.value = null;
  Object.assign(form, {
    title: '',
    meetingType: 'CLIENT',
    meetingDate: null,
    attendees: [],
    minutes: '',
    actionItems: [],
    attachments: [],
    calendarEventId: ''
  });
  showDialog.value = true;
}

function addActionItem() {
  form.actionItems.push({
    task: '',
    assigneeId: undefined,
    assigneeName: '',
    dueDate: null,
    completed: false
  });
}

function removeActionItem(idx: number) {
  form.actionItems.splice(idx, 1);
}

function addAttachment() {
  form.attachments.push({ name: '', url: '', type: 'document', size: 0 });
}

function removeAttachment(idx: number) {
  form.attachments.splice(idx, 1);
}

async function saveNote() {
  saving.value = true;
  try {
    // Map attendees from IDs to full objects
    const attendees = form.attendees.map(id => {
      const participant = participantOptions.value.find(p => p.id === id);
      return participant
        ? { id: participant.id, name: participant.name, email: participant.email, type: participant.type }
        : { id, name: 'Unknown', email: '', type: 'STAFF' };
    });

    // Map action items with assignee names
    const actionItems = form.actionItems.map(item => {
      const assignee = participantOptions.value.find(p => p.id === item.assigneeId);
      return {
        task: item.task,
        assigneeId: item.assigneeId,
        assigneeName: assignee?.name || item.assigneeName,
        dueDate: item.dueDate ? new Date(item.dueDate).toISOString() : undefined,
        completed: item.completed
      };
    });

    const payload = {
      title: form.title,
      meetingType: form.meetingType,
      meetingDate: form.meetingDate ? new Date(form.meetingDate).toISOString() : undefined,
      attendees,
      minutes: form.minutes,
      actionItems,
      attachments: form.attachments.filter(a => a.name && a.url),
      calendarEventId: form.calendarEventId || undefined
    };

    let success;
    if (editingNoteId.value) {
      const result = await useApiFetch(
        `communications/meeting-notes/${editingNoteId.value}`,
        'PUT',
        payload
      );
      success = result.success;
    } else {
      const result = await useApiFetch('communications/meeting-notes', 'POST', payload);
      success = result.success;
    }

    if (success) {
      showDialog.value = false;
      ElMessage.success($t('meetingNotes.saved'));
      await fetchNotes();
    }
  } finally {
    saving.value = false;
  }
}

async function removeNote(id: string) {
  if (!confirm($t('meetingNotes.confirmDelete'))) return;
  const { success } = await useApiFetch(`communications/meeting-notes/${id}`, 'DELETE');
  if (success) {
    notes.value = notes.value.filter((n) => n.id !== id);
    ElMessage.success($t('meetingNotes.deleted'));
  }
}

function viewNote(note: MeetingNoteItem) {
  viewingNote.value = note;
  showViewDialog.value = true;
}

function editNote(note: any) {
  editingNoteId.value = note.id;
  Object.assign(form, {
    title: note.title,
    meetingType: note.type || note.meetingType || 'CLIENT',
    meetingDate: note.date || note.meetingDate ? new Date(note.date || note.meetingDate) : null,
    attendees: (note.attendees || []).map((a: any) => a.id).filter(Boolean),
    minutes: note.minutes || '',
    actionItems: (note.actionItems || []).map((item: any) => ({
      task: item.task,
      assigneeId: item.assigneeId,
      assigneeName: item.assigneeName,
      dueDate: item.dueDate ? new Date(item.dueDate) : null,
      completed: item.completed
    })),
    attachments: note.attachments || [],
    calendarEventId: note.calendarEventId || ''
  });
  // Populate participant options with note attendees
  if (note.attendees) {
    participantOptions.value = note.attendees;
  }
  showViewDialog.value = false;
  showDialog.value = true;
}

async function toggleActionItem(noteId: string, idx: number, item: any) {
  const note = notes.value.find(n => n.id === noteId);
  if (!note) return;

  const updatedActionItems = [...(note.actionItems || [])];
  updatedActionItems[idx] = { ...item };

  const { success } = await useApiFetch(`communications/meeting-notes/${noteId}`, 'PUT', {
    actionItems: updatedActionItems
  });

  if (success) {
    await fetchNotes();
  }
}

function applyTemplate(template: any) {
  form.meetingType = template.meetingType;
  form.actionItems = template.actionItems.map((task: string) => ({
    task,
    assigneeId: undefined,
    assigneeName: '',
    dueDate: null,
    completed: false
  }));
  showTemplateDialog.value = false;
  showDialog.value = true;
}

function formatDate(date: string | Date | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
</script>
