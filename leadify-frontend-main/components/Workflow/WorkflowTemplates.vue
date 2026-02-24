<template lang="pug">
.workflow-templates
  .templates-header
    h3.text-lg.font-bold(style="color: var(--text-primary)") {{ $t('workflows.templates') }}
    p.text-sm(style="color: var(--text-muted)") {{ $t('workflows.templatesSubtitle') }}

  //- Loading
  el-skeleton(:rows="3" animated v-if="loading")

  //- Templates grid
  .templates-grid(v-else)
    .template-card(
      v-for="tpl in templates"
      :key="tpl.id"
      @click="selectTemplate(tpl)"
    )
      .template-accent(:class="`accent-${tpl.id}`")
      .template-content
        .template-icon(:class="`icon-${tpl.id}`")
          Icon(:name="getTemplateIcon(tpl.id)" size="22")
        .template-info
          h4.template-name {{ tpl.name }}
          p.template-desc {{ tpl.description }}
        .template-preview
          .node-chain
            .chain-node(
              v-for="(node, idx) in getPreviewNodes(tpl)"
              :key="node.id"
            )
              .chain-dot(:class="getNodeColorClass(node.data.nodeType)")
              span.chain-label {{ node.data.label }}
              Icon(
                v-if="idx < getPreviewNodes(tpl).length - 1"
                name="ph:arrow-right"
                size="10"
                class="chain-arrow"
              )
        .template-meta
          el-tag(size="small" effect="plain") {{ tpl.entityType }}
          el-tag(size="small" type="info" effect="plain") {{ tpl.nodes.length }} {{ $t('workflows.nodes') }}
      .template-overlay
        .overlay-content
          Icon(name="ph:arrow-circle-right-bold" size="28")
          span {{ $t('workflows.useTemplate') }}
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface TemplateNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    nodeType: string;
    config: Record<string, any>;
  };
}

interface TemplateEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  animated: boolean;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  entityType: string;
  triggerType: string;
  nodes: TemplateNode[];
  edges: TemplateEdge[];
}

const emit = defineEmits<{
  (e: 'select', template: WorkflowTemplate): void;
}>();

const loading = ref(false);
const templates = ref<WorkflowTemplate[]>([]);

const templateIcons: Record<string, string> = {
  'lead-nurture': 'ph:user-circle-plus-bold',
  'deal-won': 'ph:trophy-bold',
  'support-escalation': 'ph:megaphone-bold',
  'employee-onboarding': 'ph:identification-badge-bold',
  'invoice-reminder': 'ph:receipt-bold'
};

function getTemplateIcon(id: string): string {
  return templateIcons[id] || 'ph:flowchart-bold';
}

function getPreviewNodes(tpl: WorkflowTemplate): TemplateNode[] {
  return tpl.nodes.slice(0, 5);
}

function getNodeColorClass(nodeType: string): string {
  const map: Record<string, string> = {
    trigger: 'dot-trigger',
    action: 'dot-action',
    condition: 'dot-condition',
    delay: 'dot-delay',
    http: 'dot-http',
    template: 'dot-template',
    approval: 'dot-approval'
  };
  return map[nodeType] || 'dot-action';
}

function selectTemplate(tpl: WorkflowTemplate) {
  emit('select', tpl);
}

async function fetchTemplates() {
  loading.value = true;
  try {
    const { body, success } = await useApiFetch('workflows/templates' as any);
    if (success && body) {
      templates.value = Array.isArray(body) ? body : [];
    }
  } catch (err) {
    console.error('Failed to fetch workflow templates:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchTemplates();
});
</script>

<style lang="scss" scoped>
.workflow-templates {
  max-width: 100%;
}

.templates-header {
  margin-bottom: 20px;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

.template-card {
  position: relative;
  border-radius: 14px;
  background: var(--glass-bg, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--glass-border-color, rgba(255, 255, 255, 0.08));
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 255, 255, 0.15);
    box-shadow: var(--glass-shadow, 0 8px 32px rgba(0, 0, 0, 0.3));

    .template-overlay {
      opacity: 1;
    }
  }
}

.template-accent {
  height: 4px;

  &.accent-lead-nurture { background: linear-gradient(90deg, #16a34a, #22c55e); }
  &.accent-deal-won { background: linear-gradient(90deg, #7849ff, #a855f7); }
  &.accent-support-escalation { background: linear-gradient(90deg, #ea580c, #f97316); }
  &.accent-employee-onboarding { background: linear-gradient(90deg, #2563eb, #3b82f6); }
  &.accent-invoice-reminder { background: linear-gradient(90deg, #ca8a04, #eab308); }
}

.template-content {
  padding: 18px;
}

.template-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 12px;

  &.icon-lead-nurture { background: linear-gradient(135deg, #16a34a, #22c55e); }
  &.icon-deal-won { background: linear-gradient(135deg, #7849ff, #a855f7); }
  &.icon-support-escalation { background: linear-gradient(135deg, #ea580c, #f97316); }
  &.icon-employee-onboarding { background: linear-gradient(135deg, #2563eb, #3b82f6); }
  &.icon-invoice-reminder { background: linear-gradient(135deg, #ca8a04, #eab308); }
}

.template-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary, #e4e4e7);
  margin: 0 0 4px 0;
}

.template-desc {
  font-size: 12px;
  color: var(--text-secondary, #71717a);
  line-height: 1.4;
  margin: 0;
}

.template-preview {
  margin-top: 14px;
  padding: 10px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
}

.node-chain {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.chain-node {
  display: flex;
  align-items: center;
  gap: 4px;
}

.chain-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  &.dot-trigger { background: #22c55e; }
  &.dot-action { background: #a855f7; }
  &.dot-condition { background: #f59e0b; }
  &.dot-delay { background: #eab308; }
  &.dot-http { background: #3b82f6; }
  &.dot-template { background: #4ade80; }
  &.dot-approval { background: #f97316; }
}

.chain-label {
  font-size: 10px;
  color: var(--text-secondary, #71717a);
  white-space: nowrap;
}

.chain-arrow {
  color: var(--text-muted, #52525b);
  flex-shrink: 0;
}

.template-meta {
  display: flex;
  gap: 6px;
  margin-top: 12px;
}

.template-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: white;
  font-weight: 600;
  font-size: 14px;
}
</style>
