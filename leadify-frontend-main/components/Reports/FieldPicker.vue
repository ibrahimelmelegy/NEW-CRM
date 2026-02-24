<template lang="pug">
.field-picker
  //- Search Input
  .p-3(style="border-bottom: 1px solid var(--glass-border-color)")
    el-input(
      v-model="search"
      :placeholder="$t('reportBuilder.searchFields')"
      prefix-icon="Search"
      clearable
      size="small"
    )

  //- Module Groups
  .field-groups.overflow-y-auto(style="max-height: calc(100vh - 320px)")
    .module-group(
      v-for="mod in filteredModules"
      :key="mod.key"
    )
      //- Module Header (clickable to expand/collapse)
      .module-header.flex.items-center.gap-2.px-3.py-2.cursor-pointer(
        @click="toggleModule(mod.key)"
        style="border-bottom: 1px solid var(--glass-border-color)"
      )
        Icon(:name="mod.icon" size="16" style="color: #7849ff" aria-hidden="true")
        span.text-sm.font-semibold.flex-1(style="color: var(--text-primary)") {{ mod.label }}
        el-badge(
          :value="mod.fields.length"
          type="info"
          class="mr-2"
        )
        Icon(
          :name="expandedModules[mod.key] ? 'ph:caret-up' : 'ph:caret-down'"
          size="14"
          style="color: var(--text-muted)"
          aria-hidden="true"
        )

      //- Field list (collapsible)
      transition(name="slide")
        .field-list.px-2.py-1(v-show="expandedModules[mod.key]")
          draggable(
            :list="mod.fields"
            :group="{ name: 'reportFields', pull: 'clone', put: false }"
            item-key="name"
            :clone="cloneField"
            :sort="false"
          )
            template(#item="{ element }")
              .field-item.flex.items-center.gap-2.px-3.py-2.my-1.rounded-lg.cursor-grab(
                :class="{ 'field-selected': isFieldSelected(element.name) }"
                @click="toggleField(element)"
                style="background: var(--bg-input); border: 1px solid transparent; transition: all 0.2s"
              )
                Icon(:name="element.icon" size="14" style="color: var(--text-muted)" aria-hidden="true")
                span.text-sm.flex-1(style="color: var(--text-primary)") {{ element.label }}
                el-tag(
                  size="small"
                  :type="getFieldTypeTagType(element.type)"
                  effect="plain"
                  round
                ) {{ element.type }}
                .check-indicator(v-if="isFieldSelected(element.name)")
                  Icon(name="ph:check-circle-fill" size="16" style="color: #7849ff" aria-hidden="true")
</template>

<script setup lang="ts">
import draggable from 'vuedraggable';
import { MODULE_DEFINITIONS, type FieldDefinition, type ModuleDefinition } from '~/composables/useReportBuilderPro';

interface Props {
  modelValue: string[];
  activeModule: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [fields: string[]];
  'update:activeModule': [module: string];
}>();

const search = ref('');
const expandedModules = ref<Record<string, boolean>>({});

// Initialize with active module expanded
onMounted(() => {
  expandedModules.value[props.activeModule] = true;
});

watch(() => props.activeModule, (newMod) => {
  expandedModules.value[newMod] = true;
});

const filteredModules = computed(() => {
  const modules = Object.values(MODULE_DEFINITIONS);
  if (!search.value) return modules;

  const q = search.value.toLowerCase();
  return modules
    .map(mod => ({
      ...mod,
      fields: mod.fields.filter(f =>
        f.label.toLowerCase().includes(q) ||
        f.name.toLowerCase().includes(q) ||
        f.type.toLowerCase().includes(q)
      )
    }))
    .filter(mod => mod.fields.length > 0);
});

function toggleModule(key: string) {
  expandedModules.value[key] = !expandedModules.value[key];
}

function isFieldSelected(fieldName: string): boolean {
  return props.modelValue.includes(fieldName);
}

function toggleField(field: FieldDefinition) {
  const current = [...props.modelValue];
  const idx = current.indexOf(field.name);
  if (idx >= 0) {
    current.splice(idx, 1);
  } else {
    current.push(field.name);
  }
  emit('update:modelValue', current);

  // Also set active module
  const modKey = findModuleForField(field.name);
  if (modKey) {
    emit('update:activeModule', modKey);
  }
}

function cloneField(field: FieldDefinition): FieldDefinition {
  return { ...field };
}

function findModuleForField(fieldName: string): string | null {
  for (const [key, mod] of Object.entries(MODULE_DEFINITIONS)) {
    if (mod.fields.some(f => f.name === fieldName)) return key;
  }
  return null;
}

function getFieldTypeTagType(type: string): string {
  switch (type) {
    case 'text': return 'info';
    case 'number': return 'success';
    case 'date': return 'warning';
    case 'select': return '';
    default: return 'info';
  }
}
</script>

<style lang="scss" scoped>
.field-picker {
  height: 100%;
}

.module-header:hover {
  background: var(--bg-input);
}

.field-item:hover {
  border-color: #7849ff !important;
  background: rgba(120, 73, 255, 0.05) !important;
}

.field-item.field-selected {
  border-color: #7849ff !important;
  background: rgba(120, 73, 255, 0.08) !important;
}

.field-item:active {
  cursor: grabbing;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
}

.slide-enter-to,
.slide-leave-from {
  opacity: 1;
  max-height: 600px;
}
</style>
