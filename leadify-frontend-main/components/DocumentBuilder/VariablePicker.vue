<template lang="pug">
.variable-picker
  .px-4.py-3(style="border-bottom: 1px solid var(--glass-border-color)")
    h3.font-bold.text-sm.mb-2(style="color: var(--text-primary)") {{ $t('documentTemplates.builder.variables') }}
    el-input(
      v-model="searchQuery"
      :placeholder="$t('common.search') + '...'"
      size="small"
      clearable
      class="!rounded-lg"
    )
      template(#prefix)
        Icon(name="ph:magnifying-glass" size="14")

  .overflow-y-auto.px-2.py-2(style="max-height: calc(100vh - 320px)")
    template(v-for="group in filteredGroups" :key="group.category")
      .mb-3
        .px-2.py-1.text-xs.font-bold.uppercase.tracking-wider(style="color: var(--text-muted)") {{ group.category }}
        .space-y-0
          .variable-item.flex.items-center.gap-2.px-2.py-2.rounded-lg.cursor-pointer.transition-all(
            v-for="v in group.variables"
            :key="v.path"
            @click="handleInsert(v.path)"
          )
            .flex-shrink-0
              Icon(:name="v.icon" size="16" style="color: #7849ff")
            .flex-1.min-w-0
              .text-xs.font-semibold.truncate(style="color: var(--text-primary)") {{ v.label }}
              .text-xs.truncate(style="color: var(--text-muted)") {{ v.description }}
            .flex-shrink-0
              span.text-xs.font-mono.px-1.rounded(
                style="color: #7849ff; background: rgba(120, 73, 255, 0.08); font-size: 10px"
                v-text="'{{' + v.path + '}}'"
              )

    .text-center.py-6(v-if="filteredGroups.length === 0")
      Icon(name="ph:magnifying-glass" size="28" style="color: var(--text-muted)")
      p.text-xs.mt-2(style="color: var(--text-muted)") No variables found
</template>

<script setup lang="ts">
interface VariableItem {
  path: string;
  label: string;
  description: string;
  icon: string;
}

interface VariableGroup {
  category: string;
  variables: VariableItem[];
}

const emit = defineEmits<{
  insert: [variablePath: string];
}>();

const searchQuery = ref('');

const variableGroups: VariableGroup[] = [
  {
    category: 'Client',
    variables: [
      { path: 'client.name', label: 'Client Name', description: 'Full name of the client', icon: 'ph:user-bold' },
      { path: 'client.email', label: 'Client Email', description: 'Email address of the client', icon: 'ph:envelope-bold' },
      { path: 'client.phone', label: 'Client Phone', description: 'Phone number of the client', icon: 'ph:phone-bold' },
      { path: 'client.company', label: 'Client Company', description: 'Company the client belongs to', icon: 'ph:buildings-bold' }
    ]
  },
  {
    category: 'Deal',
    variables: [
      { path: 'deal.name', label: 'Deal Name', description: 'Name of the deal', icon: 'ph:handshake-bold' },
      { path: 'deal.price', label: 'Deal Value', description: 'Monetary value of the deal', icon: 'ph:currency-dollar-bold' },
      { path: 'deal.stage', label: 'Deal Stage', description: 'Current pipeline stage', icon: 'ph:funnel-bold' }
    ]
  },
  {
    category: 'Invoice',
    variables: [
      { path: 'invoice.number', label: 'Invoice Number', description: 'Unique invoice identifier', icon: 'ph:hash-bold' },
      { path: 'invoice.amount', label: 'Invoice Amount', description: 'Total invoice amount', icon: 'ph:currency-dollar-bold' },
      { path: 'invoice.date', label: 'Invoice Date', description: 'Date the invoice was issued', icon: 'ph:calendar-bold' },
      { path: 'invoice.dueDate', label: 'Due Date', description: 'Payment due date', icon: 'ph:calendar-check-bold' }
    ]
  },
  {
    category: 'Company',
    variables: [
      { path: 'company.name', label: 'Company Name', description: 'Your company name', icon: 'ph:buildings-bold' },
      { path: 'company.address', label: 'Company Address', description: 'Your company address', icon: 'ph:map-pin-bold' },
      { path: 'company.logo', label: 'Company Logo', description: 'Company logo image URL', icon: 'ph:image-bold' },
      { path: 'company.phone', label: 'Company Phone', description: 'Company phone number', icon: 'ph:phone-bold' },
      { path: 'company.email', label: 'Company Email', description: 'Company contact email', icon: 'ph:envelope-bold' }
    ]
  }
];

const filteredGroups = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return variableGroups;

  return variableGroups
    .map(group => ({
      ...group,
      variables: group.variables.filter(
        v => v.label.toLowerCase().includes(query) || v.path.toLowerCase().includes(query) || v.description.toLowerCase().includes(query)
      )
    }))
    .filter(group => group.variables.length > 0);
});

function handleInsert(path: string) {
  emit('insert', path);
}
</script>

<style scoped>
.variable-picker {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.variable-item:hover {
  background: rgba(120, 73, 255, 0.06);
}

.variable-item:active {
  background: rgba(120, 73, 255, 0.12);
}
</style>
