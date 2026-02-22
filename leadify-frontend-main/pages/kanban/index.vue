<template lang="pug">
.p-6.animate-entrance
  .flex.items-center.justify-between.mb-6
    div
      h1.text-3xl.font-black.tracking-tight(style="color: var(--text-primary);") 📋 Kanban Board
      p.text-sm.mt-1(style="color: var(--text-muted);") Drag & drop your deals and tasks across stages.
    el-button(type="primary" size="default" @click="addCard" style="background: var(--bg-obsidian); border: none; border-radius: 12px;")
      Icon(name="ph:plus" size="16" style="margin-right: 4px;")
      | Add Card

  //- Kanban Columns
  .flex.gap-5.overflow-x-auto.pb-6(style="min-height: 70vh;")
    .flex-shrink-0.w-80(v-for="col in columns" :key="col.id")
      //- Column Header
      .flex.items-center.justify-between.px-4.py-3.rounded-t-2xl(:style="{ background: col.color + '15', borderBottom: `3px solid ${col.color}` }")
        .flex.items-center.gap-2
          .w-3.h-3.rounded-full(:style="{ backgroundColor: col.color }")
          span.font-bold.text-sm {{ col.title }}
        el-badge(:value="getColumnCards(col.id).length" type="info")

      //- Cards Container
      div(class="space-y-3 p-3 rounded-b-2xl min-h-[200px]" style="background: var(--bg-elevated); border: 1px solid var(--border-default); border-top: none;")
        .p-4.rounded-xl.border.cursor-grab.transition-all(
          v-for="card in getColumnCards(col.id)"
          :key="card.id"
          style="background: white; border-color: var(--border-default);"
          class="hover:shadow-md hover:border-violet-200"
          draggable="true"
          @dragstart="dragStart(card)"
          @dragend="dragEnd"
        )
          .flex.items-center.justify-between.mb-2
            span.text-xs.font-mono.font-bold(style="color: var(--text-muted);") {{ card.ref }}
            el-tag(size="small" round :type="priorityTag(card.priority)") {{ card.priority }}
          p.text-sm.font-bold(style="color: var(--text-primary);") {{ card.title }}
          p.text-xs.mt-1.line-clamp-2(style="color: var(--text-muted);") {{ card.description }}
          .flex.items-center.justify-between.mt-3
            .flex.items-center.gap-1
              Icon(name="ph:user" size="12" style="color: var(--text-muted);")
              span.text-xs(style="color: var(--text-muted);") {{ card.assignee || 'Unassigned' }}
            span.text-xs.font-mono(style="color: var(--text-muted);") {{ card.value?.toLocaleString() || '—' }}
          .flex.items-center.gap-1.mt-2
            el-button(
              v-for="targetCol in columns.filter(c => c.id !== col.id)"
              :key="targetCol.id"
              text
              size="small"
              @click="moveCard(card.id, targetCol.id)"
            )
              span.text-xs → {{ targetCol.title.split(' ')[0] }}

        //- Drop zone
        .p-6.rounded-xl.border-2.border-dashed.text-center.text-xs.transition-colors(
          style="border-color: var(--border-default); color: var(--text-muted);"
          @dragover.prevent
          @drop="dropCard(col.id)"
          class="hover:border-violet-300 hover:bg-violet-50/30"
        ) Drop here

  //- Add Card Dialog
  el-dialog(v-model="showDialog" title="Add Card" width="480px")
    el-form(label-position="top" size="large")
      el-form-item(label="Title")
        el-input(v-model="form.title" placeholder="Deal or task name")
      el-form-item(label="Description")
        el-input(v-model="form.description" type="textarea" :rows="2")
      .grid.grid-cols-2.gap-4
        el-form-item(label="Stage")
          el-select(v-model="form.columnId" class="w-full")
            el-option(v-for="col in columns" :key="col.id" :label="col.title" :value="col.id")
        el-form-item(label="Priority")
          el-select(v-model="form.priority" class="w-full")
            el-option(label="Low" value="low")
            el-option(label="Medium" value="medium")
            el-option(label="High" value="high")
      .grid.grid-cols-2.gap-4
        el-form-item(label="Assignee")
          el-input(v-model="form.assignee" placeholder="Name")
        el-form-item(label="Value")
          el-input-number(v-model="form.value" :min="0" class="!w-full")
    template(#footer)
      el-button(@click="showDialog = false") Cancel
      el-button(type="primary" @click="saveCard" style="border-radius: 12px;") Add Card
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';

definePageMeta({ layout: 'main', middleware: 'auth' });

interface KanbanCard { id: string; ref: string; title: string; description: string; columnId: string; priority: string; assignee: string; value: number; }

const columns = [
  { id: 'new', title: '🆕 New Lead', color: '#6b7280' },
  { id: 'qualified', title: '🎯 Qualified', color: '#3b82f6' },
  { id: 'proposal', title: '📄 Proposal', color: '#f59e0b' },
  { id: 'negotiation', title: '🤝 Negotiation', color: '#8b5cf6' },
  { id: 'won', title: '✅ Won', color: '#22c55e' },
  { id: 'lost', title: '❌ Lost', color: '#ef4444' },
];

const STORAGE_KEY = 'crm_kanban_cards';
const cards = ref<KanbanCard[]>(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(cards.value)); }

const showDialog = ref(false);
const form = reactive({ title: '', description: '', columnId: 'new', priority: 'medium', assignee: '', value: 0 });
let draggedCard: KanbanCard | null = null;

function getColumnCards(colId: string) { return cards.value.filter(c => c.columnId === colId); }

function addCard() { showDialog.value = true; }
function saveCard() {
  cards.value.push({ ...form, id: `k_${Date.now()}`, ref: `DEAL-${String(cards.value.length + 1).padStart(3, '0')}` });
  persist();
  Object.assign(form, { title: '', description: '', columnId: 'new', priority: 'medium', assignee: '', value: 0 });
  showDialog.value = false;
}
function moveCard(cardId: string, targetCol: string) {
  const card = cards.value.find(c => c.id === cardId);
  if (card) { card.columnId = targetCol; persist(); }
}
function dragStart(card: KanbanCard) { draggedCard = card; }
function dragEnd() { draggedCard = null; }
function dropCard(colId: string) { if (draggedCard) { moveCard(draggedCard.id, colId); draggedCard = null; } }
function priorityTag(p: string): '' | 'success' | 'warning' | 'danger' { return { low: 'success' as const, medium: 'warning' as const, high: 'danger' as const }[p] || ''; }
</script>
