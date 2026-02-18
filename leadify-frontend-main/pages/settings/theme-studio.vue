<template lang="pug">
.theme-studio
  .page-header.glass-card.mb-6.p-6
    .flex.items-center.gap-3
      Icon.text-2xl(name="ph:palette-bold" :style="{ color: themeStore.accentColor }")
      div
        h1.text-2xl.font-bold.text-primary {{ $t('themeStudio.title') }}
        p.text-secondary.text-sm {{ $t('themeStudio.subtitle') }}

  .grid.gap-6(class="grid-cols-1 lg:grid-cols-3")
    //- Presets Column
    .col-span-1(class="lg:col-span-2")
      .glass-card.p-6
        h2.text-lg.font-semibold.text-primary.mb-4
          Icon.mr-2(name="ph:swatches-bold" size="20")
          | {{ $t('themeStudio.presets') }}
        .preset-grid
          .preset-card(
            v-for="preset in presets"
            :key="preset.id"
            :class="{ active: themeStore.activePresetId === preset.id }"
            @click="themeStore.applyPreset(preset.id)"
          )
            .preset-swatch(:style="{ background: `linear-gradient(135deg, ${preset.gradientStart}, ${preset.gradientEnd})` }")
              Icon.check-icon(v-if="themeStore.activePresetId === preset.id" name="ph:check-circle-fill" size="24")
            .preset-name {{ preset.name }}

    //- Controls Column
    .col-span-1
      .glass-card.p-6.space-y-6
        h2.text-lg.font-semibold.text-primary.mb-4
          Icon.mr-2(name="ph:sliders-horizontal-bold" size="20")
          | {{ $t('themeStudio.customize') }}

        //- Accent Color Picker
        .control-group
          label.control-label {{ $t('themeStudio.accentColor') }}
          .flex.items-center.gap-3
            el-color-picker(
              v-model="customAccent"
              @change="onAccentChange"
              :predefine="predefineColors"
              size="large"
            )
            .color-hex.text-sm.text-secondary {{ customAccent }}

        //- Glass Blur
        .control-group
          label.control-label {{ $t('themeStudio.glassBlur') }}
          .flex.items-center.gap-3
            el-slider(
              v-model="localBlur"
              :min="0"
              :max="30"
              :step="1"
              @change="themeStore.setGlassBlur($event)"
              class="flex-1"
            )
            span.text-sm.text-secondary.w-12.text-right {{ localBlur }}px

        //- Glass Opacity
        .control-group
          label.control-label {{ $t('themeStudio.glassOpacity') }}
          .flex.items-center.gap-3
            el-slider(
              v-model="localOpacity"
              :min="0.01"
              :max="0.3"
              :step="0.01"
              @change="themeStore.setGlassOpacity($event)"
              class="flex-1"
            )
            span.text-sm.text-secondary.w-12.text-right {{ Math.round(localOpacity * 100) }}%

        //- Font Size
        .control-group
          label.control-label {{ $t('themeStudio.fontSize') }}
          .flex.items-center.gap-3
            el-slider(
              v-model="localFontSize"
              :min="12"
              :max="18"
              :step="1"
              @change="themeStore.setFontSize($event)"
              class="flex-1"
            )
            span.text-sm.text-secondary.w-12.text-right {{ localFontSize }}px

        //- Reset Button
        el-button.w-full(@click="resetToDefault" type="default" plain)
          Icon.mr-2(name="ph:arrow-counter-clockwise-bold" size="16")
          | {{ $t('themeStudio.reset') }}

  //- Live Preview
  .glass-card.p-6.mt-6
    h2.text-lg.font-semibold.text-primary.mb-4
      Icon.mr-2(name="ph:eye-bold" size="20")
      | {{ $t('themeStudio.preview') }}
    .preview-row.flex.flex-wrap.gap-4
      el-button(type="primary" :style="{ backgroundColor: themeStore.accentColor, borderColor: themeStore.accentColor }") Primary Button
      el-button(type="default") Default Button
      el-tag(:color="themeStore.accentColor" effect="dark") Sample Tag
      .preview-glass-card.glass-card.p-4.rounded-lg
        p.text-primary.text-sm Preview Glass Card
        p.text-secondary.text-xs This shows the current glass effect
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useThemeStore, THEME_PRESETS } from '~/stores/theme';

const themeStore = useThemeStore();
const presets = THEME_PRESETS;

const customAccent = ref(themeStore.accentColor);
const localBlur = ref(themeStore.glassBlur);
const localOpacity = ref(themeStore.glassOpacity);
const localFontSize = ref(themeStore.fontSize);

const predefineColors = [
  '#7849ff', '#2563eb', '#ea580c', '#16a34a', '#e11d48',
  '#06b6d4', '#d97706', '#6366f1', '#dc2626', '#8b5cf6'
];

function onAccentChange(color: string | null) {
  if (color) themeStore.setAccentColor(color);
}

function resetToDefault() {
  themeStore.applyPreset('default-purple');
  themeStore.setGlassBlur(12);
  themeStore.setGlassOpacity(0.08);
  themeStore.setFontSize(14);
  customAccent.value = '#7849ff';
  localBlur.value = 12;
  localOpacity.value = 0.08;
  localFontSize.value = 14;
}

watch(() => themeStore.accentColor, (val) => {
  customAccent.value = val;
});
</script>

<style lang="scss" scoped>
.theme-studio {
  max-width: 1200px;
  margin: 0 auto;
}

.text-primary {
  color: var(--text-primary);
}

.text-secondary {
  color: var(--text-secondary);
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

.preset-card {
  cursor: pointer;
  border-radius: 12px;
  padding: 8px;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  background: var(--glass-bg-primary);
  backdrop-filter: var(--glass-blur);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  &.active {
    border-color: var(--accent-color, #7849ff);
    box-shadow: 0 0 20px rgba(120, 73, 255, 0.25);
  }
}

.preset-swatch {
  width: 100%;
  height: 80px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.check-icon {
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.preset-name {
  text-align: center;
  margin-top: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.color-hex {
  font-family: monospace;
}

.preview-row {
  align-items: center;
}

.preview-glass-card {
  min-width: 200px;
}
</style>
