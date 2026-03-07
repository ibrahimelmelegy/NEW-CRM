<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">{{ $t('kanbanBoard.title') }}</h1>
          <p class="text-slate-400 text-sm mt-1">{{ $t('kanbanBoard.subtitle') }}</p>
        </div>
        <div class="flex gap-2">
          <el-select v-model="selectedEntity" class="w-44" @change="onEntityChange">
            <el-option :label="$t('kanbanBoard.leads')" value="leads" />
            <el-option :label="$t('kanbanBoard.deals')" value="deals" />
            <el-option :label="$t('kanbanBoard.tasks')" value="tasks" />
            <el-option :label="$t('kanbanBoard.supportTickets')" value="tickets" />
            <el-option :label="$t('kanbanBoard.projects')" value="projects" />
          </el-select>
          <el-button type="primary" class="!rounded-xl" @click="showAddDialog = true">
            <Icon name="ph:plus-bold" class="w-4 h-4 mr-2" />
            {{ $t('kanbanBoard.addItem') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- Board Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="col in columns" :key="col.key" class="glass-panel p-4 rounded-xl text-center">
        <div class="text-2xl font-bold" :style="{ color: col.color }">{{ getColumnCards(col.key).length }}</div>
        <div class="text-xs text-slate-500 mt-1">{{ col.label }}</div>
      </div>
    </div>

    <!-- Kanban Board -->
    <div class="flex gap-4 overflow-x-auto pb-4" style="min-height: 60vh">
      <div v-for="col in columns" :key="col.key" class="flex-shrink-0 w-72">
        <!-- Column Header -->
        <div class="glass-panel p-3 rounded-xl mb-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: col.color }"></div>
              <span class="text-sm font-medium text-slate-200">{{ col.label }}</span>
              <span class="text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">{{ getColumnCards(col.key).length }}</span>
            </div>
            <el-button text size="small" @click="addToColumn(col.key)">
              <Icon name="ph:plus" class="w-4 h-4 text-slate-500" />
            </el-button>
          </div>
          <div v-if="(col as unknown).totalValue" class="text-xs text-slate-500 mt-1">{{ formatCurrency((col as unknown).totalValue) }}</div>
        </div>

        <!-- Drop Zone -->
        <div
          class="space-y-3 min-h-[200px] rounded-xl p-2 transition-colors"
          :class="dragOverCol === col.key ? 'bg-primary-500/10 border border-primary-500/30 border-dashed' : ''"
          @dragover.prevent="dragOverCol = col.key"
          @dragleave="dragOverCol = ''"
          @drop="onDrop($event, col.key)"
        >
          <!-- Cards -->
          <div
            v-for="card in getColumnCards(col.key)"
            :key="card.id"
            class="glass-panel p-4 rounded-xl cursor-grab hover:border-primary-500/30 transition-all group"
            draggable="true"
            @dragstart="onDragStart($event, card)"
            @click="openCard(card)"
          >
            <!-- Priority Badge -->
            <div class="flex justify-between items-start mb-2">
              <el-tag v-if="card.priority" :type="getPriorityType(card.priority)" effect="dark" size="small">
                {{ card.priority }}
              </el-tag>
              <span class="text-xs text-slate-600">{{ card.code }}</span>
            </div>

            <!-- Card Title -->
            <h4 class="text-sm font-medium text-slate-200 mb-2">{{ card.title }}</h4>

            <!-- Labels -->
            <div v-if="card.labels?.length" class="flex gap-1 flex-wrap mb-2">
              <span v-for="label in card.labels" :key="label" class="text-[10px] px-2 py-0.5 rounded-full" :class="getLabelClass(label)">
                {{ label }}
              </span>
            </div>

            <!-- Card Footer -->
            <div class="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60">
              <div class="flex items-center gap-2">
                <el-avatar :size="22" class="bg-slate-700">
                  {{ card.assignee?.charAt(0) || '?' }}
                </el-avatar>
                <span class="text-xs text-slate-500">{{ card.assignee }}</span>
              </div>
              <div class="flex items-center gap-2 text-xs text-slate-600">
                <span v-if="card.dueDate" class="flex items-center gap-1" :class="isOverdue(card.dueDate) ? 'text-red-400' : ''">
                  <Icon name="ph:calendar" class="w-3 h-3" />
                  {{ formatShortDate(card.dueDate) }}
                </span>
                <span v-if="card.comments" class="flex items-center gap-1">
                  <Icon name="ph:chat-circle" class="w-3 h-3" />
                  {{ card.comments }}
                </span>
                <span v-if="card.attachments" class="flex items-center gap-1">
                  <Icon name="ph:paperclip" class="w-3 h-3" />
                  {{ card.attachments }}
                </span>
              </div>
            </div>

            <!-- Progress Bar -->
            <el-progress
              v-if="card.progress !== undefined"
              :percentage="card.progress"
              :stroke-width="3"
              :show-text="false"
              :color="card.progress === 100 ? '#10B981' : '#6366F1'"
              class="mt-2"
            />
          </div>

          <!-- Empty State -->
          <div v-if="getColumnCards(col.key).length === 0" class="text-center py-8 text-slate-600 text-xs">{{ $t('kanbanBoard.dropItemsHere') }}</div>
        </div>
      </div>
    </div>

    <!-- Add Item Dialog -->
    <el-dialog v-model="showAddDialog" :title="$t('kanbanBoard.addBoardItem')" width="480px">
      <el-form label-position="top">
        <el-form-item :label="$t('common.title')">
          <el-input v-model="newCard.title" :placeholder="$t('kanbanBoard.itemTitle')" />
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item :label="$t('common.status')">
            <el-select v-model="newCard.status" class="w-full">
              <el-option v-for="col in columns" :key="col.key" :label="col.label" :value="col.key" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('common.priority')">
            <el-select v-model="newCard.priority" class="w-full">
              <el-option :label="$t('kanbanBoard.criticalPriority')" value="CRITICAL" />
              <el-option :label="$t('kanbanBoard.highPriority')" value="HIGH" />
              <el-option :label="$t('kanbanBoard.mediumPriority')" value="MEDIUM" />
              <el-option :label="$t('kanbanBoard.lowPriority')" value="LOW" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item :label="$t('kanbanBoard.assignee')">
          <el-input v-model="newCard.assignee" :placeholder="$t('kanbanBoard.assigneeName')" />
        </el-form-item>
        <el-form-item :label="$t('kanbanBoard.dueDate')">
          <el-date-picker v-model="newCard.dueDate" type="date" class="w-full" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="addCard">{{ $t('kanbanBoard.addItem') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';

definePageMeta({
  layout: 'default',
  middleware: 'permissions'
});

const { t } = useI18n();

interface BoardCard {
  id: number;
  title: string;
  code: string;
  status: string;
  priority?: string;
  assignee?: string;
  dueDate?: string;
  labels?: string[];
  comments?: number;
  attachments?: number;
  progress?: number;
  value?: number;
}

const selectedEntity = ref('deals');
const showAddDialog = ref(false);
const dragOverCol = ref('');
let draggedCard: BoardCard | null = null;

const newCard = ref({ title: '', status: 'NEW', priority: 'MEDIUM', assignee: '', dueDate: '' });

const entityColumns: Record<string, { key: string; label: string; color: string }[]> = {
  leads: [
    { key: 'NEW', label: 'New', color: '#3B82F6' },
    { key: 'CONTACTED', label: 'Contacted', color: '#8B5CF6' },
    { key: 'QUALIFIED', label: 'Qualified', color: '#F59E0B' },
    { key: 'CONVERTED', label: 'Converted', color: '#10B981' }
  ],
  deals: [
    { key: 'DISCOVERY', label: 'Discovery', color: '#3B82F6' },
    { key: 'PROPOSAL', label: 'Proposal', color: '#8B5CF6' },
    { key: 'NEGOTIATION', label: 'Negotiation', color: '#F59E0B' },
    { key: 'WON', label: 'Won', color: '#10B981' },
    { key: 'LOST', label: 'Lost', color: '#EF4444' }
  ],
  tasks: [
    { key: 'TODO', label: 'To Do', color: '#64748B' },
    { key: 'IN_PROGRESS', label: 'In Progress', color: '#3B82F6' },
    { key: 'REVIEW', label: 'In Review', color: '#F59E0B' },
    { key: 'DONE', label: 'Done', color: '#10B981' }
  ],
  tickets: [
    { key: 'OPEN', label: 'Open', color: '#EF4444' },
    { key: 'IN_PROGRESS', label: 'In Progress', color: '#F59E0B' },
    { key: 'WAITING', label: 'Waiting', color: '#8B5CF6' },
    { key: 'RESOLVED', label: 'Resolved', color: '#10B981' }
  ],
  projects: [
    { key: 'PLANNING', label: 'Planning', color: '#64748B' },
    { key: 'ACTIVE', label: 'Active', color: '#3B82F6' },
    { key: 'ON_HOLD', label: 'On Hold', color: '#F59E0B' },
    { key: 'COMPLETED', label: 'Completed', color: '#10B981' }
  ]
};

const columns = computed(() => entityColumns[selectedEntity.value] || entityColumns.deals);

const cards = ref<BoardCard[]>([]);

const getColumnCards = (status: string) => cards.value.filter(c => c.status === status);

const formatCurrency = (val: number) => {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M SAR`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K SAR`;
  return `${val} SAR`;
};

const formatShortDate = (d: string) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' });
};

const isOverdue = (d: string) => d && new Date(d) < new Date();

const getPriorityType = (p: string): 'success' | 'warning' | 'info' | 'danger' | undefined => {
  const map: Record<string, 'success' | 'warning' | 'info' | 'danger' | undefined> = {
    CRITICAL: 'danger',
    HIGH: 'warning',
    MEDIUM: undefined,
    LOW: 'info'
  };
  return map[p];
};

const getLabelClass = (label: string) => {
  const colors = [
    'bg-blue-500/20 text-blue-400',
    'bg-purple-500/20 text-purple-400',
    'bg-amber-500/20 text-amber-400',
    'bg-emerald-500/20 text-emerald-400',
    'bg-rose-500/20 text-rose-400'
  ];
  return colors[label.length % colors.length];
};

const onDragStart = (e: DragEvent, card: BoardCard) => {
  draggedCard = card;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(card.id));
  }
};

const onDrop = (_e: DragEvent, newStatus: string) => {
  dragOverCol.value = '';
  if (draggedCard && draggedCard.status !== newStatus) {
    const oldStatus = draggedCard.status;
    draggedCard.status = newStatus;
    ElMessage.success(`Moved "${draggedCard.title}" from ${oldStatus} to ${newStatus}`);
  }
  draggedCard = null;
};

const addToColumn = (status: string) => {
  newCard.value.status = status;
  showAddDialog.value = true;
};

const addCard = () => {
  if (!newCard.value.title) {
    ElMessage.warning(t('common.fillRequired'));
    return;
  }
  cards.value.push({
    id: Date.now(),
    title: newCard.value.title,
    code: `${selectedEntity.value.toUpperCase().slice(0, 4)}-${String(cards.value.length + 1).padStart(3, '0')}`,
    status: newCard.value.status,
    priority: newCard.value.priority,
    assignee: newCard.value.assignee,
    dueDate: newCard.value.dueDate
  });
  showAddDialog.value = false;
  newCard.value = { title: '', status: 'NEW', priority: 'MEDIUM', assignee: '', dueDate: '' };
  ElMessage.success(t('common.saved'));
};

const openCard = (card: BoardCard) => {
  ElMessage.info(`Opening: ${card.title}`);
};

const onEntityChange = () => {
  ElMessage.info(`Switched to ${selectedEntity.value} board`);
};
</script>
