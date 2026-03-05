<template lang="pug">
.terminal-output-container(ref="containerRef")
  .terminal-line(
    v-for="(line, index) in lines"
    :key="index"
    :class="'line-' + line.type"
  )
    span(class="line-timestamp text-xs opacity-40 mr-2") {{ formatTime(line.timestamp) }}
    template(v-if="line.type === 'table' && line.data && line.data.length")
      .line-text {{ line.content }}
      .terminal-table
        table
          thead
            tr
              th(v-for="col in tableColumns(line.data)" :key="col") {{ col }}
          tbody
            tr(v-for="(row, rowIdx) in line.data" :key="rowIdx")
              td(v-for="col in tableColumns(line.data)" :key="col") {{ row[col] || '-' }}
    template(v-else)
      span.line-text {{ line.content }}
</template>

<script setup lang="ts">
import { watch, ref, nextTick, type PropType } from 'vue';

interface TerminalLine {
  type: 'command' | 'result' | 'error' | 'info' | 'table';
  content: string;
  timestamp: Date;
  data?: Record<string, unknown>[];
}

const props = defineProps({
  lines: {
    type: Array as PropType<TerminalLine[]>,
    required: true,
    default: () => []
  }
});

const containerRef = ref<HTMLElement | null>(null);

function formatTime(date: Date): string {
  if (!date || !(date instanceof Date)) return '';
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function tableColumns(data: Record<string, unknown>[]): string[] {
  if (!data || data.length === 0) return [];
  return Object.keys(data[0]);
}

// Auto-scroll to bottom when new lines are added
watch(
  () => props.lines.length,
  async () => {
    await nextTick();
    if (containerRef.value) {
      containerRef.value.scrollTop = containerRef.value.scrollHeight;
    }
  }
);
</script>

<style lang="scss" scoped>
.terminal-output-container {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.terminal-line {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  padding: 2px 0;
  word-break: break-word;

  &.line-command {
    .line-text {
      color: #00ff88;
      font-weight: 600;
    }
  }

  &.line-result {
    .line-text {
      color: #e0e0e0;
    }
  }

  &.line-error {
    .line-text {
      color: #ff4444;
    }
  }

  &.line-info {
    .line-text {
      color: #4488ff;
    }
  }

  &.line-table {
    flex-direction: column;

    .line-text {
      color: #00ff88;
      margin-bottom: 4px;
    }
  }
}

.line-timestamp {
  color: rgba(255, 255, 255, 0.25);
  font-size: 11px;
  flex-shrink: 0;
  user-select: none;
}

.terminal-table {
  width: 100%;
  overflow-x: auto;
  margin: 4px 0 8px;

  table {
    border-collapse: collapse;
    width: 100%;
    font-size: 12px;

    th,
    td {
      padding: 4px 12px;
      text-align: left;
      white-space: nowrap;
    }

    th {
      color: #00ff88;
      border-bottom: 1px solid rgba(0, 255, 136, 0.3);
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
    }

    td {
      color: #ccc;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    tbody tr {
      &:hover {
        background: rgba(0, 255, 136, 0.05);
      }
    }
  }
}
</style>
