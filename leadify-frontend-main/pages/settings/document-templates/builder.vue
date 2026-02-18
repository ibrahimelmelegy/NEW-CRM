<template lang="pug">
.builder-page
  BuilderToolbar(
    :name="templateName"
    :type="templateType"
    :canUndo="historyIndex > 0"
    :canRedo="historyIndex < history.length - 1"
    :saving="saving"
    @update:name="templateName = $event"
    @update:type="templateType = $event"
    @undo="undo"
    @redo="redo"
    @save="saveTemplate"
    @preview="showPreview = true"
    @pick-template="showPicker = true"
  )

  .flex.gap-0(style="height: calc(100vh - 140px)")
    BuilderSidebar(
      :variables="currentVariables"
      :orientation="orientation"
      :elements="elements"
      :selectedId="selectedId"
      @add-element="addElement"
      @insert-variable="insertVariable"
      @update:orientation="orientation = $event"
      @select-element="selectElement"
      @move-layer="moveLayer"
    )

    BuilderCanvas(
      :elements="elements"
      :selectedId="selectedId"
      :orientation="orientation"
      :margins="margins"
      @select="selectElement"
      @deselect="selectedId = null"
      @move-element="moveElement"
      @resize-element="resizeElement"
    )

    BuilderProperties(
      :element="selectedElement"
      @update="updateElement"
      @delete="deleteSelected"
      @duplicate="duplicateSelected"
    )

  TemplatePreview(
    :show="showPreview"
    :elements="elements"
    :orientation="orientation"
    @close="showPreview = false"
  )

  TemplatePicker(
    :show="showPicker"
    :templates="defaultTemplates"
    :typeFilter="templateType"
    @close="showPicker = false"
    @select="applyTemplate"
    @start-blank="startBlank"
  )
</template>

<script setup lang="ts">
import { ElNotification } from 'element-plus';
import type { DocumentTemplate, TemplateElement } from '~/composables/useDocumentTemplates';
import {
  fetchDocumentTemplate, createDocumentTemplate, updateDocumentTemplate,
  fetchDefaultConfigs, BUILTIN_TEMPLATES
} from '~/composables/useDocumentTemplates';
import BuilderToolbar from '~/components/DocumentBuilder/BuilderToolbar.vue';
import BuilderSidebar from '~/components/DocumentBuilder/BuilderSidebar.vue';
import BuilderCanvas from '~/components/DocumentBuilder/BuilderCanvas.vue';
import BuilderProperties from '~/components/DocumentBuilder/BuilderProperties.vue';
import TemplatePreview from '~/components/DocumentBuilder/TemplatePreview.vue';
import TemplatePicker from '~/components/DocumentBuilder/TemplatePicker.vue';

definePageMeta({
  middleware: 'permissions',
  permission: 'VIEW_DOCUMENT_TEMPLATES'
});

const route = useRoute();
const router = useRouter();

const templateId = computed(() => route.query.id as string | undefined);
const isEditing = computed(() => !!templateId.value);

const templateName = ref('Untitled Template');
const templateType = ref<'INVOICE' | 'PURCHASE_ORDER'>('INVOICE');
const orientation = ref<'portrait' | 'landscape'>('portrait');
const margins = ref({ top: 20, right: 15, bottom: 20, left: 15 });
const elements = ref<TemplateElement[]>([]);
const selectedId = ref<string | null>(null);
const saving = ref(false);
const showPreview = ref(false);
const showPicker = ref(false);
const defaultTemplates = ref<DocumentTemplate[]>([]);

// History for undo/redo
const history = ref<string[]>([]);
const historyIndex = ref(-1);

const INVOICE_VARIABLES = [
  'companyName', 'companyAddress', 'companyPhone', 'companyEmail', 'companyLogo',
  'invoiceNumber', 'date', 'dueDate',
  'clientName', 'clientAddress', 'clientPhone', 'clientEmail',
  'items', 'subtotal', 'tax', 'total', 'notes'
];

const PO_VARIABLES = [
  'companyName', 'companyAddress', 'companyPhone', 'companyEmail', 'companyLogo',
  'poNumber', 'date', 'deliveryDate',
  'vendorName', 'vendorAddress', 'vendorPhone', 'vendorEmail',
  'projectName', 'items', 'subtotal', 'tax', 'total', 'notes'
];

const currentVariables = computed(() =>
  templateType.value === 'INVOICE' ? INVOICE_VARIABLES : PO_VARIABLES
);

const selectedElement = computed(() =>
  selectedId.value ? elements.value.find(e => e.id === selectedId.value) || null : null
);

onMounted(async () => {
  // Load default templates for picker (fall back to built-in definitions)
  const apiTemplates = await fetchDefaultConfigs();
  defaultTemplates.value = apiTemplates.length ? apiTemplates : BUILTIN_TEMPLATES;

  if (templateId.value) {
    const tpl = await fetchDocumentTemplate(templateId.value);
    if (tpl) {
      templateName.value = tpl.name;
      templateType.value = tpl.type;
      orientation.value = tpl.layout?.orientation || 'portrait';
      margins.value = tpl.layout?.margins || margins.value;
      elements.value = tpl.layout?.elements || [];
    }
  } else if (!elements.value.length) {
    showPicker.value = true;
  }

  pushHistory();
});

function generateId(): string {
  return 'el_' + Math.random().toString(36).substring(2, 9);
}

