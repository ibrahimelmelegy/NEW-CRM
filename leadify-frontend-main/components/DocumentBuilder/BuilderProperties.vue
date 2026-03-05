<template lang="pug">
.builder-properties.glass-card.rounded-xl.p-4(style="width: 280px; min-width: 280px; overflow-y: auto; max-height: calc(100vh - 180px)")
  template(v-if="element")
    .flex.items-center.justify-between.mb-4
      h3.font-bold.text-sm(style="color: var(--text-primary)") {{ $t('documentTemplates.builder.properties') }}
      .flex.gap-1
        el-tooltip(:content="$t('documentTemplates.builder.duplicateElement')")
          el-button(text size="small" @click="$emit('duplicate')")
            Icon(name="ph:copy" size="16")
        el-tooltip(:content="$t('documentTemplates.builder.deleteElement')")
          el-button(text size="small" @click="$emit('delete')")
            Icon(name="ph:trash" size="16" style="color: #ef4444")

    //- Position & Size
    .section.mb-4
      label.text-xs.font-bold.block.mb-2(style="color: var(--text-muted)") {{ $t('documentTemplates.builder.position') }} & {{ $t('documentTemplates.builder.size') }}
      .grid.grid-cols-2.gap-2
        div
          label.text-xs(style="color: var(--text-muted)") X (mm)
          el-input-number(v-model="localElement.x" :min="0" :max="210" size="small" controls-position="right" @change="emitUpdate")
        div
          label.text-xs(style="color: var(--text-muted)") Y (mm)
          el-input-number(v-model="localElement.y" :min="0" :max="297" size="small" controls-position="right" @change="emitUpdate")
        div
          label.text-xs(style="color: var(--text-muted)") W (mm)
          el-input-number(v-model="localElement.width" :min="1" :max="210" size="small" controls-position="right" @change="emitUpdate")
        div
          label.text-xs(style="color: var(--text-muted)") H (mm)
          el-input-number(v-model="localElement.height" :min="1" :max="297" size="small" controls-position="right" @change="emitUpdate")

    //- Opacity (all elements)
    .section.mb-4
      label.text-xs.font-bold.block.mb-2(style="color: var(--text-muted)") {{ $t('documentTemplates.builder.opacity') || 'Opacity' }}
      el-slider(v-model="localOpacity" :min="10" :max="100" :step="5" @change="updateOpacity" size="small")

    //- Text props
    template(v-if="element.type === 'text'")
      .section.mb-4
        label.text-xs.font-bold.block.mb-2(style="color: var(--text-muted)") {{ $t('documentTemplates.builder.content') }}
        el-input(v-model="localElement.props.content" type="textarea" :rows="3" size="small" @input="emitUpdate")

      .section.mb-4
        label.text-xs.font-bold.block.mb-2(style="color: var(--text-muted)") Typography
        .grid.grid-cols-2.gap-2
          div
            label.text-xs(style="color: var(--text-muted)") {{ $t('documentTemplates.builder.fontSize') }}
            el-input-number(v-model="localElement.props.fontSize" :min="6" :max="72" size="small" controls-position="right" @change="emitUpdate")
          div
            label.text-xs(style="color: var(--text-muted)") {{ $t('documentTemplates.builder.fontWeight') }}
            el-select(v-model="localElement.props.fontWeight" size="small" @change="emitUpdate")
              el-option(:label="$t('common.normal')" value="normal")
              el-option(:label="$t('docBuilder.bold')" value="bold")
              el-option(:label="$t('docBuilder.light')" value="300")
          div.col-span-2
            label.text-xs(style="color: var(--text-muted)") {{ $t('documentTemplates.builder.fontFamily') }}
            el-select(v-model="localElement.props.fontFamily" size="small" @change="emitUpdate" class="w-full")
              el-option(v-for="font in fontFamilies" :key="font.value" :label="font.label" :value="font.value")
          div
            label.text-xs(style="color: var(--text-muted)") {{ $t('documentTemplates.builder.align') }}
            .flex.gap-1
              el-button(v-for="align in alignOptions" :key="align.value" :type="localElement.props.align === align.value ? 'primary' : 'default'" size="small" @click="[localElement.props.align = align.value, emitUpdate()]")
                Icon(:name="align.icon" size="14")
        .mt-2.flex.items-center.gap-3
          div
            label.text-xs(style="color: var(--text-muted)") {{ $t('documentTemplates.builder.color') }}
            el-color-picker(v-model="localElement.props.color" size="small" :predefine="presetColors" @change="emitUpdate")
          div
            label.text-xs(style="color: var(--text-muted)") {{ $t('documentTemplates.builder.backgroundColor') || 'Background' }}
            el-color-picker(v-model="localElement.props.backgroundColor" size="small" :predefine="presetColors" @change="emitUpdate")

      //- Border
      .section.mb-4
        label.text-xs.font-bold.block.mb-2(style="color: var(--text-muted)") {{ $t('documentTemplates.builder.border') || 'Border' }}
        .grid.grid-cols-2.gap-2
          div
            label.text-xs(style="color: var(--text-muted)") Width
            el-input-number(v-model="localElement.props.borderWidth" :min="0" :max="5" size="small" controls-position="right" @change="emitUpdate")
          div
            label.text-xs(style="color: var(--text-muted)") Color
            el-color-picker(v-model="localElement.props.borderColor" size="small" :predefine="presetColors" @change="emitUpdate")

      //- Padding
      .section.mb-4
        label.text-xs.font-bold.block.mb-2(style="color: var(--text-muted)") Padding (mm)
        .grid.grid-cols-4.gap-1
          div
            label.text-xs(style="color: var(--text-muted)") T
            el-input-number(v-model="localElement.props.paddingTop" :min="0" :max="20" size="small" controls-position="right" @change="emitUpdate")
          div
            label.text-xs(style="color: var(--text-muted)") R
            el-input-number(v-model="localElement.props.paddingRight" :min="0" :max="20" size="small" controls-position="right" @change="emitUpdate")
          div
            label.text-xs(style="color: var(--text-muted)") B
            el-input-number(v-model="localElement.props.paddingBottom" :min="0" :max="20" size="small" controls-position="right" @change="emitUpdate")
          div
            label.text-xs(style="color: var(--text-muted)") L
            el-input-number(v-model="localElement.props.paddingLeft" :min="0" :max="20" size="small" controls-position="right" @change="emitUpdate")

    //- Table props
    template(v-if="element.type === 'table'")
      .section.mb-4
        label.text-xs.font-bold.block.mb-2(style="color: var(--text-muted)") {{ $t('documentTemplates.builder.columns') }}
        .space-y-1
          .flex.items-center.gap-1(v-for="(col, i) in localElement.props.columns" :key="i")
            el-input(v-model="localElement.props.columns[i]" size="small" @input="emitUpdate")
            el-button(text size="small" @click="removeColumn(i)")
              Icon(name="ph:x" size="14" style="color: #ef4444")
        el-button(text size="small" @click="addColumn" class="mt-1")
          Icon(name="ph:plus" size="14")
          span.ml-1 {{ $t('common.add') || 'Add' }}

      .section.mb-4
        label.text-xs.font-bold.block.mb-2(style="color: var(--text-muted)") {{ $t('documentTemplates.builder.tableStyle') || 'Table Style' }}
        .grid.grid-cols-2.gap-2
          div
            label.text-xs(style="color: var(--text-muted)") {{ $t('documentTemplates.builder.headerBackground') }}
            el-color-picker(v-model="localElement.props.headerBg" size="small" :predefine="presetColors" @change="emitUpdate")
          div
            label.text-xs(style="color: var(--text-muted)") {{ $t('documentTemplates.builder.headerColor') }}
            el-color-picker(v-model="localElement.props.headerColor" size="small" :predefine="presetColors" @change="emitUpdate")
          div
            label.text-xs(style="color: var(--text-muted)") {{ $t('documentTemplates.builder.borderColor') }}
            el-color-picker(v-model="localElement.props.borderColor" size="small" :predefine="presetColors" @change="emitUpdate")
          div
            label.text-xs(style="color: var(--text-muted)") {{ $t('documentTemplates.builder.fontSize') }}
            el-input-number(v-model="localElement.props.fontSize" :min="6" :max="24" size="small" controls-position="right" @change="emitUpdate")
          div.col-span-2
            label.text-xs(style="color: var(--text-muted)") {{ $t('documentTemplates.builder.fontFamily') }}
            el-select(v-model="localElement.props.fontFamily" size="small" @change="emitUpdate" class="w-full")
              el-option(v-for="font in fontFamilies" :key="font.value" :label="font.label" :value="font.value")

    //- Line props
    template(v-if="element.type === 'line'")
      .section.mb-4
        label.text-xs.font-bold.block.mb-2(style="color: var(--text-muted)") Line Style
        .grid.grid-cols-2.gap-2
          div
            label.text-xs(style="color: var(--text-muted)") {{ $t('documentTemplates.builder.color') }}
            el-color-picker(v-model="localElement.props.color" size="small" :predefine="presetColors" @change="emitUpdate")
          div
            label.text-xs(style="color: var(--text-muted)") {{ $t('documentTemplates.builder.thickness') }}
            el-input-number(v-model="localElement.props.thickness" :min="1" :max="10" size="small" controls-position="right" @change="emitUpdate")
          div
            label.text-xs(style="color: var(--text-muted)") Style
            el-select(v-model="localElement.props.lineStyle" size="small" @change="emitUpdate")
              el-option(:label="$t('docBuilder.solid')" value="solid")
              el-option(:label="$t('docBuilder.dashed')" value="dashed")
              el-option(:label="$t('docBuilder.dotted')" value="dotted")

    //- Shape props
    template(v-if="element.type === 'shape'")
      .section.mb-4
        label.text-xs.font-bold.block.mb-2(style="color: var(--text-muted)") Shape Style
        .grid.grid-cols-2.gap-2
          div
            label.text-xs(style="color: var(--text-muted)") {{ $t('documentTemplates.builder.shapeType') }}
            el-select(v-model="localElement.props.shape" size="small" @change="emitUpdate")
              el-option(:label="$t('documentTemplates.builder.rectangle')" value="rectangle")
              el-option(:label="$t('documentTemplates.builder.circle')" value="circle")
          div
            label.text-xs(style="color: var(--text-muted)") {{ $t('documentTemplates.builder.fill') }}
            el-color-picker(v-model="localElement.props.fill" size="small" :predefine="presetColors" @change="emitUpdate")
          div
            label.text-xs(style="color: var(--text-muted)") {{ $t('documentTemplates.builder.borderRadius') }}
            el-input-number(v-model="localElement.props.borderRadius" :min="0" :max="100" size="small" controls-position="right" @change="emitUpdate")
          div
            label.text-xs(style="color: var(--text-muted)") {{ $t('documentTemplates.builder.borderColor') }}
            el-color-picker(v-model="localElement.props.borderColor" size="small" :predefine="presetColors" @change="emitUpdate")
          div
            label.text-xs(style="color: var(--text-muted)") Border Width
            el-input-number(v-model="localElement.props.borderWidth" :min="0" :max="5" size="small" controls-position="right" @change="emitUpdate")

    //- Image props
    template(v-if="element.type === 'image'")
      .section.mb-4
        label.text-xs.font-bold.block.mb-2(style="color: var(--text-muted)") {{ $t('documentTemplates.builder.content') }}
        el-input(v-model="localElement.props.content" size="small" placeholder="{{companyLogo}} or URL" @input="emitUpdate")
        .mt-2
          label.text-xs(style="color: var(--text-muted)") {{ $t('documentTemplates.builder.objectFit') }}
          el-select(v-model="localElement.props.objectFit" size="small" @change="emitUpdate")
            el-option(:label="$t('docBuilder.contain')" value="contain")
            el-option(:label="$t('docBuilder.cover')" value="cover")
            el-option(:label="$t('docBuilder.fill')" value="fill")
        .mt-2
          label.text-xs(style="color: var(--text-muted)") {{ $t('documentTemplates.builder.borderRadius') }}
          el-input-number(v-model="localElement.props.borderRadius" :min="0" :max="50" size="small" controls-position="right" @change="emitUpdate")

  //- No selection
  .text-center.py-8(v-else)
    Icon(name="ph:cursor-click" size="32" style="color: var(--text-muted)")
    p.mt-2.text-sm(style="color: var(--text-muted)") {{ $t('documentTemplates.builder.noSelection') }}
