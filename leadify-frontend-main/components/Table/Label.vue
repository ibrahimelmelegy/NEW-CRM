<template lang="pug">
.border.rounded-xl.text-xs.p-2(:class="labelType" v-if="type === 'outline'")  {{ getTextFromValue(value) }}
.flex.items-center(:class="labelType" v-if="type === 'solid'")
  div(class="h-1.5 w-1.5 rounded-full mr-1" :class="labelBg")
  span {{ getTextFromValue(value) }}
.flex.items-center.py-2(v-if="type === 'select'")
 el-dropdown.flex.items-center.justify-center.border.rounded-xl(class="w-[100px] h-[40px]" trigger="click" :class="labelType" )
  span(:class="labelType"  ) {{ getTextFromValue(value) }}
  template(#dropdown='')
   el-dropdown-menu
      el-dropdown-item(v-for="(item , index ) in filters " :key="index" @click = "item?.actions({...valueObject , status: item?.value})" )
        span  {{item?.text}}
</template>

<script setup>
const props = defineProps({
  valueObject: {
    type: Object,
    required: false
  },
  value: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  filters: {
    type: Array,
    default: () => []
  }
});
const route = useRoute();

const valueMap = {
  ACTIVE: 'PROJECT_ACTIVE',
  CANCELLED: 'PROJECT_CANCELLED',
  COMPLETED: 'PROJECT_COMPLETED',
  ON_HOLD: 'PROJECT_ON_HOLD'
};
const labelType = computed(() => {
  // Check if the route includes "projects"
  const statusValue = route.path.includes('projects') ? valueMap[props.value] || props.value : props.value;
  return `label-${props.type == 'select' ? 'outline' : props.type}-${getStatusColor(statusValue)}`;
});
const labelBg = computed(() => {
  return `bg-${props.type}-${getStatusColor(props.value)}`;
});

function getTextFromValue(value) {
  const mappedValue = route.path.includes('projects') ? valueMap[value] || value : value;

  const matchedFilter = props.filters?.find(filter => filter.value === mappedValue);

  return matchedFilter ? matchedFilter.text : mappedValue;
}
</script>
<style lang="scss">
// Status color variables (dark mode safe via CSS custom properties)
:root {
  --status-cyan-bg: #e6f9fb;
  --status-cyan-text: #00adc3;
  --status-purple-bg: #e9e6f3;
  --status-purple-text: #270089;
  --status-red-bg: #ffebeb;
  --status-red-text: #ee2424;
  --status-yellow-bg: #fff8e7;
  --status-yellow-text: #ffb72d;
  --status-orange-text: #ee7c24;
  --status-green-bg: #d1ffe5;
  --status-green-text: #0db355;
  --status-gray-text: #b5b3ba;
}

html.dark-mode {
  --status-cyan-bg: rgba(0, 173, 195, 0.15);
  --status-purple-bg: rgba(39, 0, 137, 0.15);
  --status-red-bg: rgba(238, 36, 36, 0.15);
  --status-yellow-bg: rgba(255, 183, 45, 0.15);
  --status-green-bg: rgba(13, 179, 85, 0.15);
}

.label {
  &-outline {
    &-one {
      background-color: var(--status-cyan-bg);
      color: var(--status-cyan-text);
      border-color: transparent;
    }

    &-two {
      background-color: var(--status-purple-bg);
      color: var(--status-purple-text);
      border-color: transparent;
    }

    &-three {
      background-color: var(--status-red-bg);
      color: var(--status-red-text);
      border-color: transparent;
    }

    &-four {
      background-color: var(--status-yellow-bg);
      color: var(--status-yellow-text);
      border-color: transparent;
    }

    &-five {
      color: var(--status-orange-text);
      border-color: transparent;
    }

    &-primary {
      background-color: var(--status-green-bg);
      color: var(--status-green-text);
      border-color: transparent;
    }

    &-six {
      color: var(--status-gray-text);
      border-color: transparent;
    }
  }

  &-solid {
    &-three {
      color: var(--status-red-text);
      border-color: transparent;
    }

    &-five {
      color: var(--status-orange-text);
      border-color: transparent;
    }

    &-four {
      color: var(--status-yellow-text);
      border-color: transparent;
    }

    &-primary {
      color: var(--status-green-text);
      border-color: transparent;
    }

    &-six {
      color: var(--status-gray-text);
      border-color: transparent;
    }

    &-brown {
      border: 1px solid $brown;
      color: $brown;
      background-color: $brown-light;
    }
  }
}

.bg {
  &-solid {
    &-three {
      background-color: var(--status-red-text) !important;
    }

    &-five {
      background-color: var(--status-orange-text) !important;
    }

    &-four {
      background-color: var(--status-yellow-text) !important;
    }

    &-primary {
      background-color: var(--status-green-text) !important;
    }

    &-six {
      background-color: var(--status-gray-text) !important;
    }

    &-brown {
      border: 1px solid $brown;
      color: $brown;
      background-color: $brown-light;
    }
  }
}
</style>