function addElement(type: string) {
  const defaults: Record<string, Partial<TemplateElement>> = {
    text: { width: 80, height: 10, props: { content: 'New Text', fontSize: 12, fontWeight: 'normal', fontFamily: 'Helvetica', color: '#333333', align: 'left' } },
    image: { width: 40, height: 30, props: { content: '{{companyLogo}}', objectFit: 'contain' } },
    table: { width: 180, height: 60, props: { columns: ['Item', 'Qty', 'Price', 'Total'], columnWidths: [80, 30, 35, 35], headerBg: '#f0f0f0', headerColor: '#000000', borderColor: '#cccccc', fontSize: 9, fontFamily: 'Helvetica' } },
    line: { width: 180, height: 1, props: { color: '#000000', thickness: 1 } },
    shape: { width: 60, height: 30, props: { shape: 'rectangle', fill: '#e0e0e0', borderRadius: 0 } }
  };

  const def = defaults[type] ?? defaults.text;
  const el: TemplateElement = {
    id: generateId(),
    type: type as TemplateElement['type'],
    x: 15,
    y: 15 + elements.value.length * 5,
    width: def!.width!,
    height: def!.height!,
    props: { ...def!.props }
  };

  elements.value.push(el);
  selectedId.value = el.id;
  pushHistory();
}

function selectElement(id: string) {
  selectedId.value = id;
}

function moveElement({ id, x, y }: { id: string; x: number; y: number }) {
  const el = elements.value.find(e => e.id === id);
  if (el) {
    el.x = x;
    el.y = y;
  }
}

function resizeElement({ id, width, height }: { id: string; width: number; height: number }) {
  const el = elements.value.find(e => e.id === id);
  if (el) {
    el.width = width;
    el.height = height;
  }
}

function updateElement(updated: TemplateElement) {
  const idx = elements.value.findIndex(e => e.id === updated.id);
  if (idx !== -1) {
    elements.value[idx] = updated;
    pushHistory();
  }
}

function deleteSelected() {
  if (!selectedId.value) return;
  elements.value = elements.value.filter(e => e.id !== selectedId.value);
  selectedId.value = null;
  pushHistory();
}

function duplicateSelected() {
  const el = selectedElement.value;
  if (!el) return;
  const clone: TemplateElement = {
    ...JSON.parse(JSON.stringify(el)),
    id: generateId(),
    x: el.x + 5,
    y: el.y + 5
  };
  elements.value.push(clone);
  selectedId.value = clone.id;
  pushHistory();
}

function moveLayer({ id, direction }: { id: string; direction: 'up' | 'down' }) {
  const idx = elements.value.findIndex(e => e.id === id);
  if (idx === -1) return;
  if (direction === 'up' && idx < elements.value.length - 1) {
    // Move up in z-order = move later in array
    [elements.value[idx], elements.value[idx + 1]] = [elements.value[idx + 1]!, elements.value[idx]!];
    pushHistory();
  } else if (direction === 'down' && idx > 0) {
    // Move down in z-order = move earlier in array
    [elements.value[idx], elements.value[idx - 1]] = [elements.value[idx - 1]!, elements.value[idx]!];
    pushHistory();
  }
}

function insertVariable(variable: string) {
  if (selectedElement.value && selectedElement.value.type === 'text') {
    const el = elements.value.find(e => e.id === selectedId.value);
    if (el) {
      el.props.content = (el.props.content || '') + `{{${variable}}}`;
      pushHistory();
    }
  } else {
    // Add a new text element with the variable
    addElement('text');
    const el = elements.value[elements.value.length - 1];
    if (el) {
      el.props.content = `{{${variable}}}`;
    }
  }
}

// History management
function pushHistory() {
  const state = JSON.stringify(elements.value);
  // Remove future states if we've undone
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1);
  }
  history.value.push(state);
  historyIndex.value = history.value.length - 1;
  // Limit history
  if (history.value.length > 50) {
    history.value.shift();
    historyIndex.value--;
  }
}

function undo() {
  if (historyIndex.value > 0) {
    historyIndex.value--;
    elements.value = JSON.parse(history.value[historyIndex.value]!);
    selectedId.value = null;
  }
}

function redo() {
  if (historyIndex.value < history.value.length - 1) {
    historyIndex.value++;
    elements.value = JSON.parse(history.value[historyIndex.value]!);
    selectedId.value = null;
  }
}

function applyTemplate(tpl: DocumentTemplate) {
  templateName.value = isEditing.value ? templateName.value : tpl.name;
  templateType.value = tpl.type;
  orientation.value = tpl.layout?.orientation || 'portrait';
  margins.value = tpl.layout?.margins || margins.value;
  elements.value = JSON.parse(JSON.stringify(tpl.layout?.elements || []));
  selectedId.value = null;
  showPicker.value = false;
  pushHistory();
}

function startBlank() {
  elements.value = [];
  selectedId.value = null;
  showPicker.value = false;
  pushHistory();
}

async function saveTemplate() {
  if (!templateName.value.trim()) {
    ElNotification({ type: 'warning', title: 'Warning', message: 'Please enter a template name' });
    return;
  }

  saving.value = true;
  try {
    const payload: any = {
      name: templateName.value,
      type: templateType.value,
      layout: {
        pageSize: 'A4',
        orientation: orientation.value,
        margins: margins.value,
        elements: elements.value,
        variables: currentVariables.value
      }
    };

    let result;
    if (isEditing.value) {
      result = await updateDocumentTemplate(templateId.value!, payload);
    } else {
      result = await createDocumentTemplate(payload);
    }

    if (result.success) {
      ElNotification({ type: 'success', title: 'Success', message: 'Template saved' });
      if (!isEditing.value && result.body?.id) {
        router.replace({ query: { id: result.body.id } });
      }
    } else {
      ElNotification({ type: 'error', title: 'Error', message: result.message || 'Failed to save' });
    }
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.builder-page {
  padding: 16px;
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
