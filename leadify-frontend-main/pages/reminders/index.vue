<template lang="pug">
.p-6.animate-entrance
  //- Header
  .flex.items-center.justify-between.mb-8
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") ⏰ Reminders & Follow-ups
      p.text-sm.mt-1(style="color: var(--text-muted);") Never miss a deadline or follow-up again.
    el-button(type="primary" size="default" @click="showCreateDialog = true" style="background: var(--bg-obsidian); border: none; border-radius: 12px;")
      Icon(name="ph:plus" size="16" style="margin-right: 4px;")
      | New Reminder

  //- Stats
  .grid.grid-cols-4.gap-4.mb-8
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Pending
      p.text-3xl.font-black.mt-1(style="color: #f59e0b;") {{ stats.pending }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Overdue
      p.text-3xl.font-black.mt-1(style="color: #ef4444;") {{ stats.overdue }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Today
      p.text-3xl.font-black.mt-1(style="color: #22c55e;") {{ stats.todayCount }}
    .p-5.rounded-2xl.border(style="border-color: var(--border-default); background: var(--bg-elevated);")
      p.text-xs.font-bold.uppercase.tracking-widest(style="color: var(--text-muted);") Completed
      p.text-3xl.font-black.mt-1(style="color: var(--text-primary);") {{ stats.completedCount }}

  //- Tabs
  .flex.gap-3.mb-6
    el-button(:type="activeTab === 'upcoming' ? 'primary' : 'default'" round @click="activeTab = 'upcoming'") Upcoming ({{ upcoming.length }})
    el-button(:type="activeTab === 'overdue' ? 'primary' : 'default'" round @click="activeTab = 'overdue'" :class="{ '!text-red-500': overdue.length > 0 }") 🔴 Overdue ({{ overdue.length }})
    el-button(:type="activeTab === 'completed' ? 'primary' : 'default'" round @click="activeTab = 'completed'") Completed ({{ completed.length }})

  //- List
  el-card.rounded-2xl(shadow="never" style="border: 1px solid var(--border-default);")
    .divide-y(style="border-color: var(--border-default);")
      .flex.items-center.gap-4.px-6.py-5.transition-colors(
        v-for="rem in displayedReminders"
        :key="rem.id"
        :class="{ 'opacity-50': rem.completed }"
        class="hover:bg-gray-50/50"
      )
        //- Priority indicator
        .w-1.h-12.rounded-full.flex-shrink-0(:style="{ backgroundColor: priorityColor(rem.priority) }")
        //- Checkbox
        el-checkbox(:model-value="rem.completed" @change="toggleComplete(rem)" size="large")
        //- Content
        .flex-1.min-w-0
          .flex.items-center.gap-2
            p.text-sm.font-bold(:class="{ 'line-through': rem.completed }" style="color: var(--text-primary);") {{ rem.title }}
            el-tag(size="small" round effect="plain") {{ rem.type.replace('_', ' ') }}
            el-tag(size="small" round :type="priorityTagType(rem.priority)") {{ rem.priority }}
          p.text-xs.mt-1(style="color: var(--text-muted);") {{ rem.description }}
          p.text-xs.mt-1.font-mono(v-if="rem.relatedTo" style="color: #7c3aed;") 🔗 {{ rem.relatedTo.label }}
        //- Due date
        .text-right.flex-shrink-0
          p.text-sm.font-bold(:style="{ color: isOverdue(rem) ? '#ef4444' : 'var(--text-primary)' }") {{ formatDate(rem.dueDate) }}
          p.text-xs(style="color: var(--text-muted);") {{ timeLeft(rem.dueDate) }}
        //- Actions
        el-button(text circle size="small" @click="removeReminder(rem.id)" type="danger")
          Icon(name="ph:trash" size="14")

    .text-center.py-16(v-if="displayedReminders.length === 0")
      Icon(name="ph:clock" size="48" style="color: var(--text-muted);")
      p.text-sm.mt-3(style="color: var(--text-muted);") No reminders in this category

  //- Create Dialog
  el-dialog(v-model="showCreateDialog" title="New Reminder" width="500px")
    el-form(label-position="top" size="large")
      el-form-item(label="Title")
        el-input(v-model="form.title" placeholder="e.g. Follow up with client")
      el-form-item(label="Description")
        el-input(v-model="form.description" type="textarea" :rows="2" placeholder="Details...")
      .grid.grid-cols-2.gap-4
        el-form-item(label="Type")
          el-select(v-model="form.type" class="w-full")
            el-option(label="Follow Up" value="follow_up")
            el-option(label="Payment" value="payment")
            el-option(label="Deadline" value="deadline")
            el-option(label="Meeting" value="meeting")
            el-option(label="Custom" value="custom")
        el-form-item(label="Priority")
          el-select(v-model="form.priority" class="w-full")
            el-option(label="Low" value="low")
            el-option(label="Medium" value="medium")
            el-option(label="High" value="high")
            el-option(label="Urgent" value="urgent")
      el-form-item(label="Due Date")
        el-date-picker(v-model="form.dueDate" type="datetime" class="!w-full" placeholder="Select date & time")
    template(#footer)
      el-button(@click="showCreateDialog = false") Cancel
      el-button(type="primary" @click="createReminder" style="border-radius: 12px;") Create Reminder
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { useReminders } from '~/composables/useReminders';

definePageMeta({});
const { t } = useI18n();

const { upcoming, overdue, completed, stats, addReminder, completeReminder, removeReminder } = useReminders();

const activeTab = ref('upcoming');
const showCreateDialog = ref(false);
const form = reactive({
  title: '',
  description: '',
  type: 'follow_up' as const,
  priority: 'medium' as const,
  dueDate: ''
});

const displayedReminders = computed(() => {
  if (activeTab.value === 'overdue') return overdue.value;
  if (activeTab.value === 'completed') return completed.value;
  return upcoming.value;
});

function toggleComplete(rem: any) {
  if (!rem.completed) completeReminder(rem.id);
}

function createReminder() {
  if (!form.title || !form.dueDate) return;
  addReminder({
    title: form.title,
    description: form.description,
    type: form.type as any,
    priority: form.priority as any,
    dueDate: new Date(form.dueDate).toISOString()
  });
  Object.assign(form, { title: '', description: '', type: 'follow_up', priority: 'medium', dueDate: '' });
  showCreateDialog.value = false;
  ElMessage.success(t('reminders.reminderCreated'));
}

function isOverdue(rem: any): boolean {
  return !rem.completed && rem.dueDate < new Date().toISOString();
}

function priorityColor(p: string): string {
  const map: Record<string, string> = { low: '#22c55e', medium: '#f59e0b', high: '#f97316', urgent: '#ef4444' };
  return map[p] || '#6b7280';
}

function priorityTagType(p: string): '' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = { low: 'success', medium: 'warning', high: 'danger', urgent: 'danger' };
  return map[p] || 'info';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function timeLeft(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return `${Math.abs(Math.ceil(diff / 86400000))}d overdue`;
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d left`;
  const hrs = Math.floor(diff / 3600000);
  return `${hrs}h left`;
}
</script>