</template>

<script setup lang="ts">
const props = defineProps<{
  element: unknown | null;
}>();

const emit = defineEmits(['update', 'delete', 'duplicate']);

const localElement = ref<Record<string, unknown> | null>(null);
const localOpacity = ref(100);

const fontFamilies = [
  { label: 'Helvetica', value: 'Helvetica' },
  { label: 'Times Roman', value: 'Times-Roman' },
  { label: 'Courier', value: 'Courier' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Verdana', value: 'Verdana' },
  { label: 'Trebuchet MS', value: 'Trebuchet MS' },
  { label: 'Tahoma', value: 'Tahoma' }
];

const alignOptions = [
  { value: 'left', icon: 'ph:text-align-left-bold' },
  { value: 'center', icon: 'ph:text-align-center-bold' },
  { value: 'right', icon: 'ph:text-align-right-bold' }
];

const presetColors = [
  '#000000',
  '#333333',
  '#666666',
  '#999999',
  '#cccccc',
  '#ffffff',
  '#7849ff',
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#ec4899'
];

watch(
  () => props.element,
  el => {
    if (el) {
      localElement.value = JSON.parse(JSON.stringify(el));
      localOpacity.value = (el.props?.opacity ?? 1) * 100;
    } else {
      localElement.value = null;
      localOpacity.value = 100;
    }
  },
  { immediate: true, deep: true }
);

function emitUpdate() {
  if (localElement.value) {
    emit('update', JSON.parse(JSON.stringify(localElement.value)));
  }
}

function updateOpacity() {
  if (localElement.value) {
    localElement.value.props.opacity = localOpacity.value / 100;
    emitUpdate();
  }
}

function addColumn() {
  if (localElement.value?.props?.columns) {
    localElement.value.props.columns.push('New Column');
    emitUpdate();
  }
}

function removeColumn(i: number) {
  if (localElement.value?.props?.columns && localElement.value.props.columns.length > 1) {
    localElement.value.props.columns.splice(i, 1);
    emitUpdate();
  }
}
</script>
